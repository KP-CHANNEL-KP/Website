// index.js (Cloudflare Worker Code - အပြီးသတ် ပေါင်းစပ်ပြီး)

// ⚠️ သင့်ရဲ့ လျှို့ဝှက်အချက်အလက်များကို ဤနေရာတွင် ထည့်သွင်းပါ။
// လုံခြုံရေးအရ၊ ၎င်းတို့ကို Cloudflare Worker Settings တွင် Environment Variable အဖြစ် ထားရှိသင့်သည်။
const BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"; // ဥပမာ: 123456:ABC-DEF...
const CHAT_ID = "YOUR_TELEGRAM_CHAT_ID";   // ဥပမာ: 123456789

// ⚠️ KV Namespace ကို သင့် Cloudflare Worker Setting မှာ 'USER_DB' နာမည်နဲ့ ချိတ်ဆက်ပေးရပါမယ်။
const USER_KV = USER_DB; 

// Helper function for JSON response
const jsonResponse = (data, status = 200) => 
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// ------------------- Telegram Notification Function -------------------
async function sendTelegramNotification(text) {
    if (!BOT_TOKEN || !CHAT_ID || BOT_TOKEN === "YOUR_TELEGRAM_BOT_TOKEN") {
        console.error("Telegram Token or Chat ID is missing or not configured.");
        return; 
    }
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: text,
            parse_mode: 'HTML' // Bold စာသားများ အသုံးပြုနိုင်ရန်
        })
    });
    
    if (!response.ok) {
        console.error("Failed to send Telegram message:", await response.text());
    }
}

// ------------------- Worker Request Handler -------------------
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // CORS Headers (Frontend ကနေ ခေါ်သုံးနိုင်ဖို့)
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await request.json();

  // ------------------- Path Routing -------------------
  switch (path) {
    case '/api/signup':
      return handleSignup(body);
    case '/api/login':
      return handleLogin(body);
    case '/api/purchase': 
      return handlePurchase(body); 
    default:
      return jsonResponse({ error: 'Not Found' }, 404);
  }
}

// ------------------- 1. Signup Logic -------------------
async function handleSignup(body) {
  const { username, password } = body;
  
  if (!username || !password) {
    return jsonResponse({ error: 'Username နှင့် password လိုအပ်သည်' }, 400);
  }

  const userKey = `user:${username.toLowerCase()}`;
  const existingUser = await USER_KV.get(userKey);

  if (existingUser) {
    return jsonResponse({ error: 'Username ရှိနှင့်ပြီးဖြစ်သည်' }, 409);
  }

  const accountId = crypto.randomUUID(); 
  const userData = {
    id: accountId,
    username: username,
    hashedPassword: password, 
    points: 0, 
    created_at: new Date().toISOString(),
  };

  await USER_KV.put(userKey, JSON.stringify(userData));

  return jsonResponse({ 
    message: 'အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။', 
    user: { id: accountId, username: username, points: 0 } 
  }, 201);
}

// ------------------- 2. Login Logic -------------------
async function handleLogin(body) {
  const { username, password } = body;
  
  if (!username || !password) {
    return jsonResponse({ error: 'Username နှင့် password လိုအပ်သည်' }, 400);
  }

  const userKey = `user:${username.toLowerCase()}`;
  const userJson = await USER_KV.get(userKey);

  if (!userJson) {
    return jsonResponse({ error: 'Username သို့မဟုတ် password မမှန်ပါ' }, 401);
  }

  const user = JSON.parse(userJson);

  if (user.hashedPassword !== password) {
    return jsonResponse({ error: 'Username သို့မဟုတ် password မမှန်ပါ' }, 401);
  }
  
  return jsonResponse({ 
    message: 'အကောင့်ဝင်ခြင်း အောင်မြင်ပါသည်။', 
    user: { id: user.id, username: user.username, points: user.points } 
  });
}

