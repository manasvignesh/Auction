import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { motion } from 'motion/react';

export function Home({ error, onCreateRoom, onJoinRoom }: {
  error: string | null;
  onCreateRoom: (roomId: string) => void;
  onJoinRoom: (roomId: string) => void;
}) {
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    onCreateRoom(newRoomId);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    setIsLoading(true);
    onJoinRoom(roomId.trim().toUpperCase());
    setTimeout(() => setIsLoading(false), 2000);
  };

  const stats = [
    { val: '60', label: 'Elite Players' },
    { val: '8', label: 'Franchises' },
    { val: '₹100Cr', label: 'Per Purse' },
    { val: 'Live', label: 'Multiplayer' },
  ];

  return (
    <div className="noise min-h-screen bg-[#0A0A0C] flex flex-col overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#E8B84B] opacity-[0.04] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500 opacity-[0.03] blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-500 opacity-[0.03] blur-[100px] rounded-full" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Ticker bar */}
      <div className="relative z-10 border-b border-white/5 overflow-hidden h-8 flex items-center">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0A0A0C] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0A0A0C] to-transparent z-10" />
        <div className="ticker-inner text-[11px] font-medium tracking-widest text-[#5A5A6A]">
          {Array(4).fill(null).map((_, i) => (
            <span key={i} className="flex gap-12 pr-12">
              <span>VIRAT KOHLI · BAT · ★95</span>
              <span className="text-[#E8B84B]">◆</span>
              <span>JASPRIT BUMRAH · BOWL · ★96</span>
              <span className="text-[#E8B84B]">◆</span>
              <span>RASHID KHAN · AR · ★94</span>
              <span className="text-[#E8B84B]">◆</span>
              <span>RISHABH PANT · WK · ★91</span>
              <span className="text-[#E8B84B]">◆</span>
              <span>HARDIK PANDYA · AR · ★92</span>
              <span className="text-[#E8B84B]">◆</span>
              <span>TRAVIS HEAD · BAT · ★91</span>
              <span className="text-[#E8B84B]">◆</span>
              <span>ANDRE RUSSELL · AR · ★90</span>
              <span className="text-[#E8B84B]">◆</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#E8B84B]" />
            <span className="text-[#E8B84B] text-[11px] font-semibold tracking-[0.4em] uppercase">IPL Franchise Auction</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#E8B84B]" />
          </div>
          <h1 className="font-display text-[clamp(64px,12vw,120px)] leading-none tracking-wider text-white">
            AUCTION
            <br />
            <span className="text-gold-gradient">ARENA</span>
          </h1>
          <p className="mt-4 text-[#5A5A6A] text-sm tracking-wide max-w-sm mx-auto">
            Build your dream IPL franchise. Outbid rivals. Prove your squad is unstoppable.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-8 mb-12"
        >
          {stats.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className="text-center">
                <div className="font-display text-2xl text-[#E8B84B] tracking-wider">{s.val}</div>
                <div className="text-[10px] text-[#5A5A6A] tracking-widest uppercase mt-0.5">{s.label}</div>
              </div>
              {i < stats.length - 1 && <div className="w-px h-8 bg-white/5" />}
            </React.Fragment>
          ))}
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <div className="bg-[#111114] border border-white/8 rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              {(['create', 'join'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-4 text-[11px] font-semibold tracking-[0.2em] uppercase transition-all duration-200 ${
                    mode === m
                      ? 'text-[#E8B84B] border-b-2 border-[#E8B84B] -mb-px'
                      : 'text-[#5A5A6A] hover:text-white'
                  }`}
                >
                  {m === 'create' ? 'Create Room' : 'Join Room'}
                </button>
              ))}
            </div>

            <div className="p-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="space-y-4">
                {mode === 'join' ? (
                  <div>
                    <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-[#5A5A6A] mb-2">
                      Room Code
                    </label>
                    <input
                      type="text"
                      value={roomId}
                      onChange={e => setRoomId(e.target.value.toUpperCase())}
                      placeholder="E.G. AB3X7K"
                      maxLength={6}
                      autoFocus
                      className="w-full bg-[#18181C] border border-white/8 rounded-xl px-4 py-3.5 text-white font-mono text-center text-lg tracking-[0.4em] placeholder:text-white/15 focus:outline-none focus:border-[#E8B84B]/40 transition-colors"
                    />
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <div className="w-14 h-14 bg-[#E8B84B]/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#E8B84B]/20">
                      <span className="text-2xl">🏏</span>
                    </div>
                    <p className="text-[#5A5A6A] text-sm">A unique room code will be generated.<br/>Share it with up to 7 friends.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || (mode === 'join' && roomId.length < 4)}
                  className="w-full py-4 rounded-xl font-semibold text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
                  style={{
                    background: isLoading ? 'rgba(232,184,75,0.5)' : 'linear-gradient(135deg, #E8B84B, #C8922A)',
                    color: '#0A0A0C',
                  }}
                >
                  <span className="relative z-10">
                    {isLoading ? 'Connecting...' : mode === 'create' ? '🔨 Start Auction' : '→ Enter Room'}
                  </span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-[11px] text-[#5A5A6A] mt-4 tracking-wide">
            Works best with 2–8 players on separate devices
          </p>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-white/5 px-6 py-3 flex items-center justify-between">
        <span className="text-[10px] text-[#5A5A6A] tracking-widest uppercase">IPL Mega Auction 2025</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 live-dot" />
          <span className="text-[10px] text-[#5A5A6A] tracking-widest uppercase">Live</span>
        </div>
      </div>
    </div>
  );
}
