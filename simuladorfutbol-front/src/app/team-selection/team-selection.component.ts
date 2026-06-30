import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Team } from '../models/team.model';
import { getSecondLevelOptions, filterTeamsByTypeAndGroup } from '../models/team-utils';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-team-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './team-selection.component.html',
  styleUrls: ['./team-selection.component.scss']
})
export class TeamSelectionComponent implements OnInit {
  tournamentType: 'Liga' | 'Play-off' | 'Grupos y Play-off' | null = null;
  teamCount = 2;
  groupCount: number | null = null;
  playoffTeams: number | null = null;
  tieBreakMethod: 'olympic' | 'goalDifference' | null = null;

  teams: Team[] = [];
  isLoading = false;

  typeSelection: 'SELECCION' | 'CLUB' | null = null;
  filterConfLeague: string | null = null;
  selectedTeam?: Team;
  selectedTeams: Team[] = [];
  assetsBaseUrl = environment.assetsBaseUrl;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const type = params.get('type');
      if (type === 'Liga' || type === 'Play-off' || type === 'Grupos y Play-off') {
        this.tournamentType = type;
      }

      const teamCountParam = Number(params.get('teamCount'));
      if (!isNaN(teamCountParam) && teamCountParam > 0) {
        this.teamCount = teamCountParam;
      }

      const groupCountParam = Number(params.get('groupCount'));
      this.groupCount = !isNaN(groupCountParam) && groupCountParam > 0 ? groupCountParam : null;

      const playoffTeamsParam = Number(params.get('playoffTeams'));
      this.playoffTeams = !isNaN(playoffTeamsParam) && playoffTeamsParam > 0 ? playoffTeamsParam : null;

      const tieBreakParam = params.get('tieBreak');
      if (tieBreakParam === 'olympic' || tieBreakParam === 'goalDifference') {
        this.tieBreakMethod = tieBreakParam;
      }
    });

    this.loadTeams();
  }

  loadTeams() {
    this.isLoading = true;
    this.apiService.getTeams().subscribe({
      next: (data) => {
        this.teams = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getSecondLevelOptions(type: 'SELECCION' | 'CLUB' | null): string[] {
    return getSecondLevelOptions(this.teams, type);
  }

  get filteredTeams(): Team[] {
    return filterTeamsByTypeAndGroup(this.teams, this.typeSelection, this.filterConfLeague);
  }

  get remainingSlots(): number {
    return Math.max(0, this.teamCount - this.selectedTeams.length);
  }

  get bracketSize(): number {
    if (!this.teamCount || this.teamCount <= 1) {
      return 1;
    }
    return 2 ** Math.ceil(Math.log2(this.teamCount));
  }

  get byes(): number {
    return this.bracketSize - this.teamCount;
  }

  get firstRoundMatches(): number {
    return Math.max(0, (this.teamCount - this.byes) / 2);
  }

  get mainDrawRounds(): { label: string; slots: number }[] {
    if (!this.teamCount) {
      return [];
    }

    const rounds = [];
    let slots = this.bracketSize;

    while (slots >= 2) {
      let label: string;
      if (slots === 2) {
        label = 'Final';
      } else if (slots === 4) {
        label = 'Semifinal';
      } else if (slots === 8) {
        label = 'Cuartos';
      } else if (slots === 16) {
        label = 'Octavos';
      } else {
        label = `${slots}avos`;
      }

      rounds.push({ label, slots });
      slots /= 2;
    }

    return rounds;
  }

  get groupSizes(): number[] {
    if (!this.teamCount || !this.groupCount || this.groupCount < 1) {
      return [];
    }

    const base = Math.floor(this.teamCount / this.groupCount);
    const remainder = this.teamCount % this.groupCount;
    return Array.from({ length: this.groupCount }, (_, index) => index < remainder ? base + 1 : base);
  }

  get groupAssignments(): Team[][] {
    const sizes = this.groupSizes;
    const assignments: Team[][] = [];
    let teamIndex = 0;

    for (const size of sizes) {
      const groupTeams = this.selectedTeams.slice(teamIndex, teamIndex + size);
      assignments.push(groupTeams);
      teamIndex += size;
    }

    return assignments;
  }

  addSelectedTeam() {
    if (!this.selectedTeam || this.remainingSlots <= 0) {
      return;
    }

    if (this.selectedTeams.some(team => team.id === this.selectedTeam!.id)) {
      return;
    }

    this.selectedTeams = [...this.selectedTeams, this.selectedTeam];
  }

  addGroupTeams() {
    if (!this.filterConfLeague || !this.typeSelection || this.remainingSlots <= 0) {
      return;
    }

    const toAdd = this.filteredTeams.filter(team => !this.selectedTeams.some(selected => selected.id === team.id));
    const candidates = toAdd.slice(0, this.remainingSlots);
    this.selectedTeams = [...this.selectedTeams, ...candidates];
  }

  getRoundSlotNumbers(slots: number): number[] {
    return Array.from({ length: slots / 2 }, (_, index) => index + 1);
  }

  getGroupSlotNumbers(groupIndex: number): number[] {
    const length = this.groupSizes[groupIndex] ?? 0;
    return Array.from({ length }, (_, index) => index + 1);
  }

  isTeamSelected(team: Team): boolean {
    return this.selectedTeams.some(selected => selected.id === team.id);
  }

  removeSelectedTeam(team: Team) {
    this.selectedTeams = this.selectedTeams.filter(selected => selected.id !== team.id);
  }

  get teamSlots(): number[] {
    return Array.from({ length: this.teamCount }, (_, index) => index + 1);
  }

  getSlotTeamName(slot: number): string {
    const team = this.selectedTeams[slot - 1];
    return team ? team.name : 'Vacío';
  }

  getGroupSlotTeamName(groupIndex: number, slot: number): string {
    const group = this.groupAssignments[groupIndex] || [];
    const team = group[slot - 1];
    return team ? team.name : 'Vacío';
  }

  goBack() {
    this.router.navigate(['/create-tournament']);
  }
}
