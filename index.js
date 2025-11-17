// index.js (Cloudflare Worker Code)

// ⚠️ KV Namespace ကို သင့်နာမည်အတိုင်း ပြောင်းပေးရန်။ 
// Worker Setting မှာ 'USER_DB' ကို ဒီ KV Namespace နဲ့ ချိတ်ဆက်ပေးရပါမယ်။
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
    'Access-Control-Allow-Origin': '*', // သင့် website URL ကိုသာ ထားသင့်သည်
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

  switch (path) {
    case '/api/signup':
      return handleSignup(body);
    case '/api/login':
      return handleLogin(body);
    case '/api/profile':
      return handleProfile(body);
    // case '/api/admin/topup': // Admin Point ဖြည့်သွင်းမှုအတွက် (နောက်မှရေးပါမယ်)
    //   return handleAdminTopup(body);
    default:
      return jsonResponse({ error: 'Not Found' }, 404);
  }
}

// ------------------- Worker Logic Functions -------------------

async function handleSignup(body) {
  const { username, password } = body;
  
  if (!username || !password) {
    return jsonResponse({ error: 'Username and password are required' }, 400);
  }

  // 1. Username ထပ်နေခြင်း ရှိမရှိ စစ်ဆေးခြင်း
  const userKey = `user:${username.toLowerCase()}`;
  const existingUser = await USER_KV.get(userKey);

  if (existingUser) {
    return jsonResponse({ error: 'Username already taken' }, 409);
  }

  // 2. User Data ဖန်တီးခြင်း
  const accountId = crypto.randomUUID(); // Unique Account ID
  const userData = {
    id: accountId,
    username: username,
    // ⚠️ Security Risk: Production မှာ password ကို HASH လုပ်ရပါမယ်
    hashedPassword: password, 
    points: 0, // စဝင်ဝင်ချင်း 0 point
    created_at: new Date().toISOString(),
  };

  // 3. KV မှာ သိမ်းဆည်းခြင်း
  await USER_KV.put(userKey, JSON.stringify(userData));

  return jsonResponse({ 
    message: 'Signup successful!', 
    user: { id: accountId, username: username, points: 0 } 
  }, 201);
}

async function handleLogin(body) {
  const { username, password } = body;
  
  if (!username || !password) {
    return jsonResponse({ error: 'Username and password are required' }, 400);
  }

  const userKey = `user:${username.toLowerCase()}`;
  const userJson = await USER_KV.get(userKey);

  if (!userJson) {
    return jsonResponse({ error: 'Invalid username or password' }, 401);
  }

  const user = JSON.parse(userJson);

  // ⚠️ Security Risk: Production မှာ Hash ကို နှိုင်းယှဉ်ရပါမယ်
  if (user.hashedPassword !== password) {
    return jsonResponse({ error: 'Invalid username or password' }, 401);
  }

  // 3. Login အောင်မြင်ပါက Session Token (JWT) ထုတ်ပေးနိုင်သည်
  // အခု Demo အတွက်တော့ User Data ကို ပြန်ပို့ပေးပါမယ်
  
  // ⚠️ Session Token လိုအပ်ပါမယ်။ အခုတော့ User data ကို ပို့ပြီး Front-end က Session ထိန်းပါမယ်။
  return jsonResponse({ 
    message: 'Login successful!', 
    user: { id: user.id, username: user.username, points: user.points } 
  });
}

async function handleProfile(body) {
    // Front-end ကနေ ပို့တဲ့ User ID ဒါမှမဟုတ် Session Token ကို စစ်ဆေးရပါမယ်။
    const { userId } = body; 
    
    // (အခု Demo အတွက် KV မှာ ID နဲ့ လိုက်ရှာဖို့ ယာယီ လုပ်ထားပါတယ်။)
    // ပိုမိုလုံခြုံဖို့ User Session ထဲက ID ကို သုံးသင့်ပါတယ်။
    
    // KV မှာ ID ကို တိုက်ရိုက် ရှာဖို့ ကီးပုံစံ ပြင်ရပါမယ်။ (အခုတော့ Username ကိုပဲ Key အဖြစ် သုံးထားလို့ ရှုပ်ထွေးနိုင်ပါတယ်)
    
    // Login လုပ်ပြီး Session ထိန်းထားရင် ဒီ function မလိုတော့ပါဘူး။ 
    return jsonResponse({ message: "Profile data retrieval not implemented yet." }, 501);
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// -------------------------------------------------------------
