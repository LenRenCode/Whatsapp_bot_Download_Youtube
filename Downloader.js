const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Runs the yt-dlp binary with the given args.
 * Requires yt-dlp and ffmpeg to be installed and available in PATH.
 */
function run(args) {
  return new Promise((resolve, reject) => {
    execFile('yt-dlp', args, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout);
    });
  });
}

/**
 * Downloads a video at the best available quality up to 1080p, merged as mp4.
 */
function downloadVideo(url, outDir) {
  return new Promise(async (resolve, reject) => {
    const id = crypto.randomBytes(6).toString('hex');
    const outputTemplate = path.join(outDir, `${id}.%(ext)s`);
    try {
      await run([
        url,
        '-f',
        'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best[height<=1080]',
        '--merge-output-format', 'mp4',
        '-o', outputTemplate,
        '--no-playlist',
      ]);
      const finalPath = path.join(outDir, `${id}.mp4`);
      if (!fs.existsSync(finalPath)) {
        return reject(new Error('Download finished but no file was produced (1080p format may be unavailable for this link).'));
      }
      resolve(finalPath);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Extracts audio only, converted to mp3 at the best available quality.
 */
function downloadAudio(url, outDir) {
  return new Promise(async (resolve, reject) => {
    const id = crypto.randomBytes(6).toString('hex');
    const outputTemplate = path.join(outDir, `${id}.%(ext)s`);
    try {
      await run([
        url,
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', outputTemplate,
        '--no-playlist',
      ]);
      const finalPath = path.join(outDir, `${id}.mp3`);
      if (!fs.existsSync(finalPath)) {
        return reject(new Error('Audio extraction failed.'));
      }
      resolve(finalPath);
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { downloadVideo, downloadAudio };