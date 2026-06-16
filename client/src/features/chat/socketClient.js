import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined

let socket = null
let currentToken = null

export function connectSocket(token) {
  if (socket?.connected && currentToken === token) return socket
  if (socket) socket.disconnect()
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })
  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message)
  })
  currentToken = token
  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; currentToken = null }
}

export function getCurrentToken() {
  return currentToken
}
