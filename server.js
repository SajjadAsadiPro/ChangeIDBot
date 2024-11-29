const TelegramBot = require('node-telegram-bot-api');

// توکن ربات تلگرام
const token = '7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY';
const bot = new TelegramBot(token, { polling: true });

// دکمه‌ها و آیدی‌های مبدا و مقصد
const mappings = {
  "مستر مووی": {
    source_id: "@MrMoovie",
    dest_id: "@FILmoseriyalerooz_bot"
  },
  "اخبار فیلم و سریال روز": {
    source_id: "@towfilm",
    dest_id: "@GlobCinema"
  }
};

// ذخیره آیدی‌ها برای کاربران
const userMappings = {};

// فرمان /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "مستر مووی", callback_data: "مستر مووی" },
          { text: "اخبار فیلم و سریال روز", callback_data: "اخبار فیلم و سریال روز" }
        ],
        [
          { text: "انتخاب آیدی‌ها", callback_data: "انتخاب آیدی‌ها" },
          { text: "تغییر کاور", callback_data: "change_cover" }
        ]
      ]
    }
  };

  // دکمه غیر شیشه‌ای برای شروع (اضافه کردن به گزینه‌های منو)
  const startOptions = {
    reply_markup: {
      keyboard: [
        [
          { text: "/start" }
        ]
      ],
      resize_keyboard: true, // برای تنظیم اندازه دکمه‌ها
      one_time_keyboard: true // دکمه فقط یکبار ظاهر شود
    }
  };

  bot.sendMessage(chatId, "سلام! لطفاً یک گزینه انتخاب کنید:", options);
  bot.sendMessage(chatId, "برای شروع دوباره /start را بزنید:", startOptions);
});

// هندلر برای انتخاب دکمه
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const selectedOption = query.data;

  // اگر انتخاب شده دکمه "مستر مووی" یا "اخبار فیلم و سریال روز" باشد
  if (mappings[selectedOption]) {
    const { source_id, dest_id } = mappings[selectedOption];
    
    // ذخیره آیدی‌های مبدا و مقصد برای کاربر
    userMappings[chatId] = { source_id, dest_id };

    bot.sendMessage(chatId, `آیدی مبدا: ${source_id} با موفقیت ذخیره شد.`);
    bot.sendMessage(chatId, `آیدی مقصد: ${dest_id} با موفقیت ذخیره شد.`);

    // تایید و آماده‌سازی برای تغییرات در پیام‌ها
    bot.sendMessage(chatId, "حالا هر پیام یا رسانه‌ای که ارسال کنید، آیدی مبدا با آیدی مقصد جایگزین خواهد شد.");
  }

  // اگر کاربر "انتخاب آیدی‌ها" را انتخاب کند
  if (selectedOption === "انتخاب آیدی‌ها") {
    bot.sendMessage(chatId, "لطفاً آیدی مبدا را وارد کنید:");
    bot.once('message', (msg) => {
      const source_id = msg.text;
      bot.sendMessage(chatId, "حالا لطفاً آیدی مقصد را وارد کنید:");
      
      bot.once('message', (msg) => {
        const dest_id = msg.text;

        // ذخیره آیدی‌ها برای کاربر
        userMappings[chatId] = { source_id, dest_id };

        bot.sendMessage(chatId, `آیدی مبدا: ${source_id} با موفقیت ذخیره شد.`);
        bot.sendMessage(chatId, `آیدی مقصد: ${dest_id} با موفقیت ذخیره شد.`);
        bot.sendMessage(chatId, "حالا هر پیام یا رسانه‌ای که ارسال کنید، آیدی مبدا با آیدی مقصد جایگزین خواهد شد.");
      });
    });
  }

  // اگر کاربر "تغییر کاور" را انتخاب کند
  if (selectedOption === "change_cover") {
    bot.sendMessage(chatId, "لطفاً تصویر کاور را ارسال کنید تا تغییرات لازم اعمال شود.");
  }
});

// پردازش تغییر کاور
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  let caption = msg.caption || '';

  // بررسی برای وجود "➰ لینک دانلود" و "کلیک کنید"
  if (caption.includes("➰ لینک دانلود") && caption.includes("کلیک کنید")) {
    // حذف متن بین "➰ لینک دانلود" و "کلیک کنید"
    caption = caption.replace(/➰ لینک دانلود.*?کلیک کنید/g, '');
    // تغییر t.me/towfilm به @GlobCinema
    caption = caption.replace("🆔 t.me/towfilm", "🆔 t.me/GlobCinema");
  }

  // ارسال تصویر با کپشن تغییر یافته
  bot.sendPhoto(chatId, msg.photo[0].file_id, { caption });

  // ارسال تصویر به کانال مقصد
  if (userMappings[chatId]) {
    const { source_id, dest_id } = userMappings[chatId];
    // ارسال به کانال مقصد
    bot.sendPhoto('@Sajjjad_asadi', msg.photo[0].file_id, { caption });
  }
});

// پردازش پیام‌های متنی
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text !== '/start') {
    // بررسی اینکه آیدی مبدا در متن وجود دارد
    let messageText = msg.text;
    if (userMappings[chatId]) {
      const { source_id, dest_id } = userMappings[chatId];
      if (messageText.includes(source_id)) {
        messageText = messageText.replace(source_id, dest_id);
      }
      
      // ارسال پیام تغییر یافته به کانال مقصد
      bot.sendMessage(chatId, messageText);
    }
  }
});

// پردازش تصاویر
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  let caption = msg.caption;

  if (userMappings[chatId]) {
    const { source_id, dest_id } = userMappings[chatId];
    if (caption && caption.includes(source_id)) {
      caption = caption.replace(source_id, dest_id);
    }
  }

  // ارسال تصویر با کپشن تغییر یافته
  bot.sendPhoto(chatId, msg.photo[0].file_id, { caption });
});

// پردازش ویدیو
bot.on('video', (msg) => {
  const chatId = msg.chat.id;
  let caption = msg.caption;

  if (userMappings[chatId]) {
    const { source_id, dest_id } = userMappings[chatId];
    if (caption && caption.includes(source_id)) {
      caption = caption.replace(source_id, dest_id);
    }
  }

  // ارسال ویدیو با کپشن تغییر یافته
  bot.sendVideo(chatId, msg.video.file_id, { caption });
});
