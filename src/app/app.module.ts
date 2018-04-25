import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { PlayerComponent } from './player/player.component';
import 'jquery';
import {GapiClientService} from './gapi-client.service';
import { SliderComponent } from './slider/slider.component';
import {FormsModule} from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    PlayerComponent,
    SliderComponent
  ],
  imports: [
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
