import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {TestComponent} from './test.component';
import {TEST_PATHS_MAP} from './test-paths';
import {CollectionsMenuComponent} from './collections-menu/collections-menu.component';

const routes: Routes = [
    {
        path: '',
        component: TestComponent,
    },
    {
        path: TEST_PATHS_MAP['collections-menu'],
        component: CollectionsMenuComponent,
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
