// Worker Domain ကို သေချာစစ်ဆေးပြီး ထည့်သွင်းပါ။ 
// WORKER_BASE_URL သည် API Endpoints ၏ Root URL ဖြစ်ပါစေ။
const WORKER_BASE_URL = 'https://kp-upload-git.kopaing232003.workers.dev'; 
const UPLOAD_API_URL = WORKER_BASE_URL + '/upload';
const LIST_API_URL = WORKER_BASE_URL + '/list'; 


// =======================================================
// A. စာသား ကူးယူခြင်း (Copy to Clipboard Function)
// =======================================================
function copyToClipboard(elementId) {
    // free.html ထဲက vmessContent ID ကို ခေါ်သည်
    const copyText = document.getElementById(elementId); 
    
    if (copyText) {
        copyText.select();
        copyText.setSelectionRange(0, 99999); 
        
        try {
            // Copy Command
            document.execCommand('copy'); 
            alert("✅ စာသားကို ကူးယူပြီးပါပြီ!");
        } catch (err) {
            console.error('Copy failed', err);
            alert("❌ ကူးယူမှု မအောင်မြင်ပါ");
        }
    }
}


// =======================================================
// B. R2 သို့ ဖိုင်တင်ခြင်း (Upload Logic)
// =======================================================
async function startR2Upload() {
    // free.html ထဲက ID များကို ခေါ်ယူသည်
    const fileInput = document.getElementById('r2FileInput');
    const statusDiv = document.getElementById('uploadMessage'); 
    
    if (fileInput.files.length === 0) {
        statusDiv.innerText = '⚠️ ကျေးဇူးပြု၍ ဖိုင်ရွေးချယ်ပါ';
        return;
    }
    
    const file = fileInput.files[0];
    statusDiv.innerText = `🔄 ဖိုင်တင်နေသည်... ${file.name}`; 

    try {
        const formData = new FormData();
        formData.append('uploadFile', file); 

        // 🚨 ပြင်ဆင်ချက် ၁: method ကို 'POST' ပြောင်းလိုက်သည်
        const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            body: formData
        });

        // 🚨 ပြင်ဆင်ချက် ၂: response.json() ကို သုံးပြီး Error Handling ပိုကောင်းအောင် လုပ်သည်
        let result;
        try {
            result = await response.json(); 
        } catch (e) {
            // JSON ပြန်မလာရင် String အနေနဲ့ ယူပါ (Fallback)
            const textResponse = await response.text();
            result = { error: `Invalid API Response Format or Server Error: ${textResponse}` };
        }

        if (response.ok) {
            // Upload Logic: result.url ကို ပြသသည်
            statusDiv.innerText = `✅ အောင်မြင်ပါသည်! URL: ${result.url}`;
            // အောင်မြင်လျှင် ဖိုင်စာရင်းကို ပြန်ခေါ်ပါမည်
            displayFileList(); 
        } else {
            // Error Message ကို ပြသသည်
            statusDiv.innerText = `❌ Upload မအောင်မြင်ပါ: Status ${response.status}. Error: ${result.error || result.message || 'Unknown Error'}`; 
        }
    } catch (error) {
        statusDiv.innerText = `❌ Upload မအောင်မြင်ပါ: Network Error!`;
        console.error('Fetch Error:', error);
    }
}


// =======================================================
// C. R2 မှ ဖိုင်စာရင်း ရယူပြီး ပြသခြင်း (List Logic)
// =======================================================
async function displayFileList() {
    const container = document.getElementById('fileListContainer');
    if (!container) return; 
    
    container.innerHTML = '🔄 Fetching files...'; 

    try {
        const response = await fetch(LIST_API_URL);
        const files = await response.json(); 
        
        if (files && files.length > 0) {
            let listHtml = '<ul>';
            files.forEach(file => {
                // 🚨 ပြင်ဆင်ချက် ၃: URL တည်ဆောက်ပုံကို ပိုရှင်းအောင် ပြင်လိုက်သည်
                const fileUrl = `${WORKER_BASE_URL}/${file.key}`; // Worker ၏ Base URL ကို တိုက်ရိုက်သုံးသည်
                listHtml += `<li><a href="${fileUrl}" target="_blank">${file.key}</a> (${(file.size / 1024).toFixed(2)} KB)</li>`;
            });
            listHtml += '</ul>';
            container.innerHTML = listHtml;
        } else {
            container.innerHTML = 'ဖိုင်များ မရှိပါ';
        }
        
    } catch (error) {
        container.innerHTML = 'ဖိုင်စာရင်း ရယူရာတွင် အမှားဖြစ်ပွားပါသည်';
        console.error('List Error:', error);
    }
}

// Page စတင် load ချိန်တွင် ဖိုင်စာရင်းကို ချက်ချင်းခေါ်ရန် (Optional)
document.addEventListener('DOMContentLoaded', displayFileList);
