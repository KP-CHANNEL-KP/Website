// /functions/api/upload.js
// R2 Upload 기능을 "ခဏပိတ်" 모드로 전환한 버전입니다.
// Frontend ကနေ /api/upload ကိုခေါ်ရင် JSON နဲ့ "DISABLED" status ပြန်ပေးမယ်။

export async function onRequestPost(context) {
  try {
    // POST request ကိုသာ ကိုင်တွယ်ရန်
    if (context.request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    
    // 1. Request body ကို Form Data အဖြစ် ရယူခြင်း
    const formData = await context.request.formData();
    const file = formData.get('file'); 

    if (!file || file.size === 0) {
      return new Response(
        JSON.stringify({ status: 'ERROR', message: 'No file uploaded.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ❗ IMPORTANT:
    // ဒီနေရာကနေဖော R2 ကို မခေါ်တော့ပါဘူး (env.UPLOAD_BUCKET 사용 X)
    // ခဏ R2 Upload ကို Disable လုပ်ထားတဲ့ message နဲ့ပဲ ပြန်ပေးထားပါတယ်။

    const filename = file.name || 'unknown';

    return new Response(
      JSON.stringify({
        status: 'DISABLED',
        filename,
        message: `R2 Upload ကို ခဏ ပိတ်ထားပါသဖြင့် "${filename}" ကို Server ပေါ် မသိမ်းဘူးပါနော်။`
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    // Error ဖြစ်ပါက Error JSON Response ပြန်ပို့ခြင်း
    return new Response(
      JSON.stringify({ 
        status: 'SERVER_ERROR', 
        message: `File upload failed due to server error: ${error.message}` 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
