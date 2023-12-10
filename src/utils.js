const crypto = require('crypto');
const {promises: fs, constants} = require('fs');
const {exec} = require('child_process');

/**
 * Check whether file exists or not
 * @param {any} file/dir path
 * @returns {promise}
 */
function file_exists(path_name) {
    return fs
        .access(path_name, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);
}

/**
 * Sort an array of objects by a key
 * @param {array} array
 * @param {string} key
 * @returns {array} sorted array
 */
function sort_by_key(array, key) {
    return array.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        return x < y ? -1 : x > y ? 1 : 0;
    });
}

/**
 * Generate md5 hash for a string
 * @param {string} str
 * @returns {string} md5 hash
 */
function get_hash(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Get diff between 2 dates
 * returns the difference as an array of date components: [day, hours, months, seconds]
 * @param {number} ms
 * @returns {array} array of diff elements
 */
function get_time_diff(ms) {
    let seconds = ms / 1000;
    let d = Math.floor(seconds / (3600 * 24));
    let h = Math.floor((seconds % (3600 * 24)) / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    return [d, h, m, s];
}

/**
 * Convert the diff returned from get_time_diff and humanize it
 * @param {any} items
 * @returns {string} the diff in string
 */
function to_time_ago(items) {
    let criteria = ['day', 'hour', 'minute', 'seconds'];
    for (var i = 0; i < criteria.length; i++) {
        let item = items[i];
        if (item > 0) {
            let type = criteria[i];
            return (
                'about ' +
                item +
                ' ' +
                (item === 1 ? type : type + 's') +
                ' ago.'
            );
        }
    }
}

/**
 * Promisified child_process.exec. Resolves with stdout and rejects with stderr.
 * @param {any} string
 * @returns {any}
 */
function execute(cmd) {
    return new Promise(function (resolve, reject) {
        exec(
            cmd,
            {maxBuffer: 1024 * 5000, shell: '/bin/bash'},
            function (err, stdout, stderr) {
                if (err != null) reject(Object.assign(err, {stderr}));
                else resolve(String(stdout));
            }
        );
    });
}

/**
 * Ensure directory exists
 * @param {string} dir
 * @returns {}
 */
function ensure_dir(dir) {
    return fs.access(dir, constants.F_OK).catch(() => {
        return fs.mkdir(dir, {recursive: true});
    });
}

module.exports = {
    ensure_dir,
    sort_by_key,
    execute,
    to_time_ago,
    file_exists,
    get_hash,
    get_time_diff,
};
