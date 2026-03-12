import React, { useEffect, useState } from 'react';
import { socket } from './socket';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { Auction } from './components/Auction';
import { Results } from './components/Results';
import type { Room } from '../server/game';

export default function App() {
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socket.connect();

    // Handle initial routing and reconnection
    const path = window.location.pathname;
    const pathRoomId = path.startsWith('/room/') ? path.split('/')[2] : null;

    if (pathRoomId && !room) {
      socket.emit('join_room', { roomId: pathRoomId.toUpperCase() });
    }

    socket.on('room_update', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setError(null);
      // Update URL without reload
      const newPath = `/room/${updatedRoom.id}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
    });

    socket.on('auction_started', (updatedRoom: Room) => {
      setRoom(updatedRoom);
    });

    socket.on('bid_placed', (updatedRoom: Room) => {
      setRoom(updatedRoom);
    });

    socket.on('player_result', ({ event, room: updatedRoom }: { event: string, room: Room }) => {
      setRoom(updatedRoom);
    });

    socket.on('next_player', (updatedRoom: Room) => {
      setRoom(updatedRoom);
    });

    socket.on('auction_finished', (updatedRoom: Room) => {
      setRoom(updatedRoom);
    });

    socket.on('error', (msg: string) => {
      setError(msg);
    });

    socket.on('disconnect', () => {
      // Don't clear room immediately to allow for reconnection
      console.log('Socket disconnected');
    });

    socket.on('connect', () => {
      // Re-join if we were in a room
      const currentPath = window.location.pathname;
      const currentRoomId = currentPath.startsWith('/room/') ? currentPath.split('/')[2] : null;
      if (currentRoomId) {
        socket.emit('join_room', { roomId: currentRoomId.toUpperCase() });
      }
    });

    return () => {
      socket.off('room_update');
      socket.off('auction_started');
      socket.off('bid_placed');
      socket.off('player_result');
      socket.off('next_player');
      socket.off('auction_finished');
      socket.off('error');
      socket.off('disconnect');
      socket.off('connect');
      socket.disconnect();
    };
  }, []);

  const handleCreateRoom = (newRoomId: string) => {
    socket.emit('create_room', { roomId: newRoomId });
    socket.emit('join_room', { roomId: newRoomId });
  };

  const handleJoinRoom = (targetRoomId: string) => {
    socket.emit('join_room', { roomId: targetRoomId.toUpperCase() });
  };

  if (!room) {
    return <Home error={error} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
  }

  if (room.auctionState.status === 'lobby') {
    return <Lobby room={room} />;
  }

  if (room.auctionState.status === 'in_progress') {
    return <Auction room={room} />;
  }

  if (room.auctionState.status === 'finished') {
    return <Results room={room} />;
  }

  return null;
}
