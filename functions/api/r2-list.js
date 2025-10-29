// functions/api/r2-list.js
// R2 Bucket Bindings: UPLOAD_BUCKET ကို ဤနေရာတွင် အသုံးပြုမည်

export async function onRequestGet(context) {
    const { env } = context;

    // R2 Binding ကို စစ်ဆေးပါ (Upload အတွက် ချိတ်ထားပြီးသား UPLOAD_BUCKET ကိုပဲ သုံးပါမည်)
    if (!env.UPLOAD_BUCKET) {
        // Backend Error ကို JSON မဟုတ်ဘဲ HTML ဖြင့် ပြန်ပို့ပါ (iFrame ထဲမှာ မြင်ရအောင်)
        return new Response("<h3>❌ R2 Binding Error</h3><p>UPLOAD_BUCKET binding is missing in Pages Settings!</p>", { 
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }

    try {
        // 1. R2 List Object ကို ခေါ်ယူခြင်း
        const listing = await env.UPLOAD_BUCKET.list();
        
        const headers = {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*', // free.html မှ ခေါ်ယူနိုင်ရန်
            'Cache-Control': 'no-cache',
        };
        
        // 2. HTML စာရင်း စတင် တည်ဆောက်ခြင်း
        let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>R2 File List</title>
    <style>
        body { font-family: Arial, sans-serif; background: white; margin: 0; padding: 10px; }
        .file-container { max-width: 100%; margin: 0 auto; padding: 0; border-radius: 8px; }
        h3 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; margin-top: 0; font-size: 1.1em; }
        ul { list-style: none; padding: 0; }
        li { margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        a { color: #007bff; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
        .file-info { font-size: 0.85em; color: #666; }
    </style>
</head>
<body>
    <div class="file-container">
        <h3>📂 R2 File List (${listing.objects.length} files)</h3>
        <ul>
        `;

        // 3. ဖိုင်တစ်ခုချင်းစီကို HTML List ထဲသို့ ထည့်သွင်းခြင်း
        if (listing.objects.length === 0) {
            htmlContent += `<li><p style="color:#999;">ဖိုင်များမရှိသေးပါ</p></li>`;
        } else {
            listing.objects.forEach(obj => {
                // Pages Function Route ကိုပဲ သုံးပြီး Download လုပ်ပါမည် (အခြား API တစ်ခု လိုအပ်)
                // လောလောဆယ် Download နေရာမှာ Placeholder ထားပါမည်။
                // Download URL ကို /download/[key] လိုမျိုး နောက်ထပ် Pages Function တစ်ခုနဲ့မှ လုပ်ရမည်။
                const downloadPlaceholderUrl = `/r2-download-link/${obj.key}`; 
                
                const sizeMB = (obj.size / (1024 * 1024)).toFixed(2); 

                htmlContent += `
                    <li>
                        <a href="${downloadPlaceholderUrl}" target="_blank">${obj.key}</a>
                        <span class="file-info">${sizeMB} MB | ${new Date(obj.uploaded).toLocaleDateString()}</span>
                    </li>
                `;
            });
        }

        htmlContent += `
        </ul>
    </div>
</body>
</html>`;

        return new Response(htmlContent, { headers });

    } catch (error) {
        return new Response(`<h3>❌ R2 Listing Error</h3><p>Server Error: ${error.message}</p>`, { 
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
}
