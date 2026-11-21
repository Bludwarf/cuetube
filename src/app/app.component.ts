import {Component} from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent {
    title = 'app';
}

export function showLoader() {
    switchLoader(true);
}

export function hideLoader() {
    switchLoader(false);
}

function switchLoader(show: boolean) {
    const $foreground = $('#foreground-overlay');
    if (show) {
        $foreground.show();
    } else {
        $foreground.hide();
    }
}
