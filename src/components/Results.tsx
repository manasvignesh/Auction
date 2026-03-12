import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { getAuctionHistory, SoldPlayer } from '../utils/auctionUtils';
import type { Room, Team } from '../../server/game';

const CITY_COLORS: Record<string, string> = {
  Mumbai: '#1B8FD6', Chennai: '#F5C518', Bangalore: '#EC1C24',
  Kolkata: '#8B3DA8', Delhi: '#0057A8', Jaipur: '#FF3EA5',
  Hyderabad: '#F26522', Ahmedabad: '#1B4D8E',
};

const CITY_TEAMS: Record<string, string> = {
  Mumbai: 'Mumbai Indians', Chennai: 'Chennai Super Kings', Bangalore: 'Royal Challengers',
  Kolkata: 'Kolkata Knight Riders', Delhi: 'Delhi Capitals', Jaipur: 'Rajasthan Royals',
  Hyderabad: 'Sunrisers Hyderabad', Ahmedabad: 'Gujarat Titans',
};

const ROLE_META: Record<string, { label: string; color: string }> = {
  Batsman:      { label: 'BAT', color: '#60A5FA' },
  Bowler:       { label: 'BOWL', color: '#F87171' },
  'All-rounder':{ label: 'AR', color: '#A78BFA' },
  Wicketkeeper: { label: 'WK', color: '#FBBF24' },
};

interface TeamScore {
  team: Team;
  overall: number;
  quality: number;
  balance: number;
  value: number;
  rank: number;
}

function calcScores(teams: Team[]): TeamScore[] {
  return teams.map(team => {
    if (team.squad.length === 0) return { team, overall: 0, quality: 0, balance: 0, value: 0, rank: 0 };

    const avgRating = team.squad.reduce((s, p) => s + p.rating, 0) / team.squad.length;
    const quality = Math.round((avgRating / 96) * 100);

    const bats = team.squad.filter(p => p.role === 'Batsman').length;
    const bowls = team.squad.filter(p => p.role === 'Bowler').length;
    const alls = team.squad.filter(p => p.role === 'All-rounder').length;
    const wks = team.squad.filter(p => p.role === 'Wicketkeeper').length;
    let bal = 100;
    bal -= Math.abs(bats - 4) * 8;
    bal -= Math.abs(bowls - 3) * 8;
    bal -= Math.abs(alls - 3) * 5;
    bal -= Math.abs(wks - 1) * 15;
    const balance = Math.max(0, bal);

    const spent = 100 - team.budget;
    const ratingPerCrore = spent > 0 ? (avgRating / spent) * 10 : 0;
    const value = Math.min(100, Math.round(ratingPerCrore * 10));

    const overall = Math.round(quality * 0.5 + balance * 0.3 + value * 0.2);
    return { team, overall, quality, balance, value, rank: 0 };
  }).sort((a, b) => b.overall - a.overall).map((s, i) => ({ ...s, rank: i + 1 }));
}

