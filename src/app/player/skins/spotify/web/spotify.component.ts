import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import $ from 'jquery';

@Component({
    selector: 'app-spotify',
    imports: [],
    templateUrl: './spotify.component.html',
    styleUrls: [
        // https://open.spotify.com
        './4750.d02563c0.css',
        './dwp-feedback-bar.931ea758.css',
        './dwp-home-chips-row.fb404ad3.css',
        './dwp-home-header.0ec3bbd9.css',
        './dwp-leaderboard-component.13c571e2.css',
        './dwp-magpie.45bd8663.css',
        './dwp-now-playing-bar.41972fd4.css',
        './dwp-panel-section.b5964e9f.css',
        './dwp-top-bar.0ec3bbd9.css',
        './dwp-video-player.e7563948.css',
        './dwp-watch-feed-view-container.f0765aa5.css',
        './listening-stats-modal.e46fcd5c.css',
        './web-player.39ded9a7.css',
        './xpui-root-dialogs.25458546.css',
        './xpui-routes-your-library-x.ea3af739.css',

        './spotify.component.css',
    ],
})
export class SpotifyComponent implements OnInit {

    ngOnInit() {
        this.$foreground.hide();
    }

    // TODO : remonter dans app
    get $foreground() {
        return $('#foreground-overlay');
    }
}
