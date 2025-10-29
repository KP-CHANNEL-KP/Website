/**
 * script.js - Logic for the new KP Blog Free Page UI.
 * This version removes the separate text input field and button, allowing users 
 * to type directly into the main textarea and use the 'Save' button.
 * * NOTE: For production, the API endpoints MUST be correctly implemented on a server/worker.
 */

// ===========================================
// CONFIGURATION (CHANGE THESE FOR PRODUCTION)
// ===========================================
const API_BASE_URL = '/api/r2-manager'; // Change this to your actual Worker/API endpoint
const ADMIN_PASSCODE = 'YOUR_SECRET_PASSCODE'; // !!! CHANGE THIS TO A STRONG SECRET !!!

// ===========================================
// CLIENT-SIDE LOGIC
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // HTML Element References
    const vmessTextarea = document.getElementById('vmessTextarea');
    const copyButton = document.getElementById('copyToClipboardKP');
    const saveButton = document.getElementById('saveMainTextToKey');
    const adminPasscodeInput = document.getElementById('adminPasscode');
    
    // UPLOAD References
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const uploadButton = document.getElementById('uploadButton');
    const uploadStatus = document.getElementById('uploadStatus');
    
    // TABLE References
    const fileListTableBody = document.getElementById('fileListTable').querySelector('tbody');


    // --- 1. TEXT ENTRY, COPY & SAVE LOGIC ---
    
    // --- B. Copy Button ---
    copyButton.addEventListener('click', () => {
        vmessTextarea.select();
        vmessTextarea.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            alert('စာသားကို ကူးယူပြီးပါပြီ။');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('ကူးယူခြင်း မအောင်မြင်ပါ။ စာသားကို ကိုယ်တိုင် ကူးယူပါ။');
        }
    });

    // --- C. Save Button (Now serves as the main save action) ---
    saveButton.addEventListener('click', () => {
        const textToSave = vmessTextarea.value.trim();
        
        if (!textToSave) {
            alert('သိမ်းဆည်းရန် စာသားမရှိပါ။ Text Box ထဲတွင် တိုက်ရိုက် ရေးသွင်းပါ/ကူးထည့်ပါ။');
            return;
        }

        // Placeholder for API call to save text to R2/DB
        // 🚨🚨 REAL API CALL REQUIRED HERE 🚨🚨
        alert(`"[API Placeholder]": စာသားကို စာရင်းသွင်း/သိမ်းဆည်းနေပါသည်။ \n (စာသားအရှည်: ${textToSave.length})`);

        // Example for real implementation: 
        /*
        fetch(`${API_BASE_URL}/save-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: textToSave, timestamp: new Date() })
        })
        .then(response => {
            if (response.ok) {
                alert('စာသား အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။');
                vmessTextarea.value = ''; // Clear after save
                loadFileList(); // Refresh the list if saving text means adding a file
            } else {
                alert('သိမ်းဆည်းခြင်း မအောင်မြင်ပါ။');
            }
        })
        .catch(error => {
            console.error('Save error:', error);
            alert('Network Error: သိမ်းဆည်းခြင်း မအောင်မြင်ပါ။');
        });
        */
    });


    // ===========================================
    // 2. FILE UPLOAD LOGIC
    // ===========================================

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileNameDisplay.textContent = fileInput.files[0].name;
            uploadButton.disabled = false;
        } else {
            fileNameDisplay.textContent = 'File မရွေးရသေးပါ';
            uploadButton.disabled = true;
        }
    });

    uploadButton.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        uploadStatus.textContent = 'Uploading... Please wait.';
        uploadButton.disabled = true;

        // 🚨🚨 REAL API CALL REQUIRED HERE 🚨🚨
        try {
            // Placeholder for R2 Upload API Call
            
            // --- TEMP SUCCESS SIMULATION ---
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            uploadStatus.textContent = `Upload Successful: ${file.name} (API Placeholder)`;
            fileInput.value = ''; 
            fileNameDisplay.textContent = 'File မရွေးရသေးပါ';
            uploadButton.disabled = true;
            loadFileList(); 

        } catch (error) {
            uploadStatus.textContent = 'Network Error during upload.';
            console.error('Upload error:', error);
        } finally {
            uploadButton.disabled = true; 
        }
    });


    // ===========================================
    // 3. FILE LISTING (LATEST FIRST) & DELETION LOGIC
    // ===========================================
    
    // Function to format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Placeholder Data structure (In production, this comes from API)
    let fileData = [
        { name: 'KP_MyTel_VPN_005.npvt', size: 1024 * 12, date: new Date('2025-10-30T10:00:00Z'), isLatest: true },
        { name: 'KBZ_Key_Oct29.txt', size: 1024 * 5, date: new Date('2025-10-29T15:30:00Z') },
        { name: 'Ooredoo_2.npvt', size: 1024 * 20, date: new Date('2025-10-28T09:00:00Z') },
        { name: 'New_Telenor_Config.ovpn', size: 1024 * 35, date: new Date('2025-10-30T09:30:00Z') },
    ];

    const renderFileList = (files) => {
        fileListTableBody.innerHTML = ''; // Clear existing rows

        // Sort files by date (Latest (Newest) first)
        files.sort((a, b) => b.date.getTime() - a.date.getTime());

        files.forEach(file => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-filename">${file.name} ${file.isLatest ? '<span style="color: red; font-weight: bold;">(NEW)</span>' : ''}</td>
                <td class="col-filesize">${formatFileSize(file.size)}</td>
                <td class="col-filedate">${file.date.toLocaleDateString('en-GB')} ${file.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                <td class="col-action">
                    <a href="${API_BASE_URL}/download?file=${encodeURIComponent(file.name)}" class="download-btn-table">Download</a>
                    <button class="delete-btn-table" data-filename="${file.name}">Delete</button>
                </td>
            `;
            fileListTableBody.appendChild(row);
        });

        // Re-check delete button status after rendering
        checkPasscodeAndToggleDelete();
    };

    const loadFileList = async () => {
        fileListTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">ဖိုင်စာရင်းများကို Loading လုပ်နေသည်...</td></tr>';
        
        try {
            // 🚨🚨 REAL API CALL REQUIRED HERE 🚨🚨
            // const response = await fetch(`${API_BASE_URL}/list`);
            // const data = await response.json();
            // fileData = data.files.map(f => ({ ...f, date: new Date(f.date) }));
            
            // --- TEMP SIMULATION ---
            await new Promise(resolve => setTimeout(resolve, 1000));
            renderFileList(fileData);

        } catch (error) {
            fileListTableBody.innerHTML = '<tr><td colspan="4" style="color: red; text-align: center;">ဖိုင်စာရင်းများကို ခေါ်ယူရာတွင် အမှားဖြစ်ပွားပါသည်။</td></tr>';
            console.error('Error fetching file list:', error);
        }
    };

    // --- D. Admin Passcode & Delete Logic ---

    const checkPasscodeAndToggleDelete = () => {
        const passcode = adminPasscodeInput.value;
        const deleteButtons = document.querySelectorAll('.delete-btn-table');
        
        deleteButtons.forEach(button => {
            if (passcode === ADMIN_PASSCODE) {
                button.classList.add('enabled');
            } else {
                button.classList.remove('enabled');
            }
        });
    };
    
    adminPasscodeInput.addEventListener('input', checkPasscodeAndToggleDelete);

    fileListTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn-table') && e.target.classList.contains('enabled')) {
            const fileName = e.target.dataset.filename;
            
            if (confirm(`သေချာပါသလား။ "${fileName}" ကို ဖျက်တော့မည်။`)) {
                e.target.textContent = 'Deleting...';
                e.target.disabled = true;

                // 🚨🚨 REAL API CALL REQUIRED HERE 🚨🚨
                try {
                    // Placeholder for R2 Delete API Call
                    
                    // --- TEMP SUCCESS SIMULATION ---
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    fileData = fileData.filter(f => f.name !== fileName); // Remove from temp data
                    alert(`${fileName} ကို အောင်မြင်စွာ ဖျက်လိုက်ပါပြီ။ (API Placeholder)`);
                    loadFileList(); // Reload the list

                } catch (error) {
                    alert('Network Error during deletion.');
                    console.error('Deletion error:', error);
                    e.target.textContent = 'Delete';
                    e.target.disabled = false;
                }
            }
        }
    });

    // Initial load of the file list when the page loads
    loadFileList();
});
