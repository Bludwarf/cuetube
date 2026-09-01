import {Component, effect, EventEmitter, input, Output} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

@Component({
    selector: 'app-player-collections',
    templateUrl: './player-collections.component.html',
    styleUrls: ['./player-collections.component.css'],
    imports: [
        MatButtonModule,
        MatIconModule,
    ],
    standalone: true
})
export class PlayerCollectionsComponent {

    collectionNames = input<string[]>([]);
    currentCollectionNames = input<string[]>([]);

    @Output()
    createCollection = new EventEmitter<string | undefined>();

    @Output()
    activateDefaultCollection = new EventEmitter<void>();

    @Output()
    activateOnlyCollection = new EventEmitter<string>();

    @Output()
    toggleCollection = new EventEmitter<string>();

    @Output()
    removeCollection = new EventEmitter<string>();

    public items: Item[] = [];

    constructor(public dialog: MatDialog) {
        effect(() => this.setCollections(this.collectionNames()));
        effect(() => this.setCurrentCollections(this.currentCollectionNames()));
    }

    setCollections(collectionNames: string[]) {
        this.items = collectionNames.map(collectionName => new Item(this, collectionName));
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

}

class Item {
    public isCurrent = false;

    constructor(public component: PlayerCollectionsComponent, public name: string) {

    }

    toggle() {
        this.component.toggleCollection.emit(this.name);
    }

    delete() {
        const dialogRef = this.component.dialog.open(PlayerCollectionDeleteDialogComponent, {
            // height: '400px',
            // width: '600px',
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.component.removeCollection.emit(this.name);
            }
        });
    }

    selectOnly() {
        return this.component.activateOnlyCollection.emit(this.name);
    }
}

@Component({
    templateUrl: './delete-dialog.component.html',
    standalone: false
})
export class PlayerCollectionDeleteDialogComponent {

    constructor(
        public dialogRef: MatDialogRef<PlayerCollectionDeleteDialogComponent>) {
    }
}
