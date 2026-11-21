import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AppComponent} from './app.component';
import {PlayerComponent} from './player/player.component';
import {GapiClientService} from './gapi-client.service';
import {SliderComponent} from './slider/slider.component';
import {FormsModule} from '@angular/forms';
import {EditCueComponent} from './edit-cue/edit-cue.component';
import {EditCueFileComponent} from './edit-cue-file/edit-cue-file.component';
import {PlayerCollectionDeleteDialogComponent, PlayerCollectionsComponent} from './player-collections/player-collections.component';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {LocalStoragePrefsService} from './local-storage-prefs.service';
import {provideHttpClient} from '@angular/common/http';
import {CollectionComponent} from './collection/collection.component';
import {collectionResolver} from './collection/collection.resolver';
import {GoogleDriveButtonComponent} from './google-drive/google-drive-button/google-drive-button.component';

const appRoutes: Routes = [
    {path: '', component: PlayerComponent}, // redirectTo: 'player', pathMatch: 'full' },
    {path: 'player', component: PlayerComponent},
    {path: 'edit-cue', component: EditCueComponent},
    {
        path: 'collection/:name',
        component: CollectionComponent,
        resolve: {
            collection: collectionResolver,
        },
    },
    {
        path: 'test',
        loadChildren: () => import('./test/test.module').then(m => m.TestModule),
    },
];

export const imports = [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    PlayerCollectionsComponent,
];
export const providers = [
    GapiClientService,
    LocalStoragePrefsService,
    provideHttpClient(),
];

@NgModule({
    declarations: [
        AppComponent,
        PlayerComponent,
        SliderComponent,
        EditCueComponent,
        EditCueFileComponent,
        PlayerCollectionDeleteDialogComponent
    ],
    imports: [
        RouterModule.forRoot(appRoutes, {
            // enableTracing: true // <-- debugging purposes only

            // Attention : les inputs seront toujours de type "string" quelque-soit le type déclaré
            // Sauf si on utilise (exemple pour un number) : input<number, string>(0, {transform: Number})
            bindToComponentInputs: true,
        }),
        ...imports,
        GoogleDriveButtonComponent
    ],
    providers,
    bootstrap: [AppComponent]
})
export class AppModule {
}
