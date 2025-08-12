import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Team } from '../../models/team.model';
import { MatchResult } from '../../models/match-result.model';
import { count, forkJoin, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Player } from '../../models/player.model';

@Component({
  selector: 'app-play-match',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './play-match.component.html',
  styleUrls: ['./play-match.component.scss']
})
export class PlayMatchComponent implements OnInit {
  @ViewChild('scrollPanel') scrollPanel?: ElementRef<HTMLDivElement>;
  apiBaseUrl = environment.apiBaseUrl;
  assetsBaseUrl = environment.assetsBaseUrl;
  teams: Team[] = [];
  isLoading = false;
  matchResult?: MatchResult;
  goalTimelineA: number[] = [];
  goalTimelineB: number[] = [];
  liveGoalsA = 0;
  liveGoalsB = 0;
  incidentsLog: string[] = [];
  isMatchInProgress = false;
  isMatchPlayed = false;
  private teamHasPlayers = new Map<number, boolean>();
  lastTeamA: Team | null = null;
  lastTeamB: Team | null = null;
  lastTypeA: 'SELECCION' | 'CLUB' | null = null;
  lastTypeB: 'SELECCION' | 'CLUB' | null = null;
  lastConfA: string | null = null;
  lastConfB: string | null = null;
  penaltyPlayersByTeam = new Map<number, { name: string }[]>();
  allPlayersByTeam = new Map<number, { name: string, position: string }[]>();
  missedPenaltiesA: { minute: number, team: Team }[] = [];
  missedPenaltiesB: { minute: number, team: Team }[] = [];
  redCardsA: number[] = [];
  redCardsB: number[] = [];
  private expelledByTeam = new Map<number, { name: string; minute: number }[]>();
  private preparedRedCards = new Map<number, Map<number, string | null>>();

  placeholderImage = '/assets/placeholder_pelota.png';

  penaltyShootoutActive = false;
  penaltyVisible = false;
  penaltyTurns: ('✅' | '❌')[][] = [[], []];
  currentShooter: 0 | 1 = 0;
  lastShooters: string[] = ['', ''];
  penaltyWinner: Team | null = null;
  maxPenalties: number = 5;
  isSuddenDeath = false;
  isPenaltyInProgress = false;
  penaltyShootoutLog: string[] = [];

  typeA: 'SELECCION' | 'CLUB' | null = null;
  filterAConfLeague: string | null = null;
  selectedTeamA?: Team;

  typeB: 'SELECCION' | 'CLUB' | null = null;
  filterBConfLeague: string | null = null;
  selectedTeamB?: Team;

  uniqueConfederations: string[] = [];
  uniqueLeagues: string[] = [];

  durations = [
    { label: 'Instantáneo', value: 0 },
    { label: '30 segundos', value: 30_000 },
    { label: '1 minuto', value: 60_000 },
    { label: '5 minutos', value: 300_000 },
    { label: '10 minutos', value: 600_000 }
  ];
  selectedDuration = 0;

