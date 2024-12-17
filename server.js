const TelegramBot = require('node-telegram-bot-api');

// توکن ربات تلگرام
const token = '7796261453:AAGCRAra68yi7n5d0jKXzE3JRvaN3spW9vk';
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

// جایگزینی متن برای گزینه "ایرانی"
const modifyCaptionIranian = (caption) => {
  const splitPoint = "📥 لینک دانلود رایگان پرسرعت 📥";
  if (caption.includes(splitPoint)) {
    return caption.split(splitPoint)[0] + "\n@filmoseriyalerooz_bot";
  }
  return caption;
};

// جایگزینی متن برای گزینه "خارجی" و "ترکیبی"
const modifyCaptionForeign = (caption) => {
  if (caption.includes("➰ لینک دانلود:")) {
    return caption.split("➰ لینک دانلود:")[0] + "\n❤️@GlobCinema\n❤️@GlobCinemaNews";
  }
  return caption;
};

// پردازش تصاویر
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  const userMapping = userMappings[chatId];
  let caption = msg.caption || "";

  if (userMapping) {
    const { dest_id } = userMapping;

    if (dest_id === "@FILmoseriyalerooz_bot") {
      caption = modifyCaptionIranian(caption);
    } else if (dest_id === "@GlobCinema") {
      caption = modifyCaptionForeign(caption);
    }
  }

  addToQueue(() => bot.sendPhoto(chatId, msg.photo[0].file_id, { caption }));
});

// پردازش ویدیو
bot.on('video', (msg) => {
  const chatId = msg.chat.id;
  const userMapping = userMappings[chatId];
  let caption = msg.caption || "";

  if (userMapping) {
    const { dest_id } = userMapping;

    // تغییر آیدی برای ویدیوهای ایرانی
    if (dest_id === "@FILmoseriyalerooz_bot" && caption.includes("@MrMoovie")) {
      caption = caption.replace("@MrMoovie", "@FILmoseriyalerooz_bot");
    }

    // تغییر آیدی برای ویدیوهای خارجی و ترکیبی
    if (dest_id === "@GlobCinema" && caption.includes("@towfilm")) {
      caption = caption.replace("@towfilm", "@GlobCinema");
    }
  }

  addToQueue(() => bot.sendVideo(chatId, msg.video.file_id, { caption }));
});

// پردازش پیام‌های متنی
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text !== '/start') {
    let messageText = msg.text;

    const userMapping = userMappings[chatId];
    if (userMapping) {
      const { source_id, dest_id } = userMapping;

      if (source_id && dest_id && messageText.includes(source_id)) {
        messageText = messageText.replace(source_id, dest_id);
      }

      addToQueue(() => bot.sendMessage(chatId, messageText));
    }
  }
});
