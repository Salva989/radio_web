# Custom Admin Dashboard

This dashboard is a lightweight admin view on top of the AzuraCast API.

## Features included

- health / now playing fetch
- station list overview
- service cards for each station
- simple playlist counts and live status placeholders

## Required API setup

1. In AzuraCast, create an API key with admin scope.
2. Copy `api/dashboard/.env.example` to `api/dashboard/.env`.
3. Set:
   - `VITE_AZURACAST_API_URL`
   - `VITE_AZURACAST_API_KEY`

## Security

Do not expose this dashboard publicly without authentication.

Recommended options:

- reverse proxy basic auth
- Cloudflare Access
- Tailscale funnel or tailnet-only access
- SSO via Authelia or Authentik
