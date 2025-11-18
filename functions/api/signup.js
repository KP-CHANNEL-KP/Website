// functions/api/signup.js
import { jsonResponse } from '../telegram.js'; // Helper ကို ခေါ်သုံးခြင်း

export async function onRequest({ request, env }) {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
        const body = await request.json();
        const { username, password } = body;
        
        if (!username || !password) {
            return jsonResponse({ error: 'Username နှင့် password လိုအပ်သည်' }, 400);
        }

        const userKey = `user:${username.toLowerCase()}`;
        const existingUser = await env.USER_DB.get(userKey); 

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

        await env.USER_DB.put(userKey, JSON.stringify(userData));

        return jsonResponse({ 
            message: 'အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။', 
            user: { id: accountId, username: username, points: 0 } 
        }, 201);
    
    } catch (error) {
        // Network Error ကို ဖြေရှင်းဖို့ ဒီ Error ကို စစ်ဆေးပါ။
        console.error("Signup Error:", error);
        return jsonResponse({ error: 'Server Error: Pages Functions ချိတ်ဆက်မှုကို စစ်ဆေးပါ' }, 500);
    }
}
