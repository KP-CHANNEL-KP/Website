// functions/api/r2-download/[[filename]].js (ပြုပြင်ထားသော Code)

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
        
        // 🚨 ပြင်ဆင်ချက် ၁: object.body မရှိရင် Server Error ပြန်ပါ
        if (!object.body) {
            // R2 က object ပြန်ပေးပေမယ့် body မပါရင် (ဥပမာ: Server-side Error)
            return new Response('R2 object found, but no body/content available.', { status: 500 });
        }
        
        // 2. ဖိုင်ကို Download ချပေးရန် Headers များ သတ်မှတ်ခြင်း
        const headers = new Headers();
        
        // Browser က Download အဖြစ် မြင်စေရန်
        headers.set('Content-Disposition', `attachment; filename="${key}"`);
        
        // 🚨 ပြင်ဆင်ချက် ၂: object.headers ရှိမှသာ forEach ကို ခေါ်ပါ
        if (object.headers) {
             // R2 ၏ Content-Type နှင့် အခြား Headers များကို ယူသုံးခြင်း
            object.headers.forEach((value, name) => {
                headers.set(name, value);
            });
        }
       
        // CORS အတွက်
        headers.set('Access-Control-Allow-Origin', '*');
        
        return new Response(object.body, { 
            headers,
            status: 200
        });

    } catch (error) {
        // ... (catch block သည် မပြောင်းလဲပါ) ...
        return new Response(`Download Server Error: ${error.message}`, { status: 500 });
    }
}
