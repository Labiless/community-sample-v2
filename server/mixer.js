// mixer-files.js
const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');
const { path: ffmpegPath } = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

function mixFilesToWav(inputPaths, opts = {}) {
    const { channels = 2, sampleRate = 48000, normalize = false } = opts;

    if (!inputPaths?.length) {
        return Promise.reject(new Error('Nessun file da mixare'));
    }

    const inputsN = inputPaths.length;
    const amix = `amix=inputs=${inputsN}:duration=longest${normalize ? ':normalize=1' : ''}`;

    return new Promise((resolve, reject) => {
        const cmd = ffmpeg();

        cmd.on('start', (commandLine) => {
            console.log('FFmpeg cmd:', commandLine);
        });

        inputPaths.forEach(p => cmd.input(p));

        const outStream = new PassThrough();
        const chunks = [];
        outStream.on('data', c => chunks.push(c));

        cmd
            .audioChannels(channels)        // 1 = mono (usa 2 per stereo)
            .audioFrequency(sampleRate)     // uniforma il sample rate
            .complexFilter([amix])          // sovrappone le tracce
            .format('wav')                  // output WAV
            .on('error', reject)
            .on('end', () => resolve(Buffer.concat(chunks)))
            .pipe(outStream, { end: true });
    });
}

module.exports = { mixFilesToWav };