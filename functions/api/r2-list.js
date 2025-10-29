// functions/api/r2-list.js
// Delete ခလုတ်၊ Passcode Form နှင့် Local Storage ဖြင့် Passcode မှတ်သားခြင်း Logic ပါဝင်ပြီး

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
            flex-direction: column; 
            padding: 10px 0; 
            border-bottom: 1px dashed #e0e0e0; 
        }
        .file-name-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
            width: 100%;
        }
        .file-name { flex-grow: 1; margin-right: 10px; }
        .file-name a { color: #007bff; text-decoration: none; font-weight: bold; font-size: 1.05em; word-break: break-all; }
        .file-name a:hover { text-decoration: underline; }

        .file-metadata { 
            display: flex; 
            justify-content: flex-start; 
            align-items: center; 
            font-size: 0.85em; 
            color: #666; 
            white-space: nowrap; 
            width: 100%; 
        }
        .file-size { margin-right: 15px; }
        .file-date { margin-right: 25px; }

        .download-btn {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 5px 12px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 0.85em;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
            font-weight: normal; 
            margin-left: auto;
        }
        .download-btn:hover { background-color: #0056b3; }
        
        /* Delete ခလုတ် style */
        .delete-btn {
            background-color: #dc3545;
            color: white;
            border: none;
            padding: 5px 12px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 0.85em;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
            font-weight: normal; 
            margin-left: 10px;
        }
        .delete-btn:hover { background-color: #c82333; }
        
        /* Passcode Form Style */
        #passcode-form {
            display: flex;
            align-items: center;
            padding: 10px;
            border: 1px solid #ccc;
            margin-bottom: 15px;
            border-radius: 5px;
            background-color: #f8f9fa;
        }
        #passcode-form input {
            padding: 8px;
            margin-right: 10px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            flex-grow: 1;
        }
        #passcode-form label {
            white-space: nowrap;
            font-weight: bold;
            margin-right: 10px;
            color: #333;
        }
        
        .error-message { color: red; font-weight: bold; text-align: center; padding: 20px; }
    </style>
</head>
<body>
    <div class="file-container">
        <h3>📂 R2 File List (${sortedObjects.length} files) - Newest First</h3>
        
        <div id="passcode-form">
            <label for="admin-passcode">Admin Passcode (For Delete):</label>
            <input type="password" id="admin-passcode" placeholder="Enter Passcode to Enable Deletion">
        </div>
        
        <ul class="file-list">
        `;

        // 4. ဖိုင်တစ်ခုချင်းစီကို HTML List ထဲသို့ ထည့်သွင်းခြင်း
        if (sortedObjects.length === 0) {
            htmlContent += `<p class="error-message">ဖိုင်များမရှိသေးပါ။</p>`;
        } else {
            sortedObjects.forEach(obj => {
                const downloadUrl = `/api/r2-download/${obj.key}`; 
                const sizeMB = (obj.size / (1024 * 1024)).toFixed(2); 

                htmlContent += `
                    <li class="file-item" data-key="${obj.key}">
                        <div class="file-name-row">
                            <div class="file-name">
                                <a href="${downloadUrl}" title="${obj.key}">${obj.key}</a>
                            </div>
                            <a href="${downloadUrl}" target="_blank" class="download-btn">Download</a>
                            
                            <button class="delete-btn" onclick="deleteFile('${obj.key}')">Delete</button>
                        </div>
                        
                        <div class="file-metadata">
                            <span class="file-size">Size: ${sizeMB} MB</span>
                            <span class="file-date">Date: ${new Date(obj.uploaded).toLocaleDateString()}</span>
                        </div>
                    </li>
                `;
            });
        }

        htmlContent += `
        </ul>
    </div>
    
    <script>
        const PASSCODE_STORAGE_KEY = 'adminR2Passcode';
        const passcodeInput = document.getElementById('admin-passcode');

        // 1. စာမျက်နှာဖွင့်ဖွင့်ချင်း Local Storage ကနေ Passcode ကို ပြန်ထည့်ပေးခြင်း
        const storedPasscode = localStorage.getItem(PASSCODE_STORAGE_KEY);
        if (storedPasscode) {
            passcodeInput.value = storedPasscode;
        }

        async function deleteFile(key) {
            const passcode = passcodeInput.value;

            if (!passcode) {
                alert("Please enter the Admin Passcode in the field above to delete the file.");
                return;
            }

            if (!confirm(\`Are you sure you want to delete \${key}?\`)) {
                return;
            }

            // 2. Delete မလုပ်ခင် Passcode ကို Local Storage မှာ သိမ်းထားခြင်း
            localStorage.setItem(PASSCODE_STORAGE_KEY, passcode); 

            const deleteUrl = '/api/r2-delete';

            try {
                const formData = new FormData();
                formData.append('key', key);
                formData.append('passcode', passcode);

                // Delete Function ကို ခေါ်ယူခြင်း
                const response = await fetch(deleteUrl, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.text();

                if (response.ok) {
                    alert('Successfully deleted: ' + key);
                    // ဖျက်ပြီးပါက စာရင်းကို refresh လုပ်ရန်
                    window.location.reload(); 
                } else {
                    alert('Failed to delete: ' + result);
                    // 3. Passcode မှားရင် Local Storage ကနေ ဖျက်ပစ်ခြင်း
                    if (response.status === 401) { 
                        localStorage.removeItem(PASSCODE_STORAGE_KEY);
                        passcodeInput.value = ''; // Input Field ကို ရှင်းပစ်
                    }
                }

            } catch (error) {
                alert('An error occurred during deletion: ' + error.message);
            }
        }
    </script>
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
