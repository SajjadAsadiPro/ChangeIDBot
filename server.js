const TelegramBot = require('node-telegram-bot-api');

// توکن ربات خود را اینجا وارد کنید
const token = '7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY';
const bot = new TelegramBot(token, { polling: true });

// آیدی کانال مبدا
const sourceChannelId = '-1002421032578';

// آیدی خودتان برای ارسال پیام‌های خطا
const myId = '7556830926';

// ارسال پیام استارت
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'سلام! ربات در حال آماده‌سازی است.');
});

// تابعی برای تغییر کپشن
function modifyCaption(text) {
  return text.replace(/@\w+/g, '@day'); // تغییر @user به @day
}

// ارسال انواع پیام‌ها
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // اگر پیام دارای ویدیو بود
  if (msg.video) {
    let caption = msg.caption || '';  // کپشن ویدیو را دریافت می‌کنیم

    // تغییر کپشن
    caption = modifyCaption(caption);

    // ارسال ویدیو به کانال مبدا همراه با کپشن تغییر یافته
    bot.sendVideo(sourceChannelId, msg.video.file_id, { caption: caption })
      .catch(error => {
        bot.sendMessage(myId, `خطا در ارسال ویدیو به کانال مبدا: ${error.message}`);
      });
  }
  // اگر پیام دارای تصویر بود
  else if (msg.photo) {
    let caption = msg.caption || '';  // کپشن تصویر را دریافت می‌کنیم

    // تغییر کپشن
    caption = modifyCaption(caption);

    // ارسال تصویر به کانال مبدا همراه با کپشن تغییر یافته
    bot.sendPhoto(sourceChannelId, msg.photo[msg.photo.length - 1].file_id, { caption: caption })
      .catch(error => {
        bot.sendMessage(myId, `خطا در ارسال تصویر به کانال مبدا: ${error.message}`);
      });
  }
  // اگر پیام دارای متن بود
  else if (msg.text) {
    let text = msg.text;

    // تغییر متن
    text = modifyCaption(text);

    // بررسی اینکه متن پیام خالی نباشد
    if (text.trim() === '') {
      bot.sendMessage(myId, 'پیام ارسالی خالی است و به کانال مبدا ارسال نشد.');
      return;
    }

    // ارسال پیام به کانال مبدا
    bot.sendMessage(sourceChannelId, text)
      .catch(error => {
        bot.sendMessage(myId, `خطا در ارسال پیام به کانال مبدا: ${error.message}`);
      });
  }
});
