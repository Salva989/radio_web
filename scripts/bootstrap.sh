#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

docker compose pull
docker compose up -d

echo "AzuraCast should now be starting. Open the web UI to complete installation."
