import {Component, OnInit} from '@angular/core';
import {PlayerCollectionsComponent} from '../../player-collections/player-collections.component';
import {hideLoader} from '../../app.component';

@Component({
    selector: 'app-collections-menu',
    templateUrl: './collections-menu.component.html',
    styleUrl: './collections-menu.component.css',
    standalone: true,
    imports: [
        PlayerCollectionsComponent
    ]
})
export class CollectionsMenuComponent implements OnInit {

    ngOnInit() {
        hideLoader();
    }

}
