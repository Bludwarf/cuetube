import {Component, Input, OnInit} from '@angular/core';
import {PlayerComponent} from '../player/player.component';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
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
