const TelegramBot = require('node-telegram-bot-api');

// توکن ربات تلگرام
const token = '7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY';
const bot = new TelegramBot(token, { polling: true });

// دکمه‌ها و آیدی‌های مبدا و مقصد
const mappings = {
  "مستر مووی": {
    source_id: "@MrMoovie",
    dest_id: "@FILmoseriyalerooz_bot"
  },
  "اخبار فیلم و سریال روز": {
    source_id: "@towfilm",
    dest_id: "@GlobCinema"
  }
};

// فرمان /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "مستر مووی", callback_data: "مستر مووی" },
          { text: "اخبار فیلم و سریال روز", callback_data: "اخبار فیلم و سریال روز" }
        ]
      ]
    }
  };
  bot.sendMessage(chatId, "سلام! لطفاً یک گزینه انتخاب کنید:", options);
});

// هندلر برای انتخاب دکمه
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const selectedOption = query.data;

  // اگر انتخاب شده دکمه "مستر مووی" یا "اخبار فیلم و سریال روز" باشد
  if (mappings[selectedOption]) {
    const { source_id, dest_id } = mappings[selectedOption];
    
    // ذخیره آیدی‌های مبدا و مقصد برای کاربر
    bot.sendMessage(chatId, `آیدی مبدا: ${source_id} با موفقیت ذخیره شد.`);
    bot.sendMessage(chatId, `آیدی مقصد: ${dest_id} با موفقیت ذخیره شد.`);

    // تایید و آماده‌سازی برای تغییرات در پیام‌ها
    bot.sendMessage(chatId, "حالا هر پیام یا رسانه‌ای که ارسال کنید، آیدی مبدا با آیدی مقصد جایگزین خواهد شد.");
  }
});

// پردازش پیام‌های متنی
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text !== '/start') {
    // بررسی اینکه آیدی مبدا در متن وجود دارد
    let messageText = msg.text;
    Object.keys(mappings).forEach((key) => {
      const { source_id, dest_id } = mappings[key];
      if (messageText.includes(source_id)) {
        messageText = messageText.replace(source_id, dest_id);
      }
    });
    
    // ارسال پیام تغییر یافته به کانال مبدا
    bot.sendMessage(chatId, messageText);
  }
});

// پردازش تصاویر
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  let caption = msg.caption;

  Object.keys(mappings).forEach((key) => {
    const { source_id, dest_id } = mappings[key];
    if (caption && caption.includes(source_id)) {
      caption = caption.replace(source_id, dest_id);
    }
  });

  // ارسال تصویر با کپشن تغییر یافته
  bot.sendPhoto(chatId, msg.photo[0].file_id, { caption });
});

// پردازش ویدیو
bot.on('video', (msg) => {
  const chatId = msg.chat.id;
  let caption = msg.caption;

  Object.keys(mappings).forEach((key) => {
    const { source_id, dest_id } = mappings[key];
    if (caption && caption.includes(source_id)) {
      caption = caption.replace(source_id, dest_id);
    }
  });

  // ارسال ویدیو با کپشن تغییر یافته
  bot.sendVideo(chatId, msg.video.file_id, { caption });
});
