// functions/api/r2-download/[[filename]].js
// URL Decode ကို ကိုယ်တိုင်လုပ်ပြီး Space ပါသော ဖိုင်များကို ရှာနိုင်စေရန် ပြင်ဆင်ထားသော Code

export async function onRequestGet(context) {
    const { env, params } = context;
    
    // Catch-all Route (e.g., /api/r2-download/folder/file.txt) မှ Path segments များကို ယူသည်
    // (params.filename သည် Array တစ်ခုဖြစ်သည်)
    
    // Path segments များကို '/' ဖြင့် ပြန်ဆက်၍ Encoded Key ကို ရယူသည်
    const encodedKey = params.filename.join('/'); 

    // URL Decode လုပ်ခြင်း (ဥပမာ: '%20' ကို ' ' နေရာလွတ် ပြန်ပြောင်းရန်)
    const key = decodeURIComponent(encodedKey);

    if (!key) {
        return new Response('File name missing in URL parameters.', { status: 400 });
    }

    try {
        // 1. R2 Bucket ထဲက ဖိုင်ကို ဆွဲထုတ်ခြင်း (Decode လုပ်ပြီးသား key ဖြင့် ရှာပါမည်)
        const object = await env.UPLOAD_BUCKET.get(key);

        if (object === null) {
            return new Response(`File not found: ${key}`, { status: 404 });
        }
        
        // 2. ဖိုင်ကို Download ချပေးရန် Headers များ သတ်မှတ်ခြင်း
        const headers = new Headers();
        
        // Browser က Download အဖြစ် မြင်စေရန် Content-Disposition သတ်မှတ်ခြင်း
        headers.set('Content-Disposition', `attachment; filename="${key}"`);
        
        // R2 Metadata မှ Content-Type နှင့် အခြား Headers များကို ယူသုံးခြင်း
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
