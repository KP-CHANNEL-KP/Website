// This is the main logic file for the website, handling all user interactions and API calls.

// Admin Password for the text editor section
const ADMIN_TEXT_PASSWORD = "232003"; 
        
// 🔔 PUSH NOTIFICATION PROMPT FUNCTION 
// Function called when the user clicks the custom "Notify Me" button.
function showNotificationPrompt() {
    // Wait for OneSignal to be ready
    window.OneSignalDeferred.push(function(OneSignal) {
        // 1. Show the native browser prompt (e.g., the white box) to subscribe
        OneSignal.showNativePrompt();
        // 2. Hide the custom red prompt box immediately after the native prompt appears
        document.getElementById('notificationPrompt').style.display = 'none';
    });
}

// 🚨🚨 GATE 2 FUNCTION (Download function with an intermediate advertising link)
function startFileDownload(r2_url) {
    // Open the ad link in a new tab
    window.open("https://www.effectivegatecpm.com/np4tde3942?key=3493cfa20b5c90219d4054a4d0bb7f6d", "_blank");
    
    // After a short delay, redirect the current window to the actual R2 download URL
    setTimeout(function() {
        window.location.href = r2_url; 
    }, 100); 
}

// 1. Password Check Function for Admin Panel
function checkAdminPassword() {
    const inputPw = document.getElementById('adminTextPwInput').value;
    const adminPanel = document.getElementById('textAdminPanel');
    const pwGate = document.getElementById('adminPasswordGate');
    const pwMessage = document.getElementById('pwMessage');
    
    if (inputPw === ADMIN_TEXT_PASSWORD) {
        pwGate.style.display = 'none';
        adminPanel.style.display = 'block';
        pwMessage.style.display = 'none';
    } else {
        pwMessage.style.display = 'block';
    }
}

// 🚨🚨 GATE 1 FUNCTION (Show the R2 file list iframe)
function showFiles() {
    document.getElementById('r2-file-list-iframe').style.display = 'block';
    document.getElementById('file-list-message').style.display = 'block';
}

// Getting HTML elements for the main text and input areas
const mainTextarea = document.getElementById('mainTextArea'); 
const inputLine = document.getElementById('inputLine');
const saveButton = document.getElementById('saveButton');

// 2. Copy Function (Copy main text content to clipboard)
function copyMainTextToClipboard() {
    const textToCopy = mainTextarea.value;
    if (textToCopy && textToCopy !== 'ဒေတာများကို စတင်ဆွဲယူနေပါသည်။') {
        // Use modern clipboard API
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                // Using a custom message box instead of alert()
                alert("စာသား ကူးယူပြီးပါပြီ!"); 
            })
            .catch(err => {
                console.error('Copy Error:', err);
                alert("ကူးယူရန် မအောင်မြင်ပါ!");
            });
    } else {
        alert("ကူးယူရန် စာသား မရှိပါ!");
    }
}

// 3. File Name Display Function (Updates file name text when user selects a file)
function updateFileName(input) {
    var fileName = input.files[0] ? input.files[0].name : "Choose File";
    document.getElementById('fileNameDisplay').innerText = fileName;
}

// 4. R2 Upload Functions (Handles file upload to R2 storage)
async function startR2Upload() {
    const fileInput = document.getElementById('fileInput');
    const uploadMessage = document.getElementById('uploadMessage');
    
    if (fileInput.files.length === 0) {
        uploadMessage.innerHTML = '❌ ဖိုင်ရွေးချယ်ရန် လိုအပ်ပါသည်။';
        return;
    }

    const file = fileInput.files[0];
    uploadMessage.innerHTML = `⌛ ${file.name} ကို Upload ပြုလုပ်နေပါသည်။...`;
    
    // API endpoint for file upload (must be configured on the server side)
    const apiEndpoint = "/api/upload"; 

    const formData = new FormData();
    formData.append('file', file); 

    try {
        const uploadResponse = await fetch(apiEndpoint, {
            method: 'POST', 
            body: formData 
        });

        const result = await uploadResponse.json(); 

        if (uploadResponse.ok && result.status === 'SUCCESS') {
            uploadMessage.innerHTML = `✅ ဖိုင်ကို အောင်မြင်စွာ တင်ပြီးပါပြီ! (${file.name}). Message: ${result.message}`;
            const iframe = document.getElementById('r2-file-list-iframe');
            if (iframe) {
                // Refresh the iframe to show the new file
                iframe.src = iframe.src; 
            }
        } else {
            const errorText = result.message || uploadResponse.statusText;
            uploadMessage.innerHTML = `❌ Upload မအောင်မြင်ပါ။ Error: ${errorText}`;
            throw new Error(`Upload Failed: ${errorText}`);
        }
    } catch (error) {
        console.error('Final Upload Error:', error);
        uploadMessage.innerHTML = `❌ Upload မအောင်မြင်ပါ။ Error: ${error.message}`;
    }
}

// 5. Fetch Text from Server (KV storage) and Display it
async function fetchInitialText() {
    try {
        const response = await fetch('/api/text'); 
        const text = await response.text();
        mainTextarea.value = text;
    } catch (error) {
        console.error('Failed to fetch initial text:', error);
        mainTextarea.value = 'Data load မလုပ်နိုင်ပါ။ Backend/KV ချိတ်ဆက်မှု စစ်ဆေးပါ။';
    }
}

// 6. Save Text to Server (KV storage)
async function saveToMainTextarea() {
    const newText = inputLine.value.trim(); 
    
    if (newText === '') {
        alert('ထည့်သွင်းရန် စာသား မရှိပါ။');
        return;
    }
    
    let oldContent = mainTextarea.value.trim();
    
    // Clear initial or error messages before saving new data
    if (oldContent === 'ဒေတာများကို စတင်ဆွဲယူနေပါသည်။' || oldContent.includes('Data load မလုပ်နိုင်ပါ') || oldContent === 'Hello' || oldContent === '') {
        oldContent = '';
    }
    
    const now = new Date();
    const timestamp = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

    const divider = '\n\n============================\n\n';
    const newEntry = `[${timestamp}]\n\n${newText}`;

    let updatedText;
    
    // Concatenate new entry with old content, placing the newest entry on top
    if (oldContent === '') {
        updatedText = newEntry; 
    } else {
        updatedText = newEntry + divider + oldContent; 
    }
    
    // Disable button and show loading state
    saveButton.disabled = true;
    saveButton.innerText = 'သိမ်းဆည်းနေပါသည်...';

    try {
        const response = await fetch('/api/text', {
            method: 'POST',
            body: updatedText,
            headers: { 'Content-Type': 'text/plain' }
        });

        if (!response.ok) {
            throw new Error('Server error: ' + response.statusText);
        }

        // Update UI after successful save
        mainTextarea.value = updatedText; 
        inputLine.value = ''; 
        alert('✅ စာသားကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။ (အသစ်ဆုံးစာ အပေါ်ဆုံးတွင် ရောက်နေပါမည်)');
        
        mainTextarea.scrollTop = 0; // Scroll to the top to see the new entry

    } catch (error) {
        alert('❌ သိမ်းဆည်းမှု မအောင်မြင်ပါ။ Error: ' + error.message);
        console.error('Save error:', error);
    } finally {
        // Re-enable button
        saveButton.disabled = false;
        saveButton.innerText = 'စာသားထည့်သွင်း/သိမ်းဆည်း (Save)';
    }
}

// Fetch the initial text content when the page loads
document.addEventListener('DOMContentLoaded', fetchInitialText);
