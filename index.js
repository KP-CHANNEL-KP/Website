export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Order Create Endpoint
    if(url.pathname === '/api/order/create' && request.method === 'POST'){
      const formData = await request.formData();
      const cart = JSON.parse(formData.get('cart'));
      const total = formData.get('total');
      const screenshot = formData.get('screenshot');

      const key = `order-${Date.now()}.png`;
      await env.R2_BUCKET.put(key, await screenshot.arrayBuffer(), {
        httpMetadata: { contentType: screenshot.type }
      });

      // Insert into D1
      const orderResult = await env.D1_DATABASE.prepare(
        `INSERT INTO orders (cart, total, screenshot, status, user_id) VALUES (?, ?, ?, ?, ?)`
      ).bind(JSON.stringify(cart), total, key, 'pending', 'USER_PHONE_OR_ID').run();

      const orderId = orderResult.lastInsertRowid;

      // Send Telegram message to admin
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_ADMIN_CHAT_ID,
          text: `New Order!\nTotal: ${total} Ks\nOrder ID: ${orderId}`,
          reply_markup:{
            inline_keyboard:[
              [
                { text:'Approve', callback_data:`approve-${orderId}` },
                { text:'Reject', callback_data:`reject-${orderId}` }
              ]
            ]
          }
        })
      });

      return new Response(JSON.stringify({ success:true }), { status:200 });
    }

    // Telegram Callback Handler
    if(url.pathname === '/api/telegram/callback' && request.method === 'POST'){
      const body = await request.json();
      const callback = body.callback_query;
      const data = callback.data; // approve-123 or reject-123
      const [action, orderId] = data.split('-');

      // Get order from DB
      const order = await env.D1_DATABASE.prepare(`SELECT * FROM orders WHERE id=?`)
        .bind(orderId).first();

      if(!order) return new Response('Order not found', { status:404 });

      if(action === 'approve'){
        // Update order status
        await env.D1_DATABASE.prepare(`UPDATE orders SET status=? WHERE id=?`)
          .bind('approved', orderId).run();

        // Calculate points (1 Ks = 1 point)
        const points = order.total;

        // Update user points
        await env.D1_DATABASE.prepare(`UPDATE users SET points = points + ? WHERE id=?`)
          .bind(points, order.user_id).run();

        // Notify User
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({
            chat_id: order.user_id,
            text: `Your order #${orderId} is approved! You earned ${points} points.`
          })
        });

      } else if(action === 'reject'){
        // Update order status
        await env.D1_DATABASE.prepare(`UPDATE orders SET status=? WHERE id=?`)
          .bind('rejected', orderId).run();

        // Notify User
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({
            chat_id: order.user_id,
            text: `Your order #${orderId} was rejected by admin.`
          })
        });
      }

      // Answer callback to remove loading
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ callback_query_id: callback.id })
      });

      return new Response('OK');
    }

    return new Response('Not Found', { status:404 });
  }
}
