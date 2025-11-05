// chat_logic.js (Final Full-featured Version)

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
const fileInput = document.getElementById('file-input');
const typingIndicator = document.getElementById('typing-indicator'); // Typing Indicator Element

// Typing Indicator အတွက် State
let isTyping = false;
let typingTimer;

// Time Stamp ကို Readable Format သို့ ပြောင်းလဲခြင်း
function formatTimestamp(timetoken) {
    const date = new Date(timetoken / 10000); 
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// 4. Message/File လက်ခံရရှိပါက UI ကို Update လုပ်မည့် Function
function displayMessage(user, content, timetoken, senderUuid) {
    const p = document.createElement('p');
    
    // Message ပို့သူသည် လက်ရှိ User ID ဖြစ်မဖြစ် စစ်ဆေးခြင်း
    const isSelf = senderUuid === pubnub.getUUID(); 
    p.classList.add('chat-message');
    p.classList.add(isSelf ? 'self' : 'other'); // Class ခွဲခြား သတ်မှတ်ခြင်း (Self Message Fix)
    
    const timeString = formatTimestamp(timetoken);
    
    let contentHTML = content.text || ''; 
    
    if (content.file) {
        const file = content.file;
        const fileUrl = file.url;
        const fileName = file.name;
        
        if (file.mimeType && file.mimeType.startsWith('image/')) {
            contentHTML += `<a href="${fileUrl}" target="_blank"><img src="${fileUrl}" alt="${fileName}" class="uploaded-image"></a>`;
        } else {
            contentHTML += `<a href="${fileUrl}" target="_blank" class="file-link">📁 ${fileName} (Download)</a>`;
        }
        
        if (content.text) {
             contentHTML = `${content.text}<br>${contentHTML}`;
        }
    }
    
    // Self Message ဆိုရင် နာမည်ကို message bubble အောက်ခြေနားမှာ ဖျောက်ထားလေ့ရှိသည်
    const userNameDisplay = isSelf ? '' : `<strong>${user || 'Guest'}</strong>: `; 

    p.innerHTML = `
        ${userNameDisplay}
        <div style="margin-top: 5px;">${contentHTML}</div>
        <span class="timestamp">${timeString}</span>
    `;
    
    messageArea.appendChild(p);
    messageArea.scrollTop = messageArea.scrollHeight;
}

// 5. PubNub Listener ကို ထည့်သွင်းခြင်း
pubnub.addListener({
    // Messages လက်ခံရရှိပါက
    message: function(message) {
        const sender = message.message.user || 'Anonymous';
        const timetoken = message.timetoken; 
        
        // Typing Indicator ကို ပျောက်သွားအောင် လုပ်သည်
        if (message.message.typing === false) return; 

        displayMessage(sender, message.message, timetoken, message.publisher); // Publisher (UUID) ကို ပို့သည်
    },
    // Signal (Typing Indicator အတွက်) လက်ခံရရှိပါက
    signal: function(signal) {
        const senderUuid = signal.publisher;
        // ကိုယ့်ဆီကလာတဲ့ signal ဆိုရင် စာမပြရ
        if (senderUuid === pubnub.getUUID()) return; 

        const typingStatus = signal.message.typing;
        const senderName = signal.message.user || 'တစ်ဦးတစ်ယောက်';
        
        if (typingStatus === true) {
            typingIndicator.textContent = `${senderName} စာရိုက်နေသည်...`;
        } else {
            typingIndicator.textContent = '';
        }
    },
    // Connection Status ပြောင်းလဲပါက
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

// 7. Typing Signal ပို့ရန် Function
function sendTypingSignal(typingStatus) {
    let userName = usernameInput.value.trim() || 'Guest';
    pubnub.signal({
        channel: CHAT_CHANNEL,
        message: {
            user: userName,
            typing: typingStatus
        }
    });
}

// 8. Message ပို့ရန် Function (File Logic ထပ်တိုး)
function sendMessage(fileToSend = null) {
    // ပြီးသွားတဲ့အခါ Typing Signal ကို ပိတ်ပါ
    if (isTyping) {
        isTyping = false;
        clearTimeout(typingTimer);
        sendTypingSignal(false);
    }
    
    let userName = usernameInput.value.trim() || 'Guest';
    const text = messageInput.value.trim();
    
    if (text.length === 0 && !fileToSend) {
        return; 
    }

    if (fileToSend) {
        // 8.1. File Upload လုပ်ခြင်း
        pubnub.sendFile({
            channel: CHAT_CHANNEL,
            file: fileToSend,
            message: {
                user: userName,
                text: text 
            }
        }, (status, response) => {
            if (status.error) {
                alert("File ပို့ရာတွင် အခက်အခဲရှိပါသည်။: " + status.error.message);
            }
        });
        
        fileInput.value = ''; 
    } else {
        // 8.2. စာသားသက်သက်သာ ပို့ခြင်း
        pubnub.publish({
            channel: CHAT_CHANNEL,
            message: {
                user: userName, 
                text: text
            }
        });
    }

    messageInput.value = ''; 
}

// 9. Input တွင် စာရိုက်နေကြောင်း စစ်ဆေးရန် Event Listener
messageInput.addEventListener('input', function() {
    // စာလုံး စရိုက်တာနဲ့ Typing Signal ပို့သည်
    if (!isTyping) {
        isTyping = true;
        sendTypingSignal(true);
    }
    
    // 2 စက္ကန့် စာမရိုက်ရင် Typing Signal ပိတ်သည်
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        isTyping = false;
        sendTypingSignal(false);
    }, 2000); 
});

// 10. Send Button နှင့် Enter Key Event Listeners
sendButton.addEventListener('click', () => {
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

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const confirmSend = confirm(`"${file.name}" ဖိုင်ကို ပို့မှာလား? (Message Input မှာ စာသား ထပ်ထည့်နိုင်ပါသည်။)`);
        if (confirmSend) {
            document.getElementById('send-button').click(); 
        } else {
             fileInput.value = ''; 
        }
    }
});


// 11. Message Persistence မှ ယခင် Message များကို Load လုပ်ခြင်း
pubnub.history({
    channel: CHAT_CHANNEL,
    count: 50 
}, (status, response) => {
    if (response && response.messages) {
        response.messages.forEach(item => {
            const sender = item.entry.user || 'Anonymous';
            const timetoken = item.timetoken; 
            // History က sender UUID ကို ယူရန်
            const senderUuid = item.actions ? item.actions.uuid : item.publisher || 'unknown'; 

            // History က messages တွေကို ပြသရန်
            displayMessage(sender, item.entry, timetoken, senderUuid); 
        });
    }
});
