// functions/api/admin/topup.js (Crash Test Code)

// Helper function ကို တိုက်ရိုက်ထည့်သွင်းခြင်း
const jsonResponse = (data, status = 200) => 
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequest({ request, env }) {
    // ⚠️ ဤ Function သည် Admin Secret သို့မဟုတ် KV ကို လုံးဝ မခေါ်ပါ။
    // ၎င်းသည် တိုက်ရိုက် အောင်မြင်ကြောင်းသာ ပြန်ပို့ပါမည်။
    
    // Test Pass ကို စမ်းသပ်ရန် စာသား
    console.log("Admin Topup Function Started.");
    
    return jsonResponse({
        message: "TEST SUCCESS! Function is reaching the server!",
        status_code: 200
    }, 200);
}
