// Cloudflare Pages Function: R2 သို့ တင်ရန် Signed URL ကို ထုတ်ပေးသည့် API Endpoint
// Path: /upload-url
export async function onRequest(context) {
    const { request, env } = context;

    // 1. R2 Binding ကို စစ်ဆေးပါ (Binding Name ကို BUCKET အဖြစ် သတ်မှတ်ထားပါသည်)
    // env.BUCKET ကို သေချာစစ်ဆေးပါ
    const bucket = env.BUCKET; 
    
    if (!bucket) {
        // Binding မရှိရင် Server Error (500) ပြပါမည်
        return new Response(JSON.stringify({ error: 'Server Error: R2 Bucket binding "BUCKET" is not correctly configured.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
    
    // 2. GET method ကိုသာ ခွင့်ပြုပါ
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed. Use GET to request Signed URL.' }), { 
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
        // key: R2 တွင် သိမ်းဆည်းမည့် ဖိုင်နာမည်
        const { upload, url: publicUrl } = await bucket.upload.create({
            key: fileName,
        });
        
        // 5. Signed URL ကို Front-end သို့ JSON အနေနဲ့ ပြန်ပို့ပါ
        return new Response(JSON.stringify({ 
            uploadURL: upload.url,
            key: fileName,
            publicUrl: publicUrl
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            }
        });
    } catch (error) {
        console.error('Final R2 API Creation Error:', error);
        return new Response(JSON.stringify({ error: `R2 API Failure: ${error.message}` }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}
