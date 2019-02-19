import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCueComponent } from './edit-cue.component';
import {AppComponent} from '../app.component';
import {PlayerComponent} from '../player/player.component';
import {SliderComponent} from '../slider/slider.component';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {GapiClientService} from '../gapi-client.service';
import {RouterTestingModule} from '@angular/router/testing';
import {PlayerCollectionsComponent} from '../player-collections/player-collections.component';
import {EditCueFileComponent} from '../edit-cue-file/edit-cue-file.component';
import {MatIconModule} from '@angular/material';

describe('EditCueComponent', () => {
  let component: EditCueComponent;
  let fixture: ComponentFixture<EditCueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        EditCueComponent,
        EditCueFileComponent,
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
    fixture = TestBed.createComponent(EditCueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
