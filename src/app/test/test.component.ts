import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TEST_PATHS} from './test-paths';
import {hideLoader} from '../app.component';
import {DiscService} from '../../refacto-2026/disc.service';

@Component({
    selector: 'app-test',
    standalone: true,
    imports: [
        RouterLink,
    ],
    templateUrl: './test.component.html',
    styleUrl: './test.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestComponent implements OnInit {
    protected readonly testRoutes: readonly string[] = TEST_PATHS;
    protected discIds: string[];

    constructor() {
        const discService = inject(DiscService);
        discService.load().then(() => {
            this.discIds = discService.getDiscIds();
        });
    }

    ngOnInit() {
        hideLoader();
    }
}
