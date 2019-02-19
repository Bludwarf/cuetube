import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {RouterModule, Routes} from '@angular/router';
import {AppComponent} from './app.component';
import {PlayerComponent} from './player/player.component';
import {GapiClientService} from './gapi-client.service';
import {SliderComponent} from './slider/slider.component';
import {FormsModule} from '@angular/forms';
import {EditCueComponent} from './edit-cue/edit-cue.component';
import {EditCueFileComponent} from './edit-cue-file/edit-cue-file.component';
import {PlayerCollectionsComponent} from './player-collections/player-collections.component';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatIconModule} from '@angular/material';

const appRoutes: Routes = [
  { path: '',         component: PlayerComponent}, // redirectTo: 'player', pathMatch: 'full' },
  { path: 'player',   component: PlayerComponent },
  { path: 'edit-cue', component: EditCueComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    PlayerComponent,
    SliderComponent,
    EditCueComponent,
    EditCueFileComponent,
    PlayerCollectionsComponent
  ],
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    ),
    BrowserModule,
    // import HttpClientModule after BrowserModule. : https://angular.io/guide/http
    HttpClientModule,
    FormsModule,
    NoopAnimationsModule,
    MatIconModule
  ],
  providers: [
      GapiClientService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
