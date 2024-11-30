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
      keyboard: [
        [
          { text: "ایرانی" },
          { text: "خارجی" }
        ],
        [
          { text: "انتخاب آیدی‌ها" },
          { text: "تغییر لینک دانلود" }
        ]
      ],
      resize_keyboard: true, // صفحه کلید را تنظیم می‌کند تا مناسب با اندازه صفحه باشد
      one_time_keyboard: true // صفحه کلید بعد از انتخاب گزینه پنهان می‌شود
    }
  };

  bot.sendMessage(chatId, "سلام! لطفاً یک گزینه انتخاب کنید:", options);
});

// هندلر برای انتخاب دکمه
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === "ایرانی" || msg.text === "خارجی") {
    const selectedOption = msg.text;
    if (mappings[selectedOption]) {
      const { source_id, dest_id } = mappings[selectedOption];
      userMappings[chatId] = { source_id, dest_id };

      bot.sendMessage(chatId, `آیدی مبدا: ${source_id} با موفقیت ذخیره شد.`);
      bot.sendMessage(chatId, `آیدی مقصد: ${dest_id} با موفقیت ذخیره شد.`);
      bot.sendMessage(chatId, "حالا هر پیام یا رسانه‌ای که ارسال کنید، آیدی مبدا با آیدی مقصد جایگزین خواهد شد.");
    }
  }

  if (msg.text === "انتخاب آیدی‌ها") {
    bot.sendMessage(chatId, "لطفاً انتخاب کنید: ایرانی یا خارجی.");
  }

  if (msg.text === "تغییر لینک دانلود") {
    bot.sendMessage(chatId, "لطفاً لینک دانلود جدید را ارسال کنید.");
    // برای گرفتن لینک دانلود جدید و تغییر آن در کپشن در اینجا عملیات لازم را اضافه کنید.
  }
});

// پردازش پیام‌های متنی
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text !== '/start') {
    let messageText = msg.text;

    if (userMappings[chatId]) {
      const { source_id, dest_id } = userMappings[chatId];
      if (messageText.includes(source_id)) {
        messageText = messageText.replace(source_id, dest_id);
      }

      addToQueue(() => bot.sendMessage(chatId, messageText));
    }
  }
});

// پردازش تصاویر
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  let caption = msg.caption;

  if (userMappings[chatId]) {
    const { source_id, dest_id } = userMappings[chatId];
    if (caption && caption.includes(source_id)) {
      caption = caption.replace(source_id, dest_id);
    }
  }

  addToQueue(() => bot.sendPhoto(chatId, msg.photo[0].file_id, { caption }));
});

// پردازش ویدیو
bot.on('video', (msg) => {
  const chatId = msg.chat.id;
  let caption = msg.caption;

  if (userMappings[chatId]) {
    const { source_id, dest_id } = userMappings[chatId];
    if (caption && caption.includes(source_id)) {
      caption = caption.replace(source_id, dest_id);
    }
  }

  addToQueue(() => bot.sendVideo(chatId, msg.video.file_id, { caption }));
});
