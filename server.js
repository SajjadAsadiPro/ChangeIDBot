const TelegramBot = require('node-telegram-bot-api');

// توکن ربات را وارد کنید
const token = '7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY';

// آی‌دی کانال‌ها
const sourceChannel = '@source_channel'; // کانال مبدأ
const targetChannel = '@target_channel'; // کانال مقصد

// ایجاد نمونه ربات
const bot = new TelegramBot(token, { polling: true });

// شنود پیام‌های دریافتی از کانال مبدأ
bot.on('message', (msg) => {
    if (msg.chat && msg.chat.username === sourceChannel.replace('@', '')) {
        // فوروارد کردن پیام به کانال مقصد
        bot.forwardMessage(targetChannel, msg.chat.id, msg.message_id)
            .then(() => {
                console.log(`Message forwarded to ${targetChannel}`);
            })
            .catch((err) => {
                console.error(`Error forwarding message: ${err.message}`);
            });
    }
});

// مدیریت پیام‌های دیگر
bot.on('polling_error', (err) => {
    console.error(`Polling Error: ${err.message}`);
});
