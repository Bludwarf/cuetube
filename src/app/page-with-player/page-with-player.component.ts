import {Component, inject, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {GoogleDriveButtonComponent} from '../google-drive/google-drive-button/google-drive-button.component';
import {Title} from '@angular/platform-browser';

@Component({
    selector: 'app-page-with-player',
    imports: [
        RouterOutlet,
        GoogleDriveButtonComponent
    ],
    templateUrl: './page-with-player.component.html',
    styleUrl: './page-with-player.component.css',
})
export class PageWithPlayerComponent implements OnInit {
    protected readonly title = inject(Title);

    ngOnInit() {
        console.log('PageWithPlayerComponent ngOnInit');
    }
}
