// chat_logic.js (Private Chat/Token-Based Version - အပြီးသတ်)

// 1. Key များကို သတ်မှတ်ခြင်း 
const PUBLISH_KEY = "pub-c-bdaf8ee9-735f-45b4-b10f-3f0ddce7a6d6";
const SUBSCRIBE_KEY = "sub-c-adef92a7-e638-4643-8bb5-03d9223a6fd2";
const CHAT_CHANNEL = "kp_blog_public_group"; 
// ***သင့်ရဲ့ Deploy လုပ်ပြီးသား Cloudflare Worker URL ကို ထည့်သွင်းထားပါပြီ***
const TOKEN_SERVER_URL = "https://pubnub-auth-token-generator.kopaing232003.workers.dev"; 

// 2. Chat အတွက် User ID ကို Dynamic သတ်မှတ်မည်
let CURRENT_USER_ID = ''; 
let pubnub; 
let currentChannel = CHAT_CHANNEL; // လက်ရှိ စကားပြောနေတဲ့ Channel ကို သိမ်းထားရန်

const messageArea = document.getElementById('message-area');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const usernameInput = document.getElementById('username-input');
const fileInput = document.getElementById('file-input');

// Private Channel နာမည် ဖန်တီးခြင်း Logic (Worker Code နဲ့ တူရပါမည်)
function getPrivateChannelName(user1Id, user2Id) {
    const ids = [user1Id, user2Id].sort(); 
    return `private_chat_${ids[0]}_${ids[1]}`;
}

// Time Stamp ကို Readable Format သို့ ပြောင်းလဲခြင်း
function formatTimestamp(timetoken) {
    const date = new Date(timetoken / 10000); 
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// 3. Message/File လက်ခံရရှိပါက UI ကို Update လုပ်မည့် Function
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
            contentHTML += `<a href="${fileUrl}" target="_blank"><img src="${fileUrl}" alt="${fileName}" class="uploaded-image"></a>`;
        } else {
            contentHTML += `<a href="${fileUrl}" target="_blank" class="file-link">📁 ${fileName} (Download)</a>`;
        }
        
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


// 4. PubNub ကို Token ဖြင့် Initialize လုပ်သော Main Function
async function initializePubNub(targetId = null) {
    const userName = usernameInput.value.trim();
    if (userName.length === 0) {
        alert("Chat စတင်ရန် သင့်နာမည်ကို ရိုက်ထည့်ပါ။");
        return;
    }
    
    CURRENT_USER_ID = userName.replace(/\s/g, '_').toLowerCase(); 
    
    let apiUrl = `${TOKEN_SERVER_URL}?user_id=${CURRENT_USER_ID}`;
    
    if (targetId) {
        apiUrl += `&target_id=${targetId}`;
        currentChannel = getPrivateChannelName(CURRENT_USER_ID, targetId);
        messageArea.innerHTML = `<p style='text-align: center;'>🔒 ${targetId} အတွက် Private Chat စတင်နေပါသည်...</p>`;
    } else {
        currentChannel = CHAT_CHANNEL;
        messageArea.innerHTML = "<p style='text-align: center;'>🔑 Group Chat အတွက် Token တောင်းခံနေပါသည်...</p>";
    }
    
    try {
        // Cloudflare Worker မှ Access Token ကို တောင်းခံခြင်း
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to get token from server');
        
        const data = await response.json();
        const authToken = data.token;
        
        // Token ဖြင့် PubNub ကို Initialize လုပ်ခြင်း
        if (pubnub) {
            pubnub.unsubscribeAll(); 
        }
        
        pubnub = new PubNub({
            publishKey: PUBLISH_KEY,
            subscribeKey: SUBSCRIBE_KEY,
            uuid: CURRENT_USER_ID, 
            authToken: authToken, // ***Token ထည့်သွင်းခြင်း***
            heartbeatInterval: 10 
        });

        // PubNub Listener ကို ထည့်သွင်းခြင်း
        pubnub.addListener({
            message: function(message) {
                const sender = message.message.user || 'Anonymous';
                const timetoken = message.timetoken; 
                displayMessage(sender, message.message, timetoken);
            },
            status: function(status) {
                if (status.category === "PNConnectedCategory") {
                    messageArea.innerHTML = `<p style='color: green; text-align: center;'>✅ ${targetId ? 'Private Chat' : 'Group Chat'} ချိတ်ဆက်ပြီးပါပြီ။</p>`;
                    messageInput.disabled = false;
                    sendButton.disabled = false;
                    loadHistory(currentChannel); // လက်ရှိ channel ရဲ့ history load ပါ
                } else if (status.category === "PNAccessDeniedCategory") {
                    messageArea.innerHTML = `<p style='color: red; text-align: center;'>❌ Access Denied! Token ပြဿနာရှိနေပါသည်။</p>`;
                }
            }
        });
        
        // Channel ကို Subscribe လုပ်ခြင်း 
        pubnub.subscribe({
            channels: [currentChannel],
            withPresence: true 
        });

    } catch (error) {
        messageArea.innerHTML = `<p style='color: red; text-align: center;'>❌ ချိတ်ဆက်မှု အဆင်မပြေပါ။ Worker ပြဿနာရှိနိုင်ပါသည်။ (${error.message})</p>`;
        console.error('PubNub Initialization Error:', error);
    }
}


