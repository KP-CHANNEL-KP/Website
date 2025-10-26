// Path: Website/functions/upload-url.js
export async function onRequest(context) {
    const { request, env } = context;
    const bucket = env.BUCKET; // Pages Binding Name: BUCKET

    if (!bucket) {
        return new Response(JSON.stringify({ error: 'Server Error: R2 Bucket binding "BUCKET" is not configured.' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
    
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed. Use GET.' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    const url = new URL(request.url);
    const fileName = url.searchParams.get('fileName');
    // Frontend မှ ပို့လာသော fileType ကို ယူပါမည်
    const fileType = url.searchParams.get('fileType') || 'application/octet-stream'; 

    if (!fileName) {
        return new Response(JSON.stringify({ error: 'File name is missing in query parameter.' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    try {
        // R2 Bucket မှ Signed URL ကို ဖန်တီးပါ
        // mimeType ကို ထည့်သွင်းခြင်းသည် R2 API Failure ကို ဖြေရှင်းပေးနိုင်သည်
        const { upload, url: publicUrl } = await bucket.upload.create({
            key: fileName,
            mimeType: fileType, 
        });
        
        // Signed URL ကို ပြန်ပို့ပါ
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
        console.error('R2 API Creation Error:', error);
        return new Response(JSON.stringify({ error: `R2 API Failure: ${error.message}` }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}
