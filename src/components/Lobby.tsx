import React, { useState } from 'react';
import { socket } from '../socket';
import { motion, AnimatePresence } from 'motion/react';
import type { Room, City } from '../../server/game';

const CITIES: City[] = ['Mumbai', 'Delhi', 'Hyderabad', 'Bangalore', 'Chennai', 'Kolkata', 'Jaipur', 'Ahmedabad'];

const CITY_META: Record<City, { team: string; short: string; color: string; bg: string; emoji: string }> = {
  Mumbai:    { team: 'Mumbai Indians',              short: 'MI',   color: '#1B8FD6', bg: '#001E3C', emoji: '🔵' },
  Chennai:   { team: 'Chennai Super Kings',         short: 'CSK',  color: '#F5C518', bg: '#1A1400', emoji: '🟡' },
  Bangalore: { team: 'Royal Challengers',           short: 'RCB',  color: '#EC1C24', bg: '#1C0002', emoji: '🔴' },
  Kolkata:   { team: 'Kolkata Knight Riders',       short: 'KKR',  color: '#8B3DA8', bg: '#150020', emoji: '🟣' },
  Delhi:     { team: 'Delhi Capitals',              short: 'DC',   color: '#0057A8', bg: '#00102A', emoji: '🔵' },
  Jaipur:    { team: 'Rajasthan Royals',            short: 'RR',   color: '#FF3EA5', bg: '#1A001A', emoji: '🩷' },
  Hyderabad: { team: 'Sunrisers Hyderabad',         short: 'SRH',  color: '#F26522', bg: '#1A0800', emoji: '🟠' },
  Ahmedabad: { team: 'Gujarat Titans',              short: 'GT',   color: '#1B4D8E', bg: '#040420', emoji: '🔷' },
};

