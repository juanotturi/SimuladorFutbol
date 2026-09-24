import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PlayMatchComponent } from './play-match.component';

describe('PlayMatchComponent', () => {
  let component: PlayMatchComponent;
  let fixture: ComponentFixture<PlayMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayMatchComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayMatchComponent);
    component = fixture.componentInstance;
    component.isLoading = false;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the localia radio state', () => {
    expect(component.hasLocalia).toBeFalse();
    expect(typeof component.hasLocalia).toBe('boolean');
  });

  it('should apply localia adjustment to team scores', () => {
    component.hasLocalia = true;
    expect(component.getAdjustedTeamScoreForLocalia(70, 'A')).toBe(72);
    expect(component.getAdjustedTeamScoreForLocalia(70, 'B')).toBe(68);

    component.hasLocalia = false;
    expect(component.getAdjustedTeamScoreForLocalia(70, 'A')).toBe(70);
    expect(component.getAdjustedTeamScoreForLocalia(70, 'B')).toBe(70);
  });

  it('should swap team sides on repeat match when localia is active', () => {
    const teamA = { id: 1, name: 'Equipo A', score: 70 } as any;
    const teamB = { id: 2, name: 'Equipo B', score: 68 } as any;

    component.lastTeamA = teamA;
    component.lastTeamB = teamB;
    component.lastTypeA = 'CLUB';
    component.lastTypeB = 'SELECCION';
    component.lastConfA = 'Liga 1';
    component.lastConfB = 'Liga 2';
    component.typeA = 'CLUB';
    component.typeB = 'SELECCION';
    component.filterAConfLeague = 'Liga 1';
    component.filterBConfLeague = 'Liga 2';
    component.selectedTeamA = teamA;
    component.selectedTeamB = teamB;
    component.hasLocalia = true;

    component.repeatMatch();

    expect(component.selectedTeamA).toBe(teamB);
    expect(component.selectedTeamB).toBe(teamA);
    expect(component.typeA).toBe('SELECCION');
    expect(component.typeB).toBe('CLUB');
  });
});
