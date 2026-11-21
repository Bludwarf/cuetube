import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TEST_PATHS} from './test-paths';
import {hideLoader} from '../app.component';

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

    ngOnInit() {
        hideLoader();
    }
}
