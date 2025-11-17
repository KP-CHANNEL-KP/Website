import { generateOTP, hashOTP, verifyOTP, sendTelegramMessage, createSignedR2URL } from './utils.js';

export default {
    async fetch(req, env) {
        const url = new URL(req.url);
        const pathname = url.pathname;

        // -------------------------
        // Request OTP
        if (pathname === '/api/request_otp' && req.method === 'POST') {
            const { phone } = await req.json();
            const otp = generateOTP();
            const otpHash = await hashOTP(otp);

            await env.D1_DATABASE.prepare(
                "INSERT INTO otps (phone, otp_hash, expire_at) VALUES (?, ?, ?)"
            ).bind(phone, otpHash, Date.now() + 5*60*1000).run();

            // send OTP via Telegram bot
            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, phone, `KP Shop OTP: ${otp} (5min)`);

            return new Response(JSON.stringify({success:true}), {status:200});
        }

        // -------------------------
        // Verify OTP and create session
        if (pathname === '/api/verify_otp' && req.method === 'POST') {
            const { phone, otp } = await req.json();
            const result = await env.D1_DATABASE.prepare(
                "SELECT * FROM otps WHERE phone = ?"
            ).bind(phone).first();

            if(!result) return new Response(JSON.stringify({success:false, msg:'OTP not found'}), {status:400});
            const valid = await verifyOTP(otp, result.otp_hash);
            if(!valid) return new Response(JSON.stringify({success:false, msg:'Invalid OTP'}), {status:400});

            const sessionId = crypto.randomUUID();
            await env.D1_DATABASE.prepare(
                "INSERT INTO sessions (session_id, phone, expires_at) VALUES (?, ?, ?)"
            ).bind(sessionId, phone, Date.now() + 7*24*60*60*1000).run();

            const response = new Response(JSON.stringify({success:true}), {status:200});
            response.headers.append('Set-Cookie', `session_id=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/`);
            return response;
        }

        // -------------------------
        // Get products
        if (pathname === '/api/products' && req.method === 'GET') {
            const products = await env.D1_DATABASE.prepare("SELECT * FROM products").all();
            return new Response(JSON.stringify(products.results), {status:200});
        }

        // -------------------------
        // Create Order
        if (pathname === '/api/order/create' && req.method === 'POST') {
            const formData = await req.formData();
            const screenshotFile = formData.get('screenshot');
            const cart = JSON.parse(formData.get('cart'));
            const total = Number(formData.get('total'));

            const screenshotKey = `orders/${Date.now()}_${screenshotFile.name}`;
            await env.R2_BUCKET.put(screenshotKey, screenshotFile.stream(), {
                httpMetadata: { contentType: screenshotFile.type }
            });

            const points = total; // 1 Ks = 1 point
            const orderResult = await env.D1_DATABASE.prepare(
                "INSERT INTO orders (user_phone, cart, amount, points_awarded, screenshot_key, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
            ).bind(cart[0]?.phone || 'unknown', JSON.stringify(cart), total, points, screenshotKey, 'pending', Date.now()).run();

            const signedURL = await createSignedR2URL(env.R2_BUCKET, screenshotKey);
            const adminMessage = `New Order!
Phone: ${cart[0]?.phone || 'unknown'}
Total: ${total} Ks
Points: ${points}
Screenshot: ${signedURL}
[Approve ✅] [Reject ❌]`;

            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_ADMIN_CHAT_ID, adminMessage);

            return new Response(JSON.stringify({success:true, orderId: orderResult.lastInsertRowid}), {status:200});
        }

        // -------------------------
        // Admin Approve/Reject callback from Telegram
        if (pathname === '/api/order/admin' && req.method === 'POST') {
            const { orderId, action } = await req.json(); // action = 'approve' | 'reject'
            if (!['approve','reject'].includes(action)) return new Response("Invalid action", {status:400});

            const order = await env.D1_DATABASE.prepare(
                "SELECT * FROM orders WHERE id=?"
            ).bind(orderId).first();

            if(!order) return new Response("Order not found", {status:404});

            let newStatus = action === 'approve' ? 'approved' : 'rejected';
            await env.D1_DATABASE.prepare(
                "UPDATE orders SET status=? WHERE id=?"
            ).bind(newStatus, orderId).run();

            if(action === 'approve') {
                // Add points to user
                const points = order.points_awarded;
                await env.D1_DATABASE.prepare(
                    "UPDATE users SET points = points + ? WHERE phone = ?"
                ).bind(points, order.user_phone).run();
            }

            return new Response(JSON.stringify({success:true, newStatus}), {status:200});
        }

        return new Response("Not found", {status:404});
    }
}
