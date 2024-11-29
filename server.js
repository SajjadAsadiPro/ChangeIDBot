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
const fileQueue = {}; // صف برای ذخیره فایل‌ها به تفکیک شماره قسمت

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

  // بررسی شماره قسمت در کپشن
  if (caption && caption.includes("قسمت")) {
    const match = caption.match(/قسمت\s*(\d+)/);
    const episodeNumber = match ? parseInt(match[1]) : null;

    if (episodeNumber !== null) {
      // ذخیره عکس در صف به تفکیک شماره قسمت
      if (!fileQueue[episodeNumber]) {
        fileQueue[episodeNumber] = [];
      }
      fileQueue[episodeNumber].push({
        type: "photo",
        file_id: msg.photo[0].file_id,
        caption,
        chatId,
      });
    }
  } else {
    // اگر شماره قسمت وجود ندارد، فقط آیدی مبدا را تغییر بده
    bot.sendPhoto(chatId, msg.photo[0].file_id, { caption });
  }

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

  // بررسی شماره قسمت در کپشن
  if (caption && caption.includes("قسمت")) {
    const match = caption.match(/قسمت\s*(\d+)/);
    const episodeNumber = match ? parseInt(match[1]) : null;

    if (episodeNumber !== null) {
      // ذخیره ویدیو در صف به تفکیک شماره قسمت
      if (!fileQueue[episodeNumber]) {
        fileQueue[episodeNumber] = [];
      }
      fileQueue[episodeNumber].push({
        type: "video",
        file_id: msg.video.file_id,
        caption,
        chatId,
      });
    }
  } else {
    // اگر شماره قسمت وجود ندارد، فقط آیدی مبدا را تغییر بده
    bot.sendVideo(chatId, msg.video.file_id, { caption });
  }

  // فراخوانی تابع برای ارسال فایل‌ها از صف
  processQueue(); // شروع فرآیند ارسال
});

// تابع پردازش صف فایل‌ها
async function processQueue() {
  // ابتدا شماره قسمت‌ها را مرتب می‌کنیم
  const sortedEpisodes = Object.keys(fileQueue)
    .map(Number)
    .sort((a, b) => a - b);

  // ارسال فایل‌ها به ترتیب شماره قسمت
  for (let episodeNumber of sortedEpisodes) {
    if (fileQueue[episodeNumber].length > 0) {
      // ارسال هر فایل در صف مربوطه
      for (let file of fileQueue[episodeNumber]) {
        if (file.type === "photo") {
          // ارسال عکس با وقفه یک ثانیه‌ای
          await sendWithDelay(file.chatId, file.file_id, file.caption, "photo");
        } else if (file.type === "video") {
          // ارسال ویدیو با وقفه یک ثانیه‌ای
          await sendWithDelay(file.chatId, file.file_id, file.caption, "video");
        }
      }

      // پس از ارسال تمام فایل‌ها برای این قسمت، صف آن قسمت را پاک می‌کنیم
      delete fileQueue[episodeNumber];
    }
  }
}

// تابع ارسال با وقفه
function sendWithDelay(chatId, fileId, caption, type) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (type === "photo") {
        bot
          .sendPhoto(chatId, fileId, { caption })
          .then(() => {
            console.log(`Photo for episode sent.`);
            resolve();
          })
          .catch((err) => {
            console.error("Error sending photo:", err);
            resolve();
          });
      } else if (type === "video") {
        bot
          .sendVideo(chatId, fileId, { caption })
          .then(() => {
            console.log(`Video for episode sent.`);
            resolve();
          })
          .catch((err) => {
            console.error("Error sending video:", err);
            resolve();
          });
      }
    }, 1000); // وقفه یک ثانیه‌ای
  });
}
