import {Component, Input, OnInit} from '@angular/core';
import {Disc} from '../../disc';
import {yth} from '../../yt-helper';

@Component({
    selector: 'app-edit-cue-file',
    templateUrl: './edit-cue-file.component.html',
    styleUrls: ['./edit-cue-file.component.css']
})
export class EditCueFileComponent implements OnInit {

    @Input() file: Disc.File;

    constructor() {
    }

    ngOnInit() {
    }

    getTracklist(tracks) {
        return yth.getTracklist(tracks);
    }

    prompt(text, placeholder) {
        return prompt(text, placeholder);
    }

    setTracklist(tracklist, file) {
        yth.setTracklist(tracklist, file);
    }
    setTracklistFromButton($event, file) {
        const button = $event.currentTarget;
        const $textarea = $('textarea', button.parent);
        this.setTracklist($textarea.val(), file);
    }

}
