import { Player, PLAYERS } from './players';

export type City = 'Mumbai' | 'Delhi' | 'Hyderabad' | 'Bangalore' | 'Chennai' | 'Kolkata' | 'Jaipur' | 'Ahmedabad';

export interface Team {
  id: string; // Socket ID
  name: string;
  city: City | null;
  budget: number;
  squad: Player[];
  isReady: boolean;
}

export interface AuctionState {
  currentPlayerIndex: number;
  currentBid: number;
  highestBidderId: string | null;
  timer: number;
  status: 'lobby' | 'in_progress' | 'finished';
  mode: 'quick' | 'full';
  playersPool: Player[];
}

export interface Room {
  id: string;
  hostId: string;
  teams: Record<string, Team>;
  auctionState: AuctionState;
}

const rooms: Record<string, Room> = {};
const roomIntervals: Record<string, NodeJS.Timeout> = {};

export function createRoom(roomId: string, hostId: string): Room {
  if (roomIntervals[roomId]) clearInterval(roomIntervals[roomId]);
  rooms[roomId] = {
    id: roomId,
    hostId,
    teams: {},
    auctionState: {
      currentPlayerIndex: 0,
      currentBid: 0,
      highestBidderId: null,
      timer: 30,
      status: 'lobby',
      mode: 'full',
      playersPool: [],
    },
  };
  return rooms[roomId];
}

export function getRoom(roomId: string): Room | undefined {
  return rooms[roomId];
}

export function joinRoom(roomId: string, teamId: string): Room | null {
  const room = rooms[roomId];
  if (!room) return null;
  if (Object.keys(room.teams).length >= 8) return null; // Max 8 players
  if (room.auctionState.status !== 'lobby') return null;

  room.teams[teamId] = {
    id: teamId,
    name: `Player ${Object.keys(room.teams).length + 1}`,
    city: null,
    budget: 100,
    squad: [],
    isReady: false,
  };
  return room;
}

export function updateTeam(roomId: string, teamId: string, name: string, city: City): { success: boolean, error?: string } {
  const room = rooms[roomId];
  if (!room) return { success: false, error: 'Room not found' };
  
  const team = room.teams[teamId];
  if (!team) return { success: false, error: 'Team not found' };

  // Check if city is already taken by someone else
  if (city) {
    const cityTaken = Object.values(room.teams).some(t => t.id !== teamId && t.city === city);
    if (cityTaken) return { success: false, error: 'City already taken' };
  }

  team.name = name;
  team.city = city;
  return { success: true };
}

export function leaveRoom(roomId: string, teamId: string) {
  const room = rooms[roomId];
  if (room) {
    delete room.teams[teamId];
    if (Object.keys(room.teams).length === 0) {
      if (roomIntervals[roomId]) {
        clearInterval(roomIntervals[roomId]);
        delete roomIntervals[roomId];
      }
      delete rooms[roomId];
    } else if (room.hostId === teamId) {
      room.hostId = Object.keys(room.teams)[0];
    }
  }
}

export function setReady(roomId: string, teamId: string, isReady: boolean) {
  const room = rooms[roomId];
  if (room && room.teams[teamId]) {
    room.teams[teamId].isReady = isReady;
  }
}

export function canStartAuction(roomId: string): boolean {
  const room = rooms[roomId];
  if (!room) return false;
  const teams = Object.values(room.teams);
  if (teams.length < 2) return false; // Need at least 2 players
  return teams.every(t => t.isReady);
}

export function startAuction(roomId: string, mode: 'quick' | 'full') {
  const room = rooms[roomId];
  if (!room) return;

  // Shuffle and select players
  let pool = [...PLAYERS].sort(() => Math.random() - 0.5);
  if (mode === 'quick') {
    pool = pool.slice(0, 30);
  }

  room.auctionState = {
    currentPlayerIndex: 0,
    currentBid: pool[0].basePrice,
    highestBidderId: null,
    timer: 30,
    status: 'in_progress',
    mode,
    playersPool: pool,
  };
}

