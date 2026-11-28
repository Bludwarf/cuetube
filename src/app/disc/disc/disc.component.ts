import {Component, OnInit} from '@angular/core';
import {hideLoader} from '../../app.component';
import {injectDisc} from '../../test/resolvers';

@Component({
    selector: 'app-disc',
    imports: [],
    templateUrl: './disc.component.html',
    styleUrl: './disc.component.css',
})
export class DiscComponent implements OnInit {
    protected readonly disc = injectDisc();

    ngOnInit() {
        hideLoader();
    }
}