function ScoreBar({ label, val, color, delay = 0 }: { label: string; val: number; color: string; delay?: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#5A5A6A]">{label}</span>
        <span className="font-mono text-xs" style={{ color }}>{val}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${val}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export function Results({ room }: { room: Room }) {
  const [aiVerdict, setAiVerdict] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const teams = Object.values(room.teams);
  const scored = calcScores(teams);
  const winner = scored[0];

  useEffect(() => {
    // Winner confetti
    setTimeout(() => {
      confetti({ particleCount: 300, spread: 120, origin: { y: 0.4 },
        colors: ['#E8B84B', '#F5D080', '#ffffff', '#C8922A'] });
    }, 500);

    // AI Verdict
    fetchAIVerdict();
  }, []);

  const fetchAIVerdict = async () => {
    setAiLoading(true);
    const teamData = scored.map(s => ({
      rank: s.rank,
      name: s.team.name,
      city: s.team.city,
      score: s.overall,
      budgetLeft: s.team.budget.toFixed(1),
      players: s.team.squad.map(p =>
        `${p.name} (${p.role}, ★${p.rating}${p.recentForm === 'hot' ? ' 🔥' : ''})`
      ).join(', ') || 'No players acquired',
    }));

    try {
      const res = await fetch('/api/ai-verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: teamData })
      });
      const data = await res.json();
      setAiVerdict(data.verdict || '');
    } catch {
      setAiVerdict("The auction analytics system is temporarily offline — but one look at the squads tells you everything you need to know.");
    }
    setAiLoading(false);
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="noise min-h-screen bg-[#0A0A0C] text-white overflow-x-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#E8B84B] opacity-[0.04] blur-[120px] rounded-full" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <span className="font-display text-xl tracking-widest text-[#E8B84B]">AUCTION ARENA</span>
        <span className="text-[10px] text-[#5A5A6A] tracking-widest uppercase">Final Results</span>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* WINNER HERO */}
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl border overflow-hidden p-8 text-center"
            style={{
              borderColor: winner.team.city ? `${CITY_COLORS[winner.team.city]}40` : 'rgba(232,184,75,0.3)',
              background: winner.team.city
                ? `radial-gradient(ellipse at top, ${CITY_COLORS[winner.team.city]}08 0%, transparent 60%), #111114`
                : 'radial-gradient(ellipse at top, rgba(232,184,75,0.06) 0%, transparent 60%), #111114',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background: winner.team.city ? CITY_COLORS[winner.team.city] : '#E8B84B' }}
            />
            <div className="text-4xl mb-3">🏆</div>
            <div className="text-[11px] font-semibold tracking-[0.4em] uppercase text-[#5A5A6A] mb-2">
              Auction Champion
            </div>
            <h1
              className="font-display text-[clamp(36px,8vw,80px)] tracking-widest leading-none mb-2"
              style={{ color: winner.team.city ? CITY_COLORS[winner.team.city] : '#E8B84B' }}
            >
              {winner.team.name}
            </h1>
            {winner.team.city && (
              <div className="text-[#5A5A6A] text-sm mb-4">{CITY_TEAMS[winner.team.city]}</div>
            )}
            <div className="flex items-center justify-center gap-8">
              <div>
                <div
                  className="font-display text-4xl tracking-wider"
                  style={{ color: winner.team.city ? CITY_COLORS[winner.team.city] : '#E8B84B' }}
                >
                  {winner.overall}
                </div>
                <div className="text-[10px] text-[#5A5A6A] tracking-widest uppercase mt-0.5">Overall Score</div>
              </div>
              <div className="w-px h-10 bg-white/5" />
              <div>
                <div className="font-mono text-2xl text-white">₹{winner.team.budget.toFixed(1)}Cr</div>
                <div className="text-[10px] text-[#5A5A6A] tracking-widest uppercase mt-0.5">Budget Remaining</div>
              </div>
              <div className="w-px h-10 bg-white/5" />
              <div>
                <div className="font-display text-4xl text-white">{winner.team.squad.length}</div>
                <div className="text-[10px] text-[#5A5A6A] tracking-widest uppercase mt-0.5">Players Acquired</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI VERDICT */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111114] border border-white/7 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-sm">🤖</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">AI Analyst Verdict</div>
              <div className="text-[10px] text-[#5A5A6A] tracking-widest uppercase">Powered by Claude</div>
            </div>
            {aiLoading && (
              <div className="ml-auto flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </div>
            )}
          </div>
          {aiVerdict ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#aaa] leading-relaxed text-sm"
            >
              {aiVerdict}
            </motion.p>
          ) : (
            <div className="h-16 shimmer rounded-lg" />
          )}
        </motion.div>

        {/* ALL TEAMS GRID */}
        <div>
          <h2 className="font-display text-3xl tracking-wider text-white mb-4">
            FINAL STANDINGS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scored.map((s, i) => {
              const color = s.team.city ? CITY_COLORS[s.team.city] : '#5A5A6A';
              const isExpanded = expandedTeam === s.team.id;
              return (
                <motion.div
                  key={s.team.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="bg-[#111114] border rounded-2xl overflow-hidden cursor-pointer team-card-hover"
                  style={{ borderColor: i === 0 ? `${color}40` : 'rgba(255,255,255,0.07)' }}
                  onClick={() => setExpandedTeam(isExpanded ? null : s.team.id)}
                >
                  {/* Color strip */}
                  <div className="h-0.5" style={{ background: color }} />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-display text-sm flex-shrink-0"
                          style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
                        >
                          {s.team.city?.substring(0, 2)?.toUpperCase() || '??'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-white">{s.team.name}</span>
                            {i < 3 && <span className="text-base">{medals[i]}</span>}
                          </div>
                          <div className="text-[11px] text-[#5A5A6A] mt-0.5">
                            {s.team.city ? CITY_TEAMS[s.team.city] : 'No franchise'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-2xl tracking-wider" style={{ color }}>
                          {s.overall}
                        </div>
                        <div className="text-[10px] text-[#5A5A6A] tracking-widest uppercase">Score</div>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <ScoreBar label="Squad Quality" val={s.quality} color="#E8B84B" delay={0.1 + i * 0.06} />
                      <ScoreBar label="Balance" val={s.balance} color="#22C55E" delay={0.2 + i * 0.06} />
                      <ScoreBar label="Value" val={s.value} color="#60A5FA" delay={0.3 + i * 0.06} />
                    </div>

                    <div className="flex items-center justify-between text-sm border-t border-white/5 pt-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[#5A5A6A] text-xs">{s.team.squad.length} players</span>
                        <span className="font-mono text-xs" style={{ color }}>₹{s.team.budget.toFixed(1)}Cr left</span>
                      </div>
                      <span className="text-[10px] text-[#5A5A6A] tracking-widest">
                        {isExpanded ? 'Hide squad ▴' : 'View squad ▾'}
                      </span>
                    </div>
                  </div>

                  {/* Squad list */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 px-5 pb-4 overflow-hidden"
                    >
                      <div className="pt-4 space-y-1.5">
                        {s.team.squad.length === 0 ? (
                          <p className="text-[#5A5A6A] text-sm italic">No players acquired</p>
                        ) : (
                          s.team.squad.map(p => {
                            const rm = ROLE_META[p.role];
                            return (
                              <div
                                key={p.id}
                                className="flex items-center justify-between py-2 border-b border-white/4 last:border-0"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                                    style={{ background: `${rm.color}15`, color: rm.color }}
                                  >
                                    {rm.label}
                                  </div>
                                  <span className="text-sm font-medium text-white">{p.name}</span>
                                  {p.recentForm === 'hot' && <span className="text-xs">🔥</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-[#5A5A6A]">★{p.rating}</span>
                                  <span className="font-mono text-xs" style={{ color }}>
                                    ₹{p.basePrice.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Awards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="font-display text-3xl tracking-wider text-white mb-4">AUCTION AWARDS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: '💎',
                title: 'Best Squad Quality',
                team: scored.sort((a, b) => b.quality - a.quality)[0],
                stat: (s: TeamScore) => `${s.quality}/100 quality`,
              },
              {
                icon: '⚖️',
                title: 'Best Squad Balance',
                team: scored.sort((a, b) => b.balance - a.balance)[0],
                stat: (s: TeamScore) => `${s.balance}/100 balance`,
              },
              {
                icon: '💰',
                title: 'Best Value For Money',
                team: scored.sort((a, b) => b.value - a.value)[0],
                stat: (s: TeamScore) => `₹${s.team.budget.toFixed(1)}Cr remaining`,
              },
            ].map(award => {
              const color = award.team?.team.city ? CITY_COLORS[award.team.team.city] : '#E8B84B';
              return (
                <div
                  key={award.title}
                  className="bg-[#111114] border rounded-2xl p-5"
                  style={{ borderColor: `${color}25` }}
                >
                  <div className="text-2xl mb-3">{award.icon}</div>
                  <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#5A5A6A] mb-1">
                    {award.title}
                  </div>
                  <div className="font-semibold text-white text-sm mb-1">
                    {award.team?.team.name}
                  </div>
                  <div className="font-mono text-xs" style={{ color }}>
                    {award.team ? award.stat(award.team) : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* AUCTION RECAP: SOLD & UNSOLD */}
        <div className="mt-20 pt-16 border-t border-white/5 pb-20">
          <h2 className="font-display text-4xl tracking-[0.2em] text-center mb-16 text-white uppercase">
            Auction Recap
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Sold Players Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                <h3 className="text-xl font-bold tracking-widest text-[#222226] uppercase">Sold Players</h3>
              </div>
              
              <div className="space-y-3">
                {getAuctionHistory(room).soldPlayers.length === 0 ? (
                    <p className="text-[#5A5A6A] italic">No players were sold.</p>
                ) : (
                  getAuctionHistory(room).soldPlayers.map(p => {
                    const teamColor = p.buyingTeam.city ? CITY_COLORS[p.buyingTeam.city] : '#E8B84B';
                    return (
                      <div 
                        key={p.id} 
                        className="bg-white/2 border border-white/5 rounded-2xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/3 flex items-center justify-center text-[10px] font-bold text-[#5A5A6A] border border-white/5">
                            {ROLE_META[p.role]?.label}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{p.name}</div>
                            <div 
                              className="text-[10px] font-semibold tracking-widest uppercase mt-0.5"
                              style={{ color: teamColor }}
                            >
                              {p.buyingTeam.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-xs font-bold text-[#E8B84B]">₹{p.basePrice.toFixed(1)} Cr</div>
                          <div className="text-[9px] text-[#5A5A6A] uppercase tracking-widest mt-0.5">Value</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Unsold Players Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-6 bg-[#5A5A6A] rounded-full" />
                <h3 className="text-xl font-bold tracking-widest text-[#222226] uppercase">Unsold Players</h3>
              </div>

              <div className="space-y-3">
                {getAuctionHistory(room).unsoldPlayers.length === 0 ? (
                  <p className="text-[#5A5A6A] italic">No players went unsold.</p>
                ) : (
                  getAuctionHistory(room).unsoldPlayers.map(p => (
                    <div 
                      key={p.id} 
                      className="bg-white/2 border border-dashed border-white/5 rounded-2xl p-4 flex items-center justify-between opacity-60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#18181C] flex items-center justify-center text-[10px] font-bold text-[#3A3A4A]">
                          {ROLE_META[p.role]?.label}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#8A8A9A]">{p.name}</div>
                          <div className="text-[10px] text-[#5A5A6A] uppercase tracking-widest mt-0.5">
                            {p.nationality}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs text-[#5A5A6A]">₹{p.basePrice.toFixed(1)} Cr</div>
                        <div className="text-[9px] text-[#3A3A4A] uppercase tracking-widest mt-0.5">Base Price</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
