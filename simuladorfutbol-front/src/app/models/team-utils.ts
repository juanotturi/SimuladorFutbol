import { Team } from './team.model';

export function isSelectionTeam(team: Team): boolean {
  return !team.league;
}

export function isClubTeam(team: Team): boolean {
  return !!team.league && team.league !== 'Sin competencia';
}

export function sortLeagues(leagues: string[]): string[] {
  return [...leagues].sort((a, b) => {
    const mA = a.match(/\(([^)]+)\)/);
    const mB = b.match(/\(([^)]+)\)/);

    const hasA = !!mA;
    const hasB = !!mB;

    if (hasA && !hasB) return -1;
    if (!hasA && hasB) return 1;

    if (!hasA && !hasB) return a.localeCompare(b, 'es');

    const [countryA, levelAStr = '999'] = mA![1].split(' ');
    const [countryB, levelBStr = '999'] = mB![1].split(' ');

    const byCountry = countryA.localeCompare(countryB, 'es');
    if (byCountry !== 0) return byCountry;

    const levelA = parseInt(levelAStr, 10);
    const levelB = parseInt(levelBStr, 10);
    return (isNaN(levelA) ? 999 : levelA) - (isNaN(levelB) ? 999 : levelB);
  });
}

export function getUniqueConfederations(teams: Team[]): string[] {
  const confSet = new Set<string>();
  teams.forEach(team => {
    if (team.confederation) {
      confSet.add(team.confederation);
    }
  });
  return Array.from(confSet).sort((a, b) => a.localeCompare(b, 'es'));
}

export function getUniqueLeagues(teams: Team[]): string[] {
  const leagueSet = new Set<string>();
  teams.forEach(team => {
    if (team.league && team.league !== 'Sin competencia') {
      leagueSet.add(team.league);
    }
  });
  return sortLeagues(Array.from(leagueSet));
}

export function getSecondLevelOptions(teams: Team[], type: 'SELECCION' | 'CLUB' | null): string[] {
  if (type === 'SELECCION') {
    return getUniqueConfederations(teams);
  }
  if (type === 'CLUB') {
    return getUniqueLeagues(teams);
  }
  return [];
}

export function filterTeamsByTypeAndGroup(
  teams: Team[],
  type: 'SELECCION' | 'CLUB' | null,
  filterConfLeague: string | null
): Team[] {
  return teams
    .filter(team => {
      if (type === 'SELECCION') {
        return isSelectionTeam(team);
      }
      if (type === 'CLUB') {
        return isClubTeam(team);
      }
      return false;
    })
    .filter(team => {
      if (!filterConfLeague) {
        return true;
      }
      return team.confederation === filterConfLeague || team.league === filterConfLeague;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
