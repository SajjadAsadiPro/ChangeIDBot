const TelegramBot = require("node-telegram-bot-api");

// توکن ربات خود را اینجا وارد کنید
const token = "7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY";
const bot = new TelegramBot(token, { polling: true });

// آیدی کانال مبدا
const sourceChannelId = "-1002421032578";

// آیدی خودتان برای ارسال پیام‌های خطا
const myId = "7556830926";

// ارسال پیام استارت
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "سلام! ربات در حال آماده‌سازی است.");
});

// ارسال پیام‌ها به کانال مبدا با جایگزینی آیدی‌های @ با @day
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  let text = msg.text || "";

  // جایگزینی @user با @day
  text = text.replace(/@\w+/g, "@day");

  // ارسال پیام به کانال مبدا
  bot.sendMessage(sourceChannelId, text).catch((error) => {
    // اگر خطا پیش آمد، به آیدی خودتان پیام خطا ارسال می‌شود
    bot.sendMessage(myId, `خطا در ارسال پیام به کانال مبدا: ${error.message}`);
  });
});
