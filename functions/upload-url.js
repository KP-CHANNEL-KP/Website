// Cloudflare Pages Function: R2 သို့ တင်ရန် Signed URL ကို ထုတ်ပေးသည့် API Endpoint
// Path: /upload-url
export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'GET') {
        return new Response('Method Not Allowed. Use GET.', { status: 405 });
    }

    // 1. R2 Bucket Binding ကို ရယူပါ
    // ⚠️ env.R2_BUCKET သည် သင့် Pages Setting မှ Binding Name ဖြစ်ရမည်
    const bucket = env.R2_BUCKET; 
    
    // 2. URL မှ fileName ကို ထုတ်ယူပါ
    const url = new URL(request.url);
    const fileName = url.searchParams.get('fileName');

    if (!fileName) {
        return new Response(JSON.stringify({ error: 'File name is missing.' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 3. R2 Bucket မှ Signed URL ကို ဖန်တီးပါ
        // key: R2 တွင် သိမ်းဆည်းမည့် ဖိုင်နာမည်
        const { upload, url: publicUrl } = await bucket.upload.create({
            key: fileName,
        });
        
        // 4. Signed URL ကို Front-end သို့ JSON အနေနဲ့ ပြန်ပို့ပေးပါ
        return new Response(JSON.stringify({ 
            uploadURL: upload.url, // Browser ကနေ PUT request ပို့ရမည့် URL
            key: fileName,
            publicUrl: publicUrl
        }), {
            headers: {
                'Content-Type': 'application/json',
                // CORS အတွက် ခွင့်ပြုချက် (Browser မှ API ကို ခေါ်ခြင်းအား ခွင့်ပြုရန်)
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            }
        });
    } catch (error) {
        console.error('Error creating signed URL:', error);
        return new Response(JSON.stringify({ error: `Server Error: ${error.message}. Check R2 Binding & Deployment Logs.` }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
