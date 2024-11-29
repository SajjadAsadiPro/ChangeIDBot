const TelegramBot = require("node-telegram-bot-api");
const token = "7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY";
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const inlineKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "بازدید سایت", url: "https://example.com" }],
        [{ text: "دکمه دیگر", callback_data: "other_button" }],
      ],
    },
  };

  bot.sendMessage(
    chatId,
    "سلام! یکی از گزینه‌ها را انتخاب کن:",
    inlineKeyboard
  );
});

// مدیریت دکمه‌هایی که از callback_data استفاده می‌کنند
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === "other_button") {
    bot.sendMessage(chatId, "شما دکمه دیگر را انتخاب کردید!");
  }
});
