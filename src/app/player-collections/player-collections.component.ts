import {Component, Inject, Input, OnInit} from '@angular/core';
import {PlayerComponent} from '../player/player.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-player-collections',
  templateUrl: './player-collections.component.html',
  styleUrls: ['./player-collections.component.css']
})
export class PlayerCollectionsComponent implements OnInit {

  @Input() player: PlayerComponent;
  public items: Item[] = [];

  constructor(public dialog: MatDialog, public snackBar: MatSnackBar) {
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

  delete() {
    const dialogRef = this.component.dialog.open(PlayerCollectionDeleteDialogComponent, {
      // height: '400px',
      // width: '600px',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.player.removeCollection(this.name).then(res => {
          if (res) {
            this.component.snackBar.open(`Collection "${this.name}" supprimée`, undefined, {
              duration: 2000,
              verticalPosition: 'top'
            });
          }
        });
      }
    });
  }
}

@Component({
  templateUrl: './delete-dialog.component.html'
})
export class PlayerCollectionDeleteDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<PlayerCollectionDeleteDialogComponent>) {
  }
}
