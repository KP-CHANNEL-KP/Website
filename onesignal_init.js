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
});
