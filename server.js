const TelegramBot = require('node-telegram-bot-api');

// توکن ربات خود را اینجا وارد کنید
const token = '7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY';
const bot = new TelegramBot(token, { polling: true });

// آیدی ربات مقصد (عدد)
const destinationBotId = 1664164433;  // آیدی ربات مقصد

// آیدی خودتان برای ارسال پیام‌های خطا
const myId = '7556830926';

// ارسال پیام استارت
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'سلام! ربات در حال آماده‌سازی است.');
});

// تابعی برای تغییر کپشن
function modifyCaption(text) {
  // تغییر @MrMoovie به @filmoseriyalerooz_bot
  return text.replace(/📽@MrMoovie/g, '@filmoseriyalerooz_bot').replace(/@\w+/g, '@day'); // تغییر @user به @day
}

// ارسال انواع پیام‌ها
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // اگر پیام دارای ویدیو بود
  if (msg.video) {
    let caption = msg.caption || '';  // کپشن ویدیو را دریافت می‌کنیم

    // تغییر کپشن
    caption = modifyCaption(caption);

    // ارسال ویدیو به ربات مقصد همراه با کپشن تغییر یافته
    bot.sendVideo(destinationBotId, msg.video.file_id, { caption: caption })
      .catch(error => {
        bot.sendMessage(myId, `خطا در ارسال ویدیو به ربات مقصد: ${error.message}`);
      });
  }
  // اگر پیام دارای تصویر بود
  else if (msg.photo) {
    let caption = msg.caption || '';  // کپشن تصویر را دریافت می‌کنیم

    // تغییر کپشن
    caption = modifyCaption(caption);

    // ارسال تصویر به ربات مقصد همراه با کپشن تغییر یافته
    bot.sendPhoto(destinationBotId, msg.photo[msg.photo.length - 1].file_id, { caption: caption })
      .catch(error => {
        bot.sendMessage(myId, `خطا در ارسال تصویر به ربات مقصد: ${error.message}`);
      });
  }
  // اگر پیام دارای متن بود
  else if (msg.text) {
    let text = msg.text;

    // تغییر متن
    text = modifyCaption(text);

    // بررسی اینکه متن پیام خالی نباشد
    if (text.trim() === '') {
      bot.sendMessage(myId, 'پیام ارسالی خالی است و به ربات مقصد ارسال نشد.');
      return;
    }

    // ارسال پیام به ربات مقصد
    bot.sendMessage(destinationBotId, text)
      .catch(error => {
        bot.sendMessage(myId, `خطا در ارسال پیام به ربات مقصد: ${error.message}`);
      });
  }
});
