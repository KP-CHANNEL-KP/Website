// Path: Website/_worker.js

/**
 * Cloudflare Pages Functions (Routing: /upload-url)
 * R2 သို့ File Upload ရန်အတွက် Signed URL ကို ထုတ်ပေးခြင်း
 */

// Worker က GET request တွေကိုသာ ဖမ်းပြီး၊ /upload-url ကို route လုပ်ပါမယ်
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Pages Function (API) path ကို စစ်ဆေးခြင်း
    if (url.pathname !== '/upload-url') {
      // Static files များကို ဆက်လက် တင်ပို့ခွင့်ပေးပါ (Pages အတွက်)
      return env.ASSETS.fetch(request);
    }
    
    // 1. R2 Binding ကို စစ်ဆေးပါ (Variable Name: R2_STORE)
    const bucket = env.R2_STORE; 
    
    if (!bucket) {
        return new Response(JSON.stringify({ error: 'Server Error: R2 Bucket binding "R2_STORE" is not configured.' }), {
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

    // 3. URL မှ fileName နှင့် fileType ကို ထုတ်ယူပါ
    const fileName = url.searchParams.get('fileName');
    // Frontend မှ ပို့လာသော fileType ကို ယူပါမည်
    const fileType = url.searchParams.get('fileType') || 'application/octet-stream'; 

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
            mimeType: fileType, // Content-Type error ကို ဖြေရှင်းရန်
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
        console.error('R2 API Creation Error:', error);
        return new Response(JSON.stringify({ error: `R2 API Failure: ${error.message}` }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
  }
};
