# seylan
`seylan` is a small and fast video streamer which utilitizes 
`yt-dlp` and `ffmpeg` for re-streaming video streams. 

There are several options for re-streaming (`streamlink`, `tvheadend`) and watching IPTV streams (`mpv`, `vlc`), 
but if you happen to use these programs you will notice that there is 
a delay for certain streams. It's because some servers are slow to produce/serve m3u files and it takes time
to analyze the available formats and selecting the target format and this makes switching between the streams 
an annoying experience, especially on slow networks.

`seylan` tries to facilitate this problem 
by getting the streams' data and caching the target formats. 
The program uses `yt-dlp` for getting the available formats and `ffmpeg` for re-streaming.

## Dependencies
- **`node`**: `seylan` is a node.js program
- **`npm`**/**`yarn`**: node package managers
- **`yt-dlp`**: for getting available formats
- **`ffmpeg`**: for re-streaming

## Installation
via `npm`:
```bash
$ npm i -g seylan
```

via `yarn`:
```bash
$ yarn global add seylan
```

## Configuration
`seylan` uses environment variables for configuration. 
- **`SEYLAN_PORT`**: port for seylan server. default is 7777
- **`SEYLAN_CACHE_INTERVAL`**: interval for stream caching in milliseconds. default is 300000 (5 minutes)
- **`SEYLAN_PROXY`**: proxy to be used for `yt-dlp` and `ffmpeg`

## Channels
`seylan` optionally reads `channels.json` file for caching and creating a playlist. 
The file should be created in `$HOME/.config/seylan/channels.json`.

### Example
```json
{
    "Sky News": "https://www.youtube.com/watch?v=9Auq9mYxFEE",
    "CNN": "https://16live00.akamaized.net/CNN/index.m3u8"
}
```

`seylan` watches the `channels.json` file and recreates the 
playlist on the fly. You can use [https://github.com/iptv-org/iptv](https://github.com/iptv-org/iptv) 
for finding stream links.

## Caches
`seylan` creates a file in `$HOME/.cache/seylan` directory for each stream defined in `channels.json` file. 
As youtube stream formats get expired after several hours it updates the cache by using an interval.

## Usage

### Starting the server
```bash
$ SEYLAN_PORT=7777 seylan
```

### Getting and playing the playlist by using `mpv`
```bash
$ mpv --playlist=http://localhost:7777/get_playlist
```

### Playing a stream directly
```bash
$ mpv "http://127.0.0.1:7777/stream\?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ"
```

## License
Licensed under MIT.
