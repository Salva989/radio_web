import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, 'public')

const config = loadConfig(path.join(__dirname, 'azuracast-live.env'))
const serverPort = Number(config.CHROME_LIVE_INPUT_PORT || 3050)
let activeSession = null
let lastSession = {
  active: false,
  startedAt: null,
  stoppedAt: null,
  stopReason: null,
  browserBytes: 0,
  frames: 0,
  ffmpegErrors: [],
  mode: null
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)

    if (url.pathname === '/api/config') {
      return json(res, {
        station: config.AZURACAST_STATION_NAME || 'Azura One',
        shortcode: config.AZURACAST_STATION_SHORT_NAME || 'azura_one',
        host: config.AZURACAST_HOST || 'localhost',
        port: Number(config.AZURACAST_ICECAST_PORT || 8102),
        mount: config.AZURACAST_MOUNT || '/radio.mp3',
        bitrate: Number(config.BUTT_BITRATE_KBPS || 192),
        hasCredentials: Boolean(config.AZURACAST_STREAMER_USERNAME || config.AZURACAST_STREAMER_PASSWORD)
      })
    }

    if (url.pathname === '/api/nowplaying') {
      const apiBase = config.AZURACAST_API_BASE || 'http://localhost/api'
      const response = await fetch(`${apiBase.replace(/\/$/, '')}/nowplaying`)
      const body = await response.text()
      res.writeHead(response.status, { 'content-type': response.headers.get('content-type') || 'application/json' })
      return res.end(body)
    }

    if (url.pathname === '/api/status') {
      return json(res, {
        active: Boolean(activeSession),
        lastSession
      })
    }

    if (url.pathname === '/api/test-tone' && req.method === 'POST') {
      if (activeSession) {
        res.writeHead(409, { 'content-type': 'application/json' })
        return res.end(JSON.stringify({ error: 'A live session is already active.' }))
      }

      activeSession = createTestToneSession()
      return json(res, { ok: true })
    }

    return serveStatic(req, res)
  } catch (error) {
    res.writeHead(500, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: error.message }))
  }
})

server.on('upgrade', (req, socket) => {
  if (req.url !== '/stream') {
    socket.destroy()
    return
  }

  if (activeSession) {
    socket.write('HTTP/1.1 409 Conflict\r\n\r\nOnly one live input session is allowed.\r\n')
    socket.destroy()
    return
  }

  const key = req.headers['sec-websocket-key']
  if (!key) {
    socket.destroy()
    return
  }

  const accept = crypto
    .createHash('sha1')
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest('base64')

  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '\r\n'
  ].join('\r\n'))

  activeSession = createBroadcastSession(socket)
})

server.listen(serverPort, () => {
  console.log(`Chrome live input ready: http://localhost:${serverPort}`)
})

function createBroadcastSession(socket) {
  const icecastUrl = buildIcecastUrl()
  const ffmpeg = spawn(config.FFMPEG_PATH || 'ffmpeg', [
    '-hide_banner',
    '-loglevel', 'warning',
    '-f', 'webm',
    '-i', 'pipe:0',
    '-vn',
    '-ac', '2',
    '-ar', '44100',
    '-codec:a', 'libmp3lame',
    '-b:a', `${Number(config.BUTT_BITRATE_KBPS || 192)}k`,
    '-content_type', 'audio/mpeg',
    '-f', 'mp3',
    icecastUrl
  ], { stdio: ['pipe', 'ignore', 'pipe'] })

  let closed = false
  let frameBuffer = Buffer.alloc(0)
  lastSession = {
    active: true,
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    stopReason: null,
    browserBytes: 0,
    frames: 0,
    ffmpegErrors: [],
    mode: 'browser'
  }

  ffmpeg.stderr.on('data', (chunk) => recordFfmpegError(chunk))
  ffmpeg.on('error', (error) => close(error.message))
  ffmpeg.on('close', () => close('ffmpeg stopped'))

  socket.on('data', (chunk) => {
    frameBuffer = Buffer.concat([frameBuffer, chunk])
    const result = decodeWebSocketFrames(frameBuffer)
    frameBuffer = result.rest

    for (const frame of result.frames) {
      if (frame.opcode === 0x8) {
        close('browser closed stream')
        return
      }
      if (frame.opcode === 0x2 && !ffmpeg.stdin.destroyed) {
        lastSession.browserBytes += frame.payload.length
        lastSession.frames += 1
        ffmpeg.stdin.write(frame.payload)
      }
    }
  })

  socket.on('error', (error) => close(error.message))
  socket.on('close', () => close('browser socket closed'))

  function close(reason) {
    if (closed) return
    closed = true
    console.log(`Live input stopped: ${reason}`)
    lastSession.active = false
    lastSession.stoppedAt = new Date().toISOString()
    lastSession.stopReason = reason
    if (!socket.destroyed) socket.destroy()
    if (!ffmpeg.stdin.destroyed) ffmpeg.stdin.end()
    if (!ffmpeg.killed) ffmpeg.kill('SIGTERM')
    activeSession = null
  }

  return { close }
}

