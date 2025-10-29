// functions/api/r2-download/[[filename]].js (Download Function)

export async function onRequestGet(context) {
    const { env, params } = context;
    
    // URL Decode လုပ်ခြင်း (Space ပါသော ဖိုင်အမည်များအတွက်)
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
        
        // Download ကို အတင်းအကျပ် သတ်မှတ်ခြင်း
        headers.set('Content-Disposition', `attachment; filename="${key}"`);
        
        // R2 ရဲ့ Content-Type ကို ယူသုံးမယ်။ မရှိရင် binary stream အဖြစ် သတ်မှတ်မယ်။
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