// ------------------- 3. Purchase Logic (Point နှုတ်ယူခြင်း + Telegram) -------------------
async function handlePurchase(body) {
  const { userId, playerId, product } = body;
  
  if (!userId || !playerId || !product || !product.points || !product.amount) {
    return jsonResponse({ error: 'ဝယ်ယူမှုအတွက် လိုအပ်သောအချက်အလက်များ မပြည့်စုံပါ' }, 400);
  }

  const pointsRequired = product.points;
  
  // 1. User ရဲ့ Data ကို ရှာဖွေခြင်း (userId ဖြင့်)
  const userList = await USER_KV.list({ prefix: 'user:' });
  let userKey = null;
  let user = null;

  for (const keyInfo of userList.keys) {
      const userJson = await USER_KV.get(keyInfo.name);
      const tempUser = JSON.parse(userJson);
      if (tempUser.id === userId) {
          userKey = keyInfo.name;
          user = tempUser;
          break;
      }
  }

  if (!user) {
    return jsonResponse({ error: 'အသုံးပြုသူ အကောင့်ကို ရှာမတွေ့ပါ' }, 404);
  }

  // 2. Point လုံလောက်မှု ရှိမရှိ စစ်ဆေးခြင်း
  if (user.points < pointsRequired) {
    return jsonResponse({ 
      error: `Point မလုံလောက်ပါ! (လိုအပ် Point: ${pointsRequired} / လက်ရှိ Point: ${user.points})`, 
      current_points: user.points 
    }, 402); 
  }

  // 3. Point နှုတ်ယူခြင်း
  const newPoints = user.points - pointsRequired;
  user.points = newPoints;
  
  // 4. User Data ကို Update လုပ်ခြင်း
  await USER_KV.put(userKey, JSON.stringify(user));

  // 5. Telegram Notification ပေးပို့ခြင်း
  const notificationText = `
    🚨 <b>🛒 ဝယ်ယူမှု အသစ်!</b> 🚨
    
    - <b>User Name:</b> ${user.username} (ID: ${userId.substring(0, 8)}...)
    - <b>Player ID:</b> ${playerId}
    - <b>Product:</b> ${product.amount} ${product.game}
    - <b>Point နှုတ်ယူမှု:</b> ${pointsRequired} Points
    - <b>ကျန်ရှိ Point:</b> ${newPoints} Points
    
    ---
    <b>ချက်ချင်းလုပ်ဆောင်ရန်။</b>
    `;
    
  // Notification ပို့ခြင်းကို စောင့်စရာမလိုဘဲ အတူတကွ လုပ်ဆောင်သည်
  sendTelegramNotification(notificationText); 

  // 6. ဝယ်ယူမှု အောင်မြင်ကြောင်း Frontend ကို ပြန်ပို့ခြင်း
  return jsonResponse({
    message: 'ဝယ်ယူမှု အောင်မြင်ပါသည်။',
    new_points: newPoints,
    product_purchased: product,
    player_id: playerId,
  }, 200);
}

// ------------------- Worker Listener -------------------
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});


// ------------------- Admin Topup Logic -------------------

async function handleAdminTopup(body) {
  const { admin_secret, username, points } = body;

  // 1. Admin Secret စစ်ဆေးခြင်း (လုံခြုံရေး)
  if (admin_secret !== ADMIN_SECRET || !admin_secret) {
    return jsonResponse({ error: 'ခွင့်ပြုချက်မရှိပါ (Invalid Admin Secret)' }, 403);
  }

  // 2. Input စစ်ဆေးခြင်း
  if (!username || typeof points !== 'number' || points <= 0) {
    return jsonResponse({ error: 'Username နှင့် Point ပမာဏ မှန်ကန်စွာ ထည့်သွင်းပါ' }, 400);
  }

  const pointsToAdd = Math.floor(points); // ကိန်းပြည့်သာ လက်ခံမည်

  // 3. User ရဲ့ Data ကို ရှာဖွေခြင်း (Username ဖြင့်)
  const userKey = `user:${username.toLowerCase()}`;
  const userJson = await USER_KV.get(userKey);

  if (!userJson) {
    return jsonResponse({ error: `Username "${username}" ကို ရှာမတွေ့ပါ` }, 404);
  }

  const user = JSON.parse(userJson);

  // 4. Point ထပ်ပေါင်းခြင်း
  const newPoints = user.points + pointsToAdd;
  user.points = newPoints;

  // 5. User Data ကို Update လုပ်ခြင်း
  await USER_KV.put(userKey, JSON.stringify(user));

  // 6. Telegram Notification (Admin ကို အတည်ပြုပေးခြင်း)
  const notificationText = `
    ✅ <b>Point ဖြည့်သွင်းမှု အောင်မြင်!</b> ✅
    
    - <b>Admin:</b> Topup ပြုလုပ်သည်
    - <b>User Name:</b> ${user.username}
    - <b>ဖြည့်သွင်း Point:</b> +${pointsToAdd} Points
    - <b>စုစုပေါင်း Point:</b> ${newPoints} Points
    `;
  sendTelegramNotification(notificationText); // Admin ကိုပဲ ပြန်ပို့သည်

  return jsonResponse({
    message: `Point ${pointsToAdd} အောင်မြင်စွာ ဖြည့်သွင်းပြီးပါပြီ။`,
    new_points: newPoints,
    username: user.username,
  }, 200);
}
