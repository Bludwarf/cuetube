import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import {PlayerComponent} from './player/player.component';
import {HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {GapiClientService} from './gapi-client.service';
import {SliderComponent} from './slider/slider.component';
describe('AppComponent', () => {
  beforeEach(async(() => {
      TestBed.configureTestingModule({
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
          ]
      })
      .compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
  it(`should have as title 'app'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('app');
  }));
  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    // Par défaut on charge la liste vide => espace insécable comme titre de la page
    expect(compiled.querySelector('h1').textContent).toContain(' ');
  }));
});
