# Chrome Live Input

This folder contains a local browser relay for broadcasting audio from a Chrome
tab or window into AzuraCast.

Recommended chain on Windows:

```text
Chrome tab audio -> local Node relay -> ffmpeg -> AzuraCast live input
```

The VB-Cable + BUTT workflow is still useful as a fallback, but the included
Node relay lets Chrome share tab audio directly from the browser.

## Requirements

- Node.js 18 or newer
- ffmpeg available in `PATH`
- AzuraCast running locally with the station port exposed
- a Streamer/DJ user configured in AzuraCast

## Quick start

1. Copy the local config:

   ```powershell
   Copy-Item azuracast-live.env.example azuracast-live.env
   ```

2. Edit `azuracast-live.env` and fill:

   ```text
   AZURACAST_STREAMER_USERNAME=
   AZURACAST_STREAMER_PASSWORD=
   ```

3. Start the relay:

   ```powershell
   npm start
   ```

4. Open:

   ```text
   http://localhost:3050
   ```

5. Press `Start Capture`, choose the Chrome tab/window, and enable audio
   sharing in Chrome's picker.

If AzuraCast accepts the connection, the station should switch from AutoDJ to
live input.

## Direct browser relay

The relay page uses Chrome's screen/tab capture permission. For best results,
choose a Chrome tab and enable tab audio in the share dialog. Chrome may not
share audio for every window type.

The server receives browser audio as WebM/Opus, converts it with ffmpeg, and
streams MP3 to the station's Icecast-compatible endpoint.

## BUTT fallback

If you prefer a traditional encoder, use this chain:

```text
Chrome audio -> VB-Cable -> BUTT -> AzuraCast live DJ input
```

### 1. Install the audio bridge

Install VB-Cable, then reboot Windows if the installer asks for it.

After installation, Windows should show:

- `CABLE Input` as an output device
- `CABLE Output` as an input/recording device

### 2. Route Chrome audio to VB-Cable

Open:

```text
Windows Settings -> System -> Sound -> Volume mixer
```

Set Chrome output device to:

```text
CABLE Input
```

Chrome audio will now be sent into the virtual cable.

### 3. Enable live broadcasting in AzuraCast

Open AzuraCast:

```text
http://localhost
```

For the station you want to use, usually `Azura One`:

1. Open the station profile.
2. Enable live broadcasting / streamers.
3. Create a Streamer/DJ account.
4. Save the streamer username and password.
5. Check the station's live connection details in AzuraCast.

Use the exact host, port, mount point, username, and password shown by
AzuraCast if they differ from the defaults below.

### 4. Configure BUTT

Install BUTT, then create a new server profile.

Suggested starting values for the local Docker setup:

```text
Type: IceCast
Address: localhost
Port: 8001
Mount: /radio.mp3
Username: <streamer_username>
Password: <streamer_password>
```

Audio device:

```text
CABLE Output
```

Encoding:

```text
Codec: MP3
Bitrate: 192 kbps
Sample rate: 44100 Hz
Channels: Stereo
```

Press `Connect` in BUTT. If AzuraCast accepts the connection, the station should
switch from AutoDJ to live input.

## Verify the broadcast

Check now playing:

```powershell
Invoke-RestMethod http://localhost/api/nowplaying
```

Or open the public station player from AzuraCast.

## Troubleshooting

- If BUTT cannot connect, verify that the station port is exposed by Docker.
  This project exposes ports `8000-8010`.
- If BUTT connects but no sound is heard, confirm Chrome is routed to
  `CABLE Input` and BUTT is listening to `CABLE Output`.
- If Chrome becomes silent on your speakers, that is expected while its output
  is routed only to VB-Cable. Use Windows audio routing or a mixer if you also
  need local monitoring.
- If AzuraCast keeps playing the ident, the live connection was not accepted or
  the station did not switch to the live source.
