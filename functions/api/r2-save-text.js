// functions/api/r2-save-text.js - စာသား အသစ်ကို အပေါ်ဆုံးတွင် ထည့်သွင်းသိမ်းဆည်းမည့် Function

export async function onRequestPost(context) {
    const { env, request } = context;

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    if (!env.UPLOAD_BUCKET) {
        return new Response(JSON.stringify({ error: "R2 Binding is missing!" }), { status: 500, headers });
    }

    try {
        const body = await request.json();
        const newKey = body.key;           // အောက်ခံ Key/Name (ဥပမာ: vmess://...)
        const newContent = body.content;   // Textarea ထဲက စာသားအဟောင်း/အသစ် အားလုံး
        
        if (!newKey || !newContent) {
            return new Response(JSON.stringify({ error: "Key or Content is missing." }), { status: 400, headers });
        }
        
        // 1. Text Box ထဲက စာသားအဟောင်း/အသစ် တစ်ခုလုံးကို R2 မှာ overwrite လုပ်သိမ်းဆည်းခြင်း
        // Note: လက်ရှိ UI က Input/Textarea တစ်ခုတည်းကိုသာ သိမ်းဆည်းတဲ့ပုံစံကို ယူထားပါတယ်။ 
        // 2. စာအသစ်ကို အပေါ်ဆုံးသို့ ရွှေ့ခြင်း (Prepend)
        // 🚨 ဤအပိုင်းကို Frontend (JavaScript) မှသာ ထိန်းချုပ်နိုင်ပါသည်။
        // ဤ Function မှာ စာသားတစ်ခုလုံးကို R2 မှာ တင်ပေးခြင်းသာ လုပ်ဆောင်ပါမည်။
        
        await env.UPLOAD_BUCKET.put(newKey, newContent, {
            httpMetadata: {
                contentType: 'text/plain; charset=utf-8',
            },
        });

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Content saved successfully to R2 key: ${newKey}` 
        }), { status: 200, headers });

    } catch (error) {
        return new Response(JSON.stringify({ error: `Server Error: ${error.message}` }), { status: 500, headers });
    }
}
