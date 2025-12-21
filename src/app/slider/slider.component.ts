import {Component, Input, OnInit} from '@angular/core';
import {PlayerComponent} from '../player/player.component';

@Component({
    selector: 'app-slider',
    templateUrl: './slider.component.html',
    styleUrls: ['./slider.component.css'],
    standalone: false
})
export class SliderComponent implements OnInit {

  @Input() player: PlayerComponent;
  value;
  min;
  max;

  constructor() { }

  ngOnInit() {
  }

}
