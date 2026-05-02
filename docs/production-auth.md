# Production Authentication

Do not expose the custom dashboard directly on the public internet. Put it
behind a reverse proxy authentication layer, SSO provider, VPN, or private
tailnet.

## Caddy Basic Auth

Use `config/proxy/Caddyfile.basic-auth.example` as a minimal starting point.
Generate a password hash with:

```bash
caddy hash-password
```

Then replace the placeholder hash and point the upstream to the dashboard host.

## Nginx Basic Auth

Use `config/proxy/nginx-basic-auth.example.conf` when Nginx is already your
edge proxy. Generate the password file with:

```bash
htpasswd -c /etc/nginx/.htpasswd admin
```

## SSO Options

For production teams, prefer Cloudflare Access, Authelia, Authentik, Tailscale
Serve/Funnel access controls, or your existing identity-aware proxy. The
dashboard stores the AzuraCast API key in browser-accessible Vite env output,
so network-level access control is the security boundary.
