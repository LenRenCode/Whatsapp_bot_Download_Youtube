# WhatsApp YouTube Media Bot

A WhatsApp bot and local-network web app for downloading video or audio from
supported links using `yt-dlp`. The WhatsApp integration uses
[Baileys](https://github.com/WhiskeySockets/Baileys).

## Requirements

- Node.js 18 or newer
- `yt-dlp` installed and available in your system PATH
  - macOS: `brew install yt-dlp`
  - Windows: `winget install yt-dlp` (or download the .exe and add it to PATH)
  - Linux: `pip install -U yt-dlp` or your package manager
- `ffmpeg` installed and available in PATH (needed to merge video+audio and
  convert to mp3)
  - macOS: `brew install ffmpeg`
  - Windows: `winget install ffmpeg`
  - Linux: `apt install ffmpeg` (or your package manager)

## Setup

```bash
cd Whatsapp_bot_Download_Youtube
npm install
node Index.js
```

A QR code will print in your terminal. Open WhatsApp on your phone →
**Settings → Linked Devices → Link a Device**, and scan it. Once connected,
the bot stays logged in (session data is saved to the `auth_info` folder) —
you won't need to scan again unless you delete that folder or log out.

## Usage

Send these commands from a chat the bot is part of (a group, or by messaging
its own number from a linked device / another number):

```
.video <link>
.audio <link>
.menu
```

Example:

```
.video https://www.youtube.com/watch?v=example
.audio https://www.youtube.com/watch?v=example
```

- `.video` downloads the best available quality up to 1080p and merges it to
  a single `.mp4`.
- `.audio` extracts just the audio track and converts it to `.mp3`.

## Notes and limitations

- **File size**: WhatsApp has practical media size limits. Very long or
  high-bitrate 1080p videos may download fine but fail to send. If that
  happens, consider capping resolution lower (edit the `-f` selector in
  `utils/Downloader.js`) or trimming the video.
- **Sources**: `yt-dlp` supports YouTube and many other sites. Whether a given
  link works depends on that site's structure and yt-dlp's current support
  for it — keep `yt-dlp` updated (`pip install -U yt-dlp` or `yt-dlp -U`)
  since sites change often.
- **Copyright / Terms of Service**: only download content you own, have
  permission for, or that's otherwise permitted (e.g. Creative Commons,
  content explicitly downloadable under the platform's terms). Downloading
  copyrighted material without authorization can violate the source
  platform's terms and copyright law in many jurisdictions — that
  responsibility is on however this bot is used.
- **This uses Baileys**, an unofficial WhatsApp Web protocol implementation,
  not the official WhatsApp Business API. It's widely used for personal
  projects, but be aware unofficial clients carry some risk of account
  restrictions if used for high-volume or spammy behavior.

## Local network web version

There's also a small web app that does the same downloading, but through a
browser instead of WhatsApp — and it keeps a library you can stream from any
device on your Wi-Fi/LAN (phone, tablet, smart TV browser, etc.), not just
the computer running it.

### Run it

```bash
npm install
node Server.js
```

The terminal will print two links:

```
✅ On this computer:        http://localhost:3000
✅ From other LAN devices:  http://192.168.x.x:3000
```

Open the first link on the same machine, or the second link from any other
device connected to the **same Wi-Fi/router**. Paste a link, pick Video or
Audio, and hit Download — it'll show up in the library below with a built-in
player you can stream from (seeking/scrubbing works normally).

You can run the WhatsApp bot (`node index.js`) and the web server
(`node server.js`) at the same time, in two separate terminals — they don't
interfere with each other.

### Local-only by design

The server checks each request's IP and rejects anything outside private
network ranges (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`, `localhost`), so
it won't respond even if a router happens to expose the port externally.
That said, on the LAN itself there's no login — anyone on the same
Wi-Fi/network can open the page. If that network is shared with people you
don't trust (e.g. shared/public Wi-Fi), don't run this there, or add basic
authentication (e.g. the `express-basic-auth` package) in front of the
routes in `server.js`.

## Project structure

```
Whatsapp_bot_Download_Youtube/
├── index.js              # WhatsApp bot entry point
├── server.js             # Local-network web server (download + stream)
├── public/                # Web frontend (served by server.js)
│   ├── Index.html
│   ├── Style.css
│   └── App.js
├── downloads/             # Created automatically; stores web-downloaded media
├── utils/
│   └── Downloader.js      # yt-dlp wrappers for video and audio
├── package.json
└── README.md
```
