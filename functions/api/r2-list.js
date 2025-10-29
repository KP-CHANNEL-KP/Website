// functions/api/r2-list.js

export async function onRequestGet(context) {
    const { env } = context;

    if (!env.UPLOAD_BUCKET) {
        return new Response("<h3>❌ R2 Binding Error</h3><p>UPLOAD_BUCKET binding is missing in Pages Settings!</p>", { 
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }

    try {
        // 1. R2 List Object ကို ခေါ်ယူခြင်း
        const listing = await env.UPLOAD_BUCKET.list();
        
        // 2. ဖိုင်စာရင်းကို နောက်ဆုံး တင်ထားသည့် အချိန်အလိုက် စီခြင်း (အသစ်ဆုံးက အပေါ်ဆုံး)
        const sortedObjects = listing.objects.sort((a, b) => 
            new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime()
        );

        const headers = {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
        };
        
        // 3. HTML Layout နှင့် Style ပြင်ဆင်ခြင်း
        let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>R2 File List</title>
    <style>
        body { font-family: Arial, sans-serif; background: #fff; margin: 0; padding: 0; }
        .file-container { width: 100%; margin: 0; padding: 10px; box-sizing: border-box; }
        h3 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; margin-top: 0; font-size: 1.1em; }
        .file-list { list-style: none; padding: 0; }
        .file-item { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 10px 0; 
            border-bottom: 1px dashed #e0e0e0; 
        }
        .file-name { flex-grow: 1; margin-right: 10px; }
        .file-name a { color: #333; text-decoration: none; font-weight: bold; font-size: 1.05em; word-break: break-all; }
        .file-metadata { display: flex; align-items: center; font-size: 0.8em; color: #666; white-space: nowrap; }
        .file-size { margin-right: 10px; }
        .download-btn {
            background-color: #28a745;
            color: white;
            border: none;
            padding: 5px 10px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 0.9em;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .download-btn:hover { background-color: #218838; }
        /* Error Message Style */
        .error-message { color: red; font-weight: bold; text-align: center; padding: 20px; }
    </style>
</head>
<body>
    <div class="file-container">
        <h3>📂 R2 File List (${sortedObjects.length} files) - Newest First</h3>
        <ul class="file-list">
        `;

        // 4. ဖိုင်တစ်ခုချင်းစီကို HTML List ထဲသို့ ထည့်သွင်းခြင်း
        if (sortedObjects.length === 0) {
            htmlContent += `<p class="error-message">ဖိုင်များမရှိသေးပါ။</p>`;
        } else {
            sortedObjects.forEach(obj => {
                // Download URL ကို နောက်တစ်ဆင့်အတွက် Placeholder အဖြစ်ထားပါမည်
                // /api/r2-download/[filename] ဆိုတဲ့ Pages Function အသစ် လိုအပ်ပါမည်
                const downloadUrl = `/api/r2-download/${obj.key}`; 
                
                const sizeMB = (obj.size / (1024 * 1024)).toFixed(2); 

                htmlContent += `
                    <li class="file-item">
                        <div class="file-name">
                            <a href="${downloadUrl}" target="_blank">${obj.key}</a>
                        </div>
                        <div class="file-metadata">
                            <span class="file-size">${sizeMB} MB</span>
                            <span class="file-date">${new Date(obj.uploaded).toLocaleDateString()}</span>
                            <a href="${downloadUrl}" target="_blank" class="download-btn" style="margin-left: 10px;">Download</a>
                        </div>
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