export function placeBid(roomId: string, teamId: string, amount: number): boolean {
  const room = rooms[roomId];
  if (!room || room.auctionState.status !== 'in_progress') return false;

  const team = room.teams[teamId];
  if (!team) return false;

  const state = room.auctionState;
  
  // If amount is 0, it means bidding the base price
  const newBid = amount === 0 && !state.highestBidderId ? state.currentBid : state.currentBid + amount;

  // Check budget
  if (team.budget < newBid) return false;

  // Check squad rules
  if (team.squad.length >= 11) return false;

  // Strict minimums check
  // If buying this player prevents them from reaching the minimums with remaining slots, block it.
  const currentPlayer = state.playersPool[state.currentPlayerIndex];
  const newSquad = [...team.squad, currentPlayer];
  
  const bats = newSquad.filter(p => p.role === 'Batsman').length;
  const bowls = newSquad.filter(p => p.role === 'Bowler').length;
  const wks = newSquad.filter(p => p.role === 'Wicketkeeper').length;
  
  const remainingSlots = 11 - newSquad.length;
  const neededBats = Math.max(0, 4 - bats);
  const neededBowls = Math.max(0, 3 - bowls);
  const neededWks = Math.max(0, 1 - wks);
  
  const totalNeeded = neededBats + neededBowls + neededWks;
  
  if (totalNeeded > remainingSlots) {
    return false; // Cannot fulfill minimum requirements if they buy this player
  }
  
  // They must have enough budget left to buy the minimum required players at 0.5 Cr each
  if (team.budget - newBid < totalNeeded * 0.5) {
    return false;
  }

  // Can't bid against yourself
  if (state.highestBidderId === teamId) return false;

  state.currentBid = newBid;
  state.highestBidderId = teamId;
  state.timer = Math.max(state.timer, 10); // Ensure at least 10s left on bid, don't decrease if higher

  return true;
}

export function processAuctionTimer(roomId: string): { event: 'tick' | 'sold' | 'unsold' | 'finished' | 'transition', room: Room } | null {
  const room = rooms[roomId];
  if (!room || room.auctionState.status !== 'in_progress') return null;

  const state = room.auctionState;

  if (state.timer > 0) {
    state.timer -= 1;
    return { event: 'tick', room };
  }

  // Timer is 0
  if (state.timer === 0) {
    const currentPlayer = state.playersPool[state.currentPlayerIndex];
    let event: 'sold' | 'unsold' = 'unsold';

    if (state.highestBidderId) {
      // Sold
      const winningTeam = room.teams[state.highestBidderId];
      if (winningTeam) {
        winningTeam.budget -= state.currentBid;
        winningTeam.squad.push(currentPlayer);
        event = 'sold';
      }
    }

    // Set timer to -6 for a 6-second transition
    state.timer = -6;
    return { event, room };
  }

  // Transition period
  if (state.timer < 0) {
    state.timer += 1;
    if (state.timer === 0) {
      // Move to next player
      state.currentPlayerIndex += 1;
      if (state.currentPlayerIndex >= state.playersPool.length) {
        state.status = 'finished';
        return { event: 'finished', room };
      } else {
        state.currentBid = state.playersPool[state.currentPlayerIndex].basePrice;
        state.highestBidderId = null;
        state.timer = 15;
        return { event: 'transition', room }; // Transition finished, next player
      }
    }
    return { event: 'tick', room }; // Still transitioning
  }

  return null;
}

export function setRoomInterval(roomId: string, interval: NodeJS.Timeout) {
  if (roomIntervals[roomId]) clearInterval(roomIntervals[roomId]);
  roomIntervals[roomId] = interval;
}

export function clearRoomInterval(roomId: string) {
  if (roomIntervals[roomId]) {
    clearInterval(roomIntervals[roomId]);
    delete roomIntervals[roomId];
  }
}
