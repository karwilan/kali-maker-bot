require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
app.use(express.json());

const TRACKS = new Map();

// ==================== START COMMAND ====================
bot.command('start', async (ctx) => {
    const text = `🔥 *KALI MAKER BOT - Device Monitor*\n\nPilih menu di bawah:`;

    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📍 Device Monitor', 'device_monitor')]
    ]);

    await ctx.replyWithMarkdown(text, keyboard);
});

// ==================== DEVICE MONITOR ====================
bot.action('device_monitor', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        `📍 *Kirim URL Website Target*\n\nContoh: https://example.com`,
        Markup.inlineKeyboard([[Markup.button.callback('🔙 Kembali', 'back_menu')]])
    );
});

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url.startsWith('http')) return ctx.reply('❌ Masukkan URL yang valid!');

    const trackId = Math.random().toString(36).substring(2, 10);
    const trackUrl = `https://\( {process.env.RAILWAY_STATIC_URL || 'domain-kamu'}/track/ \){trackId}`;

    TRACKS.set(trackId, { url, data: [] });

    await ctx.reply(
        `✅ *Link Tracking Siap!*\n\nKirim link ini ke target:\n\`${trackUrl}\``,
        { parse_mode: 'Markdown' }
    );
});

// ==================== TRACKING SERVER ====================
app.get('/track/:id', (req, res) => {
    const track = TRACKS.get(req.params.id);
    if (!track) return res.send('Link expired.');

    const html = `
    <script>
        fetch('/capture/${req.params.id}', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                ip: 'Detected',
                device: navigator.userAgent,
                screen: screen.width + 'x' + screen.height,
                language: navigator.language
            })
        });
        window.location.href = "${track.url}";
    </script>`;
    res.send(html);
});

app.post('/capture/:id', (req, res) => {
    const data = req.body;
    console.log('📍 Data Captured:', data);
    bot.telegram.sendMessage(process.env.OWNER_ID, 
        `📍 *Device Captured*\n\n${JSON.stringify(data, null, 2)}`
    );
    res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Kali Maker Bot Running ✅'));

// ==================== LAINNYA ====================
bot.action('back_menu', (ctx) => ctx.editMessageText('Kembali ke menu utama...', Markup.inlineKeyboard([[Markup.button.callback('📍 Device Monitor', 'device_monitor')]])));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot running on port ${PORT}`));

bot.launch();
console.log('🤖 Kali Maker Device Monitor Bot Started!');
