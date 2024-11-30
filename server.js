const TelegramBot = require('node-telegram-bot-api');

// توکن ربات تلگرام
const token = '7300821157:AAFpqNZQqznNqf74O-gVDDhQHCdgzv4X8pY';
const bot = new TelegramBot(token, { polling: true });

// دکمه‌ها و آیدی‌های مبدا و مقصد
const mappings = {
  "ایرانی": {
    source_id: "@MrMoovie",
    dest_id: "@FILmoseriyalerooz_bot"
  },
  "خارجی": {
    source_id: "@towfilm",
    dest_id: "@GlobCinema"
  }
};

// ذخیره آیدی‌ها برای کاربران
const userMappings = {};

// اموجی‌های مرتبط با ژانرها
const genreEmojis = {
  "#کمدی": "😊",
  "#جنایی": "🔍",
  "#درام": "💞",
  "#ترسناک": "👻",
  "#هیجان_انگیز": "🔥",
  "#اکشن": "⚡",
  "#فانتزی": "✨",
  "#عاشقانه": "💖",
  "#مستند": "🎥",
  "#معمایی": "🕵️‍♂️",
  "#ورزشی": "🏋️",
  "#جنگی": "⚔️",
  "#نوآر": "🕴️",
  "#موزیکال": "🎤",
  "#ماجراجویی": "🏞️",
  "#علمی_تخیلی": "🌌",
  "#رازآلود": "🕶️",
  "#وسترن": "🤠",
  "#بیوگرافی": "🎬"
};

// تابع استخراج نام از کپشن
function extractNameFromCaption(caption) {
  let name = "";

  // استخراج نام سریال
  const seriesMatch = caption.match(/≻\s?([^⭐️]+)/);
  if (seriesMatch) {
    name = seriesMatch[1].trim();
  }

  // استخراج سال ساخت
  const yearMatch = caption.match(/\d{4}/);
  if (yearMatch) {
    name += ` (${yearMatch[0]})`;  // اضافه کردن سال ساخت
  }

  // استخراج کشورها (اگر وجود داشته باشند)
  const countryMatch = caption.match(/[\u0627-\u0646\u0628\u062C\u062F\u0632\u0633\u0641\u0642\u0644\u0645]+/g);
  if (countryMatch && countryMatch.length >= 2) {
    name += ` ${countryMatch[0].slice(0, 2)}🇺🇸${countryMatch[1].slice(0, 2)}🇨🇱`; // اگر دو کشور شناسایی شود
  }

  // استخراج ژانرها
  const genreMatch = caption.match(/#\w+/g);
  if (genreMatch) {
    genreMatch.forEach(genre => {
      if (genreEmojis[genre]) {
        name += ` ${genreEmojis[genre]}`;  // اضافه کردن اموجی ژانر
      }
    });
  }

  return name;
}

// فرمان /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "ایرانی", callback_data: "ایرانی" },
          { text: "خارجی", callback_data: "خارجی" }
        ],
        [
          { text: "انتخاب آیدی‌ها", callback_data: "انتخاب آیدی‌ها" },
          { text: "تغییر نام", callback_data: "تغییر نام" }
        ]
      ]
    }
  };

  // دکمه غیر شیشه‌ای برای شروع
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

  // اگر انتخاب شده دکمه "ایرانی" یا "خارجی" باشد
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

  // اگر کاربر "تغییر نام" را انتخاب کند
  if (selectedOption === "تغییر نام") {
    bot.sendMessage(chatId, "لطفاً کپشن مورد نظر خود را ارسال کنید:");
    bot.once('message', (msg) => {
      const caption = msg.text;
      const newName = extractNameFromCaption(caption);
      bot.sendMessage(chatId, `نام جدید دکمه به این صورت خواهد بود: ${newName}`);
    });
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
