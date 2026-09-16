const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { getInfo, downloadVideo, downloadAudio } = require('./utils/downloader');

const app = express();
const PORT = process.env.PORT || 3000;
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
const LIBRARY_FILE = path.join(DOWNLOAD_DIR, 'library.json');

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);
if (!fs.existsSync(LIBRARY_FILE)) fs.writeFileSync(LIBRARY_FILE, '[]');

function loadLibrary() {
  try {
    return JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveLibrary(lib) {
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify(lib, null, 2));
}

/**
 * Only allow requests coming from private/local network ranges
 * (or the machine itself). This keeps the site off the public internet
 * even if the machine's firewall/router is misconfigured.
 */
function isPrivateIp(rawIp) {
  const ip = (rawIp || '').replace('::ffff:', '');
  if (ip === '::1' || ip === '127.0.0.1') return true;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

app.use((req, res, next) => {
  if (!isPrivateIp(req.socket.remoteAddress)) {
    return res.status(403).send('Forbidden: this server only accepts local-network connections.');
  }
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// express.static supports HTTP Range requests out of the box, so video/audio
// seeking works correctly when streamed from here.
app.use('/media', express.static(DOWNLOAD_DIR));

app.get('/api/library', (req, res) => {
  res.json(loadLibrary());
});

app.post('/api/download', async (req, res) => {
  const { url, type } = req.body || {};
  if (!url || !type) {
    return res.status(400).json({ error: 'url and type are required' });
  }
  if (type !== 'video' && type !== 'audio') {
    return res.status(400).json({ error: 'type must be "video" or "audio"' });
  }

  try {
    const info = await getInfo(url).catch(() => null);
    const title = info?.title || 'Unknown title';

    const filePath =
      type === 'video'
        ? await downloadVideo(url, DOWNLOAD_DIR)
        : await downloadAudio(url, DOWNLOAD_DIR);

    const filename = path.basename(filePath);
    const entry = {
      id: filename,
      title,
      type,
      filename,
      addedAt: new Date().toISOString(),
    };

    const lib = loadLibrary();
    lib.unshift(entry);
    saveLibrary(lib);

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/library/:id', (req, res) => {
  const lib = loadLibrary();
  const entry = lib.find((e) => e.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'not found' });

  const filePath = path.join(DOWNLOAD_DIR, entry.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  saveLibrary(lib.filter((e) => e.id !== req.params.id));
  res.json({ success: true });
});

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
}

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log(`✅ On this computer:        http://localhost:${PORT}`);
  if (ip) {
    console.log(`✅ From other LAN devices:  http://${ip}:${PORT}`);
  } else {
    console.log('Could not detect a LAN IP — make sure this device is on Wi-Fi/Ethernet.');
  }
});