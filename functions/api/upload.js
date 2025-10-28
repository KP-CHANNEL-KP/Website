// /functions/api/upload.js
// R2 Bucket Name ကို env.UPLOAD_BUCKET အဖြစ် Cloudflare Pages Bindings တွင် ချိတ်ထားရပါမယ်။

export async function onRequestPost(context) {
  try {
    // POST request ကိုသာ ကိုင်တွယ်ရန်
    if (context.request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    
    // 1. Request body ကို Form Data အဖြစ် ရယူခြင်း
    const formData = await context.request.formData();
    // Client-side JS က 'file' ဆိုတဲ့ key နဲ့ ပို့ထားကြောင်း တွေ့ရပါသည်။
    const file = formData.get('file'); 

    if (!file || file.size === 0) {
      return new Response(JSON.stringify({ status: 'ERROR', message: 'No file uploaded.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { env } = context;
    const arrayBuffer = await file.arrayBuffer(); // File Data ကို ArrayBuffer အဖြစ် ပြောင်း
    
    // ဖိုင်နာမည်ကို R2 တွင် သိမ်းမည့် key အဖြစ် သုံးခြင်း (သို့မဟုတ်) Unique ID တစ်ခု ဖန်တီးနိုင်သည်
    const key = file.name; 

    // 2. R2 Bucket တွင် ဖိုင်ကို သိမ်းဆည်းခြင်း
    // env.UPLOAD_BUCKET သည် Pages Bindings မှ R2 Bucket ဖြစ်သည်။
    await env.UPLOAD_BUCKET.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream' // File Type ကို သတ်မှတ်ခြင်း
      }
    });

    // 3. အောင်မြင်ကြောင်း JSON Response ပြန်ပို့ခြင်း (Client-side JS မှ JSON ကို မျှော်လင့်သောကြောင့်)
    return new Response(JSON.stringify({
      status: 'SUCCESS',
      filename: key,
      message: `${key} uploaded successfully!`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // 4. Error ဖြစ်ပါက Error JSON Response ပြန်ပို့ခြင်း
    return new Response(JSON.stringify({ 
      status: 'SERVER_ERROR', 
      message: `File upload failed due to server error: ${error.message}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
