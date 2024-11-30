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
      inline_keyboard: [
        [
          { text: "ایرانی", callback_data: "ایرانی" },
          { text: "خارجی", callback_data: "خارجی" }
        ],
        [
          { text: "انتخاب آیدی‌ها", callback_data: "انتخاب آیدی‌ها" },
          { text: "تغییر کپشن لینک دانلود", callback_data: "تغییر کپشن" }
        ],
        [
          { text: "ریستارت ربات", callback_data: "ریستارت" } // دکمه جدید برای ریستارت ربات
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

  if (selectedOption === "تغییر کپشن") {
    // فعال کردن حالت تغییر کپشن
    bot.sendMessage(chatId, "حالت تغییر کپشن لینک دانلود فعال شد. لینک دانلود به شرح زیر تغییر خواهد کرد:\n❤️@GlobCinema\n❤️@GlobCinemaNews");
    
    // ذخیره وضعیت تغییر کپشن برای استفاده بعدی
    userMappings[chatId] = { changeCaption: true };
  }

  if (mappings[selectedOption]) {
    const { source_id, dest_id } = mappings[selectedOption];
    userMappings[chatId] = { source_id, dest_id };

    bot.sendMessage(chatId, `آیدی مبدا: ${source_id} با موفقیت ذخیره شد.`);
    bot.sendMessage(chatId, `آیدی مقصد: ${dest_id} با موفقیت ذخیره شد.`);
    bot.sendMessage(chatId, "حالا هر پیام یا رسانه‌ای که ارسال کنید، آیدی مبدا با آیدی مقصد جایگزین خواهد شد.");
  }

  // هندلر برای دکمه انتخاب آیدی‌ها
  if (selectedOption === "انتخاب آیدی‌ها") {
    bot.sendMessage(chatId, "لطفاً آیدی مبدا را ارسال کنید.");
    userMappings[chatId] = { step: "source_id" }; // مرحله اول (دریافت آیدی مبدا)
  }

  // هندلر برای دکمه ریستارت
  if (selectedOption === "ریستارت") {
    delete userMappings[chatId]; // پاک کردن اطلاعات کاربر برای ریستارت ربات
    bot.sendMessage(chatId, "ربات با موفقیت ریستارت شد.");
  }
});

// پردازش پیام‌های متنی
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text !== '/start') {
    let messageText = msg.text;

    if (userMappings[chatId]) {
      const { step, source_id, dest_id, changeCaption } = userMappings[chatId];

      if (step === "source_id") {
        // مرحله اول: دریافت آیدی مبدا
        userMappings[chatId].source_id = messageText;
        userMappings[chatId].step = "dest_id"; // مرحله بعدی: دریافت آیدی مقصد
        bot.sendMessage(chatId, `آیدی مبدا "${messageText}" ذخیره شد. حالا لطفاً آیدی مقصد را ارسال کنید.`);
        return;
      }

      if (step === "dest_id") {
        // مرحله دوم: دریافت آیدی مقصد
        userMappings[chatId].dest_id = messageText;
        delete userMappings[chatId].step; // اتمام پروسه انتخاب آیدی‌ها
        bot.sendMessage(chatId, `آیدی مقصد "${messageText}" ذخیره شد. حالا هر پیامی که ارسال کنید، آیدی مبدا با آیدی مقصد جایگزین خواهد شد.`);
        return;
      }

      if (source_id && dest_id) {
        if (messageText.includes(source_id)) {
          messageText = messageText.replace(source_id, dest_id);
        }

        // اگر دکمه تغییر کپشن فشرده شده باشد، تغییر لینک دانلود را اعمال می‌کنیم
        if (changeCaption && messageText.includes('➰ لینک دانلود:')) {
          // فقط بخش لینک دانلود را تغییر داده و بقیه متن را پاک می‌کنیم
          messageText = messageText.split('➰ لینک دانلود:')[0] + '❤️@GlobCinema\n❤️@GlobCinemaNews';
          delete userMappings[chatId].changeCaption;  // غیرفعال کردن حالت تغییر کپشن
        }

        addToQueue(() => bot.sendMessage(chatId, messageText));
      }
    }
  }
});

// پردازش تصاویر
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  let caption = msg.caption;

  if (userMappings[chatId]) {
    const { source_id, dest_id, changeCaption } = userMappings[chatId];
    if (caption && caption.includes(source_id)) {
      caption = caption.replace(source_id, dest_id);
    }

    // اگر دکمه تغییر کپشن فشرده شده باشد، تغییر لینک دانلود را اعمال می‌کنیم
    if (changeCaption && caption && caption.includes('➰ لینک دانلود:')) {
      // فقط بخش لینک دانلود را تغییر داده و بقیه متن را پاک می‌کنیم
      caption = caption.split('➰ لینک دانلود:')[0] + '❤️@GlobCinema\n❤️@GlobCinemaNews';
      delete userMappings[chatId].changeCaption;  // غیرفعال کردن حالت تغییر کپشن
    }
  }

  addToQueue(() => bot.sendPhoto(chatId, msg.photo[0].file_id, { caption }));
});

// پردازش ویدیو
bot.on('video', (msg) => {
  const chatId = msg.chat.id;
  let caption = msg.caption;

  if (userMappings[chatId]) {
    const { source_id, dest_id, changeCaption } = userMappings[chatId];
    if (caption && caption.includes(source_id)) {
      caption = caption.replace(source_id, dest_id);
    }

    // اگر دکمه تغییر کپشن فشرده شده باشد، تغییر لینک دانلود را اعمال می‌کنیم
    if (changeCaption && caption && caption.includes('➰ لینک دانلود:')) {
      // فقط بخش لینک دانلود را تغییر داده و بقیه متن را پاک می‌کنیم
      caption = caption.split('➰ لینک دانلود:')[0] + '❤️@GlobCinema\n❤️@GlobCinemaNews';
      delete userMappings[chatId].changeCaption;  // غیرفعال کردن حالت تغییر کپشن
    }
  }

  addToQueue(() => bot.sendVideo(chatId, msg.video.file_id, { caption }));
});
