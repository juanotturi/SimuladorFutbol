import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-tournament',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-tournament.component.html',
  styleUrl: './create-tournament.component.scss'
})
export class CreateTournamentComponent {
  tournamentTypes = ['Liga', 'Play-off', 'Grupos y Play-off'];
  selectedTournamentType: string | null = null;

  teamCount: number | null = 2;
  groupCount: number | null = null;
  playoffTeams: number | null = null;
  returnLegs = false;
  tieBreakMethod: 'olympic' | 'goalDifference' | null = null;

  get isLeagueType(): boolean {
    return this.selectedTournamentType === 'Liga';
  }

  get isPlayoffType(): boolean {
    return this.selectedTournamentType === 'Play-off';
  }

  get isGroupsType(): boolean {
    return this.selectedTournamentType === 'Grupos y Play-off';
  }

  get showGroupFields(): boolean {
    return this.isGroupsType;
  }

  get showTieBreakSelector(): boolean {
    return this.isLeagueType || this.isGroupsType;
  }

  get tieBreakMethodLabel(): string | null {
    if (this.tieBreakMethod === 'goalDifference') {
      return 'Diferencia de Gol';
    }
    if (this.tieBreakMethod === 'olympic') {
      return 'Desempate Olímpico';
    }
    return null;
  }

  get maxGroupsAllowed(): number | null {
    if (!this.teamCount) {
      return null;
    }
    return Math.floor(this.teamCount / 2);
  }

  get isTeamCountInvalid(): boolean {
    return this.teamCount != null && this.teamCount < 2;
  }

  get isGroupCountInvalid(): boolean {
    return this.showGroupFields && this.groupCount != null && this.maxGroupsAllowed != null && this.groupCount > this.maxGroupsAllowed;
  }

  get isPlayoffTeamsInvalid(): boolean {
    return this.showGroupFields && this.playoffTeams != null && this.teamCount != null && this.playoffTeams > this.teamCount;
  }

  get isPlayoffTeamsTooSmall(): boolean {
    return this.showGroupFields && this.playoffTeams != null && this.groupCount != null && this.playoffTeams < this.groupCount;
  }

  get teamsPerGroup(): number | null {
    if (this.teamCount && this.groupCount) {
      return Math.floor(this.teamCount / this.groupCount);
    }
    return null;
  }

  get teamsPerGroupText(): string | null {
    if (!this.teamCount || !this.groupCount) {
      return null;
    }

    const base = Math.floor(this.teamCount / this.groupCount);
    const remainder = this.teamCount % this.groupCount;

    if (remainder === 0) {
      return `${base}`;
    }

    const largerGroupSize = base + 1;
    const largerGroupCount = remainder;
    const smallerGroupCount = this.groupCount - remainder;

    const parts: string[] = [];
    if (smallerGroupCount > 0) {
      parts.push(`${smallerGroupCount} grupo${smallerGroupCount === 1 ? '' : 's'} de ${base}`);
    }
    if (largerGroupCount > 0) {
      parts.push(`${largerGroupCount} grupo${largerGroupCount === 1 ? '' : 's'} de ${largerGroupSize}`);
    }

    return parts.join(' y ');
  }

  get baseQualifiersPerGroup(): number | null {
    if (this.groupCount && this.playoffTeams) {
      return Math.floor(this.playoffTeams / this.groupCount);
    }
    return null;
  }

  get extraPlayoffSpots(): number | null {
    if (this.groupCount && this.playoffTeams) {
      return this.playoffTeams % this.groupCount;
    }
    return null;
  }

  get groupPlayoffExplanation(): string | null {
    if (!this.showGroupFields || this.baseQualifiersPerGroup === null || this.playoffTeams === null) {
      return null;
    }

    const base = this.baseQualifiersPerGroup;
    const extra = this.extraPlayoffSpots ?? 0;
    if (extra > 0) {
      const nextPosition = base + 1;
      return `${base} por grupo + ${extra} mejores ${nextPosition}° lugar`;
    }
    return `${base} por grupo`;
  }

  constructor(private router: Router) {}

  onTournamentTypeChange() {
    this.teamCount = 2;
    this.groupCount = this.showGroupFields ? 1 : null;
    this.playoffTeams = this.showGroupFields ? 1 : null;
    this.returnLegs = false;
    this.tieBreakMethod = this.showTieBreakSelector ? 'goalDifference' : null;
  }

  navigateToTeamSelection() {
    if (!this.selectedTournamentType) {
      return;
    }

    const queryParams: Record<string, string> = {
      type: this.selectedTournamentType,
      teamCount: String(this.teamCount ?? 2),
    };

    if (this.groupCount !== null) {
      queryParams['groupCount'] = String(this.groupCount);
    }
    if (this.playoffTeams !== null) {
      queryParams['playoffTeams'] = String(this.playoffTeams);
    }
    if (this.tieBreakMethod !== null) {
      queryParams['tieBreak'] = this.tieBreakMethod;
    }

    this.router.navigate(['/team-selection'], { queryParams });
  }

  selectTieBreakMethod(method: 'olympic' | 'goalDifference') {
    this.tieBreakMethod = method;
  }

  onTeamCountChange() {
    if (this.teamCount == null) {
      this.groupCount = null;
      this.playoffTeams = null;
    }
  }
}