// 5. Private Chat စတင်ရန် Function (သင့် HTML မှာ ခေါ်ရန်)
// ဥပမာ- <button onclick="startPrivateChat('partner_user_id')">Private Chat</button>
function startPrivateChat(partnerId) {
    if (pubnub) {
        pubnub.unsubscribeAll(); 
    }
    // Token အသစ်တောင်းပြီး Private Channel အတွက် ပြန် initialize လုပ်ပါ
    initializePubNub(partnerId);
}


// 6. Message ပို့ရန် Function (File Logic ပါဝင်)
function sendMessage(fileToSend = null) {
    if (!pubnub) return; 
    
    let userName = usernameInput.value.trim();
    if (userName.length === 0) {
        userName = "Guest"; 
    }
    
    const text = messageInput.value.trim();
    
    if (text.length === 0 && !fileToSend) {
        return; 
    }

    const channelToSend = currentChannel; // လက်ရှိ channel ကို သုံးခြင်း

    if (fileToSend) {
        // 6.1. File ကို PubNub Storage သို့ Upload လုပ်ခြင်း
        pubnub.sendFile({
            channel: channelToSend, 
            file: fileToSend,
            message: {
                user: userName,
                text: text 
            }
        }, (status, response) => {
            if (status.error) {
                alert("File ပို့ရာတွင် အခက်အခဲရှိပါသည်။: " + status.error.message);
            } else {
                console.log("File Uploaded Successfully: ", response);
            }
        });
        
        fileInput.value = ''; 
    } else {
        // 6.2. စာသားသက်သက်သာ ပို့ခြင်း
        pubnub.publish({
            channel: channelToSend, 
            message: {
                user: userName, 
                text: text
            }
        });
    }

    messageInput.value = ''; 
}

// 7. Event Listeners များကို User Name ထည့်မှ Chat စတင်စေရန်
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

// 8. Message Persistence မှ ယခင် Message များကို Load လုပ်ခြင်း
function loadHistory(channel) {
    pubnub.history({
        channel: channel, 
        count: 50 
    }, (status, response) => {
        if (response && response.messages) {
             messageArea.innerHTML = ''; 
            response.messages.forEach(item => {
                const sender = item.entry.user || 'Anonymous';
                const timetoken = item.timetoken; 
                displayMessage(sender, item.entry, timetoken); 
            });
        }
    });
}

// 9. Page Load ချိန်မှာ အလိုအလျောက် စတင်ခြင်းကို ဖယ်ရှားပြီး User Name ထည့်မှ စတင်ပါ
usernameInput.addEventListener('change', () => initializePubNub());
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        initializePubNub();
    }
});
