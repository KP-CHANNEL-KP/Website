// chat_logic.js (User Name & Time Stamp Version)

// 1. Key များကို သတ်မှတ်ခြင်း 
const PUBLISH_KEY = "pub-c-bdaf8ee9-735f-45b4-b10f-3f0ddce7a6d6";
const SUBSCRIBE_KEY = "sub-c-adef92a7-e638-4643-8bb5-03d9223a6fd2";

// 2. Chat အတွက် Channel နာမည်နှင့် User ID သတ်မှတ်ခြင်း
const CHAT_CHANNEL = "kp_blog_public_group"; 
const USER_ID = "kp_blogger_" + Math.random().toString(36).substring(7); // ယာယီ User ID

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
const usernameInput = document.getElementById('username-input'); // User Name Input အသစ်

// Time Stamp ကို Readable Format သို့ ပြောင်းလဲခြင်း
function formatTimestamp(timetoken) {
    // PubNub timetoken သည် microsecond (10000) ဖြင့် မြှောက်ထားသည်ကို ပြန်စားရမည်
    const date = new Date(timetoken / 10000); 
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// 4. Message လက်ခံရရှိပါက UI ကို Update လုပ်မည့် Function
function displayMessage(user, text, timetoken) {
    const p = document.createElement('p');
    p.classList.add('chat-message');
    
    // Time Stamp ကို ပေါင်းထည့်ခြင်း
    const timeString = formatTimestamp(timetoken);
    
    // User Name, Message, Time Stamp များကို HTML ဖြင့် ပေါင်းစပ်
    p.innerHTML = `
        <strong>${user || 'Guest'}</strong>: 
        ${text}
        <span class="timestamp">${timeString}</span>
    `;
    
    messageArea.appendChild(p);
    // နောက်ဆုံး message ကို မြင်ရအောင် scroll ဆွဲခြင်း
    messageArea.scrollTop = messageArea.scrollHeight;
}

// 5. PubNub Listener ကို ထည့်သွင်းခြင်း
pubnub.addListener({
    message: function(message) {
        // Message payload ထဲက User နဲ့ Time ကို ယူသည်
        const sender = message.message.user || 'Anonymous';
        const text = message.message.text;
        const timetoken = message.timetoken; // PubNub မှ ပေးပို့သော timetoken
        displayMessage(sender, text, timetoken);
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


// 7. Message ပို့ရန် Function
function sendMessage() {
    // User ရိုက်ထည့်ထားသော နာမည်ကို ယူခြင်း
    let userName = usernameInput.value.trim();
    if (userName.length === 0) {
        userName = "Guest"; // နာမည်မထည့်ရင် Default 'Guest' လို့ သတ်မှတ်
    }
    
    const text = messageInput.value.trim();
    
    if (text.length > 0) {
        pubnub.publish({
            channel: CHAT_CHANNEL,
            message: {
                user: userName, // User ရဲ့ နာမည်ကို PubNub ကို ပို့သည်
                text: text
            }
        });
        messageInput.value = ''; // Input ရှင်းထုတ်ခြင်း
    }
}

// 8. Event Listeners (Button click and Enter key)
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Enter နှိပ်ရင် နောက်ကြောင်း မဆင်းစေရန်
        sendMessage();
    }
});

// 9. Message Persistence မှ ယခင် Message များကို Load လုပ်ခြင်း
pubnub.history({
    channel: CHAT_CHANNEL,
    count: 50 
}, (status, response) => {
    if (response && response.messages) {
        // ယခင် messages များကို Time Stamp အစရှိသည်တို့ဖြင့် ပြန်လည်ပြသ
        response.messages.forEach(item => {
            const sender = item.entry.user || 'Anonymous';
            const text = item.entry.text;
            const timetoken = item.timetoken; // History မှာလည်း timetoken ပါသည်
            displayMessage(sender, text, timetoken);
        });
    }
});
