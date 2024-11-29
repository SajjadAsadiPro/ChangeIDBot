const TelegramBot = require('node-telegram-bot-api');
const token = '7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY';  // توکن ربات شما
const bot = new TelegramBot(token, {polling: true});

const DEST_CHANNEL_ID = '@Sajjjad_asadi';  // آیدی کانال مقصد (کانال فیلم و سریال خارجی)
const YOUR_CHAT_ID = '7556830926';  // آیدی شما
const BOT_ID = '1664164433';  // آیدی ربات شما

// دستورات برای ارسال دکمه‌ها
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "تغییر کاور", callback_data: 'change_cover' },
                    { text: "مستر مووی", callback_data: 'MrMoovie' },
                    { text: "خارجی", callback_data: 'foreign' },
                    { text: "سفارشی", callback_data: 'custom' }
                ]
            ]
        }
    };
    bot.sendMessage(chatId, "سلام! لطفاً از دکمه‌ها استفاده کنید.", options);
});

// دکمه تغییر کاور
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data === 'change_cover') {
        bot.sendMessage(chatId, "لطفاً تصویر با کاور را ارسال کنید تا تغییرات لازم اعمال شود.");
    } else if (data === 'MrMoovie') {
        // تغییر آیدی مستر مووی
        changeIdAndForwardMessage('@MrMoovie', '@FILmoseriyalerooz_bot', chatId);
    } else if (data === 'foreign') {
        // تغییر آیدی خارجی
        changeIdAndForwardMessage('@towfilm', '@GlobCinema', chatId);
    } else if (data === 'custom') {
        bot.sendMessage(chatId, "لطفاً آیدی مبدا و مقصد را به شکل زیر ارسال کنید:\n\n/move @sourceId @destinationId");
    }
});

// تابع تغییر آیدی‌ها و ارسال به کانال مقصد
function changeIdAndForwardMessage(sourceId, destId, chatId) {
    bot.sendMessage(chatId, `آیدی ${sourceId} به ${destId} تغییر داده شد.`);
}

// پردازش پیام‌های تصویری
bot.on('photo', (msg) => {
    const chatId = msg.chat.id;
    const photo = msg.photo[msg.photo.length - 1].file_id;  // گرفتن بزرگترین تصویر
    const caption = msg.caption || '';

    // حذف بخش لینک و تا آخر کلیک کنید
    let newCaption = caption.replace(/➰ لینک -.*?کلیک کنید/g, '');

    // تغییر t.me/towfilm به @GlobCinema
    newCaption = newCaption.replace("🆔 t.me/towfilm", "🆔 @GlobCinema");

    // ارسال تصویر با کپشن جدید به کانال مقصد
    bot.sendPhoto(DEST_CHANNEL_ID, photo, {caption: newCaption})
        .then(() => {
            // ارسال تصویر به شما
            bot.sendPhoto(YOUR_CHAT_ID, photo, {caption: newCaption});
            // ارسال تصویر به ربات
            bot.sendPhoto(BOT_ID, photo, {caption: newCaption});
            bot.sendMessage(chatId, "کپشن تصویر تغییر کرد و به کانال مقصد، ربات و شما ارسال شد.");
        })
        .catch(error => {
            bot.sendMessage(chatId, "خطا در ارسال تصویر به کانال مقصد.");
        });
});

// دستور برای دریافت آیدی مبدا و مقصد به صورت سفارشی
bot.onText(/\/move (\S+) (\S+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const sourceId = match[1];
    const destId = match[2];

    bot.sendMessage(chatId, `آیدی ${sourceId} به ${destId} تغییر داده شد.`);

    // ارسال به کانال مقصد
    bot.sendMessage(DEST_CHANNEL_ID, `آیدی ${sourceId} به ${destId} تغییر داده شد.`);
});
