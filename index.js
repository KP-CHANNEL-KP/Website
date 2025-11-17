export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if(url.pathname === '/api/order/create' && request.method === 'POST'){
      const formData = await request.formData();
      const cart = JSON.parse(formData.get('cart'));
      const total = formData.get('total');
      const screenshot = formData.get('screenshot');

      // Upload screenshot to R2
      const key = `order-${Date.now()}.png`;
      await env.R2_BUCKET.put(key, await screenshot.arrayBuffer(), {
        httpMetadata: { contentType: screenshot.type }
      });

      // Save order to D1
      await env.D1_DATABASE.prepare(
        `INSERT INTO orders (cart, total, screenshot, status) VALUES (?, ?, ?, ?)`
      ).bind(JSON.stringify(cart), total, key, 'pending').run();

      // Notify Admin Telegram
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_ADMIN_CHAT_ID,
          text: `New Order!\nTotal: ${total} Ks`,
          reply_markup:{
            inline_keyboard:[
              [
                { text:'Approve', callback_data:`approve-${Date.now()}` },
                { text:'Reject', callback_data:`reject-${Date.now()}` }
              ]
            ]
          }
        })
      });

      return new Response(JSON.stringify({ success:true }), { status:200 });
    }

    // Telegram callback handler
    if(url.pathname === '/api/telegram/callback'){
      const body = await request.json();
      const callback_data = body.callback_query.data;
      // Update order + points in DB here
      return new Response('OK');
    }

    return new Response('Not Found', { status:404 });
  }
}
