# VPS Codex Handoff

Read this file first when working on the VPS.

## Goal

Deploy the lightest public radio setup from this repo:

```text
local Chrome relay or BUTT -> VPS Icecast -> GitHub Pages player
```

Do not deploy AzuraCast on the VPS unless explicitly requested. The goal is to
use minimal disk, RAM, and moving parts.

## Current Repo Context

- `docs/` is the GitHub Pages static site.
- `docs/index.html` contains the public player.
- `chrome-live-input/` is a local browser relay that captures Chrome tab audio,
  converts it with `ffmpeg`, and sends it to an Icecast-compatible endpoint.
- `chrome-live-input/azuracast-live.env` is intentionally ignored and may not
  exist on the VPS. Create it from an example when needed.
- `hosted-radio/` contains notes for hosted radio services, but for this VPS
  path use Icecast directly.
- Existing AzuraCast/Docker files can stay in the repo; they are not needed for
  the lightweight VPS deployment.

## Desired Public Architecture

Use Icecast on the VPS as the streaming server.

Recommended final listener URL:

```text
https://radio.<domain>/live.mp3
```

Fallback without HTTPS/domain:

```text
http://<vps-ip>:8000/live.mp3
```

Prefer the HTTPS/domain version because GitHub Pages is HTTPS and browsers may
block HTTP audio as mixed content.

## Information To Ask The User For

Ask only for missing values:

```text
DOMAIN_OR_SUBDOMAIN=radio.example.com
PUBLIC_EMAIL=user@example.com
ICECAST_SOURCE_PASSWORD=<new strong password>
ICECAST_ADMIN_PASSWORD=<new strong password>
```

If the user has no domain yet, proceed with the IP-only setup and document that
GitHub Pages playback may be blocked until HTTPS is configured.

## Minimal VPS Install

Assume Ubuntu/Debian unless the system says otherwise.

```bash
sudo apt update
sudo apt install -y icecast2 ufw
```

During package setup, if interactive prompts appear:

- enable Icecast
- set hostname to the domain if known, otherwise the VPS IP
- set source password
- set relay password to another strong value or same only if user accepts
- set admin password

If noninteractive setup is preferred, edit:

```text
/etc/icecast2/icecast.xml
/etc/default/icecast2
```

Ensure:

```text
ENABLE=true
source-password=<ICECAST_SOURCE_PASSWORD>
admin-password=<ICECAST_ADMIN_PASSWORD>
hostname=<DOMAIN_OR_IP>
```

Restart and enable:

```bash
sudo systemctl enable icecast2
sudo systemctl restart icecast2
sudo systemctl status icecast2 --no-pager
```

Open firewall:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

Test:

```bash
curl -I http://127.0.0.1:8000/
```

## HTTPS With Caddy

If the user has a domain/subdomain pointing to the VPS, install Caddy:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Create `/etc/caddy/Caddyfile`:

```caddy
radio.example.com {
  reverse_proxy 127.0.0.1:8000
}
```

Replace `radio.example.com` with the real domain.

Then:

```bash
sudo systemctl reload caddy
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
curl -I https://radio.example.com/
```

## Configure The Local Chrome Relay

On the machine that captures Chrome audio, create:

```text
chrome-live-input/azuracast-live.env
```

For direct Icecast HTTP:

```env
AZURACAST_HOST=<vps-ip-or-domain>
AZURACAST_API_BASE=
AZURACAST_STATION_NAME="radio_web"
AZURACAST_STATION_SHORT_NAME=radio_web
AZURACAST_ICECAST_PORT=8000
AZURACAST_MOUNT=/live.mp3
AZURACAST_STREAMER_USERNAME=source
AZURACAST_STREAMER_PASSWORD=<ICECAST_SOURCE_PASSWORD>
BUTT_BITRATE_KBPS=128
CHROME_LIVE_INPUT_PORT=3050
FFMPEG_PATH=ffmpeg
```

Start relay locally:

```bash
cd chrome-live-input
npm start
```

Open:

```text
http://127.0.0.1:3050
```

Use `Test Tone` first. If the listener URL plays the beep, then test Chrome
capture.

## Update GitHub Pages Player

Edit:

```text
docs/index.html
```

Set the `<audio>` `src` to one of:

```text
https://radio.<domain>/live.mp3
```

or, temporary IP-only:

```text
http://<vps-ip>:8000/live.mp3
```

Commit and push:

```bash
git add docs/index.html VPS_CODEX_HANDOFF.md
git commit -m "Point public player to VPS Icecast"
git push origin main
```

The existing GitHub Actions workflow deploys `docs/` to GitHub Pages on push to
`main`.

## Verification Checklist

On VPS:

```bash
systemctl is-active icecast2
curl -I http://127.0.0.1:8000/
curl -I http://<vps-ip>:8000/live.mp3
```

If using HTTPS:

```bash
systemctl is-active caddy
curl -I https://radio.<domain>/live.mp3
```

From local relay page:

- `Test Tone` produces beep on public stream.
- `Captured Audio` moves above 0%.
- `Sent bytes` increases.
- `Browser bytes` increases.
- `Frames` increases.

From GitHub Pages:

- Open `https://salva989.github.io/radio_web/`.
- Press play.
- The audio should come from the VPS stream URL.

## Important Notes

- Do not commit real passwords or `chrome-live-input/azuracast-live.env`.
- Do not remove AzuraCast files unless the user explicitly asks.
- Keep the VPS deployment minimal: Icecast first, Caddy only if HTTPS/domain is
  available.
- If GitHub Pages cannot play the stream, check mixed content first. HTTPS page
  plus HTTP stream is the usual cause.
- If the relay connects but no Chrome audio is heard, use the relay diagnostics
  in `http://127.0.0.1:3050`: `Captured Audio`, `Sent bytes`, `Browser bytes`,
  and `Frames`.

