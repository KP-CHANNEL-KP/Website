// functions/api/purchase.js

// Helper function for JSON response (Self-Contained - Path Error ရှောင်ရှားရန်)
const jsonResponse = (data, status = 200) => 
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/*
// ⚠️ Telegram Notification Logic ကို Error ရှောင်ရှားရန် ခဏဖယ်ရှားထားပါသည်။
// ဝယ်ယူမှု အောင်မြင်မှသာ Admin ကို သတိပေးဖို့အတွက် ဒီအပိုင်းကို နောက်မှ ပြန်ထည့်ပါမည်။
*/

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await request.json();
    // Frontend က ပို့ပေးရမည့် အချက်အလက်များ:
    const { userId, pointsToDeduct, productId, productTitle, targetId } = body;

    if (!userId || !pointsToDeduct || pointsToDeduct <= 0 || !productId) {
      return jsonResponse({ error: 'လိုအပ်သော အချက်အလက်များ မပြည့်စုံပါ' }, 400);
    }
    
    const pointsRequired = Math.floor(pointsToDeduct);
    const userKey = `user:${userId.toLowerCase()}`;
    
    // 1. User Data ကို ရှာဖွေခြင်း
    const userJson = await env.USER_DB.get(userKey);
    if (!userJson) {
      return jsonResponse({ error: `User ID ${userId} ကို ရှာမတွေ့ပါ` }, 404);
    }

    const user = JSON.parse(userJson);

    // 2. Point လက်ကျန် စစ်ဆေးခြင်း
    if (user.points < pointsRequired) {
      return jsonResponse({ 
        error: 'Point မလုံလောက်ပါ', 
        available_points: user.points 
      }, 402);
    }

    // 3. Point နှုတ်ယူခြင်း
    const newPoints = user.points - pointsRequired;
    user.points = newPoints;
    
    // 4. User Data ကို Update လုပ်ခြင်း
    await env.USER_DB.put(userKey, JSON.stringify(user));

    // 5. Telegram Admin Notification (ဝယ်ယူမှု အချက်အလက်)
    /* // ဤနေရာတွင် sendTelegramNotification() function ကို ခေါ်ပြီး 
    // Admin ထံသို့ ဝယ်ယူမှု အသေးစိတ် (Product: ${productTitle}, Target ID: ${targetId}) များကို ပို့ပါမည်။
    */

    return jsonResponse({
      message: `${productTitle} ကို ဝယ်ယူခြင်း အောင်မြင်ပါသည်။ Admin မှ အမြန်ဆုံး ဆောင်ရွက်ပေးပါမည်။`,
      new_points: newPoints,
      username: user.username,
      product: productTitle
    }, 200);

  } catch (error) {
    console.error("Purchase execution failed:", error);
    return jsonResponse({ error: `Server Error: ${error.message}` }, 500);
  }
}
