const { execute } = require('./utils.js');
const logger = require('repens').spawn('yt-dlp');

async function get_formats(url, title, proxy) {
    logger.log(`getting stream formats for url "${url}"`);
    const yt_instance = {
        title,
        url,
    };
    let proxy_flag = proxy ? `--proxy="${proxy}"` : '';
    let command = `yt-dlp ${proxy_flag} --dump-json "${url}"`;

    yt_instance.process = execute(command)
        .then((data) => {
            let response = JSON.parse(data);
            logger.success(`retrieved data for url "${url}"`);
            logger.success(`${response.formats.length} format(s) available.`);
            return response;
        })
    return yt_instance.process;
}

module.exports = get_formats;
