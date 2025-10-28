// /functions/api/upload.js
// R2 Bucket Name ကို env.UPLOAD_BUCKET အဖြစ် Cloudflare Pages Bindings မှာ ချိတ်ထားရပါမယ်။

export async function onRequestPost(context) {
  try {
    // 1. Request body ကို Form Data အဖြစ် ရယူခြင်း
    const formData = await context.request.formData();
    const file = formData.get('file'); // Front-end က 'file' ဆိုတဲ့ Key နဲ့ ပို့တာကို ဆွဲယူခြင်း
    
    // Front-end က upload.js (Client-side) မှာ 'file' ဆိုတဲ့ key နဲ့ ပို့ထားကြောင်း တွေ့ရပါသည်။

    if (!file || file.size === 0) {
      return new Response(JSON.stringify({ status: 'ERROR', message: 'No file uploaded or file is empty.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { env } = context;
    const arrayBuffer = await file.arrayBuffer(); // File Data ကို ArrayBuffer အဖြစ် ပြောင်းခြင်း
    const key = file.name; // File Name ကို R2 Key အဖြစ် အသုံးပြုခြင်း

    // 2. R2 Bucket တွင် ဖိုင်ကို သိမ်းဆည်းခြင်း
    await env.UPLOAD_BUCKET.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream' // Content Type ကို သတ်မှတ်ခြင်း
      }
    });

    // 3. အောင်မြင်ကြောင်း JSON Response ပြန်ပို့ခြင်း
    const publicUrl = `https://${env.MY_PAGES_DOMAIN}/${key}`; // (Optional: R2 Public Access URL ကို ယူဆ၍)

    return new Response(JSON.stringify({
      status: 'SUCCESS',
      message: `${key} uploaded successfully!`,
      url: publicUrl // Client-side မှာ လိုအပ်ပါက ပြန်ပို့ရန်
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // 4. Error ဖြစ်ပါက Error JSON Response ပြန်ပို့ခြင်း
    return new Response(JSON.stringify({ 
      status: 'SERVER_ERROR', 
      message: `Internal Server Error: ${error.message}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
