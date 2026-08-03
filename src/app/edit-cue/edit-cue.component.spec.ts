import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';

import {EditCueComponent} from './edit-cue.component';
import {AppComponent} from '../app.component';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {RouterTestingModule} from '@angular/router/testing';
import {PlayerCollectionsComponent} from '../player-collections/player-collections.component';
import {EditCueFileComponent} from '../edit-cue-file/edit-cue-file.component';
import { MatIconModule } from '@angular/material/icon';
import {providers} from '../app.module';

describe('EditCueComponent', () => {
  let component: EditCueComponent;
  let fixture: ComponentFixture<EditCueComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    declarations: [
        AppComponent,
        EditCueComponent,
        EditCueFileComponent,
        PlayerCollectionsComponent
    ],
    imports: [BrowserModule,
        FormsModule,
        RouterTestingModule,
        MatIconModule],
    providers
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditCueComponent);
    component = fixture.componentInstance;
    spyOn(window, 'alert'); // ngOnInit calls alert() when no disc id is found in URL params
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
