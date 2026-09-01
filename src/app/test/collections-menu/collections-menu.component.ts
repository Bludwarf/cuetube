import {Component, OnInit} from '@angular/core';
import {AppModule} from '../../app.module';
import {PlayerCollectionsComponent} from '../../player-collections/player-collections.component';

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

    // TODO : remonter dans app
    get $foreground() {
        return $('#foreground-overlay');
    }

    ngOnInit() {
        this.$foreground.hide();
    }

}
