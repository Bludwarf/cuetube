import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerComponent } from './player.component';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {AppComponent} from '../app.component';
import {SliderComponent} from '../slider/slider.component';
import {GapiClientService} from '../gapi-client.service';
import * as $ from 'jquery';
import {RouterTestingModule} from '@angular/router/testing';
import {PlayerCollectionsComponent} from '../player-collections/player-collections.component';
import {MatIconModule} from '@angular/material';
import {imports} from '../app.module';
import {EditCueComponent} from '../edit-cue/edit-cue.component';
import {EditCueFileComponent} from '../edit-cue-file/edit-cue-file.component';

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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
