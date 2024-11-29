const TelegramBot = require("node-telegram-bot-api");

// توکن ربات
const token = "7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY";

// آی‌دی کانال‌ها و ادمین
const sourceChannelId = -1002421032578; // آی‌دی عددی کانال مبدأ
const targetChannelId = -1001337119090; // آی‌دی عددی کانال مقصد
const adminId = 7556830926; // آی‌دی عددی ادمین (شما)

// ایجاد نمونه ربات
const bot = new TelegramBot(token, { polling: true });

// پیام خوش‌آمدگویی هنگام شروع
bot.on("polling_start", () => {
  console.log("Bot has started successfully!");
  bot.sendMessage(adminId, "✅ ربات با موفقیت استارت شد و آماده به کار است.");
});

// شنود پیام‌های دریافتی از کانال مبدأ
bot.on("message", (msg) => {
  if (msg.chat && msg.chat.id === sourceChannelId) {
    // فوروارد کردن پیام به کانال مقصد
    bot
      .forwardMessage(targetChannelId, msg.chat.id, msg.message_id)
      .then(() => {
        console.log(
          `Message forwarded successfully from ${sourceChannelId} to ${targetChannelId}`
        );
      })
      .catch((err) => {
        console.error(`Error forwarding message: ${err.message}`);
        // ارسال خطا به ادمین
        bot.sendMessage(
          adminId,
          `❌ خطا هنگام فوروارد پیام:\n\n${err.message}`
        );
      });
  }
});

// مدیریت خطاهای polling
bot.on("polling_error", (err) => {
  console.error(`Polling Error: ${err.message}`);
  // ارسال خطا به ادمین
  bot.sendMessage(adminId, `⚠️ خطای polling:\n\n${err.message}`);
});

// مدیریت خطاهای غیرمنتظره
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  bot.sendMessage(adminId, `⚠️ خطای غیرمنتظره:\n\n${reason}`);
});
// پیام خوش‌آمدگویی هنگام شروع
bot.on("polling_start", () => {
  console.log("Bot has started successfully!");
  bot.sendMessage(adminId, "✅ ربات با موفقیت استارت شد و آماده به کار است.");
});

// شنود پیام‌های دریافتی از کانال مبدأ
bot.on("message", (msg) => {
  if (msg.chat && msg.chat.id === sourceChannelId) {
    // فوروارد کردن پیام به کانال مقصد
    bot
      .forwardMessage(targetChannelId, msg.chat.id, msg.message_id)
      .then(() => {
        console.log(
          `Message forwarded successfully from ${sourceChannelId} to ${targetChannelId}`
        );
      })
      .catch((err) => {
        console.error(`Error forwarding message: ${err.message}`);
        // ارسال خطا به ادمین
        bot.sendMessage(
          adminId,
          `❌ خطا هنگام فوروارد پیام:\n\n${err.message}`
        );
      });
  }
});

// مدیریت خطاهای polling
bot.on("polling_error", (err) => {
  console.error(`Polling Error: ${err.message}`);
  // ارسال خطا به ادمین
  bot.sendMessage(adminId, `⚠️ خطای polling:\n\n${err.message}`);
});

// مدیریت خطاهای غیرمنتظره
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  bot.sendMessage(adminId, `⚠️ خطای غیرمنتظره:\n\n${reason}`);
});
