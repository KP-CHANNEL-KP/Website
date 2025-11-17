export function generateOTP() {
    return Math.floor(100000 + Math.random()*900000).toString();
}

export async function hashOTP(otp){
    const encoder = new TextEncoder();
    const data = encoder.encode(otp);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

export async function verifyOTP(otp, hash){
    const otpHash = await hashOTP(otp);
    return otpHash === hash;
}

export async function sendTelegramMessage(botToken, chatId, text){
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(url, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({chat_id: chatId, text})
    });
}

export async function createSignedR2URL(bucket, key){
    // example placeholder, depends on Worker R2 SDK
    const url = `https://${bucket.accountId}.r2.cloudflarestorage.com/${key}?token=SIGNED_PLACEHOLDER`;
    return url;
}
