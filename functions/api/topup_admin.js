// functions/api/topup_admin.js (Path အသစ်ဖြင့်)

// Helper function ကို တိုက်ရိုက်ထည့်သွင်းခြင်း (Self-Contained)
const jsonResponse = (data, status = 200) => 
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Cloudflare Pages Settings မှ ADMIN_SECRET ကို ခေါ်ယူခြင်း
  const ADMIN_SECRET = env.ADMIN_SECRET; 

  try {
    const body = await request.json();
    const { admin_secret, username, points } = body;

    // 1. Admin Secret စစ်ဆေးခြင်း (Server-side)
    if (admin_secret !== ADMIN_SECRET || !admin_secret) {
      return jsonResponse({ error: 'ခွင့်ပြုချက်မရှိပါ (Invalid Admin Secret)' }, 403);
    }

    if (!username || typeof points !== 'number' || points <= 0) {
      return jsonResponse({ error: 'Username နှင့် Point ပမာဏ မှန်ကန်စွာ ထည့်သွင်းပါ' }, 400);
    }

    const pointsToAdd = Math.floor(points);

    // 2. User Data ကို ရှာဖွေခြင်း
    const userKey = `user:${username.toLowerCase()}`;
    const userJson = await env.USER_DB.get(userKey);

    if (!userJson) {
      return jsonResponse({ error: `Username "${username}" ကို ရှာမတွေ့ပါ` }, 404);
    }

    const user = JSON.parse(userJson);

    // 3. Point ထပ်ပေါင်းခြင်း
    const newPoints = user.points + pointsToAdd;
    user.points = newPoints;

    // 4. User Data ကို Update လုပ်ခြင်း
    await env.USER_DB.put(userKey, JSON.stringify(user));

    // 5. Telegram Notification (Error မဖြစ်စေရန် ဖယ်ရှားထားပါသည်။)

    return jsonResponse({
      message: `Point ${pointsToAdd} အောင်မြင်စွာ ဖြည့်သွင်းပြီးပါပြီ။`,
      new_points: newPoints,
      username: user.username,
    }, 200);

  } catch (error) {
    console.error("Topup execution failed:", error);
    return jsonResponse({ error: `Server Error: ${error.message}.` }, 500);
  }
}
