// functions/api/r2-download/[filename].js
// Dynamic route: /api/r2-download/my-file.txt ကို ခေါ်ရင် my-file.txt ကို R2 ကနေ ဆွဲထုတ်ပေးမည်

export async function onRequestGet(context) {
    const { env, params } = context;
    
    // URL ထဲက filename ကို ယူခြင်း
    const key = params.filename; 

    if (!key) {
        return new Response('File name missing in URL.', { status: 400 });
    }

    try {
        // 1. R2 Bucket ထဲက ဖိုင်ကို ဆွဲထုတ်ခြင်း
        // UPLOAD_BUCKET Binding ကိုပဲ ပြန်သုံးပါသည်
        const object = await env.UPLOAD_BUCKET.get(key);

        if (object === null) {
            return new Response(`File not found: ${key}`, { status: 404 });
        }
        
        // 2. ဖိုင်ကို Browser သို့ တိုက်ရိုက် Download ချပေးခြင်း
        // object.body ကို Response body အဖြစ် ပြန်ပို့ပြီး R2 Metadata ကို Headers အဖြစ် သုံးပါမည်။
        
        const headers = new Headers();
        
        // Content-Disposition ကို သတ်မှတ်ခြင်း (ဖိုင်ကို Browser က Download အဖြစ် မြင်စေရန်)
        headers.set('Content-Disposition', `attachment; filename="${key}"`);
        
        // R2 Metadata မှ Content-Type ကို ယူသုံးခြင်း
        object.headers.forEach((value, name) => {
            headers.set(name, value);
        });
        
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
