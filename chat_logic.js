// chat_logic.js (File Sharing Version)

// 1. Key များကို သတ်မှတ်ခြင်း 
const PUBLISH_KEY = "pub-c-bdaf8ee9-735f-45b4-b10f-3f0ddce7a6d6";
const SUBSCRIBE_KEY = "sub-c-adef92a7-e638-4643-8bb5-03d9223a6fd2";

// 2. Chat အတွက် Channel နာမည်နှင့် User ID သတ်မှတ်ခြင်း
const CHAT_CHANNEL = "kp_blog_public_group"; 
const USER_ID = "kp_blogger_" + Math.random().toString(36).substring(7); 

// 3. PubNub ကို Initialize လုပ်ခြင်း
const pubnub = new PubNub({
    publishKey: PUBLISH_KEY,
    subscribeKey: SUBSCRIBE_KEY,
    uuid: USER_ID, 
    heartbeatInterval: 10 
});

const messageArea = document.getElementById('message-area');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const usernameInput = document.getElementById('username-input');
const fileInput = document.getElementById('file-input'); // File Input အသစ်

// Time Stamp ကို Readable Format သို့ ပြောင်းလဲခြင်း
function formatTimestamp(timetoken) {
    const date = new Date(timetoken / 10000); 
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// 4. Message/File လက်ခံရရှိပါက UI ကို Update လုပ်မည့် Function
function displayMessage(user, content, timetoken) {
    const p = document.createElement('p');
    p.classList.add('chat-message');
    const timeString = formatTimestamp(timetoken);
    
    // Message Content ကို ထည့်သွင်းခြင်း
    let contentHTML = content.text || ''; 
    
    // File/Image ပါလာပါက 
    if (content.file) {
        const file = content.file;
        const fileUrl = file.url;
        const fileName = file.name;
        
        if (file.mimeType && file.mimeType.startsWith('image/')) {
            // ပုံ ဖြစ်ပါက ပုံကို တိုက်ရိုက် ပြသမည်
            contentHTML += `<a href="${fileUrl}" target="_blank"><img src="${fileUrl}" alt="${fileName}" class="uploaded-image"></a>`;
        } else {
            // အခြား ဖိုင်အမျိုးအစား ဖြစ်ပါက Link အဖြစ် ပြသမည်
            contentHTML += `<a href="${fileUrl}" target="_blank" class="file-link">📁 ${fileName} (Download)</a>`;
        }
        
        // စာသားပါလာလျှင် စာသားနဲ့ ဖိုင်ကို တွဲပြသည်
        if (content.text) {
             contentHTML = `${content.text}<br>${contentHTML}`;
        }
    }
    
    p.innerHTML = `
        <strong>${user || 'Guest'}</strong>: 
        <div style="margin-top: 5px;">${contentHTML}</div>
        <span class="timestamp">${timeString}</span>
    `;
    
    messageArea.appendChild(p);
    messageArea.scrollTop = messageArea.scrollHeight;
}

// 5. PubNub Listener ကို ထည့်သွင်းခြင်း
pubnub.addListener({
    message: function(message) {
        // PubNub file message များကို message.message ထဲတွင် file attribute ဖြင့် တွေ့ရသည်
        const sender = message.message.user || 'Anonymous';
        const timetoken = message.timetoken; 
        
        displayMessage(sender, message.message, timetoken);
    },
    status: function(status) {
        if (status.category === "PNConnectedCategory") {
            messageArea.innerHTML = "<p style='color: green; text-align: center;'>✅ Chat စနစ် အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီ။ စတင် စကားပြောနိုင်ပါပြီ။</p>";
            messageInput.disabled = false;
            sendButton.disabled = false;
        } else if (status.category === "PNDisconnectedCategory") {
             messageArea.innerHTML = "<p style='color: red; text-align: center;'>❌ ချိတ်ဆက်မှု ပြတ်တောက်သွားပါသည်။</p>";
        }
    }
});

// 6. PubNub Channel ကို Subscribe လုပ်ခြင်း
pubnub.subscribe({
    channels: [CHAT_CHANNEL],
    withPresence: true 
});


// 7. Message ပို့ရန် Function (File Logic ထပ်တိုး)
function sendMessage(fileToSend = null) {
    let userName = usernameInput.value.trim();
    if (userName.length === 0) {
        userName = "Guest"; 
    }
    
    const text = messageInput.value.trim();
    
    // စာသားရော၊ ဖိုင်ပါ မပါဝင်ရင် ဘာမှမပို့ပါ
    if (text.length === 0 && !fileToSend) {
        return; 
    }

    if (fileToSend) {
        // 7.1. File ကို PubNub Storage သို့ Upload လုပ်ခြင်း
        pubnub.sendFile({
            channel: CHAT_CHANNEL,
            file: fileToSend,
            message: {
                user: userName,
                text: text // စာသားကို ဖိုင်နဲ့တွဲပြီး ပို့နိုင်သည်
            }
        }, (status, response) => {
            if (status.error) {
                alert("File ပို့ရာတွင် အခက်အခဲရှိပါသည်။: " + status.error.message);
            } else {
                console.log("File Uploaded Successfully: ", response);
            }
        });
        
        fileInput.value = ''; // File input ကို ရှင်းထုတ်ခြင်း
    } else {
        // 7.2. စာသားသက်သက်သာ ပို့ခြင်း
        pubnub.publish({
            channel: CHAT_CHANNEL,
            message: {
                user: userName, 
                text: text
            }
        });
    }

    messageInput.value = ''; // Input ရှင်းထုတ်ခြင်း
}

// 8. Event Listeners 
sendButton.addEventListener('click', () => {
    // File input မှာ ဖိုင်ပါလာရင် ဖိုင်ပို့ဖို့ ခေါ်မည်၊ မပါရင် စာသားပို့မည်
    const file = fileInput.files[0];
    if (file) {
        sendMessage(file);
    } else {
        sendMessage();
    }
});

messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); 
        const file = fileInput.files[0];
        if (file) {
             sendMessage(file);
        } else {
             sendMessage();
        }
    }
});

// 9. File Input မှာ ဖိုင်ရွေးချယ်ပြီးပါက အလိုအလျောက် ပို့ခိုင်းရန် (optional)
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const confirmSend = confirm(`"${file.name}" ဖိုင်ကို ပို့မှာလား? (Message Input မှာ စာသား ထပ်ထည့်နိုင်ပါသည်။)`);
        if (confirmSend) {
            // စာသားနဲ့တွဲပြီး ပို့ရန် Button ကို နှိပ်သလို လုပ်ဆောင်သည်
            document.getElementById('send-button').click(); 
        } else {
             fileInput.value = ''; // မပို့ရင် ဖိုင်ကို ရှင်းထုတ်သည်
        }
    }
});


// 10. Message Persistence မှ ယခင် Message များကို Load လုပ်ခြင်း
pubnub.history({
    channel: CHAT_CHANNEL,
    count: 50 
}, (status, response) => {
    if (response && response.messages) {
        response.messages.forEach(item => {
            const sender = item.entry.user || 'Anonymous';
            const timetoken = item.timetoken; 
            
            // History က messages တွေကို ပြသရန်
            displayMessage(sender, item.entry, timetoken); 
        });
    }
});

ဒါငါပြန်ပြင် ထားတဲ့ chat_logic.js code မှတ်ထား
