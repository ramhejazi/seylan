const app = require('express')();
const repens = require('repens');
const cache = require('./cache');
const fs = require('fs');
const { join } = require('path');
const { file_exists, execute } = require('./utils');
const stream = require('./stream');
const debounce = require('lodash.debounce');
const app_logger = repens.spawn('seylan');
const get_playlist = require('./get_playlist');
const channels_path = join(process.env.HOME, '.config/seylan/channels.json');
const stream_log = repens.spawn('stream');

const PROXY = process.env.SEYLAN_PROXY;
const PORT = process.env.SEYLAN_PORT || 7777;
let ITEMS = [];
let LAST_STREAM;

/* Make express return the IP on request object */
app.set('trust proxy', true);
app.get('/get_stream_url', async (req, res, next) => {
    const url = req.query.url;
    try {
        const stream_url = await cache.get_stream_url(url, '');
        res.json(stream_url);
    } catch (e) {
        app_logger.error(`could not get formats for url "${url}"`);
        next(e);
    }
});

app.get('/get_playlist', (req, res) => {
    res.setHeader('Content-type', 'application/octet-stream');
    res.setHeader('Content-disposition', 'attachment; filename=playlist.m3u');
    const playlist = get_playlist(req.hostname || '127.0.0.1', PORT, ITEMS);
    res.send(playlist);
});

app.get('/stream', async (req, res) => {
    const { url, title, streamer } = req.query;
    const logger = stream_log.spawn(title || 'unset');
    let state = 'open';
    let this_stream;

    logger.info('starting...');
    logger.info('host is', new URL(url).host);

    req.on('close', () => {
        logger.warn('stream closed.');
        state = 'closed';
        if (this_stream) this_stream.tree_kill();
    });

    try {
        if (streamer === 'yt-dlp') {
            logger.warn('stream is handled by yt-dlp');
            this_stream = stream(url, PROXY, logger, 'yt-dlp');
        } else {
            const stream_url = await cache.get_stream_url(url, title);
            this_stream = stream(stream_url, PROXY, logger, 'ffmpeg');
        }
        LAST_STREAM = this_stream;
    } catch (e) {
        let msg = `could not stream url "${url}"`;
        logger.error(msg);
        logger.error(e.stack);
        try {
            res.status(500).send(msg);
            return;
        } catch (e) {
            logger.error(
                'could not end the http request gracefully. the error is',
                e.message
            );
        }
    }

    LAST_STREAM.stdout.on('data', () => {
        if (state !== 'open') {
            this_stream.tree_kill();
        }
    });
    LAST_STREAM.stderr.on('data', (data) => {
        data = data.toString();
        logger.error(data);
        if (data.startsWith('Error opening input files')) {
            cache.remove_stream_cache(url);
        }
        if (data.startsWith('frame')) {
            logger.info('ffmpeg', data);
        }
    });
    LAST_STREAM.stdout.pipe(res);
});

async function get_items() {
    if (await file_exists(channels_path)) {
        const ret = await fs.promises.readFile(channels_path);
        try {
            const items = JSON.parse(ret);
            return Object.keys(items).map((title) => {
                return {
                    title,
                    host: new URL(items[title]).hostname,
                    url: items[title],
                };
            });
        } catch (e) {
            app_logger.error(
                'could read channels.file, the error is:',
                e.message
            );
            app_logger.error(e.stack);
        }
    } else {
        app_logger.warn(`no channels list found on ${channels_path}`);
    }
    return [];
}

function watch_conf(callback) {
    fs.watch(join(process.env.HOME, '.config/seylan'), debounce(callback, 200));
}

async function __cache_reset() {
    ITEMS = await get_items();
    cache.start(ITEMS, PROXY);
}

/**
 * Create list of local networks
 * @returns {promise}
 */
function set_ip_addrs() {
    return execute('ip -4 -j a')
        .then((data) => {
            const result = JSON.parse(data);
            NETWORKS = result
                .filter((el) => {
                    return el.upperstate !== 'DOWN';
                })
                .map((el) => {
                    return el.addr_info[0].local;
                });
        })
        .catch((e) => {
            app_logger.error(
                `could not get local networks. the error is ${e.message}`
            );
            NETWORKS = ['127.0.0.1'];
        });
}

async function start() {
    await __cache_reset();
    set_ip_addrs();
    watch_conf(async () => {
        app_logger
            .spawn('watch')
            .warn(`channels file on "${channels_path}" changed.`);
        __cache_reset();
    });
    app.listen(PORT, () => {
        app_logger.success(`listening on port ${PORT}`);
    });
}

module.exports = { start };
