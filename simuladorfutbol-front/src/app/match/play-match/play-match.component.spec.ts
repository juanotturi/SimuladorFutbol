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
    expect(component.hasLocalia).toBeTrue();
    expect(typeof component.hasLocalia).toBe('boolean');
  });

  it('should apply localia adjustment to team scores', () => {
    expect(component.getAdjustedTeamScoreForLocalia(70, 'A')).toBe(72);
    expect(component.getAdjustedTeamScoreForLocalia(70, 'B')).toBe(68);

    component.hasLocalia = false;
    expect(component.getAdjustedTeamScoreForLocalia(70, 'A')).toBe(70);
    expect(component.getAdjustedTeamScoreForLocalia(70, 'B')).toBe(70);
  });
});
