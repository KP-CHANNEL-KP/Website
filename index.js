import { generateOTP, hashOTP, verifyOTP, sendTelegramMessage, createSignedR2URL } from './utils.js';

export default {
    async fetch(req, env) {
        const url = new URL(req.url);
        const pathname = url.pathname;

        if (pathname === '/api/request_otp' && req.method === 'POST') {
            const { phone } = await req.json();
            const otp = generateOTP();
            const otpHash = await hashOTP(otp);

            // save OTP to D1
            await env.D1_DATABASE.prepare(
                "INSERT INTO otps (phone, otp_hash, expire_at) VALUES (?, ?, ?)"
            ).bind(phone, otpHash, Date.now() + 5*60*1000).run();

            // send OTP via Telegram to user (must /start bot first)
            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, phone, `KP Shop OTP: ${otp} (5min)`);

            return new Response(JSON.stringify({success:true}), {status:200});
        }

        if (pathname === '/api/verify_otp' && req.method === 'POST') {
            const { phone, otp } = await req.json();
            const result = await env.D1_DATABASE.prepare(
                "SELECT * FROM otps WHERE phone = ?"
            ).bind(phone).first();

            if(!result) return new Response(JSON.stringify({success:false, msg:'OTP not found'}), {status:400});

            const valid = await verifyOTP(otp, result.otp_hash);
            if(!valid) return new Response(JSON.stringify({success:false, msg:'Invalid OTP'}), {status:400});

            // create session_id
            const sessionId = crypto.randomUUID();
            await env.D1_DATABASE.prepare(
                "INSERT INTO sessions (session_id, phone, expires_at) VALUES (?, ?, ?)"
            ).bind(sessionId, phone, Date.now() + 7*24*60*60*1000).run();

            const response = new Response(JSON.stringify({success:true}), {status:200});
            response.headers.append('Set-Cookie', `session_id=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/`);
            return response;
        }

        if (pathname === '/api/products' && req.method === 'GET') {
            const products = await env.D1_DATABASE.prepare("SELECT * FROM products").all();
            return new Response(JSON.stringify(products.results), {status:200});
        }

        if (pathname === '/api/order/create' && req.method === 'POST') {
            const formData = await req.formData();
            const screenshotFile = formData.get('screenshot');
            const cart = JSON.parse(formData.get('cart'));
            const total = Number(formData.get('total'));

            // save screenshot to R2
            const screenshotKey = `orders/${Date.now()}_${screenshotFile.name}`;
            await env.R2_BUCKET.put(screenshotKey, screenshotFile.stream(), {
                httpMetadata: { contentType: screenshotFile.type }
            });

            // save order in D1
            const points = total; // 1 Ks = 1 point
            const result = await env.D1_DATABASE.prepare(
                "INSERT INTO orders (user_phone, cart, amount, points_awarded, screenshot_key, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
            ).bind(cart[0]?.phone || 'unknown', JSON.stringify(cart), total, points, screenshotKey, 'pending', Date.now()).run();

            // notify admin via Telegram
            const signedURL = await createSignedR2URL(env.R2_BUCKET, screenshotKey);
            const adminMessage = `New Order!\nPhone: ${cart[0]?.phone || 'unknown'}\nTotal: ${total} Ks\nPoints: ${points}\nScreenshot: ${signedURL}`;
            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_ADMIN_CHAT_ID, adminMessage);

            return new Response(JSON.stringify({success:true, orderId: result.lastInsertRowid}), {status:200});
        }

        return new Response("Not found", {status:404});
    }
}
