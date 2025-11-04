// chat_logic.js (PubNub Version)

// 1. သင့်ရဲ့ Key များကို သတ်မှတ်ခြင်း
const PUBLISH_KEY = "pub-c-bdaf8ee9-735f-45b4-b10f-3f0ddce7a6d6";
const SUBSCRIBE_KEY = "sub-c-adef92a7-e638-4643-8bb5-03d9223a6fd2";

// 2. Chat အတွက် Channel နာမည်နှင့် User ID သတ်မှတ်ခြင်း
const CHAT_CHANNEL = "kp_blog_public_group"; 
// User ID ကို ယာယီ နာမည်ပေးထားသည် (Website ဝင်တိုင်း ပြောင်းလဲသွားမည်)
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

// 4. Message လက်ခံရရှိပါက UI ကို Update လုပ်မည့် Function
function displayMessage(user, text) {
    const p = document.createElement('p');
    p.classList.add('chat-message');
    p.innerHTML = `<strong>${user}</strong>: ${text}`;
    messageArea.appendChild(p);
    // နောက်ဆုံး message ကို မြင်ရအောင် scroll ဆွဲခြင်း
    messageArea.scrollTop = messageArea.scrollHeight;
}

// 5. PubNub Listener ကို ထည့်သွင်းခြင်း
pubnub.addListener({
    // Messages လက်ခံရရှိပါက
    message: function(message) {
        const sender = message.message.user || 'Anonymous';
        const text = message.message.text;
        displayMessage(sender, text);
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


// 7. Message ပို့ရန် Function
function sendMessage() {
    const text = messageInput.value.trim();
    if (text.length > 0) {
        pubnub.publish({
            channel: CHAT_CHANNEL,
            message: {
                user: "KP_Blogger", 
                text: text
            }
        });
        messageInput.value = ''; 
    }
}

// 8. Event Listeners (Button click and Enter key)
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// 9. Message Persistence မှ ယခင် Message များကို Load လုပ်ခြင်း
pubnub.history({
    channel: CHAT_CHANNEL,
    count: 50 
}, (status, response) => {
    if (response && response.messages) {
        response.messages.forEach(item => {
            const sender = item.entry.user || 'Anonymous';
            const text = item.entry.text;
            displayMessage(sender, text);
        });
    }
});
