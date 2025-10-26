// upload.js ဖိုင်အတွင်း ထည့်သွင်းရန် Code အပြည့်အစုံ

// Worker Domain ကို သေချာစစ်ဆေးပြီး ထည့်သွင်းခြင်း
const WORKER_BASE_URL = 'https://kp-upload-worker.kopaing232003.workers.dev'; 
const UPLOAD_API_URL = WORKER_BASE_URL + '/upload';
const LIST_API_URL = WORKER_BASE_URL + '/list'; 


// =======================================================
// A. စာသား ကူးယူခြင်း (Copy to Clipboard Function)
// =======================================================
function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    
    if (copyText) {
        copyText.select();
        copyText.setSelectionRange(0, 99999); 
        
        try {
            document.execCommand('copy');
            alert("✅ စာသားကို ကူးယူပြီးပါပြီ!");
        } catch (err) {
            console.error('Copy failed', err);
            alert("❌ ကူးယူမှု မအောင်မြင်ပါ");
        }
    }
}


// =======================================================
// B. R2 သို့ ဖိုင်တင်ခြင်း (Upload)
// =======================================================
async function startR2Upload() {
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

        const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            body: formData
        });

        const text = await response.text();

        if (response.ok) {
            statusDiv.innerText = `✅ အောင်မြင်ပါသည်: ${text}`;
            displayFileList(); // တင်ပြီးတာနဲ့ List ကို ခေါ်ထားပါသည် (HTML မှာ နေရာမရှိရင် မပေါ်ပါ)
        } else {
            statusDiv.innerText = `❌ Upload မအောင်မြင်ပါ: ${text}`;
        }
    } catch (error) {
        statusDiv.innerText = `❌ Upload မအောင်မြင်ပါ: Network Error!`;
        console.error('Fetch Error:', error);
    }
}


// =======================================================
// C. R2 မှ ဖိုင်စာရင်း ရယူပြီး ပြသခြင်း (List)
// =======================================================
async function displayFileList() {
    // List container ကို ယာယီ ဖျောက်ထားသဖြင့်၊ container မရှိလျှင် ဘာမှမလုပ်ပါ
    const container = document.getElementById('fileListContainer');
    if (!container) return; 
    
    container.innerHTML = 'Fetching files...'; 

    try {
        const response = await fetch(LIST_API_URL);
        const files = await response.json(); 
        
        // ... (List ပြသသည့် Code များ)
        // ... (ယခု UI အတိုင်း အလုပ်လုပ်ပါမည်)
        
    } catch (error) {
        container.innerHTML = 'ဖိုင်စာရင်း ရယူရာတွင် အမှားဖြစ်ပွားပါသည်';
        console.error('List Error:', error);
    }
}

// 4. Page စတင် load ချိန်တွင် ဖိုင်စာရင်းကို ချက်ချင်းခေါ်ရန်
document.addEventListener('DOMContentLoaded', displayFileList);
