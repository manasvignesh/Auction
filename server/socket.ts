import { Server, Socket } from 'socket.io';
import { createRoom, getRoom, joinRoom, leaveRoom, setReady, canStartAuction, startAuction, placeBid, processAuctionTimer, City, updateTeam, setRoomInterval, clearRoomInterval, quickJoinRoom } from './game';

export function setupAuctionSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('create_room', (data: { roomId: string }) => {
      createRoom(data.roomId, socket.id);
      socket.join(data.roomId);
      io.to(data.roomId).emit('room_update', getRoom(data.roomId));
    });

    socket.on('join_room', (data: { roomId: string }) => {
      const room = joinRoom(data.roomId, socket.id);
      if (room) {
        socket.join(data.roomId);
        io.to(data.roomId).emit('room_update', room);
      } else {
        socket.emit('error', 'Cannot join room. It might be full or already started.');
      }
    });

    socket.on('update_team', (data: { roomId: string, name: string, city: City }) => {
      const result = updateTeam(data.roomId, socket.id, data.name, data.city);
      if (result.success) {
        io.to(data.roomId).emit('room_update', getRoom(data.roomId));
      } else {
        socket.emit('error', result.error);
      }
    });

    socket.on('set_ready', (data: { roomId: string, isReady: boolean }) => {
      setReady(data.roomId, socket.id, data.isReady);
      io.to(data.roomId).emit('room_update', getRoom(data.roomId));
    });

    socket.on('start_auction', (data: { roomId: string, mode: 'quick' | 'full' }) => {
      const room = getRoom(data.roomId);
      if (room && room.hostId === socket.id && canStartAuction(data.roomId)) {
        startAuction(data.roomId, data.mode);
        io.to(data.roomId).emit('auction_started', room);

        // Start timer
        const interval = setInterval(() => {
          const result = processAuctionTimer(data.roomId);
          if (result) {
            if (result.event === 'tick') {
              io.to(data.roomId).emit('timer_tick', result.room.auctionState.timer);
            } else if (result.event === 'sold' || result.event === 'unsold') {
              io.to(data.roomId).emit('player_result', { event: result.event, room: result.room });
            } else if (result.event === 'transition') {
              io.to(data.roomId).emit('next_player', result.room);
            } else if (result.event === 'finished') {
              clearRoomInterval(data.roomId);
              io.to(data.roomId).emit('auction_finished', result.room);
            }
          }
        }, 1000);
        setRoomInterval(data.roomId, interval);
      }
    });

    socket.on('place_bid', (data: { roomId: string, amount: number }) => {
      const success = placeBid(data.roomId, socket.id, data.amount);
      if (success) {
        io.to(data.roomId).emit('bid_placed', getRoom(data.roomId));
      } else {
        socket.emit('bid_error', 'Invalid bid');
      }
    });

    socket.on('quick_join', () => {
      const room = quickJoinRoom(socket.id);
      if (room) {
        socket.join(room.id);
        io.to(room.id).emit('room_update', room);
      } else {
        socket.emit('error', 'Matchmaking failed. Please try again.');
      }
    });

    // Emote relay — broadcast to everyone in the room
    socket.on('send_emote', (data: { roomId: string; emoji: string }) => {
      io.to(data.roomId).emit('receive_emote', { emoji: data.emoji, senderId: socket.id });
    });

    socket.on('disconnecting', () => {
      console.log(`User disconnecting: ${socket.id}`);
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          leaveRoom(roomId, socket.id);
          io.to(roomId).emit('room_update', getRoom(roomId));
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
