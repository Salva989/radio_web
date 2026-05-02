import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_AZURACAST_API_URL
const API_KEY = import.meta.env.VITE_AZURACAST_API_KEY

async function apiFetch(path) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}

function StatCard({ label, value, accent }) {
  return (
    <div className="card stat-card">
      <div className="label">{label}</div>
      <div className="value" style={{ color: accent }}>{value}</div>
    </div>
  )
}

export default function App() {
  const [stations, setStations] = useState([])
  const [nowPlaying, setNowPlaying] = useState([])
  const [status, setStatus] = useState('Loading...')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      apiFetch('/admin/stations'),
      apiFetch('/nowplaying')
    ])
      .then(([stationsData, nowPlayingData]) => {
        setStations(stationsData)
        setNowPlaying(nowPlayingData)
        setStatus('Connected')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('API error')
      })
  }, [])

  const onlineStations = nowPlaying.filter((station) => station?.live?.is_live || station?.listeners?.total > 0).length
  const totalListeners = nowPlaying.reduce((sum, station) => sum + (station?.listeners?.total || 0), 0)

  return (
    <main className="app-shell">
      <header className="hero card">
        <div>
          <p className="eyebrow">AzuraCast</p>
          <h1>Custom Admin Dashboard</h1>
          <p className="subtle">Monitor stations, listeners, and live activity from one place.</p>
        </div>
        <div className="status-pill">{status}</div>
      </header>

      {error ? <section className="error card">{error}</section> : null}

      <section className="stats-grid">
        <StatCard label="Stations" value={stations.length} accent="#7dd3fc" />
        <StatCard label="Currently active" value={onlineStations} accent="#86efac" />
        <StatCard label="Listeners" value={totalListeners} accent="#f9a8d4" />
      </section>

      <section className="panel-grid">
        <section className="card panel">
          <h2>Station Overview</h2>
          <div className="table-like">
            {stations.map((station) => (
              <div className="row" key={station.id}>
                <div>
                  <strong>{station.name}</strong>
                  <div className="subtle">/{station.short_name}</div>
                </div>
                <div>{station.is_enabled ? 'Enabled' : 'Disabled'}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card panel">
          <h2>Now Playing</h2>
          <div className="table-like">
            {nowPlaying.map((station) => (
              <div className="row" key={station.station.id}>
                <div>
                  <strong>{station.station.name}</strong>
                  <div className="subtle">{station.now_playing?.song?.title || 'No track'}</div>
                </div>
                <div>
                  {station.live?.is_live ? 'Live' : 'AutoDJ'} - {station.listeners?.total || 0} listeners
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
