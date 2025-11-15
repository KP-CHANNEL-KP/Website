// OneSignal Initialization (App ID ပါဝင်သော Code)
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
        appId: "3c47c69a-ea04-40e8-807a-e779477f067f",
        // Customization
        promptOptions: {
            customlink: {
                enabled: true,
                style: "button",
                size: "large",
                text: {
                    subscribe: "Notify Me",
                    unsubscribe: "Unsubscribe",
                },
                color: {
                    button: '#ff7043',
                    text: '#ffffff'
                }
            }
        }
    });

    // 🔔 စာရင်းသွင်းပြီးပြီလား စစ်ဆေးခြင်း
    // စာရင်းမသွင်းရသေးလျှင် (isPushNotificationsEnabled = false) Custom Prompt ကို ပြပါ
    OneSignal.isPushNotificationsEnabled(function(isEnabled) {
        const promptBox = document.getElementById('notificationPrompt');

        if (!isEnabled && promptBox) {
            // Notification စာရင်း မသွင်းရသေးလျှင် Custom Prompt ကို အတိအလင်း ပြသမည်။
            promptBox.style.display = 'block';
        } else if (isEnabled && promptBox) {
            // စာရင်းသွင်းပြီးပါက Custom Prompt ကို ဖျောက်ထားမည်။
            promptBox.style.display = 'none';
        }
    });
});
