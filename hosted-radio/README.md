# Hosted Radio Setup

This is the simplest public setup:

```text
Chrome tab audio -> local relay / BUTT -> hosted radio service -> GitHub Pages player
```

Recommended hosted service for the quickest path: Zeno.fm.

## Why this path

- No public VPS to manage.
- No Docker or AzuraCast server online.
- The radio stream gets a public URL that GitHub Pages can play.
- You can keep using the local Chrome relay or switch to BUTT later.

## Zeno.fm quick setup

1. Create an account at:

   ```text
   https://zeno.fm/
   ```

2. Create a station.

3. Open the station dashboard.

4. Go to:

   ```text
   Stations -> your station -> Broadcast Settings
   ```

5. Copy these encoder settings:

   ```text
   server / host
   port
   mount point
   username
   password / stream key
   public stream URL
   ```

6. Fill `zeno-live.env.example` and copy it to:

   ```text
   ../chrome-live-input/azuracast-live.env
   ```

7. Start the local relay:

   ```powershell
   cd chrome-live-input
   npm start
   ```

8. Open:

   ```text
   http://127.0.0.1:3050
   ```

9. Start capture from the Chrome tab with audio.

## GitHub Pages

Once the hosted public stream URL works, update:

```text
docs/index.html
```

Replace the player source with the Zeno public stream URL:

```html
<audio controls src="https://your-public-stream-url"></audio>
```

Then commit and push to deploy GitHub Pages.

