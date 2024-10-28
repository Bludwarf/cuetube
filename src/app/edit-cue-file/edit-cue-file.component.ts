import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Disc} from '../../disc';
import {yth} from '../../yt-helper';
import Track = Disc.Track;
import {LocalStoragePrefsService} from '../local-storage-prefs.service';
import {EditCueComponent} from '../edit-cue/edit-cue.component';

@Component({
    selector: 'app-edit-cue-file',
    templateUrl: './edit-cue-file.component.html',
    styleUrls: ['./edit-cue-file.component.css']
})
export class EditCueFileComponent implements OnInit {

    @Input() file: Disc.File;
    @Input() parent: EditCueComponent;
    @Output() fileRemove = new EventEmitter<Disc.File>();

    constructor(public prefs: LocalStoragePrefsService) {
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

    removeTrack(track: Track) {
      track.remove();
      this.parent.removedTracks.push(track);
    }

    removeFile(file: Disc.File) {
        this.fileRemove.emit(file);
    }

}
