const TelegramBot = require('node-telegram-bot-api');

// توکن ربات تلگرام
const token = '7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY';
const bot = new TelegramBot(token, { polling: true });

// ذخیره اطلاعات آیدی‌ها
let sourceId = '';
let destId = '';

// وقتی /start وارد می‌شود
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'سلام! لطفاً آیدی مبدا را وارد کنید (آیدی که می‌خواهید تغییر دهد):');
});

// وقتی آیدی مبدا وارد می‌شود
bot.onText(/^(.*)$/, (msg, match) => {
  const chatId = msg.chat.id;

  // ذخیره آیدی مبدا
  if (!sourceId) {
    sourceId = match[1];
    bot.sendMessage(chatId, `آیدی مبدا با موفقیت ذخیره شد: ${sourceId}\nحالا لطفاً آیدی مقصد (آیدی جدید) را وارد کنید:`);
  }
  // ذخیره آیدی مقصد
  else if (!destId) {
    destId = match[1];
    bot.sendMessage(chatId, `آیدی مقصد با موفقیت ذخیره شد: ${destId}\nحالا هر پیام که ارسال کنید، آیدی مبدا با آیدی مقصد جایگزین خواهد شد.`);
  }
  // تغییر آیدی در پیام‌ها
  else {
    let text = msg.text;

    // اگر متن پیام شامل آیدی مبدا باشد، آن را تغییر می‌دهیم
    if (text.includes(sourceId)) {
      text = text.replace(new RegExp(sourceId, 'g'), destId);
    }

    // ارسال پیام به کانال مقصد
    bot.sendMessage(chatId, `متن تغییر یافته: ${text}`);
    // ارسال به کانال مقصد (در اینجا آیدی کانال باید وارد شود)
    bot.sendMessage('@DEST_CHANNEL', text);
  }
});

// پردازش تصاویر و ویدیوها
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  let caption = msg.caption || '';

  if (caption.includes(sourceId)) {
    caption = caption.replace(new RegExp(sourceId, 'g'), destId);
  }

  bot.sendPhoto(chatId, msg.photo[msg.photo.length - 1].file_id, { caption: caption });
  bot.sendPhoto('@DEST_CHANNEL', msg.photo[msg.photo.length - 1].file_id, { caption: caption });
});

bot.on('video', (msg) => {
  const chatId = msg.chat.id;
  let caption = msg.caption || '';

  if (caption.includes(sourceId)) {
    caption = caption.replace(new RegExp(sourceId, 'g'), destId);
  }

  bot.sendVideo(chatId, msg.video.file_id, { caption: caption });
  bot.sendVideo('@DEST_CHANNEL', msg.video.file_id, { caption: caption });
});
