#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const apiUrl = process.env.AZURACAST_API_URL
const apiKey = process.env.AZURACAST_ADMIN_API_KEY
const configPath = process.argv[2] || 'config/stations/stations.json'
const dryRun = process.argv.includes('--dry-run')

if (!apiUrl || !apiKey) {
  console.error('Missing AZURACAST_API_URL or AZURACAST_ADMIN_API_KEY.')
  process.exit(1)
}

const baseUrl = apiUrl.replace(/\/$/, '')

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`${options.method || 'GET'} ${endpoint} failed (${response.status}): ${body}`)
  }

  return response.status === 204 ? null : response.json()
}

const resolvedConfigPath = path.resolve(process.cwd(), configPath)
const stations = JSON.parse(await fs.readFile(resolvedConfigPath, 'utf8'))
const existingStations = await apiFetch('/admin/stations')
const existingByShortName = new Map(existingStations.map((station) => [station.short_name, station]))

for (const station of stations) {
  if (existingByShortName.has(station.short_name)) {
    console.log(`Skipping existing station: ${station.short_name}`)
    continue
  }

  if (dryRun) {
    console.log(`Would create station: ${station.short_name}`)
    continue
  }

  await apiFetch('/admin/stations', {
    method: 'POST',
    body: JSON.stringify(station)
  })
  console.log(`Created station: ${station.short_name}`)
}
