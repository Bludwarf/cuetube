import {Component, EventEmitter, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-player0',
  templateUrl: './player0.component.html',
  styleUrls: ['./player0.component.css']
})
export class Player0Component implements OnInit {

  @Output() videoStarted: EventEmitter<string> = new EventEmitter();

  constructor() { }

  ngOnInit() {
    this.videoStarted.subscribe((value) => {
      console.log('event: ', value);
    });
  }

  test() {
    this.videoStarted.emit('bien reçu');
  }

}
