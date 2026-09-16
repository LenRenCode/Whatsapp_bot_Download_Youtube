const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { downloadVideo, downloadAudio } = require('./utils/downloader');

const PREFIX = '.';
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// WhatsApp media has practical size limits (varies, roughly ~64-100MB).
// Very long/high-bitrate videos may fail to send even if the download succeeds.

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('Scan this QR code with WhatsApp > Linked Devices:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('✅ Bot connected to WhatsApp');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const body =
      msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    if (!body.startsWith(PREFIX)) return;

    const [rawCmd, ...args] = body.slice(PREFIX.length).trim().split(/\s+/);
    const cmd = rawCmd.toLowerCase();
    const url = args[0];

    try {
      if (cmd === 'video' || cmd === 'ytmp4') {
        if (!url) {
          return sock.sendMessage(from, { text: `Usage: ${PREFIX}video <link>` });
        }
        await sock.sendMessage(from, { text: '⏳ Downloading video (up to 1080p)...' });
        const filePath = await downloadVideo(url, TEMP_DIR);
        await sock.sendMessage(from, {
          video: fs.readFileSync(filePath),
          mimetype: 'video/mp4',
          caption: '✅ Here is your video',
        });
        fs.unlinkSync(filePath);
      } else if (cmd === 'audio' || cmd === 'ytmp3' || cmd === 'music') {
        if (!url) {
          return sock.sendMessage(from, { text: `Usage: ${PREFIX}audio <link>` });
        }
        await sock.sendMessage(from, { text: '⏳ Downloading audio...' });
        const filePath = await downloadAudio(url, TEMP_DIR);
        await sock.sendMessage(from, {
          audio: fs.readFileSync(filePath),
          mimetype: 'audio/mpeg',
          ptt: false,
        });
        fs.unlinkSync(filePath);
      } else if (cmd === 'menu' || cmd === 'help') {
        await sock.sendMessage(from, {
          text:
            `*Media Bot*\n\n` +
            `${PREFIX}video <link> — download video (max 1080p)\n` +
            `${PREFIX}audio <link> — download audio (mp3)\n`,
        });
      }
    } catch (err) {
      console.error(err);
      await sock.sendMessage(from, { text: `❌ Error: ${err.message}` });
    }
  });
}

startBot();