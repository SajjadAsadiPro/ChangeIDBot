const TelegramBot = require("node-telegram-bot-api");

// توکن ربات تلگرام
const token = "7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY";
const bot = new TelegramBot(token, { polling: true });

// دکمه‌ها و آیدی‌های مبدا و مقصد
const mappings = {
  ایرانی: {
    source_id: "@MrMoovie",
    dest_id: "@FILmoseriyalerooz_bot",
  },
  خارجی: {
    source_id: "@towfilm",
    dest_id: "@GlobCinema",
  },
};

// ذخیره آیدی‌ها برای کاربران
const userMappings = {};

// فرمان /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "ایرانی", callback_data: "ایرانی" },
          { text: "خارجی", callback_data: "خارجی" },
        ],
        [{ text: "انتخاب آیدی‌ها", callback_data: "انتخاب آیدی‌ها" }],
      ],
    },
  };

  // دکمه غیر شیشه‌ای برای شروع (اضافه کردن به گزینه‌های منو)
  const startOptions = {
    reply_markup: {
      keyboard: [[{ text: "/start" }]],
      resize_keyboard: true, // برای تنظیم اندازه دکمه‌ها
      one_time_keyboard: true, // دکمه فقط یکبار ظاهر شود
    },
  };

  bot.sendMessage(chatId, "سلام! لطفاً یک گزینه انتخاب کنید:", options);
  bot.sendMessage(chatId, "برای شروع دوباره /start را بزنید:", startOptions);
});

// هندلر برای انتخاب دکمه
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const selectedOption = query.data;

  // اگر انتخاب شده دکمه "ایرانی" یا "خارجی" باشد
  if (mappings[selectedOption]) {
    const { source_id, dest_id } = mappings[selectedOption];

    // ذخیره آیدی‌های مبدا و مقصد برای کاربر
    userMappings[chatId] = { source_id, dest_id };

    bot.sendMessage(chatId, `آیدی مبدا: ${source_id} با موفقیت ذخیره شد.`);
    bot.sendMessage(chatId, `آیدی مقصد: ${dest_id} با موفقیت ذخیره شد.`);

    // تایید و آماده‌سازی برای تغییرات در پیام‌ها
    bot.sendMessage(
      chatId,
      "حالا هر پیام یا رسانه‌ای که ارسال کنید، آیدی مبدا با آیدی مقصد جایگزین خواهد شد."
    );
  }

  // اگر کاربر "انتخاب آیدی‌ها" را انتخاب کند
  if (selectedOption === "انتخاب آیدی‌ها") {
    bot.sendMessage(chatId, "لطفاً آیدی مبدا را وارد کنید:");
    bot.once("message", (msg) => {
      const source_id = msg.text;
      bot.sendMessage(chatId, "حالا لطفاً آیدی مقصد را وارد کنید:");

      bot.once("message", (msg) => {
        const dest_id = msg.text;

        // ذخیره آیدی‌ها برای کاربر
        userMappings[chatId] = { source_id, dest_id };

        bot.sendMessage(chatId, `آیدی مبدا: ${source_id} با موفقیت ذخیره شد.`);
        bot.sendMessage(chatId, `آیدی مقصد: ${dest_id} با موفقیت ذخیره شد.`);
        bot.sendMessage(
          chatId,
          "حالا هر پیام یا رسانه‌ای که ارسال کنید، آیدی مبدا با آیدی مقصد جایگزین خواهد شد."
        );
      });
    });
  }
});

// پردازش تصاویر
bot.on("photo", (msg) => {
  const chatId = msg.chat.id;
  let caption = msg.caption;

  if (userMappings[chatId]) {
    const { source_id, dest_id } = userMappings[chatId];
    if (caption && caption.includes(source_id)) {
      caption = caption.replace(source_id, dest_id);
    }
  }

  // ذخیره تصویر در صف
  if (!global.fileQueue) {
    global.fileQueue = [];
  }
  global.fileQueue.push({
    type: "photo",
    file_id: msg.photo[0].file_id,
    caption,
    chatId,
  });

  // ارسال تصاویر از صف بعد از 1 ثانیه
  setTimeout(() => {
    sendFilesInOrder(chatId);
  }, 1000);
});

// پردازش ویدیو
bot.on("video", (msg) => {
  const chatId = msg.chat.id;
  let caption = msg.caption;

  if (userMappings[chatId]) {
    const { source_id, dest_id } = userMappings[chatId];
    if (caption && caption.includes(source_id)) {
      caption = caption.replace(source_id, dest_id);
    }
  }

  // ذخیره ویدیو در صف
  if (!global.fileQueue) {
    global.fileQueue = [];
  }
  global.fileQueue.push({
    type: "video",
    file_id: msg.video.file_id,
    caption,
    chatId,
  });

  // ارسال ویدیوها از صف بعد از 1 ثانیه
  setTimeout(() => {
    sendFilesInOrder(chatId);
  }, 1000);
});

// تابع برای ارسال فایل‌ها در همان ترتیب
function sendFilesInOrder(chatId) {
  if (!global.fileQueue || global.fileQueue.length === 0) return;

  // ارسال فایل‌ها به ترتیب
  const file = global.fileQueue.shift(); // دریافت اولین فایل از صف

  if (file.type === "photo") {
    bot.sendPhoto(file.chatId, file.file_id, { caption: file.caption });
  } else if (file.type === "video") {
    bot.sendVideo(file.chatId, file.file_id, { caption: file.caption });
  }

  // پس از ارسال یک فایل، دوباره برای ارسال بعدی اقدام می‌کنیم
  if (global.fileQueue.length > 0) {
    setTimeout(() => {
      sendFilesInOrder(chatId);
    }, 1000);
  }
}
