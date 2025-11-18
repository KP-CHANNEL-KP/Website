// index.js (Cloudflare Worker Code - ပေါင်းစပ်ပြီး)

// ⚠️ KV Namespace ကို သင့် Cloudflare Worker Setting မှာ 'USER_DB' နာမည်နဲ့ ချိတ်ဆက်ပေးရပါမယ်။
const USER_KV = USER_DB; 

// Helper function for JSON response
const jsonResponse = (data, status = 200) => 
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Worker Request Handler
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // CORS Headers (Frontend ကနေ ခေါ်သုံးနိုင်ဖို့)
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // ⚠️ ပုံမှန်အားဖြင့် သင့် website URL ကိုသာ ထားသင့်သည်။
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
  }

  // POST Request များကိုသာ ကိုင်တွယ်မည်
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
    case '/api/purchase': // ဝယ်ယူမှု (Point နှုတ်ယူခြင်း)
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

  // 1. Username ထပ်နေခြင်း ရှိမရှိ စစ်ဆေးခြင်း
  const userKey = `user:${username.toLowerCase()}`;
  const existingUser = await USER_KV.get(userKey);

  if (existingUser) {
    return jsonResponse({ error: 'Username ရှိနှင့်ပြီးဖြစ်သည်' }, 409);
  }

  // 2. User Data ဖန်တီးခြင်း
  const accountId = crypto.randomUUID(); // Unique Account ID
  const userData = {
    id: accountId,
    username: username,
    // ⚠️ လုံခြုံရေးအတွက် Hash မလုပ်ထားပါ။ Production တွင် Hashing ပြုလုပ်သင့်ပါသည်။
    hashedPassword: password, 
    points: 0, // စဝင်ဝင်ချင်း 0 point
    created_at: new Date().toISOString(),
  };

  // 3. KV မှာ သိမ်းဆည်းခြင်း
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

  // ⚠️ Password စစ်ဆေးခြင်း (Hash မပါ)
  if (user.hashedPassword !== password) {
    return jsonResponse({ error: 'Username သို့မဟုတ် password မမှန်ပါ' }, 401);
  }
  
  // Login အောင်မြင်ပါက User data ကို ပို့ပါ
  return jsonResponse({ 
    message: 'အကောင့်ဝင်ခြင်း အောင်မြင်ပါသည်။', 
    user: { id: user.id, username: user.username, points: user.points } 
  });
}

// ------------------- 3. Purchase Logic (Point နှုတ်ယူခြင်း) -------------------
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

  // ID နဲ့ ကိုက်ညီတဲ့ user ကို ရှာဖွေခြင်း (Temporary Scan method)
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

  // 5. ဝယ်ယူမှု အတည်ပြုခြင်း (Admin ကို အသိပေးခြင်း)
  // ⚠️ ဒီနေရာမှာ Admin ကို Telegram/Email ကနေ Notification ပို့တဲ့ Logic ထပ်ထည့်သင့်ပါသည်။

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
