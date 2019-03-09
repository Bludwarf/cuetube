import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {PlayerComponent} from './player.component';
import {AppComponent} from '../app.component';
import {SliderComponent} from '../slider/slider.component';
import {RouterTestingModule} from '@angular/router/testing';
import {PlayerCollectionsComponent} from '../player-collections/player-collections.component';
import {imports, providers} from '../app.module';

describe('PlayerComponent', () => {
  let component: PlayerComponent;
  let fixture: ComponentFixture<PlayerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        PlayerComponent,
        SliderComponent,
        PlayerCollectionsComponent
      ],
      imports: [
        RouterTestingModule,
        ...imports
      ],
      providers
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
