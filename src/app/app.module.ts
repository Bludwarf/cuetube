import {BrowserModule} from '@angular/platform-browser';
import {inject, NgModule, provideAppInitializer} from '@angular/core';
import {RouterLink, RouterModule, Routes} from '@angular/router';
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
import {DiscListComponent} from './disc/list/disc-list.component';
import {DiscEditorComponent} from './test/disc-editor/disc-editor.component';
import {DISC, discResolver, MAPPED_DISC, mappedDiscResolver} from './test/resolvers';
import {CUE, cueResolver} from './test/cue.resolver';
import {ConvertCueComponent} from './test/convert-cue/convert-cue.component';
import {DiscService} from '../refacto-2026/disc.service';
import {YouTubeMappedDiscService} from '../refacto-2026/you-tube-mapped-disc.service';
import {PersistenceService} from './persistence/persistence.service';
import {ConvertAllCuesComponent} from './convert-all-cues/convert-all-cues.component';
import {PageWithPlayerComponent} from './page-with-player/page-with-player.component';
import {DiscComponent} from './disc/disc/disc.component';
import {ConvertAllCollectionsComponent} from './convert-all-collections/convert-all-collections.component';
import {CollectionService} from './collection/collection.service';
import {CollectionListComponent} from './collection/collection-list/collection-list.component';

const appRoutes: Routes = [
    {path: '', component: PlayerComponent}, // redirectTo: 'player', pathMatch: 'full' },
    {path: 'player', component: PlayerComponent},
    {
        path: 'play',
        component: PageWithPlayerComponent,
        children: [
            {
                path: 'collection/:name',
                component: CollectionComponent,
                resolve: {
                    collection: collectionResolver,
                },
                runGuardsAndResolvers: 'paramsOrQueryParamsChange',
            },
            {
                path: 'disc/:id',
                component: DiscComponent,
                resolve: {
                    [DISC]: discResolver,
                    [MAPPED_DISC]: mappedDiscResolver,
                },
                runGuardsAndResolvers: 'paramsOrQueryParamsChange',
            },
        ],
    },
    {path: 'edit-cue', component: EditCueComponent},
    {
        path: 'collection/:name',
        component: CollectionComponent,
        resolve: {
            collection: collectionResolver,
        },
    },
    {
        path: 'convert-cue',
        component: ConvertCueComponent,
        resolve: {
            [CUE]: cueResolver,
        },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    },
    {
        path: 'convert-all-cues',
        component: ConvertAllCuesComponent,
    },
    {
        path: 'convert-all-collections',
        component: ConvertAllCollectionsComponent,
    },
    {
        path: 'collections',
        component: CollectionListComponent,
    },
    {
        path: 'discs',
        component: DiscListComponent,
    },
    {
        path: 'discs/:id/edit',
        component: DiscEditorComponent,
        resolve: {
            [DISC]: discResolver,
            [MAPPED_DISC]: mappedDiscResolver,
        },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
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
    provideAppInitializer(async () => {
        const persistenceService = inject(PersistenceService);
        const collectionService = inject(CollectionService);
        const discService = inject(DiscService);
        const youTubeMappedDiscService = inject(YouTubeMappedDiscService);

        await persistenceService.getCurrentPersistenceAndInit();

        await collectionService.load();
        await discService.load();
        await youTubeMappedDiscService.load();
    })
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
        GoogleDriveButtonComponent,
        RouterLink
    ],
    providers,
    bootstrap: [AppComponent]
})
export class AppModule {
}
