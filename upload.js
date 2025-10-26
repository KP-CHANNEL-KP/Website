// upload.js ဖိုင်အတွင်း ထည့်သွင်းရန် Code အပြည့်အစုံ
const WORKER_API_URL = 'https://kp-upload-worker.kopaing232003.workers.dev/upload'; 

async function startR2Upload() {
    const fileInput = document.getElementById('r2FileInput');
    const statusDiv = document.getElementById('uploadMessage'); 
    
    // ဖိုင်မရွေးရသေးရင်
    if (fileInput.files.length === 0) {
        statusDiv.innerText = '⚠️ ကျေးဇူးပြု၍ ဖိုင်ရွေးချယ်ပါ';
        return;
    }
    
    const file = fileInput.files[0];
    statusDiv.innerText = `🔄 ဖိုင်တင်နေသည်... ${file.name}`; // Loading Message ပြခြင်း

    try {
        const formData = new FormData();
        formData.append('uploadFile', file); // Worker မှ မျှော်လင့်သော Key Name

        const response = await fetch(WORKER_API_URL, {
            method: 'POST',
            body: formData
        });

        const text = await response.text();

        if (response.ok) {
            // အောင်မြင်ပါက Message ပြသခြင်း
            statusDiv.innerText = `✅ အောင်မြင်ပါသည်: ${text}`;
        } else {
            // Error ရှိပါက Message ပြသခြင်း
            statusDiv.innerText = `❌ Upload မအောင်မြင်ပါ: ${text}`;
        }
    } catch (error) {
        // Network Error များ
        statusDiv.innerText = `❌ Upload မအောင်မြင်ပါ: Network ချိတ်ဆက်မှု အမှား`;
        console.error('Fetch Error:', error);
    }
}

// Pages Project တွင် ဖိုင်စာရင်းပြသရန် Logic မထည့်သေးပါ