export function Lobby({ room }: { room: Room }) {
  const [copied, setCopied] = useState(false);
  const [gameMode, setGameMode] = useState<'quick' | 'full'>('full');
  const [localName, setLocalName] = useState('');
  const [localCity, setLocalCity] = useState<City | ''>('');
  const [nameError, setNameError] = useState('');

  const myId = socket.id;
  const isHost = room.hostId === myId;
  const me = room.teams[myId!];
  const teamsList = Object.values(room.teams);
  const takenCities = teamsList.filter(t => t.id !== myId).map(t => t.city).filter(Boolean) as City[];
  const allReady = teamsList.length >= 2 && teamsList.every(t => t.isReady);

  const handleCopy = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateTeam = () => {
    if (!localName.trim()) { setNameError('Enter a franchise name'); return; }
    if (!localCity) { setNameError('Select a city'); return; }
    setNameError('');
    socket.emit('update_team', { roomId: room.id, name: localName.trim(), city: localCity });
  };

  const handleReady = () => {
    if (!me?.city || !me?.name || me.name.startsWith('Player ')) {
      setNameError('Save your franchise details first');
      return;
    }
    socket.emit('set_ready', { roomId: room.id, isReady: !me?.isReady });
  };

  const handleStart = () => {
    if (isHost) socket.emit('start_auction', { roomId: room.id, mode: gameMode });
  };

  return (
    <div className="noise min-h-screen bg-[#0A0A0C] text-white">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#E8B84B] opacity-[0.03] blur-[100px] rounded-full" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <span className="font-display text-xl tracking-widest text-[#E8B84B]">AUCTION ARENA</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 live-dot" />
            <span className="text-[11px] text-[#5A5A6A] tracking-widest uppercase">Lobby</span>
          </div>
          {/* Room code */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#18181C] border border-white/8 rounded-lg hover:border-[#E8B84B]/30 transition-colors group"
          >
            <span className="text-[10px] text-[#5A5A6A] tracking-widest uppercase">Room</span>
            <span className="font-mono text-sm font-medium text-white tracking-widest">{room.id}</span>
            <span className="text-[#5A5A6A] group-hover:text-[#E8B84B] transition-colors text-xs">
              {copied ? '✓' : '⎘'}
            </span>
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Setup your franchise */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <h2 className="font-display text-3xl tracking-wider text-white mb-1">YOUR FRANCHISE</h2>
            <p className="text-[#5A5A6A] text-sm">Claim a city. Name your team.</p>
          </div>

          <div className="bg-[#111114] border border-white/7 rounded-2xl p-5 space-y-4">
            {/* Franchise name */}
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-[#5A5A6A] mb-2">
                Franchise Name
              </label>
              <input
                type="text"
                value={localName}
                onChange={e => setLocalName(e.target.value)}
                placeholder="e.g. Royal Warriors"
                maxLength={24}
                className="w-full bg-[#18181C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/15 focus:outline-none focus:border-[#E8B84B]/40 transition-colors"
              />
            </div>

            {/* City grid */}
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-[#5A5A6A] mb-2">
                Select City
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CITIES.map(city => {
                  const meta = CITY_META[city];
                  const taken = takenCities.includes(city);
                  const selected = localCity === city;
                  return (
                    <button
                      key={city}
                      onClick={() => !taken && setLocalCity(city)}
                      disabled={taken}
                      className={`relative px-3 py-3 rounded-xl border text-left transition-all duration-200 ${
                        taken
                          ? 'opacity-30 cursor-not-allowed bg-[#18181C] border-white/5'
                          : selected
                          ? 'border-opacity-60 bg-opacity-20'
                          : 'bg-[#18181C] border-white/8 hover:border-white/20'
                      }`}
                      style={selected ? {
                        borderColor: meta.color,
                        backgroundColor: `${meta.color}18`,
                      } : {}}
                    >
                      <div className="text-xs font-bold" style={{ color: selected ? meta.color : '#aaa' }}>
                        {meta.short}
                      </div>
                      <div className="text-[10px] text-[#5A5A6A] mt-0.5">{city}</div>
                      {taken && <div className="absolute top-2 right-2 text-[9px] text-[#5A5A6A]">Taken</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {nameError && (
              <p className="text-red-400 text-xs">{nameError}</p>
            )}

            <button
              onClick={handleUpdateTeam}
              className="w-full py-3 rounded-xl text-[11px] font-semibold tracking-[0.2em] uppercase bg-[#18181C] border border-white/8 hover:border-[#E8B84B]/30 text-[#5A5A6A] hover:text-white transition-all"
            >
              Save Franchise →
            </button>

            {/* Ready button */}
            <button
              onClick={handleReady}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm tracking-widest uppercase transition-all duration-200 relative overflow-hidden group ${
                me?.isReady
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'text-[#0A0A0C]'
              }`}
              style={!me?.isReady ? {
                background: 'linear-gradient(135deg, #E8B84B, #C8922A)',
              } : {}}
            >
              {me?.isReady ? '✓ Ready — Click to Unready' : 'Mark Ready'}
            </button>
          </div>

          {/* Game mode (host only) */}
          {isHost && (
            <div className="bg-[#111114] border border-white/7 rounded-2xl p-5">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#5A5A6A] mb-3">
                Game Mode (Host)
              </p>
              <div className="flex gap-2 mb-4">
                {(['quick', 'full'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setGameMode(m)}
                    className={`flex-1 py-2.5 rounded-lg text-[11px] font-semibold tracking-widest uppercase transition-all ${
                      gameMode === m
                        ? 'bg-[#E8B84B] text-[#0A0A0C]'
                        : 'bg-[#18181C] text-[#5A5A6A] hover:text-white border border-white/5'
                    }`}
                  >
                    {m === 'quick' ? '⚡ Quick (30)' : '🏆 Full (60)'}
                  </button>
                ))}
              </div>
              <button
                onClick={handleStart}
                className="w-full py-4 rounded-xl font-display text-xl tracking-widest uppercase transition-all active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #E8B84B, #C8922A)',
                  color: '#0A0A0C',
                  boxShadow: '0 4px 20px rgba(232, 184, 75, 0.2)',
                }}
              >
                {allReady ? '🔨 Start Auction' : `🔨 Start Auction (Force Start)`}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Franchises in lobby */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-3xl tracking-wider">
              FRANCHISES <span className="text-[#E8B84B]">{teamsList.length}/8</span>
            </h2>
            <div className="text-[11px] text-[#5A5A6A] tracking-widest uppercase">
              {teamsList.filter(t => t.isReady).length} ready
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {teamsList.map((team, i) => {
                const meta = team.city ? CITY_META[team.city] : null;
                const isMe = team.id === myId;
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative bg-[#111114] border rounded-2xl p-4 overflow-hidden transition-all ${
                      isMe ? 'border-[#E8B84B]/25' : 'border-white/7'
                    }`}
                  >
                    {/* Color strip */}
                    {meta && (
                      <div
                        className="absolute top-0 left-0 right-0 h-0.5"
                        style={{ background: meta.color }}
                      />
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-display tracking-wider flex-shrink-0"
                          style={{
                            background: meta ? `${meta.color}20` : '#18181C',
                            color: meta?.color || '#5A5A6A',
                            border: `1px solid ${meta ? `${meta.color}40` : 'rgba(255,255,255,0.07)'}`,
                          }}
                        >
                          {meta?.short || (i + 1)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-white leading-tight">
                            {team.name.startsWith('Player ') ? (
                              <span className="text-[#5A5A6A] italic">Unnamed Franchise</span>
                            ) : team.name}
                          </div>
                          <div className="text-[11px] text-[#5A5A6A] mt-0.5">
                            {team.city ? meta?.team : 'No city selected'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-widest uppercase ${
                          team.isReady
                            ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                            : 'bg-white/5 text-[#5A5A6A] border border-white/5'
                        }`}>
                          {team.isReady ? 'Ready' : 'Waiting'}
                        </div>
                        {isMe && (
                          <span className="text-[9px] text-[#E8B84B] tracking-widest uppercase">You</span>
                        )}
                        {team.id === room.hostId && (
                          <span className="text-[9px] text-[#5A5A6A] tracking-widest uppercase">Host</span>
                        )}
                      </div>
                    </div>

                    {/* Budget preview */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-[#5A5A6A] tracking-widest uppercase">Starting Purse</span>
                      <span className="font-mono text-sm font-medium text-[#E8B84B]">₹{team.budget.toFixed(0)} Cr</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty slots */}
            {Array(Math.max(0, 8 - teamsList.length)).fill(null).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="bg-[#111114] border border-dashed border-white/5 rounded-2xl p-4 flex items-center justify-center"
              >
                <span className="text-[#5A5A6A] text-[11px] tracking-widest uppercase">Waiting for player...</span>
              </div>
            ))}
          </div>

          {/* Share link */}
          <div className="mt-4 bg-[#111114] border border-white/5 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#5A5A6A] tracking-widest uppercase mb-1">Share Room Code</p>
              <p className="font-mono text-lg font-semibold tracking-[0.4em] text-white">{room.id}</p>
            </div>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-[#18181C] border border-white/8 rounded-lg text-xs font-medium text-[#5A5A6A] hover:text-white hover:border-[#E8B84B]/30 transition-all tracking-widest uppercase"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
