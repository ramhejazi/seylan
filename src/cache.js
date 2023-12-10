const repens = require('repens');
const { join } = require('path');
const get_formats = require('./get_formats');
const { promises: fs } = require('fs');
const { writeFile, readFile, stat } = fs;
const YT_URLS = ['www.youtube.com', 'youtube.com', 'youtu.be', 'www.youtu.be'];
const log_cacher = repens.spawn('cacher');

const {
    ensure_dir,
    file_exists,
    get_hash,
    get_time_diff,
    to_time_ago,
    sort_by_key,
} = require('./utils');

/* Cache directory path */
let CACHE_DIR;
let CACHE_INTERVAL_ID;
let CACHE_INTERVAL_PERIOD = process.env.SEYLAN_CACHE_INTERVAL || 10000;
let CURRENT_CACHE_INDEX = 0;
let YT_ITEMS = [];
let PROXY = process.env.SEYLAN_PROXY;

/**
 * Set youtube items 
 * @param {array} items  
 */
function __set_youtube_items (items) {
    YT_ITEMS = items.filter((el) => YT_URLS.includes(el.host));
}

/**
 * Get best format url
 * @param {array} formats 
 * @returns {string|undefined}
 */
function __get_best_format_url(formats = []) {
    sort_by_key(formats, 'height');
    const best_format = formats.reverse().find(format => {
        return format.container === 'mp4_dash';
    }) || formats.shift();
    if (best_format) {
        return best_format.url;
    }
}

/* Set dir for cache folder */
function __set_cache_dir() {
    let cache_dir = join(
        process.env.HOME,
        '.cache',
        'seylan'
    );
    CACHE_DIR = process.env.CACHE_DIR_PATH || cache_dir;
}

/**
 * Ensure cache directory exists
 * @returns {promise} 
 */
function __ensure_cache_dir() {
    __set_cache_dir();
    if (CACHE_DIR) return ensure_dir(CACHE_DIR);
}


/**
 * Get stream url and cache the result
 * @returns {string} 
 */
async function get_stream_url (url, title = 'unknown') {
    const logger = log_cacher.spawn(title);
    const hash = get_hash(url);
    const cache_path = join(CACHE_DIR, hash + '.json');
    const exists = await file_exists(cache_path);
    if (exists) {
        const stats = await stat(cache_path);
        const updatedDate = new Date(stats.mtimeMs);
        const rawTimeDiff = new Date() - updatedDate;
        const diffInHours = rawTimeDiff / 1000 / 60 / 60;
        const timeDiff = get_time_diff(rawTimeDiff);
        const timeago = to_time_ago(timeDiff);
        logger.log(`cache file exists. updated ${timeago}`);
        if (YT_URLS.includes(new URL(url).host) && diffInHours > 5) {
            logger.warn('cache is outdated. updating...');
        } else {
            return readFile(cache_path, 'utf-8');
        }
    } else {
        logger.warn('no cache found. retrieving...');
    }
    let data = await get_formats(url, title, PROXY);

    if (!data || !data.formats) {
        throw new Error('yt-dlp output does not have "formats" property.');
    }
    let stream_url = __get_best_format_url(data.formats);
    try {
        await writeFile(cache_path, stream_url);
        logger.success(
            `wrote stream data to cache file "${cache_path}" successfully.`
        );
    } catch (e) {
        logger.error(`could not write data to the cache file.`);
    }
    return stream_url;
}

/* 
  * Cache
*/
function __start_caching_items () {
    let logger = repens.spawn('cacher');
    clearInterval(CACHE_INTERVAL_ID);
    CURRENT_CACHE_INDEX = 0;
    if (YT_ITEMS.length === 0) return;
    CACHE_INTERVAL_ID = setInterval(async () => {
        let item = YT_ITEMS[CURRENT_CACHE_INDEX];
        let item_logger = logger.spawn(item.title || 'unset');
        if (!item) return;
        item_logger.log(`getting formats for item: "${item.url.trim()}". item ${CURRENT_CACHE_INDEX + 1}/${YT_ITEMS.length}`);
        try {
            await get_stream_url(item.url, item.title);
        } catch (e) {
            item_logger.error(
                `could not get formats for "${item.url}". the error is "${e.message}"`
            );
        }
        if (CURRENT_CACHE_INDEX === (YT_ITEMS.length - 1)) {
            CURRENT_CACHE_INDEX = 0;
            logger.info('checked all the youtube items. starting from beginning...');
        } else {
            CURRENT_CACHE_INDEX++;
        }
    }, CACHE_INTERVAL_PERIOD);
}

async function start(items) {
    __set_youtube_items(items);
    await __ensure_cache_dir();
    await __start_caching_items();
}

module.exports = { start, get_stream_url };
