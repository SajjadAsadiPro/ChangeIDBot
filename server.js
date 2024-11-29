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

// ذخیره صف فایل‌ها
const fileQueue = []; // صف برای ذخیره فایل‌ها

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

  bot.sendMessage(chatId, "سلام! لطفاً یک گزینه انتخاب کنید:", options);
});

// هندلر برای انتخاب دکمه
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const selectedOption = query.data;

  if (mappings[selectedOption]) {
    const { source_id, dest_id } = mappings[selectedOption];

    // ذخیره آیدی‌های مبدا و مقصد برای کاربر
    userMappings[chatId] = { source_id, dest_id };

    bot.sendMessage(chatId, `آیدی مبدا: ${source_id} با موفقیت ذخیره شد.`);
    bot.sendMessage(chatId, `آیدی مقصد: ${dest_id} با موفقیت ذخیره شد.`);
    bot.sendMessage(
      chatId,
      "حالا هر پیام یا رسانه‌ای که ارسال کنید، آیدی مبدا با آیدی مقصد جایگزین خواهد شد."
    );
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

  // ذخیره عکس در صف
  fileQueue.push({
    type: "photo",
    file_id: msg.photo[0].file_id,
    caption,
    chatId,
  });

  // فراخوانی تابع برای ارسال فایل‌ها از صف
  processQueue(); // شروع فرآیند ارسال
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
  fileQueue.push({
    type: "video",
    file_id: msg.video.file_id,
    caption,
    chatId,
  });

  // فراخوانی تابع برای ارسال فایل‌ها از صف
  processQueue(); // شروع فرآیند ارسال
});

// تابع پردازش صف فایل‌ها
function processQueue() {
  if (fileQueue.length === 0) return; // اگر صف خالی است، هیچ کاری انجام نده

  const file = fileQueue.shift(); // دریافت اولین فایل از صف

  // اگر فایل عکس است، آن را ارسال می‌کنیم
  if (file.type === "photo") {
    bot
      .sendPhoto(file.chatId, file.file_id, { caption: file.caption })
      .then(() => {
        // پس از ارسال عکس، فایل بعدی را ارسال می‌کنیم
        processQueue();
      })
      .catch((err) => {
        console.error("Error sending photo:", err);
        processQueue(); // در صورت خطا هم ادامه می‌دهیم
      });
  }

  // اگر فایل ویدیو است، آن را ارسال می‌کنیم
  else if (file.type === "video") {
    bot
      .sendVideo(file.chatId, file.file_id, { caption: file.caption })
      .then(() => {
        // پس از ارسال ویدیو، فایل بعدی را ارسال می‌کنیم
        processQueue();
      })
      .catch((err) => {
        console.error("Error sending video:", err);
        processQueue(); // در صورت خطا هم ادامه می‌دهیم
      });
  }
}
