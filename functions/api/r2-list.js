// /functions/api/r2-list.js
// R2 Bucket ကို လုံးဝ မခေါ်တော့ပဲ "ခဏ unavailable" စာမျက်နှာလေးကိုသာ ပြသပေးမယ်။

export async function onRequestGet() {
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>R2 File List (Temporarily Disabled)</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background: #fff;
      border-radius: 8px;
      padding: 20px 25px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      box-sizing: border-box;
    }
    h2 {
      margin-top: 0;
      color: #333;
      font-size: 1.3em;
    }
    p {
      color: #555;
      line-height: 1.6;
    }
    .tag {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.8em;
      background: #ffe8a1;
      color: #8a6200;
      margin-bottom: 10px;
    }
    .note {
      font-size: 0.9em;
      color: #777;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <span class="tag">R2 TEMP DISABLED</span>
    <h2>📂 R2 File List ကို ခဏ မဖော်ပြသေးပါ</h2>
    <p>
      ယခင်တွင် R2 Bucket ထဲက ဖိုင်စာရင်းကို ပြသပေးထားပြီး 
      Delete ခလုတ်၊ Passcode Logic စတာတွေပါ လုပ်ဆောင်ပေးထားခဲ့ပါတယ်။
    </p>
    <p>
      ယခု version တွင်တော့ R2 Storage / Binding ကို ခဏ အသုံးမပြုသေးသဖြင့် 
      ဒီစာမျက်နှာမှ ဖိုင်စာရင်းပြခြင်း 기능ကို
      <strong>ပိတ်ထား</strong> ထားပါတယ်။
    </p>
    <p class="note">
      နောင် R2 ကို Setup ပြန်လုပ်လိုက်တဲ့အချိန်မှာ
      ဒီဖိုင် (functions/api/r2-list.js) ထဲကို
      မင်းရဲ့ မူလ R2 Listing Code ကို ပြန်ထည့်လိုက်ရုံနဲ့
      ရလဒ်အဟောင်းတွေကို ပြန်ရရှိနိုင်ပါတယ်။
    </p>
  </div>
</body>
</html>`;

  return new Response(htmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}
