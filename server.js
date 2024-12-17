const TelegramBot = require('node-telegram-bot-api');

// توکن ربات تلگرام
const token = '7796261453:AAGCRAra68yi7n5d0jKXzE3JRvaN3spW9vk'; // توکن خود را جایگزین کنید
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

// ذخیره تنظیمات کاربران
const userMappings = {};
const userCaptions = {};

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
    delete userCaptions[chatId];
    bot.sendMessage(chatId, "ربات با موفقیت ریستارت شد.");
  }
});

// تنظیم متن دلخواه توسط کاربر
bot.onText(/\/set_caption (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const customCaption = match[1];

  userCaptions[chatId] = customCaption;
  bot.sendMessage(chatId, "متن پیش‌فرض شما با موفقیت ذخیره شد!");
});

// پردازش رسانه‌ها (عکس، ویدیو، فایل و غیره)
const handleMedia = (msg, mediaType) => {
  const chatId = msg.chat.id;
  const userMapping = userMappings[chatId];
  const userCaption = userCaptions[chatId] || "";
  let caption = msg.caption || "";

  if (userMapping) {
    const { source_id, dest_id } = userMapping;

    if (source_id && caption.includes(source_id)) {
      caption = caption.replace(source_id, dest_id);
    }

    caption += `\n${userCaption}`; // افزودن متن سفارشی کاربر
  }

  const mediaOptions = { caption };

  addToQueue(() => {
    if (mediaType === 'photo') {
      bot.sendPhoto(chatId, msg.photo[0].file_id, mediaOptions);
    } else if (mediaType === 'video') {
      bot.sendVideo(chatId, msg.video.file_id, mediaOptions);
    } else if (mediaType === 'document') {
      bot.sendDocument(chatId, msg.document.file_id, mediaOptions);
    } else if (mediaType === 'audio') {
      bot.sendAudio(chatId, msg.audio.file_id, mediaOptions);
    } else if (mediaType === 'voice') {
      bot.sendVoice(chatId, msg.voice.file_id, mediaOptions);
    }
  });
};

// پردازش عکس‌ها
bot.on('photo', (msg) => handleMedia(msg, 'photo'));

// پردازش ویدیوها
bot.on('video', (msg) => handleMedia(msg, 'video'));

// پردازش فایل‌های اسناد
bot.on('document', (msg) => handleMedia(msg, 'document'));

// پردازش فایل‌های صوتی
bot.on('audio', (msg) => handleMedia(msg, 'audio'));

// پردازش پیام‌های صوتی
bot.on('voice', (msg) => handleMedia(msg, 'voice'));

// پردازش پیام‌های متنی
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && !msg.text.startsWith('/')) {
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
