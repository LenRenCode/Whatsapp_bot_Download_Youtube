# WA Media Bot

A WhatsApp bot (using [Baileys](https://github.com/WhiskeySockets/Baileys)) that
downloads video (up to 1080p) or audio from a link sent in chat, using `yt-dlp`.

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
cd wa-media-bot
npm install
node index.js
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
  `utils/downloader.js`) or trimming the video.
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

## Project structure

```
wa-media-bot/
├── index.js              # Bot entry point (connection + command handling)
├── utils/
│   └── downloader.js     # yt-dlp wrappers for video/audio download
├── package.json
└── README.md
```
