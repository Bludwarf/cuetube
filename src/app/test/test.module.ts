import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {TestComponent} from './test.component';

const routes: Routes = [
    {
        path: '',
        component: TestComponent,
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
