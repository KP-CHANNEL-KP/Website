// Cloudflare Pages Function: R2 သို့ တင်ရန် Signed URL ကို ထုတ်ပေးသည့် API Endpoint
// Path: /upload-url
export async function onRequest(context) {
    const { request, env } = context;

    // 1. R2 Binding ကို စစ်ဆေးပါ (Error ရှာဖို့ အရေးကြီးဆုံး)
    // သင့် Setting က BUCKET ဖြစ်တဲ့အတွက် env.BUCKET ကို သုံးထားပါသည်။
    const bucket = env.BUCKET; 
    
    if (!bucket) {
        // Binding မရှိရင် Server Error (500) ပြပါမည်
        return new Response(JSON.stringify({ error: 'Server Error: R2 Bucket binding "BUCKET" is missing or failed.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    // 2. GET method ကိုသာ ခွင့်ပြုပါ
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed. Use GET.' }), { 
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    // 3. URL မှ fileName ကို ထုတ်ယူပါ
    const url = new URL(request.url);
    const fileName = url.searchParams.get('fileName');

    if (!fileName) {
        return new Response(JSON.stringify({ error: 'File name is missing in query parameter.' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    try {
        // 4. R2 Bucket မှ Signed URL ကို ဖန်တီးပါ
        const { upload, url: publicUrl } = await bucket.upload.create({
            key: fileName,
            // expiration: 60 * 60 // Optional: သက်တမ်းကို သတ်မှတ်နိုင်သည်
        });
        
        // 5. Signed URL ကို Front-end သို့ JSON အနေနဲ့ ပြန်ပို့ပါ
        return new Response(JSON.stringify({ 
            uploadURL: upload.url,
            key: fileName,
            publicUrl: publicUrl
        }), {
            headers: {
                'Content-Type': 'application/json',
                // Front-end ကနေ ခေါ်ယူမှု မှန်ကန်စေဖို့ CORS ခွင့်ပြုချက် ပြန်ပေးရမည်
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            }
        });
    } catch (error) {
        console.error('Final R2 API Error:', error);
        return new Response(JSON.stringify({ error: `R2 API Creation Error: ${error.message}` }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}
