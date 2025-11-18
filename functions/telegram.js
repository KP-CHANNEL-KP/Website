// functions/telegram.js

// Helper function for JSON response
export const jsonResponse = (data, status = 200) => 
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Telegram Notification Function
export async function sendTelegramNotification(text, env) {
    const BOT_TOKEN = env.BOT_TOKEN;
    const CHAT_ID = env.CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
        console.error("Telegram Token or Chat ID is missing from Pages Environment.");
        return; 
    }
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: text,
            parse_mode: 'HTML'
        })
    }).catch(e => console.error("Telegram Send Error:", e));
}
