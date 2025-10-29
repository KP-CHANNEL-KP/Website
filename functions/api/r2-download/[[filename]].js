// functions/api/r2-download/[[filename]].js (Final Version for stable download)

export async function onRequestGet(context) {
    const { env, params } = context;
    
    // ... (ကနဦး စစ်ဆေးခြင်းနှင့် Decode လုပ်ခြင်း အပိုင်း) ...
    const encodedKey = params.filename.join('/'); 
    const key = decodeURIComponent(encodedKey);

    if (!key) {
        return new Response('File name missing in URL parameters.', { status: 400 });
    }

    try {
        const object = await env.UPLOAD_BUCKET.get(key);

        if (object === null) {
            return new Response(`File not found: ${key}`, { status: 404 });
        }
        
        if (!object.body) {
            return new Response('R2 object found, but no body/content available.', { status: 500 });
        }
        
        const headers = new Headers();
        
        // 1. Content-Disposition ကို Download အဖြစ် တိကျစွာ သတ်မှတ်ခြင်း (မဖြစ်မနေ Download ဆွဲစေရန်)
        headers.set('Content-Disposition', `attachment; filename="${key}"`);
        
        // 2. R2 ကပေးပို့တဲ့ Headers တွေအစား Content-Type ကို ကိုယ်တိုင် ပြန်သတ်မှတ်ပါ။
        //    (object.headers.forEach(...) အပိုင်းကို ဖြုတ်လိုက်ပါ)
        
        // 3. R2 ရဲ့ Content-Type ကို ယူသုံးမယ်။ မရှိရင် binary stream အဖြစ် သတ်မှတ်မယ်။
        const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
        headers.set('Content-Type', contentType);

        // CORS အတွက်
        headers.set('Access-Control-Allow-Origin', '*');
        
        return new Response(object.body, { 
            headers,
            status: 200
        });

    } catch (error) {
        return new Response(`Download Server Error: ${error.message}`, { status: 500 });
    }
}
