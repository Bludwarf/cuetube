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
import {
  PlayerCollectionDeleteDialogComponent,
  PlayerCollectionsComponent
} from './player-collections/player-collections.component';
import {MatButtonModule, MatDialogModule, MatIconModule, MatSnackBarModule} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

const appRoutes: Routes = [
  {path: '', component: PlayerComponent}, // redirectTo: 'player', pathMatch: 'full' },
  {path: 'player', component: PlayerComponent},
  {path: 'edit-cue', component: EditCueComponent}
];

@NgModule({
  declarations: [
    AppComponent,
    PlayerComponent,
    SliderComponent,
    EditCueComponent,
    EditCueFileComponent,
    PlayerCollectionsComponent,
    PlayerCollectionDeleteDialogComponent
  ],
  imports: [
    RouterModule.forRoot(
      appRoutes,
      {enableTracing: true} // <-- debugging purposes only
    ),
    BrowserModule,
    // import HttpClientModule after BrowserModule. : https://angular.io/guide/http
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  providers: [
    GapiClientService
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    PlayerCollectionDeleteDialogComponent
  ]
})
export class AppModule {
}
