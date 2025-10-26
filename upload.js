// upload.js ဖိုင်အတွင်း ထည့်သွင်းရန် Code အပြည့်အစုံ

// Worker Domain ကို သေချာစစ်ဆေးပြီး ထည့်သွင်းခြင်း
const WORKER_BASE_URL = 'https://kp-upload-worker.kopaing232003.workers.dev'; 
const UPLOAD_API_URL = WORKER_BASE_URL + '/upload';
const LIST_API_URL = WORKER_BASE_URL + '/list'; 


// =======================================================
// 1. R2 သို့ ဖိုင်တင်ခြင်း (Upload)
// =======================================================
async function startR2Upload() {
    const fileInput = document.getElementById('r2FileInput');
    const statusDiv = document.getElementById('uploadMessage'); 
    
    // HTML Element မတွေ့ရင် Error ပြခြင်း
    if (!fileInput || !statusDiv) {
        console.error("HTML IDs not found: r2FileInput or uploadMessage");
        return; 
    }

    // ဖိုင်ရွေးထားခြင်း ရှိ၊ မရှိ စစ်ဆေးခြင်း
    if (fileInput.files.length === 0) {
        statusDiv.innerText = '⚠️ ကျေးဇူးပြု၍ ဖိုင်ရွေးချယ်ပါ';
        return;
    }
    
    const file = fileInput.files[0];
    statusDiv.innerText = `🔄 ဖိုင်တင်နေသည်... ${file.name}`; // Loading Message

    try {
        const formData = new FormData();
        formData.append('uploadFile', file); // Worker မှ မျှော်လင့်သော Key Name

        const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            body: formData
        });

        const text = await response.text();

        if (response.ok) {
            statusDiv.innerText = `✅ အောင်မြင်ပါသည်: ${text}`;
            // Upload ပြီးတာနဲ့ ဖိုင်စာရင်းကို ချက်ချင်း ပြန်ခေါ်ပြခြင်း
            displayFileList(); 
        } else {
            statusDiv.innerText = `❌ Upload မအောင်မြင်ပါ: ${text}`;
        }
    } catch (error) {
        statusDiv.innerText = `❌ Upload မအောင်မြင်ပါ: Network Error!`;
        console.error('Fetch Error:', error);
    }
}


// =======================================================
// 2. R2 မှ ဖိုင်စာရင်း ရယူပြီး ပြသခြင်း (List)
// =======================================================
async function displayFileList() {
    const container = document.getElementById('fileListContainer');
    if (!container) return; // HTML element မရှိရင် ရပ်လိုက်

    container.innerHTML = 'Fetching files...'; // Loading Message

    try {
        const response = await fetch(LIST_API_URL);
        const files = await response.json(); // Worker က ပို့လာတဲ့ R2 object တွေ

        if (files.length === 0) {
            container.innerHTML = 'R2 ထဲတွင် ဖိုင်များ မရှိသေးပါ';
            return;
        }

        let html = '<h3>R2 ဖိုင်စာရင်း:</h3><ul>';
        files.forEach(file => {
            // ဖိုင်အမည်နှင့် အရွယ်အစားကို ပြသခြင်း
            html += `<li>${file.key} (${(file.size / 1024).toFixed(2)} KB)</li>`;
        });
        html += '</ul>';
        container.innerHTML = html;
        
    } catch (error) {
        container.innerHTML = 'ဖိုင်စာရင်း ရယူရာတွင် အမှားဖြစ်ပွားပါသည်';
        console.error('List Error:', error);
    }
}

// 3. Page စတင် load ချိန်တွင် ဖိုင်စာရင်းကို ချက်ချင်းခေါ်ရန်
document.addEventListener('DOMContentLoaded', displayFileList);
