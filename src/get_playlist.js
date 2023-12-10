const url = require('url');

function get_domain_name(addr) {
    let parsed_url = url.parse(addr);
    let name = parsed_url.hostname
        .split('.')
        .reverse()
        .slice(1)
        .find((el) => {
            if (['com', 'co', 'uk'].includes(el)) {
                return false;
            } else if (/^\d+$/.test(el)) {
                return false;
            }
            return true;
        });
    if (!name) return [];
    return [name[0].toUpperCase() + name.slice(1), parsed_url.hostname];
}

function get_playlist(ip, port, channels) {
    const server_addr = `http://${ip}:${port}/stream`;
    const lines = ['#EXTM3U'];
    channels.forEach((channel) => {
        let {url, title} = channel;
        let [domain] = get_domain_name(url);
        let resolved_url =
            server_addr + '?url=' + encodeURI(url) + '&title=' + title;
        lines.push(`#EXTINF:-1,${title.trim()} (${domain})`);
        lines.push(resolved_url);
    });
    return lines.join('\n');
}

module.exports = get_playlist;

