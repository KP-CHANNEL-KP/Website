// chat_logic.js
// CometChat အတွက် လိုအပ်သော Key များကို သတ်မှတ်ခြင်း
const appID = "1671132e0b9b1b5cb"; 
const region = "us"; 
const AUTH_KEY = "e427de3eeeaa3783abdbdfa7d4fd779113123423"; 

// စမ်းသပ်ရန် User ID
const USER_ID = "kp_blogger_public_user"; 

async function initCometChat() {
    const wrapper = document.getElementById('cometchat-wrapper');
    
    // SDK Initialization အတွက် Settings များ
    const appSetting = new CometChat.AppSettingsBuilder()
        .subscribePresenceForAllUsers()
        .setRegion(region)
        .build();
    
    try {
        wrapper.innerHTML = "<h2>SDK Initialization...</h2>";
        
        // 1. SDK ကို စတင်ခြင်း
        await CometChat.init(appID, appSetting);
        
        wrapper.innerHTML = "<h2>Logging in User...</h2>";
        
        // 2. User Login (CometChat သည် User ကို အလိုအလျောက် ဖန်တီးပေးပါသည်)
        await CometChat.login(USER_ID, AUTH_KEY);
        
        // 3. UI Kit (Chat Window) ကို Render လုပ်ခြင်း
        wrapper.innerHTML = "<h2>✅ Connection Success! Loading Group Chat...</h2>";

        const uiKitSettings = new CometChat.UIKitSettingsBuilder()
            .setLanguage("en")
            .setChatList([CometChat.GroupType.Public]) // Public Group Chat များကိုသာ ပြသမည်
            .build();

        CometChatUIKit.init(uiKitSettings);
        
        CometChatUIKit.render({
            widgetId: 'cometchat-wrapper',
            widgetType: CometChatUIKit.WidgetTypes.COMMUNICATION,
            widgetSettings: uiKitSettings
        });
        
    } catch (error) {
        // Error များ ရှိပါက ရှင်းလင်းစွာ ပြသမည်
        wrapper.innerHTML = `<h2>❌ CometChat Connection Failed!</h2><p>Error Code: ${error.code}</p><p>Message: ${error.message}</p>`;
        console.error("CometChat Initialization Error:", error);
    }
}

initCometChat();