function createTestToneSession() {
  const icecastUrl = buildIcecastUrl()
  const ffmpeg = spawn(config.FFMPEG_PATH || 'ffmpeg', [
    '-hide_banner',
    '-loglevel', 'warning',
    '-re',
    '-f', 'lavfi',
    '-i', 'sine=frequency=880:sample_rate=44100',
    '-t', '15',
    '-ac', '2',
    '-codec:a', 'libmp3lame',
    '-b:a', `${Number(config.BUTT_BITRATE_KBPS || 192)}k`,
    '-content_type', 'audio/mpeg',
    '-f', 'mp3',
    icecastUrl
  ], { stdio: ['ignore', 'ignore', 'pipe'] })

  let closed = false
  lastSession = {
    active: true,
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    stopReason: null,
    browserBytes: 0,
    frames: 0,
    ffmpegErrors: [],
    mode: 'test-tone'
  }

  ffmpeg.stderr.on('data', (chunk) => recordFfmpegError(chunk))
  ffmpeg.on('error', (error) => close(error.message))
  ffmpeg.on('close', () => close('test tone stopped'))

  function close(reason) {
    if (closed) return
    closed = true
    lastSession.active = false
    lastSession.stoppedAt = new Date().toISOString()
    lastSession.stopReason = reason
    activeSession = null
  }

  return { close }
}

function recordFfmpegError(chunk) {
  const message = chunk.toString().trim()
  if (!message) return
  console.error(`[ffmpeg] ${message}`)
  lastSession.ffmpegErrors.unshift(message)
  lastSession.ffmpegErrors = lastSession.ffmpegErrors.slice(0, 8)
}

function buildIcecastUrl() {
  const host = config.AZURACAST_HOST || 'localhost'
  const port = Number(config.AZURACAST_ICECAST_PORT || 8102)
  const mount = (config.AZURACAST_MOUNT || '/live').replace(/^\//, '')
  const username = config.AZURACAST_STREAMER_USERNAME || 'source'
  const password = config.AZURACAST_STREAMER_PASSWORD || ''

  return `icecast://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${mount}`
}

function decodeWebSocketFrames(buffer) {
  const frames = []
  let offset = 0

  while (offset + 2 <= buffer.length) {
    const frameStart = offset
    const first = buffer[offset++]
    const second = buffer[offset++]
    const opcode = first & 0x0f
    const masked = (second & 0x80) !== 0
    let length = second & 0x7f

    if (length === 126) {
      if (offset + 2 > buffer.length) {
        offset = frameStart
        break
      }
      length = buffer.readUInt16BE(offset)
      offset += 2
    } else if (length === 127) {
      if (offset + 8 > buffer.length) {
        offset = frameStart
        break
      }
      const high = buffer.readUInt32BE(offset)
      const low = buffer.readUInt32BE(offset + 4)
      length = high * 2 ** 32 + low
      offset += 8
    }

    const mask = masked ? buffer.subarray(offset, offset + 4) : null
    if (masked) {
      if (offset + 4 > buffer.length) {
        offset = frameStart
        break
      }
      offset += 4
    }
    if (offset + length > buffer.length) {
      offset = frameStart
      break
    }

    const payload = Buffer.from(buffer.subarray(offset, offset + length))
    offset += length

    if (mask) {
      for (let i = 0; i < payload.length; i += 1) {
        payload[i] ^= mask[i % 4]
      }
    }

    frames.push({ opcode, payload })
  }

  return { frames, rest: buffer.subarray(offset) }
}

function loadConfig(filePath) {
  const defaults = {
    AZURACAST_HOST: 'localhost',
    AZURACAST_ICECAST_PORT: '8001',
    AZURACAST_MOUNT: '/radio.mp3',
    BUTT_BITRATE_KBPS: '192',
    CHROME_LIVE_INPUT_PORT: '3050'
  }

  if (!fs.existsSync(filePath)) return defaults

  const loaded = Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=')
        const key = line.slice(0, index).trim()
        const value = line.slice(index + 1).trim().replace(/^"(.*)"$/, '$1')
        return [key, value]
      })
  )

  return { ...defaults, ...loaded }
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname
  const filePath = path.normalize(path.join(publicDir, pathname))

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403)
    return res.end('Forbidden')
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404)
      return res.end('Not found')
    }
    res.writeHead(200, { 'content-type': contentType(filePath) })
    res.end(content)
  })
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8'
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8'
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8'
  return 'application/octet-stream'
}

function json(res, data) {
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end(JSON.stringify(data))
}
