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

// ذخیره پیام‌ها
const pendingMessages = {};

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
    userMappings[chatId] = { source_id, dest_id };
    bot.sendMessage(chatId, `آیدی مبدا: ${source_id} با موفقیت ذخیره شد.`);
    bot.sendMessage(chatId, `آیدی مقصد: ${dest_id} با موفقیت ذخیره شد.`);
    bot.sendMessage(chatId, "حالا پیام‌های خود را ارسال کنید.");
  }

  if (selectedOption === "انتخاب آیدی‌ها") {
    bot.sendMessage(chatId, "لطفاً آیدی مبدا را وارد کنید:");
    bot.once("message", (msg) => {
      const source_id = msg.text;
      bot.sendMessage(chatId, "حالا لطفاً آیدی مقصد را وارد کنید:");
      bot.once("message", (msg) => {
        const dest_id = msg.text;
        userMappings[chatId] = { source_id, dest_id };
        bot.sendMessage(chatId, `آیدی‌ها ذخیره شدند. ارسال پیام‌ها را شروع کنید.`);
      });
    });
  }
});

// تابع استخراج عدد از کپشن
function extractNumber(caption) {
  const match = caption ? caption.match(/\d+/) : null;
  return match ? parseInt(match[0], 10) : Infinity; // اگر عددی نبود، مقدار بالا برای انتهای لیست.
}

// ذخیره و مرتب‌سازی پیام‌های تصویری
bot.on(["photo", "video"], (msg) => {
  const chatId = msg.chat.id;
  const caption = msg.caption || "";

  if (!pendingMessages[chatId]) pendingMessages[chatId] = [];

  const messageData = {
    type: msg.photo ? "photo" : "video",
    fileId: msg.photo ? msg.photo[0].file_id : msg.video.file_id,
    caption,
  };

  pendingMessages[chatId].push(messageData);

  // مرتب‌سازی پیام‌ها
  pendingMessages[chatId].sort((a, b) => extractNumber(a.caption) - extractNumber(b.caption));
});

// ارسال پیام‌ها
bot.onText(/\/send/, (msg) => {
  const chatId = msg.chat.id;

  if (pendingMessages[chatId] && pendingMessages[chatId].length > 0) {
    const { source_id, dest_id } = userMappings[chatId] || {};
    pendingMessages[chatId].forEach((message) => {
      let caption = message.caption;
      if (source_id && dest_id && caption.includes(source_id)) {
        caption = caption.replace(source_id, dest_id);
      }

      if (message.type === "photo") {
        bot.sendPhoto(chatId, message.fileId, { caption });
      } else if (message.type === "video") {
        bot.sendVideo(chatId, message.fileId, { caption });
      }
    });

    // بعد از ارسال پیام‌ها، لیست را خالی می‌کنیم
    pendingMessages[chatId] = [];
  } else {
    bot.sendMessage(chatId, "هیچ پیامی برای ارسال موجود نیست.");
  }
});
