# seylan
Fast and simple audio and video streamer which utilitizes 
`yt-dlp` and `ffmpeg` for re-streaming media streams. 

`seylan` works as an accelerator middleware between the source of media streams and media player.

Regular HLS streams found in m3u files, and all the sources that yt-dlp supports, 
including youtube videos and twitch streams, are supported.

## Why
There are many great softwares available for re-streaming and watching IPTV streams (like `streamlink`, `tvheadend`, `mpv` and `vlc`), 
but if you happen to use these programs for playing you will notice that for some streams there is 
a long delay before stream starts to play. 
It's because some servers are slow to produce/serve m3u files and it takes time
to analyze the available formats and this makes switching between the streams 
an annoying experience, especially on slow networks.

`seylan` tries to facilitate this problem 
by getting the streams' metadata and caching formats. 

## Dependencies
- **`node`** runtime: `seylan` is a node.js program
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

After installating the package, add the global prefix directory of npm or yarn to your `PATH` environment variable.
If you are using `npm`, command `npm get prefix` prints the current `npm` prefix. 

## Configuration
`seylan` uses environment variables for configuration. 
- **`SEYLAN_PORT`**: port for seylan server. default is 7777
- **`SEYLAN_CACHE_INTERVAL`**: interval for stream caching in milliseconds. default is 300000 (5 minutes)
- **`SEYLAN_PROXY`**: proxy to be used for `yt-dlp` and `ffmpeg`

## Channels
`seylan` optionally reads `channels.json` file for prefeching metadata and creating a playlist. 
The file should be created in `$HOME/.config/seylan/channels.json`. 

**Example**
```json
{
    "Youtube Stream": "https://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID",
    "Twitch Stream": "https://www.twitch.tv/CHANNEL_ID"
}
```

`seylan` watches the `channels.json` file and recreates the 
playlist on the fly. You can use [https://github.com/iptv-org/iptv](https://github.com/iptv-org/iptv) 
for finding stream links.

## Caching
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
$ mpv "http://127.0.0.1:7777/stream\?url=URI_ENCODED_URL"
```

## systemd integration (Linux)
One way of running seylan on system startup is creating a systemd unit file. Create a file
in `$HOME/.config/systemd/user/seylan.service` with following content:

```
[Unit]
Description=Seylan
After=network.target

[Service]
# Environment=SEYLAN_PORT=7777
# Environment=SEYLAN_PROXY=http://localhost:3333
ExecStart=/path/to/seylan

Restart=always

[Install]
WantedBy=default.target
```

And enable the unit:

```bash
$ systemctl --user daemon-reload
$ systemctl --user enable --now seylan
```

## License
Licensed under MIT.
