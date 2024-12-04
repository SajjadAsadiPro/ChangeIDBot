const TelegramBot = require('node-telegram-bot-api');

// توکن ربات تلگرام
const token = '7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY';
const bot = new TelegramBot(token, { polling: true });

// دکمه‌ها و آیدی‌های مبدا و مقصد
const mappings = {
  "ایرانی": {
    source_id: "@MrMoovie",
    dest_id: "@FILmoseriyalerooz_bot"
  },
  "خارجی": {
    source_id: "@towfilm",
    dest_id: "@GlobCinema"
  },
  "ترکیبی": {
    dest_id: "@GlobCinema"
  }
};

// ذخیره آیدی‌ها برای کاربران
const userMappings = {};

// صف ارسال پیام
const messageQueue = [];
let isProcessing = false;

// افزودن پیام به صف
const addToQueue = (task) => {
  messageQueue.push(task);
  processQueue();
};

// پردازش صف
const processQueue = async () => {
  if (isProcessing || messageQueue.length === 0) return;
  isProcessing = true;

  const task = messageQueue.shift();
  try {
    await task(); // اجرای پیام
  } catch (error) {
    console.error("خطا در پردازش صف:", error);
  }

  isProcessing = false;
  processQueue(); // ادامه پردازش پیام‌های بعدی
};

// فرمان /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "ایرانی", callback_data: "ایرانی" },
          { text: "خارجی", callback_data: "خارجی" },
          { text: "ترکیبی", callback_data: "ترکیبی" }
        ],
        [
          { text: "ریستارت ربات", callback_data: "ریستارت" }
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

  if (mappings[selectedOption]) {
    const { source_id, dest_id } = mappings[selectedOption];
    userMappings[chatId] = { source_id, dest_id };

    bot.sendMessage(chatId, `تنظیمات ${selectedOption} با موفقیت ذخیره شد.`);
    bot.sendMessage(chatId, "حالا هر پیام یا رسانه‌ای که ارسال کنید، آیدی‌ها تغییر خواهند کرد.");
  }

  if (selectedOption === "ریستارت") {
    delete userMappings[chatId];
    bot.sendMessage(chatId, "ربات با موفقیت ریستارت شد.");
  }
});

// جایگزینی آیدی‌ها
const replaceMentions = (text, dest_id) => {
  return text.replace(/@\w+/g, dest_id);
};

// پردازش تصاویر
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  const userMapping = userMappings[chatId];

  if (userMapping) {
    const { dest_id } = userMapping;
    let caption = msg.caption || "";

    // جایگزینی آیدی‌ها
    caption = replaceMentions(caption, dest_id);

    addToQueue(() => bot.sendPhoto(chatId, msg.photo[0].file_id, { caption }));
  }
});

// پردازش ویدیو
bot.on('video', (msg) => {
  const chatId = msg.chat.id;
  const userMapping = userMappings[chatId];

  if (userMapping) {
    const { dest_id } = userMapping;
    let caption = msg.caption || "";

    // جایگزینی آیدی‌ها
    caption = replaceMentions(caption, dest_id);

    addToQueue(() => bot.sendVideo(chatId, msg.video.file_id, { caption }));
  }
});

// پردازش پیام‌های متنی
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text !== '/start') {
    let messageText = msg.text;

    const userMapping = userMappings[chatId];
    if (userMapping) {
      const { dest_id } = userMapping;

      // جایگزینی آیدی‌ها
      messageText = replaceMentions(messageText, dest_id);

      addToQueue(() => bot.sendMessage(chatId, messageText));
    }
  }
});
