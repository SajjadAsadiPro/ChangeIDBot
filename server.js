const TelegramBot = require("node-telegram-bot-api");

// توکن ربات تلگرام
const token = "7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY";
const bot = new TelegramBot(token, { polling: true });

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

  bot.sendMessage(chatId, "سلام! لطفاً یک گزینه انتخاب کنید:", options);
});

// هندلر برای انتخاب دکمه
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const selectedOption = query.data;

  if (selectedOption === "ایرانی") {
    userMappings[chatId] = {
      source_id: "@MrMoovie",
      dest_id: "@FILmoseriyalerooz_bot",
    };
    bot.sendMessage(chatId, "آیدی‌های ایرانی با موفقیت تنظیم شدند!");
  } else if (selectedOption === "خارجی") {
    userMappings[chatId] = { source_id: "@towfilm", dest_id: "@GlobCinema" };
    bot.sendMessage(chatId, "آیدی‌های خارجی با موفقیت تنظیم شدند!");
  } else if (selectedOption === "انتخاب آیدی‌ها") {
    bot.sendMessage(chatId, "لطفاً آیدی مبدا را وارد کنید:");
    bot.once("message", (msg) => {
      const source_id = msg.text;
      bot.sendMessage(chatId, "حالا لطفاً آیدی مقصد را وارد کنید:");
      bot.once("message", (msg) => {
        const dest_id = msg.text;
        userMappings[chatId] = { source_id, dest_id };
        bot.sendMessage(
          chatId,
          `آیدی‌ها ذخیره شدند:\nمبدا: ${source_id}\nمقصد: ${dest_id}`
        );
      });
    });
  }
});

// ارسال فایل با تأخیر
function sendWithDelay(chatId, fileId, caption, type, delay) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (type === "photo") {
        bot
          .sendPhoto(chatId, fileId, { caption })
          .then(() => resolve())
          .catch(() => resolve());
      } else if (type === "video") {
        bot
          .sendVideo(chatId, fileId, { caption })
          .then(() => resolve())
          .catch(() => resolve());
      }
    }, delay);
  });
}

// پردازش پیام‌های دریافتی
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // پردازش فایل‌های تصویری
  if (msg.photo) {
    let caption = msg.caption || "";
    const updatedCaption = modifyCaption(caption, chatId); // تغییر کپشن
    await sendWithDelay(
      chatId,
      msg.photo[msg.photo.length - 1].file_id,
      updatedCaption,
      "photo",
      1000
    );
  }

  // پردازش فایل‌های ویدئویی
  if (msg.video) {
    let caption = msg.caption || "";
    const updatedCaption = modifyCaption(caption, chatId); // تغییر کپشن
    await sendWithDelay(
      chatId,
      msg.video.file_id,
      updatedCaption,
      "video",
      1000
    );
  }
});

// تابع تغییر کپشن
function modifyCaption(caption, chatId) {
  const mapping = userMappings[chatId];
  if (!mapping) return caption;

  const { source_id, dest_id } = mapping;
  return caption.includes(source_id)
    ? caption.replace(source_id, dest_id)
    : caption;
}
