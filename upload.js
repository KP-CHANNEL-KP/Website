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
    statusDiv.innerText = `🔄 ဖိုင်တင်ရန် URL တောင်းဆိုနေသည်... ${file.name}`; 

    // 1. Pages Function သို့ Signed URL ကို တောင်းဆိုခြင်း (GET Request)
    try {
        // file.type ကို URL Query တွင် ထည့်သွင်းပို့ပါ
        const fileType = encodeURIComponent(file.type || 'application/octet-stream');
        const apiEndpoint = '/upload-url?fileName=' + file.name + '&fileType=' + fileType;

        const response = await fetch(apiEndpoint);
        
        // Response က 500/400 Error များရှိမရှိ စစ်ဆေးပါ
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Call Failed. Status: ${response.status}. Response: ${errorText.substring(0, 50)}...`);
        }
        
        const data = await response.json();
        const signedUrl = data.uploadURL; // Pages Function မှ ပြန်ပေးသော Signed URL
        
        statusDiv.innerText = `🔄 R2 သို့ ဖိုင်တိုက်ရိုက်တင်နေသည်...`;

        // 2. Signed URL ကိုသုံးပြီး R2 Bucket သို့ ဖိုင်တိုက်ရိုက် PUT Request ပို့ခြင်း
        const uploadResponse = await fetch(signedUrl, {
            method: 'GET',
            body: file,
            headers: {
                // R2 ကို တင်ပို့မည့် Content Type
                'Content-Type': file.type || 'application/octet-stream' 
            }
        });

        if (uploadResponse.ok) {
            statusDiv.innerText = `✅ အောင်မြင်ပါသည်! ဖိုင်အမည်: ${file.name}`;
            // displayFileList(); // (လိုအပ်ရင် File List ကို ပြန်ခေါ်နိုင်သည်)
        } else {
            const uploadErrorText = await uploadResponse.text();
             throw new Error(`R2 Upload Failed. Status: ${uploadResponse.status}. Response: ${uploadErrorText.substring(0, 50)}...`);
        }

    } catch (error) {
        // API Call Failed (သို့) R2 Upload Failed ကို ဖမ်းပါ
        statusDiv.innerText = `❌ Upload မအောင်မြင်ပါ: Error: ${error.message}`;
        console.error('Final Upload Error:', error);
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
