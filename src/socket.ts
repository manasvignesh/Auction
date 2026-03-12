import { io } from 'socket.io-client';

// In development, the Vite dev server proxies requests, but for Socket.io
// we can just connect to the current origin.
export const socket = io(window.location.origin, {
  autoConnect: false,
});
