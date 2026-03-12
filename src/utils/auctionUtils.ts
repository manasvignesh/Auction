import type { Room, Team } from '../../server/game';
import type { Player } from '../../server/players';

export interface SoldPlayer extends Player {
  buyingTeam: Team;
}

/**
 * Derives sold and unsold players from the room state.
 */
export function getAuctionHistory(room: Room) {
  // 1. Sold Players: Flatten all squads and tag with the team
  const soldPlayers: SoldPlayer[] = Object.values(room.teams).flatMap(team =>
    team.squad.map(player => ({
      ...player,
      buyingTeam: team,
    }))
  );

  // 2. Unsold Players: All players processed so far minus the sold ones
  const processedCount = room.auctionState.currentPlayerIndex;
  const processedPlayers = room.auctionState.playersPool.slice(0, processedCount);

  const soldIds = new Set(soldPlayers.map(p => p.id));
  const unsoldPlayers = processedPlayers.filter(p => !soldIds.has(p.id));

  return { soldPlayers, unsoldPlayers };
}
