// functions/api/r2-delete.js

export async function onRequestPost(context) {
    const { env, request } = context;

    // CORS Headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Passcode'
    };
    
    // OPTIONS request များကို ချက်ချင်း ပြန်ပို့ခြင်း (CORS Pre-flight)
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers });
    }

    // R2 Binding Error စစ်ဆေးခြင်း
    if (!env.UPLOAD_BUCKET || !env.ADMIN_PASSCODE) {
        return new Response("R2 or Passcode Binding is missing in Pages Settings!", { 
            status: 500,
            headers: { 'Content-Type': 'text/plain', ...headers }
        });
    }

    try {
        const formData = await request.formData();
        const key = formData.get('key');           // ဖျက်မည့် ဖိုင်အမည် (key)
        const providedPasscode = formData.get('passcode'); // ပေးပို့လာသော Passcode

        if (!key) {
            return new Response('File key is missing.', { status: 400, headers });
        }
        
        // 1. Passcode စစ်ဆေးခြင်း (Authentication)
        if (providedPasscode !== env.ADMIN_PASSCODE) { // ADMIN_PASSCODE = 232003 ကို အသုံးပြုမည်
            return new Response("Permission Denied. Invalid Admin Passcode.", { 
                status: 401, 
                headers 
            });
        }
        
        // 2. Passcode မှန်မှ R2 Object ကို ဖျက်ခြင်း
        await env.UPLOAD_BUCKET.delete(key);

        return new Response(`File ${key} deleted successfully.`, { status: 200, headers });

    } catch (error) {
        return new Response(`Delete Server Error: ${error.message}`, { 
            status: 500, 
            headers 
        });
    }
}
