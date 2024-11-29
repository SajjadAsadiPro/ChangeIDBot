const TelegramBot = require("node-telegram-bot-api");

// توکن ربات خود را وارد کنید
const token = "7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY";

// ایجاد ربات
const bot = new TelegramBot(token, { polling: true });

// آیدی عددی کانال مقصد و مبدا
const sourceChannelId = "-1002421032578"; // کانال مبدا
const destinationChannelId = "-1001337119090"; // کانال مقصد

// آیدی عددی شما برای گزارش خطاها
const userId = "7556830926";

// زمانی که پیام جدیدی از شما دریافت می‌شود
bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  // بررسی اینکه آیا پیام از کاربر خودتان است
  if (chatId === userId) {
    // ارسال پیام به کانال مبدا
    bot
      .forwardMessage(sourceChannelId, chatId, msg.message_id)
      .then(() => {
        // در صورتی که پیام به کانال مبدا ارسال شد، به مقصد فوروارد می‌شود
        bot
          .forwardMessage(destinationChannelId, chatId, msg.message_id)
          .catch((error) => {
            // ارسال خطا به آیدی شما در صورت بروز خطا در ارسال پیام به کانال مقصد
            bot.sendMessage(
              userId,
              `خطا در ارسال پیام به کانال مقصد: ${error.message}`
            );
          });
      })
      .catch((error) => {
        // ارسال خطا به آیدی شما در صورت بروز خطا در ارسال پیام به کانال مبدا
        bot.sendMessage(
          userId,
          `خطا در ارسال پیام به کانال مبدا: ${error.message}`
        );
      });
  }
});
