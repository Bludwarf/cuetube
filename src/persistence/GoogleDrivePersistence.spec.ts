import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {GoogleDrivePersistence} from './GoogleDrivePersistence';
import {PlayerComponent} from '../app/player/player.component';
import 'jquery';
import {AppComponent} from '../app/app.component';
import {SliderComponent} from '../app/slider/slider.component';
import {RouterTestingModule} from '@angular/router/testing';
import {PlayerCollectionsComponent} from '../app/player-collections/player-collections.component';
import {imports, providers} from '../app/app.module';

describe('GoogleDrivePersistence', () => {
  let component: PlayerComponent;
  let fixture: ComponentFixture<PlayerComponent>;
  let persistence: GoogleDrivePersistence;

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
    persistence = new GoogleDrivePersistence(component.http);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
