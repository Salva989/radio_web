#!/usr/bin/env bash
set -euo pipefail

: "${AZURACAST_API_URL:?Missing AZURACAST_API_URL}"
: "${AZURACAST_ADMIN_API_KEY:?Missing AZURACAST_ADMIN_API_KEY}"

create_station() {
  local payload="$1"
  curl -sS -X POST "${AZURACAST_API_URL}/admin/stations" \
    -H "Authorization: Bearer ${AZURACAST_ADMIN_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "${payload}"
  echo
}

create_station '{"name":"Azura One","short_name":"azura_one","description":"Main hits automation","frontend_type":"icecast","frontend_config":{"port":8000},"backend_type":"liquidsoap","backend_config":{"lang":"en_US"}}'
create_station '{"name":"Azura Chill","short_name":"azura_chill","description":"Chill and ambient","frontend_type":"icecast","frontend_config":{"port":8001},"backend_type":"liquidsoap","backend_config":{"lang":"en_US"}}'
create_station '{"name":"Azura Talk","short_name":"azura_talk","description":"Talk and live shows","frontend_type":"icecast","frontend_config":{"port":8002},"backend_type":"liquidsoap","backend_config":{"lang":"en_US"}}'
