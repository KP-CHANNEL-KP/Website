// Cloudflare KV Namespace ကို Environment Variable အနေနဲ့ ရယူသည်။
// Binding Name မှာ TEXT_STORAGE ဖြစ်ရမည် (သင် Settings မှာ ချိတ်ထားပြီးပါပြီ)

const MAIN_KEY = 'VMESS_CONTENT'; // KV ထဲမှာ စာသားအားလုံးကို သိမ်းမယ့် Key

export async function onRequestGet({ env }) {
    try {
        // KV ထဲမှ လက်ရှိ စာသားများကို ဖတ်ယူခြင်း
        const text = await env.TEXT_STORAGE.get(MAIN_KEY);
        
        // စာသားမရှိရင် ကနဦးတန်ဖိုးကို ပြန်ပို့
        if (!text) {
            return new Response('vmess://default_key_here', {
                headers: { 'Content-Type': 'text/plain' },
            });
        }

        return new Response(text, {
            headers: { 'Content-Type': 'text/plain' },
        });

    } catch (e) {
        return new Response('Error retrieving text: ' + e.message, { status: 500 });
    }
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.text();

        if (!body) {
            return new Response('No text provided.', { status: 400 });
        }

        // KV ထဲသို့ စာသားအသစ်ကို ရေးသားခြင်း
        await env.TEXT_STORAGE.put(MAIN_KEY, body);

        return new Response('Text saved successfully.', { status: 200 });

    } catch (e) {
        return new Response('Error saving text: ' + e.message, { status: 500 });
    }
}
