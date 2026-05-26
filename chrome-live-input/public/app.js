const startButton = document.querySelector('#startButton')
const testToneButton = document.querySelector('#testToneButton')
const stopButton = document.querySelector('#stopButton')
const statusSignal = document.querySelector('#statusSignal')
const stationName = document.querySelector('#stationName')
const target = document.querySelector('#target')
const credentials = document.querySelector('#credentials')
const stationState = document.querySelector('#stationState')
const track = document.querySelector('#track')
const listeners = document.querySelector('#listeners')
const logElement = document.querySelector('#log')
const audioLevelBar = document.querySelector('#audioLevelBar')
const audioLevelText = document.querySelector('#audioLevelText')
const relayState = document.querySelector('#relayState')
const browserBytes = document.querySelector('#browserBytes')
const sentBytes = document.querySelector('#sentBytes')
const frameCount = document.querySelector('#frameCount')
const lastError = document.querySelector('#lastError')

let mediaRecorder = null
let websocket = null
let captureStream = null
let config = null
let audioContext = null
let meterFrame = null
let localSentBytes = 0
let localSentChunks = 0

startButton.addEventListener('click', startCapture)
testToneButton.addEventListener('click', startTestTone)
stopButton.addEventListener('click', stopCapture)

await loadConfig()
await refreshNowPlaying()
await refreshStatus()
setInterval(refreshNowPlaying, 5000)
setInterval(refreshStatus, 1000)

async function loadConfig() {
  config = await fetchJson('/api/config')
  stationName.textContent = config.station
  target.textContent = `${config.host}:${config.port}${config.mount}`
  credentials.textContent = config.hasCredentials ? 'configured' : 'missing'
}

async function startCapture() {
  try {
    setStatus('selecting')
    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    })

    const audioTracks = captureStream.getAudioTracks()
    if (audioTracks.length === 0) {
      stopTracks(captureStream)
      throw new Error('No audio track was shared. In Chrome, choose a tab and enable "Share tab audio".')
    }

    startAudioMeter(captureStream)
    localSentBytes = 0
    localSentChunks = 0

    websocket = new WebSocket(`ws://${window.location.host}/stream`)
    websocket.binaryType = 'arraybuffer'

    websocket.addEventListener('open', () => {
      const audioStream = new MediaStream(audioTracks)
      const mimeType = pickMimeType()
      mediaRecorder = mimeType
        ? new MediaRecorder(audioStream, { mimeType })
        : new MediaRecorder(audioStream)

      mediaRecorder.addEventListener('dataavailable', async (event) => {
        if (event.data.size > 0 && websocket?.readyState === WebSocket.OPEN) {
          const buffer = await event.data.arrayBuffer()
          websocket.send(buffer)
          localSentBytes += buffer.byteLength
          localSentChunks += 1
          sentBytes.textContent = `${localSentBytes} / ${localSentChunks} chunks`
        }
      })

      mediaRecorder.addEventListener('error', (event) => {
        log(`Recorder error: ${event.error?.message || 'unknown error'}`)
      })

      mediaRecorder.addEventListener('stop', stopCapture)
      captureStream.getTracks().forEach((track) => track.addEventListener('ended', stopCapture))

      mediaRecorder.start(500)
      startButton.disabled = true
      stopButton.disabled = false
      setStatus('live')
      log(`Capture started with ${mediaRecorder.mimeType || 'browser default'} audio recording.`)
    })

    websocket.addEventListener('close', () => {
      log('Relay connection closed.')
      stopCapture()
    })

    websocket.addEventListener('error', () => {
      log('Relay connection error.')
      stopCapture()
    })
  } catch (error) {
    log(error.message)
    stopCapture()
  }
}

async function startTestTone() {
  try {
    const response = await fetch('/api/test-tone', { method: 'POST' })
    if (!response.ok) throw new Error(`Test tone failed: ${response.status}`)
    log('Test tone started for 15 seconds.')
  } catch (error) {
    log(error.message)
  }
}

function stopCapture() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  mediaRecorder = null

  if (websocket && websocket.readyState <= WebSocket.OPEN) {
    websocket.close()
  }
  websocket = null

  if (captureStream) {
    stopTracks(captureStream)
  }
  captureStream = null
  stopAudioMeter()

  startButton.disabled = false
  stopButton.disabled = true
  setStatus('idle')
}

async function refreshStatus() {
  try {
    const status = await fetchJson('/api/status')
    relayState.textContent = status.active ? `${status.lastSession.mode} active` : 'idle'
    browserBytes.textContent = String(status.lastSession.browserBytes || 0)
    sentBytes.textContent = `${localSentBytes} / ${localSentChunks} chunks`
    frameCount.textContent = String(status.lastSession.frames || 0)
    lastError.textContent = status.lastSession.ffmpegErrors?.[0] || status.lastSession.stopReason || 'none'
  } catch {
    relayState.textContent = 'unreachable'
  }
}

async function refreshNowPlaying() {
  try {
    const payload = await fetchJson('/api/nowplaying')
    const stations = Array.isArray(payload) ? payload : payload.value || []
    const station = stations.find((item) => item.station?.shortcode === config?.shortcode) || stations[0]

    if (!station) {
      stationState.textContent = 'offline'
      track.textContent = 'No station found'
      listeners.textContent = '0'
      return
    }

    stationState.textContent = station.is_online ? 'online' : 'offline'
    track.textContent = station.now_playing?.song?.text || 'Unknown'
    listeners.textContent = String(station.listeners?.current ?? 0)
  } catch {
    stationState.textContent = 'unreachable'
    track.textContent = 'API unavailable'
    listeners.textContent = '0'
  }
}

function startAudioMeter(stream) {
  stopAudioMeter()

  audioContext = new AudioContext()
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 1024

  const source = audioContext.createMediaStreamSource(stream)
  source.connect(analyser)

  const samples = new Uint8Array(analyser.fftSize)

  const render = () => {
    analyser.getByteTimeDomainData(samples)

    let sum = 0
    for (const sample of samples) {
      const value = (sample - 128) / 128
      sum += value * value
    }

    const rms = Math.sqrt(sum / samples.length)
    const percent = Math.min(100, Math.round(rms * 220))
    audioLevelBar.style.width = `${percent}%`
    audioLevelText.textContent = `${percent}%`

    meterFrame = requestAnimationFrame(render)
  }

  render()
}

function stopAudioMeter() {
  if (meterFrame) {
    cancelAnimationFrame(meterFrame)
    meterFrame = null
  }

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  audioLevelBar.style.width = '0%'
  audioLevelText.textContent = '0%'
}

function pickMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'video/webm;codecs=opus',
    'audio/webm',
    'video/webm'
  ]

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || ''
}

function stopTracks(stream) {
  stream.getTracks().forEach((track) => track.stop())
}

function setStatus(value) {
  statusSignal.textContent = value
  statusSignal.dataset.status = value
}

function log(message) {
  const timestamp = new Date().toLocaleTimeString()
  logElement.textContent = `[${timestamp}] ${message}\n${logElement.textContent}`.slice(0, 4000)
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.json()
}