  matchClock = 0;
  matchInterval: any;
  matchTimer: any = null;
  penaltyGoals: any;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams() {
    this.isLoading = true;
    this.apiService.getTeams().subscribe({
      next: (data) => {
        this.teams = data;
        this.extractUniqueFilters(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading teams', err);
        this.isLoading = false;
      }
    });
  }

  extractUniqueFilters(teams: Team[]) {
    const confSet = new Set<string>();
    const leagueSet = new Set<string>();

    teams.forEach(team => {
      if (team.confederation) {
        confSet.add(team.confederation);
      }
      if (team.league) {
        leagueSet.add(team.league);
      }
    });

    this.uniqueConfederations = Array.from(confSet).sort();

    this.uniqueLeagues = Array.from(leagueSet).sort((a, b) => {
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

  getSecondLevelOptions(type: 'SELECCION' | 'CLUB' | null): string[] {
    if (type === 'SELECCION') return this.uniqueConfederations;
    if (type === 'CLUB') return this.uniqueLeagues;
    return [];
  }

  getCurrentPenaltyShooter(): string {
    const teamIndex = this.currentShooter;
    const team = teamIndex === 0 ? this.selectedTeamA : this.selectedTeamB;
    const teamId = team?.id;
    const teamName = team?.name ?? 'Equipo';

    if (!teamId) return teamName;

    const shooters = this.penaltyPlayersByTeam.get(teamId);
    if (!shooters || shooters.length === 0) {
      this.lastShooters[teamIndex] = '';
      return teamName;
    }

    const shotsTaken = this.penaltyTurns[teamIndex].length;
    const shooter = shooters[shotsTaken % shooters.length];
    this.lastShooters[teamIndex] = shooter.name;
    return shooter.name;
  }

  get filteredTeamsA(): Team[] {
    return this.teams
      .filter(t => this.typeA === 'SELECCION' ? !t.league : !!t.league)
      .filter(t => this.filterAConfLeague ? (t.confederation === this.filterAConfLeague || t.league === this.filterAConfLeague) : true)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get filteredTeamsB(): Team[] {
    return this.teams
      .filter(t => this.typeB === 'SELECCION' ? !t.league : !!t.league)
      .filter(t => this.filterBConfLeague ? (t.confederation === this.filterBConfLeague || t.league === this.filterBConfLeague) : true)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  playMatch() {
    if (!this.selectedTeamA || !this.selectedTeamB) {
      alert('Selecciona ambos equipos');
      return;
    }
    if (this.selectedTeamA === this.selectedTeamB) {
      alert('No se puede repetir el mismo equipo');
      return;
    }

    this.lastTeamA = this.selectedTeamA;
    this.lastTeamB = this.selectedTeamB;
    this.lastTypeA = this.typeA;
    this.lastTypeB = this.typeB;
    this.lastConfA = this.filterAConfLeague;
    this.lastConfB = this.filterBConfLeague;

    this.liveGoalsA = 0;
    this.liveGoalsB = 0;
    this.isMatchPlayed = false;
    this.matchResult = undefined;
    this.matchClock = 0;
    this.isMatchInProgress = true;
    this.expelledByTeam.clear();
    this.incidentsLog = [];

    const idA = this.selectedTeamA.id;
    const idB = this.selectedTeamB.id;

    forkJoin({
      a: this.teamHasPlayers.has(idA) ? of(this.teamHasPlayers.get(idA)!) : this.apiService.hasPlayers(idA),
      b: this.teamHasPlayers.has(idB) ? of(this.teamHasPlayers.get(idB)!) : this.apiService.hasPlayers(idB),
      aPlayers: this.apiService.getPlayersByTeam(idA),
      bPlayers: this.apiService.getPlayersByTeam(idB)
    }).subscribe({
      next: ({ a, b, aPlayers, bPlayers }) => {
        this.teamHasPlayers.set(idA, !!a);
        this.teamHasPlayers.set(idB, !!b);
        this.allPlayersByTeam.set(idA, aPlayers);
        this.allPlayersByTeam.set(idB, bPlayers);

        const redCardsA = this.generateRedCardMinutes();
        const redCardsB = this.generateRedCardMinutes();

        const penaltyA = this.calculateRedCardScoreReduction(redCardsA);
        const penaltyB = this.calculateRedCardScoreReduction(redCardsB);

        const adjustedScoreA = Math.max(this.selectedTeamA!.score - penaltyA, 0);
        const adjustedScoreB = Math.max(this.selectedTeamB!.score - penaltyB, 0);

        this.redCardsA = redCardsA;
        this.redCardsB = redCardsB;

        this.finalizeMatch(adjustedScoreA, adjustedScoreB);
      },
      error: () => {
        this.teamHasPlayers.set(idA, false);
        this.teamHasPlayers.set(idB, false);

        const redCardsA = this.generateRedCardMinutes();
        const redCardsB = this.generateRedCardMinutes();

        const penaltyA = this.calculateRedCardScoreReduction(redCardsA);
        const penaltyB = this.calculateRedCardScoreReduction(redCardsB);

        const adjustedScoreA = Math.max(this.selectedTeamA!.score - penaltyA, 0);
        const adjustedScoreB = Math.max(this.selectedTeamB!.score - penaltyB, 0);

        this.redCardsA = redCardsA;
        this.redCardsB = redCardsB;

        this.finalizeMatch(adjustedScoreA, adjustedScoreB);
      }
    });
  }

  private finalizeMatch(adjustedScoreA: number, adjustedScoreB: number): void {
    const teamA = this.selectedTeamA!;
    const teamB = this.selectedTeamB!;

    this.prepareRedCardData(teamA, this.redCardsA);
    this.prepareRedCardData(teamB, this.redCardsB);

    this.apiService.getMatchResult(adjustedScoreA, adjustedScoreB).subscribe({
      next: (result) => {
        this.matchResult = result;
        this.generateMissedPenalties();
        this.generateGoalTimeline();
        this.startMatchClock();
      },
      error: () => { this.isLoading = false; }
    });
  }

  private prepareRedCardData(team: Team, redCardMinutes: number[]): void {
    const teamId = team.id;
    const hasPlayers = this.teamHasPlayers.get(teamId) === true;
    const players = this.allPlayersByTeam.get(teamId) ?? [];

    const perMinute = new Map<number, string | null>();

    for (const minute of redCardMinutes) {
      let expelledName: string | null = null;

      if (hasPlayers) {
        const candidates = players.filter(p => p.position && p.position.trim() !== '');

        const DEF = candidates.filter(p => p.position === 'DEF');
        const VOL = candidates.filter(p => p.position === 'VOL');
        const DEL = candidates.filter(p => p.position === 'DEL');

        const weighted: typeof candidates = [];
        DEF.forEach(p => weighted.push(...Array(5).fill(p)));
        VOL.forEach(p => weighted.push(...Array(3).fill(p)));
        DEL.forEach(p => weighted.push(...Array(2).fill(p)));

        if (weighted.length > 0) {
          const expelled = weighted[Math.floor(Math.random() * weighted.length)];
          expelledName = expelled.name;

          if (!this.expelledByTeam.has(teamId)) this.expelledByTeam.set(teamId, []);
          this.expelledByTeam.get(teamId)!.push({ name: expelledName, minute });
        }
      }

      perMinute.set(minute, expelledName);
    }

    this.preparedRedCards.set(teamId, perMinute);
  }

  private pushRedCardLogIfMinute(team: Team, minute: number): void {
    const map = this.preparedRedCards.get(team.id);
    if (!map) return;
    if (!map.has(minute)) return;

    const name = map.get(minute);
    let log = `🟥 Roja para ${team.name}`;
    if (name) log += ` — ${name}`;
    log += ` (${minute}')`;
    this.incidentsLog.push(log);
    this.scrollToBottom();
  }

  private getExpelledNamesUpTo(teamId: number, minute: number): Set<string> {
    const list = this.expelledByTeam.get(teamId) ?? [];
    return new Set(list.filter(e => e.minute <= minute).map(e => e.name));
  }

  private getEligiblePlayers(teamId: number, minute: number): Player[] {
    const all = (this.allPlayersByTeam.get(teamId) ?? []) as Player[];
    if (!all.length) return [];
    const expelled = this.getExpelledNamesUpTo(teamId, minute);
    return all.filter(p => !expelled.has(p.name));
  }

  private pickWeighted<T extends { goalProbability?: number }>(items: T[], getWeight: (x: T) => number): T | null {
    let sum = 0;
    for (const it of items) sum += Math.max(0, getWeight(it));
    if (sum <= 0) return items.length ? items[Math.floor(Math.random() * items.length)] : null;
    let r = Math.random() * sum;
    for (const it of items) {
      r -= Math.max(0, getWeight(it));
      if (r <= 0) return it;
    }
    return items[items.length - 1] ?? null;
  }

  private pickScorerName(teamId: number, minute: number, forPenalty: boolean): string | null {
    let eligible = this.getEligiblePlayers(teamId, minute);
    if (!eligible.length) return null;

    if (forPenalty) {
      const shooters = eligible.filter(p => p.isPenaltyShooter);
      if (shooters.length) eligible = shooters;
    }

    const picked = this.pickWeighted(eligible, (p) => p.goalProbability ?? 1);
    return picked?.name ?? null;
  }

  adjustPenaltyShootersForRedCards(): void {
    const teamIds = Array.from(this.penaltyPlayersByTeam.keys());

    for (const teamId of teamIds) {
      const shooters = (this.penaltyPlayersByTeam.get(teamId) ?? []) as Player[];
      const expelledNames: string[] = (this.expelledByTeam.get(teamId) ?? []).map(e => e.name);

      const filteredShooters: Player[] = shooters.filter(p => !expelledNames.includes(p.name));
      const reordered: Player[] = filteredShooters.map((p, idx) => ({ ...p, penaltyOrder: idx + 1 }));

      this.penaltyPlayersByTeam.set(teamId, reordered);
    }

    const countA = this.penaltyPlayersByTeam.get(teamIds[0])?.length || 0;
    const countB = this.penaltyPlayersByTeam.get(teamIds[1])?.length || 0;

    if (countA === 11 && countB === 10) {
      const shootersA = this.penaltyPlayersByTeam.get(teamIds[0])! as Player[];
      const reduced = shootersA.filter(p => p.penaltyOrder !== 11);
      this.penaltyPlayersByTeam.set(teamIds[0], reduced);
    }

    if (countB === 11 && countA === 10) {
      const shootersB = this.penaltyPlayersByTeam.get(teamIds[1])! as Player[];
      const reduced = shootersB.filter(p => p.penaltyOrder !== 11);
      this.penaltyPlayersByTeam.set(teamIds[1], reduced);
    }
  }

  simulateRedCardForTeam(team: Team, players: Player[], minute: number): void {
    const hasPlayers = players && players.length > 0;
    let log = `🔴 Roja para ${team.name} (${minute}')`;

    if (hasPlayers) {
      const candidates = players.filter(p => p.position !== '');

      const grouped = {
        DEF: candidates.filter(p => p.position === 'DEF'),
        VOL: candidates.filter(p => p.position === 'VOL'),
        DEL: candidates.filter(p => p.position === 'DEL'),
      };

      const weightedPool: Player[] = [];
      grouped.DEF.forEach(p => weightedPool.push(...Array(5).fill(p)));
      grouped.VOL.forEach(p => weightedPool.push(...Array(3).fill(p)));
      grouped.DEL.forEach(p => weightedPool.push(...Array(2).fill(p)));

      if (weightedPool.length > 0) {
        const expelled = weightedPool[Math.floor(Math.random() * weightedPool.length)];
        log += ` — ${expelled.name}`;

        if (!this.expelledByTeam.has(team.id)) {
          this.expelledByTeam.set(team.id, []);
        }

        this.expelledByTeam.get(team.id)!.push({ name: expelled.name, minute });
      }
    }

    this.incidentsLog.push(log);
    this.scrollToBottom();
  }

  repeatMatch(): void {
    if (this.lastTeamA && this.lastTeamB && this.lastTypeA && this.lastTypeB) {
      this.typeA = this.lastTypeA;
      this.typeB = this.lastTypeB;
      this.filterAConfLeague = this.lastConfA;
      this.filterBConfLeague = this.lastConfB;
      this.selectedTeamA = this.lastTeamA;
      this.selectedTeamB = this.lastTeamB;
      this.liveGoalsA = 0;
      this.liveGoalsB = 0;
      this.matchResult = undefined;
      this.isMatchPlayed = false;
      this.penaltyShootoutActive = false;
      this.isPenaltyInProgress = false;
      this.penaltyVisible = false;
      this.penaltyWinner = null;
      this.penaltyTurns = [[], []];
      this.isSuddenDeath = false;
      this.matchClock = 0;
      this.incidentsLog = [];
      this.isMatchInProgress = false;
      this.penaltyShootoutLog = [];
    }
  }

  generateGoalTimeline() {
    const goalsA = this.matchResult?.goalsTeamA ?? 0;
    const goalsB = this.matchResult?.goalsTeamB ?? 0;
    const totalGoals = goalsA + goalsB;

    if (totalGoals === 0) {
      this.goalTimelineA = [];
      this.goalTimelineB = [];
      return;
    }

    const minSeparation = 1;
    const availableMinutes = new Set<number>();

    for (let i = 1; i <= 90; i++) {
      availableMinutes.add(i);
    }

    const goalMinutes: number[] = [];

    while (goalMinutes.length < totalGoals && availableMinutes.size > 0) {
      const minutesArray = Array.from(availableMinutes);
      const randomIndex = Math.floor(Math.random() * minutesArray.length);
      const candidate = minutesArray[randomIndex];

      goalMinutes.push(candidate);

      for (let i = candidate - minSeparation; i <= candidate + minSeparation; i++) {
        availableMinutes.delete(i);
      }
    }

    goalMinutes.sort((a, b) => a - b);

    const shuffled = goalMinutes.sort(() => Math.random() - 0.5);
    this.goalTimelineA = shuffled.slice(0, goalsA).sort((a, b) => a - b);
    this.goalTimelineB = shuffled.slice(goalsA).sort((a, b) => a - b);
  }

  private pushIncidentsLog(team: Team, minute: number, side: 'A' | 'B') {
    const teamId = team.id;
    const has = this.teamHasPlayers.get(teamId) === true;
    const isPenaltyGoal = Math.floor(Math.random() * 10) === 0;

    if (!has) {
      const penaltyTag = isPenaltyGoal ? ' —P—' : '';
      this.incidentsLog.push(`⚽ Gol de ${team.name}${penaltyTag} (${minute}')`);
      this.scrollToBottom();
      return;
    }

    const authorName = this.pickScorerName(teamId, minute, isPenaltyGoal);
    const authorText = authorName ? ` — ${authorName}` : '';
    const penaltyTag = isPenaltyGoal ? ' —P—' : '';
    this.incidentsLog.push(`⚽ Gol de ${team.name}${authorText}${penaltyTag} (${minute}')`);
    this.scrollToBottom();
  }

  startMatchClock() {
    const duration = this.selectedDuration;
    const intervalTime = duration / 90;
    let minute = 0;

    this.matchTimer = setInterval(() => {
      minute++;
      this.matchClock = minute;

      if (this.selectedTeamA && this.redCardsA.includes(minute)) {
        this.pushRedCardLogIfMinute(this.selectedTeamA, minute);
      }
      if (this.selectedTeamB && this.redCardsB.includes(minute)) {
        this.pushRedCardLogIfMinute(this.selectedTeamB, minute);
      }

      const allMissed = [...this.missedPenaltiesA, ...this.missedPenaltiesB];
      const missedNow = allMissed.filter(mp => mp.minute === minute);
      missedNow.forEach(mp => this.pushMissedPenaltyLog(mp.team, minute));

      if (this.goalTimelineA.includes(minute) && this.selectedTeamA) {
        this.liveGoalsA++;
        this.pushIncidentsLog(this.selectedTeamA, minute, 'A');
      }
      if (this.goalTimelineB.includes(minute) && this.selectedTeamB) {
        this.liveGoalsB++;
        this.pushIncidentsLog(this.selectedTeamB, minute, 'B');
      }

      if (minute >= 90) {
        clearInterval(this.matchTimer);
        this.isMatchPlayed = true;
      }
    }, intervalTime);
  }

  private pushMissedPenaltyLog(team: Team, minute: number) {
    const teamId = team.id;
    const has = this.teamHasPlayers.get(teamId) === true;
    const teamName = team.name;

    const outcomeRoll = Math.floor(Math.random() * 6) + 1;
    const genericText = 'erró un penal';

    const shooterNamePicked = this.pickScorerName(teamId, minute, true);
    this.apiService.getRandomScorer(teamId, true).subscribe({
      next: (author) => {
        const shooterName = author?.name ?? '';
        const isGenericShooter = !shooterName || shooterName.trim() === '';
        const shooterPart = isGenericShooter ? '' : ` ${shooterName}`;

        switch (outcomeRoll) {
          case 1:
          case 2:
            const goalkeeperName = this.getGoalkeeperName(teamId === this.selectedTeamA?.id ? 1 : 0);
            const hasGoalkeeper = goalkeeperName !== 'el arquero';
            const hasShooter = !isGenericShooter;

            let atajadaTexto = '';

            if (!hasGoalkeeper && !hasShooter) {
              atajadaTexto = 'Atajó el arquero';
            } else if (hasGoalkeeper && !hasShooter) {
              atajadaTexto = `Atajó ${goalkeeperName}`;
            } else if (!hasGoalkeeper && hasShooter) {
              atajadaTexto = `Atajó el arquero a${shooterPart}`;
            } else {
              atajadaTexto = `Atajó ${goalkeeperName} a${shooterPart}`;
            }

            this.incidentsLog.push(`❌ ${teamName} ` + genericText + ` 🧤 ${atajadaTexto} (${minute}')`);
            this.scrollToBottom();
            break;

          case 3:
            if (isGenericShooter) {
              this.incidentsLog.push(`❌ ${teamName} ` + genericText + ` 🥅 Travesaño (${minute}')`);
              this.scrollToBottom();
            } else {
              this.incidentsLog.push(`❌ ${teamName} ` + genericText + ` 🥅 Travesaño de${shooterPart} (${minute}')`);
              this.scrollToBottom();
            }
            break;

          case 4:
            if (isGenericShooter) {
              this.incidentsLog.push(`❌ ${teamName} ` + genericText + ` 🥅 Palo (${minute}')`);
              this.scrollToBottom();
            } else {
              this.incidentsLog.push(`❌ ${teamName} ` + genericText + ` 🥅 Palo de${shooterPart} (${minute}')`);
              this.scrollToBottom();
            }
            break;

          case 5:
          case 6:
            this.incidentsLog.push(`❌ ${teamName} ` + genericText + ` 🎯 Afuera${shooterPart} (${minute}')`);
            this.scrollToBottom();
            break;
        }
      },
      error: () => {
        this.incidentsLog.push(`❌ Penal errado de ${teamName} (${minute}')`);
        this.scrollToBottom();
      }
    });
  }

  private generateMissedPenalties() {
    const chances = [0, 1, 2];
    const weights = [0.97, 0.029, 0.001];

    const getCount = () => {
      const r = Math.random();
      let acc = 0;
      for (let i = 0; i < weights.length; i++) {
        acc += weights[i];
        if (r < acc) return chances[i];
      }
      return 0;
    };
    const assignMinutes = (count: number): number[] => {
      const set = new Set<number>();
      while (set.size < count) {
        const m = Math.floor(Math.random() * 90) + 1;
        set.add(m);
      }
      return Array.from(set).sort((a, b) => a - b);
    };
    const countA = getCount();
    const minutesA = assignMinutes(countA);
    this.missedPenaltiesA = minutesA.map(minute => ({ minute, team: this.selectedTeamA! }));
    const countB = getCount();
    const minutesB = assignMinutes(countB);
    this.missedPenaltiesB = minutesB.map(minute => ({ minute, team: this.selectedTeamB! }));
  }

  getMatchDurationInSeconds(): number {
    return this.selectedDuration / 1000;
  }

  fetchMatchResult() {
    this.isLoading = true;
    this.apiService.getMatchResult(this.selectedTeamA!.score, this.selectedTeamB!.score).subscribe({
      next: (result) => {
        this.matchResult = result;
        this.isMatchPlayed = true;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private generateRedCardMinutes(): number[] {
    const chances = [0, 1, 2, 3];
    const weights = [0.88, 0.1, 0.019, 0.001];
    const getCount = () => {
      const r = Math.random();
      let acc = 0;
      for (let i = 0; i < weights.length; i++) {
        acc += weights[i];
        if (r < acc) return chances[i];
      }
      return 0;
    };
    const assignMinutes = (count: number): number[] => {
      const set = new Set<number>();
      while (set.size < count) {
        const m = Math.floor(Math.random() * 90) + 1;
        set.add(m);
      }
      return Array.from(set).sort((a, b) => a - b);
    };

    return assignMinutes(getCount());
  }

  private calculateRedCardScoreReduction(minutes: number[]): number {
    return minutes.reduce((total, min) => {
      if (min <= 20) return total + 5;
      if (min <= 45) return total + 4;
      if (min <= 60) return total + 3;
      if (min <= 80) return total + 2;
      return total + 1;
    }, 0);
  }

  startPenaltyShootout() {
    this.penaltyPlayersByTeam.clear();
    this.penaltyShootoutLog = [];
    this.allPlayersByTeam.clear();
    this.lastShooters = ['', ''];

    const idA = this.selectedTeamA?.id;
    const idB = this.selectedTeamB?.id;

    if (!idA || !idB) return;

    forkJoin({
      a: this.apiService.getPlayersByTeam(idA),
      b: this.apiService.getPlayersByTeam(idB)
    }).subscribe(({ a, b }) => {
      const orderedA = a.filter(p => p.penaltyOrder > 0).sort((x, y) => x.penaltyOrder - y.penaltyOrder);
      const orderedB = b.filter(p => p.penaltyOrder > 0).sort((x, y) => x.penaltyOrder - y.penaltyOrder);

      this.penaltyPlayersByTeam.set(idA, orderedA);
      this.penaltyPlayersByTeam.set(idB, orderedB);
      this.adjustPenaltyShootersForRedCards();
      this.allPlayersByTeam.set(idA, a);
      this.allPlayersByTeam.set(idB, b);

      this.penaltyShootoutActive = true;
      this.isPenaltyInProgress = true;
      this.penaltyVisible = true;
      this.penaltyTurns = [[], []];
      this.penaltyWinner = null;
      this.isSuddenDeath = false;
      this.isMatchPlayed = false;

      this.currentShooter = Math.random() < 0.5 ? 0 : 1;
    });
  }

  takePenalty() {
    if (!this.penaltyShootoutActive || this.penaltyWinner) return;

    const teamIndex = this.currentShooter;
    const shooterNameResolved = this.getCurrentPenaltyShooter();

    const roll = Math.floor(Math.random() * 10) + 1;
    const result: '✅' | '❌' = roll <= 7 ? '✅' : '❌';

    this.penaltyTurns[teamIndex].push(result);

    const team = teamIndex === 0 ? this.selectedTeamA : this.selectedTeamB;
    const teamName = team?.name ?? 'Equipo';

    const isGenericShooter =
      !shooterNameResolved || shooterNameResolved.trim() === '' || shooterNameResolved === teamName;
    const shooterPart = isGenericShooter ? '' : ` ${shooterNameResolved}`;

    if (result === '✅') {
      this.penaltyShootoutLog.push(`✅ ${teamName} ⚽${shooterPart}`);
    } else {
      const rival = teamIndex === 0 ? 1 : 0;
      const goalkeeperName = this.getGoalkeeperName(rival);

      switch (roll) {
        case 8: {
          const hasGoalkeeper = goalkeeperName !== 'el arquero';
          const hasShooter = !isGenericShooter;
          let atajadaTexto = '';

          if (!hasGoalkeeper && !hasShooter) atajadaTexto = 'Atajó el arquero';
          else if (hasGoalkeeper && !hasShooter) atajadaTexto = `Atajó ${goalkeeperName}`;
          else if (!hasGoalkeeper && hasShooter) atajadaTexto = `Atajó el arquero a ${shooterNameResolved}`;
          else atajadaTexto = `Atajó ${goalkeeperName} a ${shooterNameResolved}`;

          this.penaltyShootoutLog.push(`❌ ${teamName} 🧤 ${atajadaTexto}`);
          break;
        }
        case 9: {
          const paloOrTravesanio = Math.random() < 0.5 ? 'Palo' : 'Travesaño';
          const paloTexto = isGenericShooter ? paloOrTravesanio : `${paloOrTravesanio} de ${shooterNameResolved}`;
          this.penaltyShootoutLog.push(`❌ ${teamName} 🥅 ${paloTexto}`);
          break;
        }
        case 10:
          this.penaltyShootoutLog.push(`❌ ${teamName} 🎯 Afuera${shooterPart}`);
          break;
      }
    }

    this.scrollToBottom();
    this.checkPenaltyWinner();
    if (!this.penaltyWinner) this.currentShooter = teamIndex === 0 ? 1 : 0;
  }


  getGoalkeeperName(teamIndex: 0 | 1): string {
    const team = teamIndex === 0 ? this.selectedTeamA : this.selectedTeamB;
    const teamId = team?.id;
    if (!teamId) return 'el arquero';

    const players = this.allPlayersByTeam.get(teamId);
    if (!players) return 'el arquero';

    const keeper = players.find(p => p.position === 'ARQ');
    return keeper?.name ?? 'el arquero';
  }

  checkPenaltyWinner() {
    const [aResults, bResults] = this.penaltyTurns;
    const aGoals = aResults.filter(r => r === '✅').length;
    const bGoals = bResults.filter(r => r === '✅').length;

    if (!this.isSuddenDeath) {
      const aRemaining = this.maxPenalties - aResults.length;
      const bRemaining = this.maxPenalties - bResults.length;

      if (aGoals > bGoals + bRemaining) {
        this.penaltyWinner = this.selectedTeamA!;
        this.endPenalties();
        return;
      }
      if (bGoals > aGoals + aRemaining) {
        this.penaltyWinner = this.selectedTeamB!;
        this.endPenalties();
        return;
      }

      if (aResults.length === this.maxPenalties && bResults.length === this.maxPenalties) {
        if (aGoals !== bGoals) {
          this.penaltyWinner = aGoals > bGoals ? this.selectedTeamA! : this.selectedTeamB!;
          this.endPenalties();
        } else {
          this.isSuddenDeath = true;
        }
        return;
      }
    } else {
      if (aResults.length > this.maxPenalties && bResults.length > this.maxPenalties && aResults.length === bResults.length) {
        const lastA = aResults[aResults.length - 1];
        const lastB = bResults[bResults.length - 1];
        if (lastA !== lastB) {
          this.penaltyWinner = lastA === '✅' ? this.selectedTeamA! : this.selectedTeamB!;
          this.penaltyShootoutActive = false;
          this.isPenaltyInProgress = false;
        }
      }
    }
  }

  endPenalties() {
    this.penaltyShootoutActive = false;
    this.isPenaltyInProgress = false;

    if (this.penaltyWinner && this.matchResult) {
      this.matchResult.penaltiesA = this.penaltyTurns[0].filter(r => r === '✅').length;
      this.matchResult.penaltiesB = this.penaltyTurns[1].filter(r => r === '✅').length;
    }
  }

  getPenaltySlots(teamIndex: number): ('✅' | '❌' | '⬜')[] {
    const current = this.penaltyTurns[teamIndex];
    const other = this.penaltyTurns[teamIndex === 0 ? 1 : 0];

    const maxBase = this.maxPenalties;
    const maxLength = Math.max(maxBase, current.length, other.length);

    return Array.from({ length: maxLength }, (_, idx) => current[idx] || '⬜');
  }

  get penaltiesA(): number {
    return this.penaltyVisible ? this.penaltyTurns[0].filter(r => r === '✅').length : (this.matchResult?.penaltiesA ?? 0);
  }

  get penaltiesB(): number {
    return this.penaltyVisible ? this.penaltyTurns[1].filter(r => r === '✅').length : (this.matchResult?.penaltiesB ?? 0);
  }

  isInteractionBlocked(): boolean {
    return this.isMatchPlayed || this.penaltyShootoutActive || this.penaltyWinner != null || this.isMatchInProgress;
  }

  private pickRandom(pool: Team[], excludeId?: number): Team | undefined {
    if (!pool.length) return undefined;
    if (excludeId == null) {
      const idx = Math.floor(Math.random() * pool.length);
      return pool[idx];
    }
    let candidate: Team | undefined;
    let tries = 0;
    do {
      const idx = Math.floor(Math.random() * pool.length);
      candidate = pool[idx];
      tries++;
    } while (candidate && candidate.id === excludeId && tries < 50);
    return candidate;
  }

  private applyTeamToSide(side: 'A' | 'B', team: Team): void {
    const type = team.league ? 'CLUB' as const : 'SELECCION' as const;
    const secondLevel = team.league ?? team.confederation ?? null;

    if (side === 'A') {
      this.typeA = type;
      this.filterAConfLeague = secondLevel;
      this.selectedTeamA = team;
    } else {
      this.typeB = type;
      this.filterBConfLeague = secondLevel;
      this.selectedTeamB = team;
    }
  }

  randomTeam(side: 'A' | 'B', scope: 'all' | 'filters' = 'all'): void {
    if (this.isInteractionBlocked() || !this.teams?.length) return;

    let pool: Team[] = [];
    if (scope === 'all') {
      pool = this.teams;
    } else {
      pool = side === 'A' ? this.filteredTeamsA : this.filteredTeamsB;
    }

    const otherId = side === 'A' ? this.selectedTeamB?.id : this.selectedTeamA?.id;
    const chosen = this.pickRandom(pool, otherId);

    if (chosen) {
      this.applyTeamToSide(side, chosen);
    }
  }

  private randomFromArray<T>(arr: T[]): T | undefined {
    if (!arr || arr.length === 0) return undefined;
    const idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
  }

  private getFiltered(side: 'A' | 'B'): Team[] {
    return side === 'A' ? this.filteredTeamsA : this.filteredTeamsB;
  }

  randomNext(side: 'A' | 'B'): void {
    if (this.isInteractionBlocked()) return;

    if (side === 'A') {
      if (!this.typeA) {
        this.typeA = Math.random() < 0.5 ? 'SELECCION' : 'CLUB';
        return;
      }

      if (!this.filterAConfLeague) {
        const opts = this.getSecondLevelOptions(this.typeA);
        this.filterAConfLeague = this.randomFromArray(opts) ?? null;
        return;
      }

      const otherId = this.selectedTeamB?.id;
      if (!this.selectedTeamA) {
        let pool = this.getFiltered('A');
        if (otherId != null) pool = pool.filter(t => t.id !== otherId);
        if (pool.length === 0) pool = this.getFiltered('A');
        const chosen = this.randomFromArray(pool);
        if (chosen) this.selectedTeamA = chosen;
        return;
      }

      let pool = this.getFiltered('A').filter(t => t.id !== this.selectedTeamA!.id);
      if (otherId != null) pool = pool.filter(t => t.id !== otherId);
      if (pool.length === 0) pool = this.getFiltered('A');
      const reroll = this.randomFromArray(pool);
      if (reroll) this.selectedTeamA = reroll;
      return;
    }

    if (!this.typeB) {
      this.typeB = Math.random() < 0.5 ? 'SELECCION' : 'CLUB';
      return;
    }

    if (!this.filterBConfLeague) {
      const opts = this.getSecondLevelOptions(this.typeB);
      this.filterBConfLeague = this.randomFromArray(opts) ?? null;
      return;
    }

    const otherId = this.selectedTeamA?.id;
    if (!this.selectedTeamB) {
      let pool = this.getFiltered('B');
      if (otherId != null) pool = pool.filter(t => t.id !== otherId);
      if (pool.length === 0) pool = this.getFiltered('B');
      const chosen = this.randomFromArray(pool);
      if (chosen) this.selectedTeamB = chosen;
      return;
    }

    let pool = this.getFiltered('B').filter(t => t.id !== this.selectedTeamB!.id);
    if (otherId != null) pool = pool.filter(t => t.id !== otherId);
    if (pool.length === 0) pool = this.getFiltered('B');
    const reroll = this.randomFromArray(pool);
    if (reroll) this.selectedTeamB = reroll;
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.scrollPanel?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  resetMatch() {
    this.selectedTeamA = undefined;
    this.selectedTeamB = undefined;
    this.typeA = null;
    this.typeB = null;
    this.filterAConfLeague = null;
    this.filterBConfLeague = null;
    this.liveGoalsA = 0;
    this.liveGoalsB = 0;
    this.matchResult = undefined;
    this.isMatchPlayed = false;
    this.penaltyShootoutActive = false;
    this.isPenaltyInProgress = false;
    this.penaltyVisible = false;
    this.penaltyWinner = null;
    this.penaltyTurns = [[], []];
    this.isSuddenDeath = false;
    this.matchClock = 0;
    this.incidentsLog = [];
    this.isMatchInProgress = false;
    this.penaltyShootoutLog = [];
  }
}
