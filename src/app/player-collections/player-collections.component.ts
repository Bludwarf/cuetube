import {Component, Input, OnInit} from '@angular/core';
import {PlayerComponent} from '../player/player.component';

@Component({
  selector: 'app-player-collections',
  templateUrl: './player-collections.component.html',
  styleUrls: ['./player-collections.component.css']
})
export class PlayerCollectionsComponent implements OnInit {

  @Input() player: PlayerComponent;
  private items: Item[] = [];

  constructor() {
  }

  ngOnInit() {
    this.player.collectionNamesChange.subscribe(collectionNames => this.setCollections(collectionNames));
    this.player.currentCollectionNamesChange.subscribe(collectionNames => this.setCurrentCollections(collectionNames));
  }

  setCollections(collectionNames: string[]) {
    this.items = [];
    collectionNames.forEach(collectionName => {
      this.items.push(new Item(this, collectionName));
    });
  }

  setCurrentCollections(collectionNames: string[]) {
    this.items.forEach(item => {
      if (!collectionNames.length) {
        item.isCurrent = false;
      } else {
        item.isCurrent = collectionNames.find(collectionName => item.name === collectionName) !== undefined;
      }
    });
  }

  createCollection() {
    return this.player.createCollection();
  }

  playDefaultCollection() {
    return this.player.playCollection();
  }
}

class Item {
  public isCurrent = false;
  constructor(public component: PlayerCollectionsComponent, public name: string) {

  }

  get player() {
    return this.component.player;
  }

  play() {
    return this.player.playCollection(this.name);
  }

  toggle($event: MouseEvent) {
    this.player.toggleCollection(this.name, $event);
  }
}
