# Station and Channel Plan

## 1. azura-one

- Type: automated music station
- Format: hits / mainstream / promo rotation
- Suggested bitrate: 128 kbps AAC or 192 kbps MP3
- Playlists:
  - `power-rotation`
  - `recurrents`
  - `gold`
  - `station-ids`
  - `sponsored-spots`
- Live input: optional for guest DJs and takeover shows

## 2. azura-chill

- Type: automated curated station
- Format: chillout / lo-fi / ambient / focus
- Suggested bitrate: 128 kbps AAC
- Playlists:
  - `lofi-core`
  - `ambient-beds`
  - `night-rotation`
  - `sweepers`
- Live input: yes, for sunset sessions or specialty sets

## 3. azura-talk

- Type: speech-forward station
- Format: talk, interviews, news recaps, live programming
- Suggested bitrate: 64-96 kbps AAC mono/stereo depending on content
- Playlists:
  - `interview-reruns`
  - `news-beds`
  - `promos`
  - `show-openers`
- Live input: enabled by default for presenters and remote hosts

## Create the stations in AzuraCast

For each station set:

- a unique station name and short name
- base URL / public page slug
- AutoDJ enabled
- media storage and playlist folders
- at least one frontend broadcast mount
- one backend profile suitable for your codec and bitrate

## Live DJ setup

Enable for each station under station profile settings.

Recommended encoder settings:

- Codec: AAC when possible
- Sample rate: 44.1 kHz
- Bitrate: 128 kbps music, 64-96 kbps talk
- Server type: Icecast compatible source

Suggested clients:

- OBS Studio for video or more complex scenes
- BUTT for lightweight audio-only live input
- Mixxx for DJ-style sets

## Playlist strategy

Use playlist types intentionally:

- General Rotation for normal tracks
- Once per X songs for sweepers / IDs
- Once per X minutes for ad breaks or promos
- Scheduled playlists for programs and themed blocks
- Interrupting playlists for urgent inserts
