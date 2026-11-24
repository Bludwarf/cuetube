import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {TestComponent} from './test.component';
import {TEST_PATHS_MAP} from './test-paths';
import {CollectionsMenuComponent} from './collections-menu/collections-menu.component';
import {EloMatchComponent} from './elo-match/elo-match.component';
import {TrackEloStatsComponent} from './track-elo-stats/track-elo-stats.component';
import {collectionResolver} from '../collection/collection.resolver';
import {TRACK, trackResolver} from './resolvers';

const routes: Routes = [
    {
        path: '',
        component: TestComponent,
    },
    {
        path: TEST_PATHS_MAP['collections-menu'],
        component: CollectionsMenuComponent,
    },
    {
        path: TEST_PATHS_MAP['elo-match'],
        component: EloMatchComponent,
    },
    {
        path: TEST_PATHS_MAP['track-elo-stats'],
        component: TrackEloStatsComponent,
        resolve: {
            [TRACK]: trackResolver,
        },
    },
];

@NgModule({
    declarations: [],
    imports: [
        RouterModule.forChild(routes),
    ],
})
export class TestModule {

    constructor() {
        console.log(`Chargement du module "test"`);
    }
}
