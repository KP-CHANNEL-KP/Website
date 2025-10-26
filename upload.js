// upload.js ဖိုင်အတွင်း ထည့်သွင်းရန် Code အပြည့်အစုံ

// သင့် Worker Domain ကို အတည်ပြုပြီး ထည့်သွင်းခြင်း
const WORKER_BASE_URL = 'https://kp-upload-worker.kopaing232003.workers.dev'; 
const UPLOAD_API_URL = WORKER_BASE_URL + '/upload';
const LIST_API_URL = WORKER_BASE_URL + '/list'; 


// =======================================================
// 1. R2 သို့ ဖိုင်တင်ခြင်း (Upload)
// =======================================================
async function startR2Upload() {
    // free.html မှ ID များ
    const fileInput = document.getElementById('r2FileInput');
    const statusDiv = document.getElementById('uploadMessage'); 
    
    if (!fileInput || !statusDiv) {
        console.error("HTML IDs not found: r2FileInput or uploadMessage");
        return; 
    }

    if (fileInput.files.length === 0) {
        statusDiv.innerText = '⚠️ ကျေးဇူးပြု၍ ဖိုင်ရွေးချယ်ပါ';
        return;
    }
    
    const file = fileInput.files[0];
    statusDiv.innerText = `🔄 ဖိုင်တင်နေသည်... ${file.name}`; 

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
            displayFileList(); // ဖိုင်တင်ပြီးတာနဲ့ စာရင်းကို ပြန်ခေါ်
        } else {
            statusDiv.innerText = `❌ Upload မအောင်မြင်ပါ: ${text}`;
        }
    } catch (error) {
        statusDiv.innerText = `❌ Upload မအောင်မြင်ပါ: Network ချိတ်ဆက်မှု အမှား`;
        console.error('Fetch Error:', error);
    }
}


// =======================================================
// 2. R2 မှ ဖိုင်စာရင်း ရယူပြီး ပြသခြင်း (List)
// =======================================================
async function displayFileList() {
    const container = document.getElementById('fileListContainer');
    if (!container) return; 
    
    container.innerHTML = 'Fetching files...'; 

    try {
        const response = await fetch(LIST_API_URL);
        const files = await response.json(); 

        if (files.length === 0) {
            container.innerHTML = 'R2 ထဲတွင် ဖိုင်များ မရှိသေးပါ';
            return;
        }

        let html = '<h3>R2 ဖိုင်စာရင်း:</h3><ul>';
        files.forEach(file => {
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
