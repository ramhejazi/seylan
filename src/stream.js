const { spawn } = require('child_process');
const tree_kill = require('tree-kill');

function ffmpeg(url, proxy, logger) {
    let env = {};
    if (proxy) {
        logger.info('proxy is', proxy);
        env = { http_proxy: proxy, HTTP_PROXY: proxy };
    }
    return spawn(
        'ffmpeg',
        [
            '-i',
            url,
            '-vcodec',
            'copy',
            '-acodec',
            'copy',
            '-f',
            'mpegts',
            'pipe:1',
        ],
        { env }
    );
}

function yt_dlp(url, proxy = '', logger) {
    let env = {};
    if (proxy) {
        logger.info('proxy is', proxy);
        env = { https_proxy: proxy, http_proxy: proxy, HTTPS_PROXY: proxy, HTTP_PROXY: proxy};
    }
    return spawn('yt-dlp', [
        '--no-check-certificate',
        '--proxy',
        proxy,
        url,
        // '-f', 'bestvideo[height<=?1080]+bestaudio/best',
        '--concurrent-fragments', 20,
        '-o',
        '-',
    ], env);
}

/**
 * @param {string} url
 * @param {string|undefined} proxy
 * @param {object} instance of repens, logger utility
 */
function stream(url, proxy, logger, type = 'ffmpeg') {
    let stream;
    if (type === 'ffmpeg') {
        stream = ffmpeg(url, proxy, logger);
    } else {
        stream = yt_dlp(url, proxy, logger);
    }

    stream.tree_kill = function () {
        try {
            tree_kill(stream.pid);
        } catch (e) {
            logger.error(
                'ffmpeg: ',
                'could not kill previous running instance of ffmpeg. the error is',
                e.message
            );
        }
    };

    return stream;
}

module.exports = stream;
