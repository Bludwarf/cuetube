import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { GoogleDrivePersistence } from './GoogleDrivePersistence';
import { PlayerComponent } from '../app/player/player.component';
import 'jquery';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {AppComponent} from '../app/app.component';
import {SliderComponent} from '../app/slider/slider.component';
import {GapiClientService} from '../app/gapi-client.service';
import {RouterTestingModule} from '@angular/router/testing';
import {PlayerCollectionsComponent} from '../app/player-collections/player-collections.component';
import {MatIconModule} from '@angular/material';

describe('GoogleDrivePersistence', () => {
  let component: PlayerComponent;
  let fixture: ComponentFixture<PlayerComponent>;
  let persistence : GoogleDrivePersistence;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        PlayerComponent,
        SliderComponent,
        PlayerCollectionsComponent
      ],
      imports: [
        BrowserModule,
        // import HttpClientModule after BrowserModule. : https://angular.io/guide/http
        HttpClientModule,
        FormsModule,
        RouterTestingModule,
        MatIconModule
      ],
      providers: [
        GapiClientService
      ]
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
