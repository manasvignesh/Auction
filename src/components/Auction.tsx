import React, { useEffect, useState, useRef, useCallback } from 'react';
import { socket } from '../socket';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useAudio } from '../hooks/useAudio';
import { getAuctionHistory, SoldPlayer } from '../utils/auctionUtils';
import type { Room, Team } from '../../server/game';
import type { Player } from '../../server/players';

interface FloatingEmoteData {
  id: string;
  emoji: string;
  x: number; // random horizontal position %
}

function FloatingEmote({ emoji, x, onDone }: { emoji: string; x: number; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{ opacity: 0, y: -300, scale: 1.4 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      className="fixed pointer-events-none text-4xl z-50"
      style={{ left: `${x}%`, bottom: '120px' }}
    >
      {emoji}
    </motion.div>
  );
}

const CITY_COLORS: Record<string, string> = {
  Mumbai: '#1B8FD6', Chennai: '#F5C518', Bangalore: '#EC1C24',
  Kolkata: '#8B3DA8', Delhi: '#0057A8', Jaipur: '#FF3EA5',
  Hyderabad: '#F26522', Ahmedabad: '#1B4D8E',
};

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  Batsman:     { label: 'BAT', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  Bowler:      { label: 'BOWL', color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  'All-rounder': { label: 'ALL-RD', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  Wicketkeeper: { label: 'WK', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
};

const FORM_META: Record<string, { label: string; color: string; emoji: string }> = {
  hot:     { label: 'In Form',   color: '#F87171', emoji: '🔥' },
  average: { label: 'Average',   color: '#FBBF24', emoji: '⚡' },
  cool:    { label: 'Out of Form', color: '#60A5FA', emoji: '❄️' },
};

function CircularTimer({ timer, max = 30 }: { timer: number; max?: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, timer / max);
  const color = timer <= 5 ? '#EF4444' : timer <= 10 ? '#F59E0B' : '#E8B84B';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
      <svg width={88} height={88} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <motion.circle
          cx={44} cy={44} r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </svg>
      <motion.div
        key={timer}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute font-display text-3xl tracking-wider"
        style={{ color, filter: timer <= 5 ? `drop-shadow(0 0 8px ${color})` : 'none' }}
      >
        {Math.max(0, timer)}
      </motion.div>
      {timer <= 5 && timer > 0 && (
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 20px ${color}40`, animation: 'pulse-ring 0.8s ease-out infinite' }}
        />
      )}
    </div>
  );
}

function RatingBar({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#5A5A6A]">{label}</span>
        <span className="font-mono text-xs font-semibold" style={{ color }}>{val}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${val}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function BidActivity({ events }: { events: { text: string; color: string; time: string }[] }) {
  return (
    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
      <AnimatePresence mode="popLayout">
        {events.slice(0, 8).map((e, i) => (
          <motion.div
            key={`${e.text}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs"
          >
            <span className="text-[#5A5A6A] font-mono text-[10px] flex-shrink-0">{e.time}</span>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
            <span className="text-[#aaa] truncate">{e.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {events.length === 0 && (
        <p className="text-[#5A5A6A] text-xs italic">No bids yet...</p>
      )}
    </div>
  );
}

export function Auction({ room }: { room: Room }) {
  const [timer, setTimer] = useState(room.auctionState.timer);
  const [result, setResult] = useState<{ event: 'sold' | 'unsold'; player: Player; team?: Team; price?: number } | null>(null);
  const [bidActivity, setBidActivity] = useState<{ text: string; color: string; time: string }[]>([]);
  const [bidFlash, setBidFlash] = useState(false);
  const [goingCount, setGoingCount] = useState(0); // 0 = none, 1 = once, 2 = twice
  const [megaBid, setMegaBid] = useState(false);
  const [emotes, setEmotes] = useState<FloatingEmoteData[]>([]);
  const [showDirectory, setShowDirectory] = useState(false);
  const [activeTab, setActiveTab] = useState<'sold' | 'unsold'>('sold');
  const activityRef = useRef<typeof bidActivity>([]);
  activityRef.current = bidActivity;
  const { playTick, playBid, playGavel } = useAudio();

  const myId = socket.id;
  const me = room.teams[myId!];
  const state = room.auctionState;
  const currentPlayer = state.playersPool[state.currentPlayerIndex];
  const highestBidder = state.highestBidderId ? room.teams[state.highestBidderId] : null;
  const amLeading = state.highestBidderId === myId;

  const teamColor = me?.city ? CITY_COLORS[me.city] : '#E8B84B';
  const roleMeta = currentPlayer ? ROLE_META[currentPlayer.role] : null;
  const formMeta = currentPlayer ? FORM_META[currentPlayer.recentForm] : null;

  const addActivity = useCallback((text: string, color: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setBidActivity(prev => [{ text, color, time }, ...prev.slice(0, 15)]);
  }, []);

  useEffect(() => {
    const onTick = (t: number) => {
      setTimer(t);
      if (t === 10 && state.highestBidderId) setGoingCount(1);
      if (t === 5 && state.highestBidderId) setGoingCount(2);
      if (t === 0) setGoingCount(0);
      // Audio: tick sound in final 3 seconds
      if (t > 0 && t < 4) playTick();
    };

    const onBid = (updatedRoom: Room) => {
      const bidder = updatedRoom.teams[updatedRoom.auctionState.highestBidderId!];
      const color = bidder?.city ? CITY_COLORS[bidder.city] : '#E8B84B';
      addActivity(`${bidder?.name || 'Unknown'} bid ₹${updatedRoom.auctionState.currentBid.toFixed(1)} Cr`, color);
      setBidFlash(true);
      setTimeout(() => setBidFlash(false), 600);
      setGoingCount(0);
      // Audio: bid sound
      playBid();
      // Screen shake on mega bid (>= 15 Cr)
      if (updatedRoom.auctionState.currentBid >= 15.0) {
        setMegaBid(true);
        setTimeout(() => setMegaBid(false), 400);
      }
    };

    const onResult = ({ event, room: r }: { event: 'sold' | 'unsold'; room: Room }) => {
      const player = r.auctionState.playersPool[r.auctionState.currentPlayerIndex];
      const team = r.auctionState.highestBidderId ? r.teams[r.auctionState.highestBidderId] : undefined;
      setResult({ event, player, team, price: r.auctionState.currentBid });
      setGoingCount(0);
      // Audio: gavel sound on sold/unsold
      playGavel();
      if (event === 'sold') {
        const color = team?.city ? CITY_COLORS[team.city] : '#E8B84B';
        addActivity(`🔨 ${player?.name} SOLD to ${team?.name} for ₹${r.auctionState.currentBid.toFixed(1)} Cr`, color);
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.55 },
          colors: ['#E8B84B', '#F5D080', '#ffffff', team?.city ? CITY_COLORS[team.city] : '#E8B84B'],
          gravity: 0.8,
        });
      } else {
        addActivity(`${player?.name} went UNSOLD`, '#5A5A6A');
      }
    };

    const onNext = (r: Room) => {
      setResult(null);
      setTimer(r.auctionState.timer);
    };

    const onError = (msg: string) => {
      addActivity(`⚠ ${msg}`, '#EF4444');
    };

    // Floating emotes from other players
    const onEmote = ({ emoji }: { emoji: string; senderId: string }) => {
      const id = `${Date.now()}-${Math.random()}`;
      const x = 15 + Math.random() * 70; // random 15%-85% horizontal
      setEmotes(prev => [...prev, { id, emoji, x }]);
    };

    socket.on('timer_tick', onTick);
    socket.on('bid_placed', onBid);
    socket.on('player_result', onResult);
    socket.on('next_player', onNext);
    socket.on('bid_error', onError);
    socket.on('receive_emote', onEmote);

    return () => {
      socket.off('timer_tick', onTick);
      socket.off('bid_placed', onBid);
      socket.off('player_result', onResult);
      socket.off('next_player', onNext);
      socket.off('bid_error', onError);
      socket.off('receive_emote', onEmote);
    };
  }, [addActivity, state.highestBidderId, playTick, playBid, playGavel]);

  const canBid = (amount: number): boolean => {
    if (!me || result) return false;
    if (amLeading) return false;
    
    // Mega Auction Rules: 25 player limit, no role constraints
    const newBid = !state.highestBidderId ? state.currentBid : state.currentBid + amount;
    
    if (me.budget < newBid) return false;
    if (me.squad.length >= 25) return false;
    
    return true;
  };

  const handleBid = (amount: number) => {
    socket.emit('place_bid', { roomId: room.id, amount });
  };

  const handleForceComplete = () => {
    if (window.confirm('Are you sure you want to end the auction and see the results?')) {
      socket.emit('force_complete', { roomId: room.id });
    }
  };

  const handleEmote = (emoji: string) => {
    socket.emit('send_emote', { roomId: room.id, emoji });
  };

  const removeEmote = useCallback((id: string) => {
    setEmotes(prev => prev.filter(e => e.id !== id));
  }, []);

  const budgetPct = me ? (me.budget / 100) * 100 : 100;
  const isBudgetCritical = me && me.budget < 15;
  const teamsSorted = Object.values(room.teams).sort((a, b) => b.budget - a.budget);

  if (!currentPlayer) return null;

  return (
    <div className={`noise min-h-screen bg-[#0A0A0C] text-white flex flex-col overflow-hidden ${megaBid ? 'screen-shake' : ''}`}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] blur-[120px] rounded-full opacity-[0.06] transition-all duration-2000"
          style={{ background: highestBidder?.city ? CITY_COLORS[highestBidder.city] : '#E8B84B' }}
        />
      </div>

      {/* TOP BAR — Broadcast style */}
      <div className="relative z-10 border-b border-white/5 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <span className="font-display text-lg tracking-widest text-[#E8B84B]">AUCTION ARENA</span>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 live-dot" />
            <span className="text-[10px] font-semibold text-red-400 tracking-[0.2em] uppercase">Live</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="font-display text-lg tracking-wider text-white">
              #{state.currentPlayerIndex + 1}
            </div>
            <div className="text-[9px] text-[#5A5A6A] tracking-widest uppercase">Lot</div>
          </div>
          <div className="w-px h-6 bg-white/5" />
          <div className="text-center">
            <div className="font-display text-lg tracking-wider text-white">
              {state.playersPool.length - state.currentPlayerIndex - 1}
            </div>
            <div className="text-[9px] text-[#5A5A6A] tracking-widest uppercase">Remaining</div>
          </div>
          <div className="w-px h-6 bg-white/5" />
          <button
            onClick={() => setShowDirectory(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white/3 border border-white/8 rounded-lg hover:border-[#E8B84B]/30 transition-colors group"
          >
            <span className="text-sm">📋</span>
            <span className="text-[10px] text-[#5A5A6A] group-hover:text-white tracking-widest uppercase font-semibold">Directory</span>
          </button>
          
          {room.hostId === myId && (
            <button
              onClick={handleForceComplete}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors group"
            >
              <span className="text-sm">🏁</span>
              <span className="text-[10px] text-red-400 tracking-widest uppercase font-semibold">End Auction</span>
            </button>
          )}
          <div className="w-px h-6 bg-white/5" />
          <div className="text-center">
            <div
              className={`font-mono text-base font-semibold ${isBudgetCritical ? 'budget-critical' : 'text-[#E8B84B]'}`}
            >
              ₹{me?.budget.toFixed(1)}Cr
            </div>
            <div className="text-[9px] text-[#5A5A6A] tracking-widest uppercase">My Purse</div>
          </div>
        </div>
      </div>

      {/* Budget progress bar */}
      <div className="h-0.5 bg-white/5 flex-shrink-0 relative z-10">
        <motion.div
          animate={{ width: `${budgetPct}%` }}
          className="h-full transition-all duration-500"
          style={{ background: isBudgetCritical ? '#EF4444' : '#E8B84B' }}
        />
      </div>

      <div className="relative z-10 flex-1 flex gap-0 overflow-hidden">

        {/* LEFT SIDEBAR — Teams */}
        <div className="w-56 border-r border-white/5 flex-shrink-0 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#5A5A6A]">
              Franchises
            </span>
          </div>
          <div className="flex-1 p-3 space-y-2">
            {teamsSorted.map(team => {
              const isLeading = team.id === state.highestBidderId;
              const isMe = team.id === myId;
              const color = team.city ? CITY_COLORS[team.city] : '#5A5A6A';
              const bPct = (team.budget / 100) * 100;
              return (
                <motion.div
                  key={team.id}
                  layout
                  className={`rounded-xl p-3 border transition-all ${
                    isLeading
                      ? 'border-opacity-50 bg-opacity-10'
                      : isMe
                      ? 'border-white/12 bg-white/3'
                      : 'border-white/5 bg-transparent'
                  }`}
                  style={isLeading ? { borderColor: color, backgroundColor: `${color}12` } : {}}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold font-display flex-shrink-0"
                        style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}
                      >
                        {team.city?.substring(0, 2)?.toUpperCase() || '??'}
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-white leading-tight truncate max-w-[80px]">
                          {team.name}
                        </div>
                      </div>
                    </div>
                    {isLeading && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[11px] font-medium" style={{ color: team.budget < 15 ? '#EF4444' : color }}>
                      ₹{team.budget.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-[#5A5A6A]">{team.squad.length}/25</span>
                  </div>
                  <div className="mt-1.5 h-0.5 bg-white/5 rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${bPct}%`, background: color, opacity: 0.6 }} />
                  </div>
                  {isLeading && (
                    <div className="mt-1.5 text-[9px] font-semibold tracking-widest uppercase" style={{ color }}>
                      Leading Bid
                    </div>
                  )}
                  {isMe && !isLeading && (
                    <div className="mt-1.5 text-[9px] text-[#5A5A6A] tracking-widest uppercase">You</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CENTER — Player + Bidding */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key={currentPlayer.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Player showcase */}
                <div className={`flex-1 flex flex-col xl:flex-row gap-0 overflow-hidden ${bidFlash ? 'bid-flash' : ''}`}>

                  {/* Player card */}
                  <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                    {/* Going once/twice indicator */}
                    <AnimatePresence>
                      {goingCount > 0 && (
                        <motion.div
                          key={goingCount}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute top-4 left-1/2 -translate-x-1/2 going-pulse"
                        >
                          <div className="px-4 py-1.5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-full">
                            <span className="text-[#F59E0B] text-xs font-semibold tracking-widest uppercase">
                              {goingCount === 1 ? '⚠ Going Once...' : '⚠ Going Twice...'}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Role tag */}
                    {roleMeta && (
                      <div
                        className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-4 border"
                        style={{ color: roleMeta.color, background: roleMeta.bg, borderColor: `${roleMeta.color}30` }}
                      >
                        {roleMeta.label}
                      </div>
                    )}

                    {/* Player name */}
                    <motion.h2
                      key={currentPlayer.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="font-display text-[clamp(40px,6vw,72px)] tracking-widest text-white text-center leading-none mb-2"
                    >
                      {currentPlayer.name}
                    </motion.h2>

                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-[#5A5A6A] text-sm">{currentPlayer.nationality}</span>
                      {formMeta && (
                        <>
                          <span className="text-white/10">·</span>
                          <span className="text-sm" style={{ color: formMeta.color }}>
                            {formMeta.emoji} {formMeta.label}
                          </span>
                        </>
                      )}
                      <span className="text-white/10">·</span>
                      <span className="text-[#E8B84B] text-sm font-mono">★{currentPlayer.rating}</span>
                    </div>

                    <div className="w-full max-w-xs space-y-3 mt-4">
                      <RatingBar label="Batting" val={currentPlayer.battingRating} color="#60A5FA" />
                      <RatingBar label="Bowling" val={currentPlayer.bowlingRating} color="#F87171" />
                      <RatingBar label="Overall" val={currentPlayer.rating} color="#E8B84B" />
                    </div>
                  </div>

                  {/* Bid panel */}
                  <div className="xl:w-72 border-t xl:border-t-0 xl:border-l border-white/5 flex flex-col">

                    {/* Timer */}
                    <div className="flex items-center justify-center py-6 border-b border-white/5 relative">
                      <CircularTimer timer={timer} max={15} />
                    </div>

                    {/* Price */}
                    <div className="px-6 py-5 border-b border-white/5">
                      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#5A5A6A] mb-1">
                        {highestBidder ? 'Current Bid' : 'Base Price'}
                      </div>
                      <motion.div
                        key={state.currentBid}
                        initial={{ scale: 1.05, color: '#F5D080' }}
                        animate={{ scale: 1, color: '#ffffff' }}
                        className="font-display text-4xl tracking-wider leading-none"
                      >
                        ₹{state.currentBid.toFixed(1)}
                        <span className="text-lg text-[#5A5A6A] ml-1">Cr</span>
                      </motion.div>

                      {highestBidder ? (
                        <div
                          className="mt-2 flex items-center gap-2 text-xs font-semibold"
                          style={{ color: highestBidder.city ? CITY_COLORS[highestBidder.city] : '#E8B84B' }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: highestBidder.city ? CITY_COLORS[highestBidder.city] : '#E8B84B',
                              boxShadow: `0 0 6px ${highestBidder.city ? CITY_COLORS[highestBidder.city] : '#E8B84B'}`,
                            }}
                          />
                          {amLeading ? 'You are leading' : highestBidder.name}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-[#5A5A6A] italic">No bids yet</div>
                      )}
                    </div>

                    {/* Bid buttons */}
                    <div className="px-4 py-5 flex-1 flex flex-col gap-3">
                      {amLeading && (
                        <div className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-400 text-center font-semibold">
                          ✓ You're leading — wait for others
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        {[0, 0.5, 1.0, 2.0].map(inc => {
                          const newBid = state.currentBid + (inc === 0 && !state.highestBidderId ? 0 : inc);
                          const canPlace = canBid(inc === 0 ? state.currentBid : newBid);
                          const label = inc === 0 ? 'Open' : `+₹${inc}`;
                          const sublabel = inc === 0
                            ? `₹${state.currentBid.toFixed(1)}Cr`
                            : `₹${(state.currentBid + inc).toFixed(1)}Cr`;

                          return (
                            <button
                              key={inc}
                              onClick={() => canPlace && handleBid(inc)}
                              disabled={!canPlace}
                              className={`flex flex-col items-center justify-center py-3.5 rounded-xl border transition-all duration-150 relative overflow-hidden group ${
                                canPlace
                                  ? 'border-[#E8B84B]/25 bg-[#E8B84B]/5 hover:bg-[#E8B84B]/12 active:scale-95 cursor-pointer'
                                  : 'border-white/5 bg-transparent opacity-25 cursor-not-allowed'
                              }`}
                            >
                              <span className={`text-[10px] font-bold tracking-widest uppercase ${canPlace ? 'text-[#E8B84B]' : 'text-[#5A5A6A]'}`}>
                                {label}
                              </span>
                              <span className="font-mono text-sm font-medium text-white mt-0.5">{sublabel}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* My squad summary */}
                      <div className="mt-auto pt-3 border-t border-white/5">
                        <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#5A5A6A] mb-2">
                          My Squad ({me?.squad.length || 0}/25)
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'].map(role => {
                            const count = me?.squad.filter(p => p.role === role).length || 0;
                            const meta = ROLE_META[role];
                            return (
                              <div
                                key={role}
                                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                                style={{ background: `${meta.color}10`, color: meta.color }}
                              >
                                <span>{meta.label}</span>
                                <span className="font-mono font-bold">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* SOLD / UNSOLD overlay */
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
              >
                {/* Big background text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <span
                    className="font-display select-none"
                    style={{
                      fontSize: 'clamp(120px, 25vw, 300px)',
                      color: result.event === 'sold' ? 'rgba(232,184,75,0.04)' : 'rgba(239,68,68,0.04)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {result.event.toUpperCase()}
                  </span>
                </div>

                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="relative z-10 text-center px-8"
                >
                  {result.event === 'sold' ? (
                    <>
                      <div className="stamp-anim inline-block mb-6">
                        <div
                          className="font-display text-[clamp(60px,10vw,100px)] tracking-widest leading-none px-8 py-2 border-[6px] rounded-xl"
                          style={{
                            color: '#E8B84B',
                            borderColor: '#E8B84B',
                            textShadow: '0 0 40px rgba(232,184,75,0.6)',
                            boxShadow: '0 0 60px rgba(232,184,75,0.2)',
                            transform: 'rotate(-2deg)',
                          }}
                        >
                          SOLD!
                        </div>
                      </div>
                      <div className="font-display text-4xl text-white tracking-widest mb-2">
                        {result.player?.name}
                      </div>
                      <div
                        className="font-mono text-2xl mb-3"
                        style={{ color: '#E8B84B' }}
                      >
                        ₹{result.price?.toFixed(1)} Cr
                      </div>
                      {result.team && (
                        <div
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold"
                          style={{
                            color: result.team.city ? CITY_COLORS[result.team.city] : '#E8B84B',
                            borderColor: result.team.city ? `${CITY_COLORS[result.team.city]}40` : 'rgba(232,184,75,0.3)',
                            background: result.team.city ? `${CITY_COLORS[result.team.city]}12` : 'rgba(232,184,75,0.08)',
                          }}
                        >
                          → {result.team.name}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="stamp-anim inline-block mb-6">
                        <div
                          className="font-display text-[clamp(60px,10vw,100px)] tracking-widest leading-none px-8 py-2 border-[6px] rounded-xl"
                          style={{
                            color: '#5A5A6A',
                            borderColor: '#5A5A6A',
                            transform: 'rotate(-2deg)',
                          }}
                        >
                          UNSOLD
                        </div>
                      </div>
                      <div className="font-display text-4xl text-white/40 tracking-widest mb-2">
                        {result.player?.name}
                      </div>
                      <div className="text-[#5A5A6A] text-sm tracking-widest uppercase">Returned to pool</div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT SIDEBAR — Activity */}
        <div className="w-52 border-l border-white/5 flex-shrink-0 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#5A5A6A]">
              Bid Activity
            </span>
          </div>
          <div className="flex-1 p-3 overflow-y-auto">
            <BidActivity events={bidActivity} />
          </div>

          {/* Upcoming players */}
          <div className="border-t border-white/5">
            <div className="px-4 py-2.5">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#5A5A6A]">Up Next</span>
            </div>
            <div className="px-3 pb-3 space-y-1.5">
              {state.playersPool.slice(state.currentPlayerIndex + 1, state.currentPlayerIndex + 5).map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg ${
                    i === 0 ? 'bg-[#E8B84B]/8 border border-[#E8B84B]/15' : 'bg-white/2'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-semibold text-white truncate max-w-[90px]">{p.name}</div>
                    <div className="text-[9px] text-[#5A5A6A]">{ROLE_META[p.role]?.label}</div>
                  </div>
                  <div className="text-[10px] font-mono text-[#5A5A6A]">₹{p.basePrice}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Players Directory Modal */}
      <AnimatePresence>
        {showDirectory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#111114] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="font-display text-3xl tracking-widest text-white">PLAYERS DIRECTORY</h2>
                  <p className="text-[#5A5A6A] text-xs uppercase tracking-widest font-semibold mt-1">Auction History & Statistics</p>
                </div>
                <button
                  onClick={() => setShowDirectory(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-[#5A5A6A] hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-8 py-2 border-b border-white/5 gap-8">
                {['sold', 'unsold'].map(tab => {
                  const { soldPlayers, unsoldPlayers } = getAuctionHistory(room);
                  const count = tab === 'sold' ? soldPlayers.length : unsoldPlayers.length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`py-4 text-xs font-bold tracking-[0.2em] uppercase transition-all relative ${
                        activeTab === tab ? 'text-[#E8B84B]' : 'text-[#5A5A6A] hover:text-[#aaa]'
                      }`}
                    >
                      {tab} Players ({count})
                      {activeTab === tab && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E8B84B]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeTab === 'sold' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getAuctionHistory(room).soldPlayers.length === 0 ? (
                      <p className="col-span-2 text-center text-[#5A5A6A] py-20 italic">No players sold yet.</p>
                    ) : (
                      getAuctionHistory(room).soldPlayers.map((p, i) => {
                        const teamColor = p.buyingTeam.city ? CITY_COLORS[p.buyingTeam.city] : '#E8B84B';
                        return (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white/2 border border-white/5 rounded-2xl p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/3 flex items-center justify-center text-[10px] font-bold text-[#5A5A6A] border border-white/5">
                                {ROLE_META[p.role]?.label}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white leading-tight">{p.name}</div>
                                <div className="text-[10px] font-semibold tracking-widest mt-1 uppercase" style={{ color: teamColor }}>
                                  {p.buyingTeam.name}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-sm font-bold text-[#E8B84B]">₹{p.basePrice.toFixed(1)} Cr</div>
                              <div className="text-[9px] text-[#5A5A6A] uppercase tracking-widest mt-0.5">Sale Price</div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getAuctionHistory(room).unsoldPlayers.length === 0 ? (
                      <p className="col-span-2 text-center text-[#5A5A6A] py-20 italic">No players unsold yet.</p>
                    ) : (
                      getAuctionHistory(room).unsoldPlayers.map((p, i) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-white/2 border border-white/5 rounded-2xl p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/3 flex items-center justify-center text-[10px] font-bold text-[#5A5A6A] border border-white/5">
                              {ROLE_META[p.role]?.label}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white leading-tight">{p.name}</div>
                              <div className="text-[10px] font-semibold tracking-widest mt-1 uppercase text-[#5A5A6A]">
                                {p.nationality}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm font-bold text-[#aaa]">₹{p.basePrice.toFixed(1)} Cr</div>
                            <div className="text-[9px] text-[#5A5A6A] uppercase tracking-widest mt-0.5">Base Price</div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Emotes Overlay */}
      <AnimatePresence>
        {emotes.map(e => (
          <FloatingEmote key={e.id} emoji={e.emoji} x={e.x} onDone={() => removeEmote(e.id)} />
        ))}
      </AnimatePresence>

      {/* Emote Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="emote-bar">
          {['🔥', '😱', '💸', '🤡'].map(emoji => (
            <button key={emoji} onClick={() => handleEmote(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
