# AzuraCast Install

A self-hosted radio stack based on AzuraCast with:

- AzuraCast via Docker Compose
- 3 preplanned stations/channels
- playlists and live DJ input notes
- a custom admin dashboard powered by the AzuraCast API
- Liquidsoap customization hooks for EQ/effects
- optional Owncast integration only if video or visual overlays are needed

## What is included

- `docker-compose.yml` for AzuraCast
- `.env.example` with deployment variables
- station planning and setup docs
- dashboard scaffold in `api/dashboard`
- Liquidsoap custom script examples in `config/liquidsoap`
- helper scripts for bootstrapping and API import examples

## Quick start

1. Copy env file:
   ```bash
   cp .env.example .env
   ```
2. Edit values for domain, email, timezone, and API credentials.
3. Start AzuraCast:
   ```bash
   docker compose up -d
   ```
4. Open the AzuraCast web installer at `http://your-server/`.
5. Create the admin account.
6. Create an API key in AzuraCast and add it to the dashboard `.env`.
7. Use the station plan in `docs/stations.md` to create stations.
8. Launch the custom dashboard:
   ```bash
   cd api/dashboard
   cp .env.example .env
   npm install
   npm run dev
   ```

## Stations planned

- `azura-one` - main hits / automation
- `azura-chill` - downtempo / ambient
- `azura-talk` - talk, interviews, live shows

## Live input

AzuraCast supports live DJ / streamers per station. The included docs cover:

- enabling live broadcasting
- source passwords / mount points
- suggested OBS / BUTT encoder settings

## Liquidsoap customization

AzuraCast can inject custom Liquidsoap code for advanced audio routing. This repo includes examples for:

- normalization
- basic EQ chain
- compression / limiter hints
- intro / fallback structure examples

Review and test Liquidsoap changes carefully before production rollout.

## Owncast

Not included by default. Add it only if you need video or visual overlays synchronized with the radio stream.

## Recommended next steps

- add Terraform or Ansible if you want infra automation
- add station provisioning through the AzuraCast API after the first install
- wire the dashboard behind SSO or a reverse proxy auth layer for production
