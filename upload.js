// upload.js ဖိုင်အတွင်းမှ Code:

// သင်၏ Worker URL ကို အစားထိုးပါ။ (နောက်မှာ /upload ပါရမည်)
const WORKER_API_URL = 'https://kp-upload-worker.kopang232003.workers.dev/upload'; 

async function startR2Upload() {
    const fileInput = document.getElementById('r2FileInput');
    const statusDiv = document.getElementById('uploadMessage');
    const file = fileInput.files[0];

    if (!file) {
        statusDiv.innerText = 'ကျေးဇူးပြု၍ တင်မည့်ဖိုင်ကို ရွေးချယ်ပါ။';
        return;
    }

    statusDiv.innerText = `Uploading ${file.name}...`;

    // Form Data တည်ဆောက်ခြင်း
    const formData = new FormData();
    // Worker Code ထဲမှာ သတ်မှတ်ခဲ့တဲ့ key name 'uploadFile' နဲ့ တူရပါမယ်။
    formData.append('uploadFile', file); 

    try {
        // Worker API ကို ခေါ်ဆိုခြင်း
        const response = await fetch(WORKER_API_URL, {
            method: 'POST',
            body: formData, 
        });

        if (response.ok) {
            statusDiv.innerText = `${file.name} ကို R2 တွင် အောင်မြင်စွာ တင်ပြီးပါပြီ။`;
        } else {
            const errorText = await response.text();
            statusDiv.innerText = `Upload မအောင်မြင်ပါ: ${errorText}`;
        }
    } catch (error) {
        statusDiv.innerText = `ကွန်ရက်ချိတ်ဆက်မှု ပြဿနာကြောင့် Upload မအောင်မြင်ပါ`;
        console.error('Fetch Error:', error);
    }
}
