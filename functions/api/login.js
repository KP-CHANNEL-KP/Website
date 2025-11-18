// functions/api/login.js
import { jsonResponse } from '../telegram'; 

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
        const userJson = await env.USER_DB.get(userKey);

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
    
    } catch (error) {
        return jsonResponse({ error: `Server Error: ${error.message}` }, 500);
    }
}
