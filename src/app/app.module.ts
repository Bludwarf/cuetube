import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { PlayerComponent } from './player/player.component';
import * as $ from 'jquery';
import {GapiClientService} from './gapi-client.service';
import { SliderComponent } from './slider/slider.component';
import {FormsModule} from '@angular/forms';
import { EditCueComponent } from './edit-cue/edit-cue.component';

const appRoutes: Routes = [
  { path: '',         redirectTo: 'player', pathMatch: 'full' },
  { path: 'player',   component: PlayerComponent },
  { path: 'edit-cue', component: EditCueComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    PlayerComponent,
    SliderComponent,
    EditCueComponent
  ],
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    ),
    BrowserModule,
    // import HttpClientModule after BrowserModule. : https://angular.io/guide/http
    HttpClientModule,
    FormsModule
  ],
  providers: [
      GapiClientService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
