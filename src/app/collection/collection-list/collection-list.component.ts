import {Component, inject, OnInit} from '@angular/core';
import {CollectionService} from '../collection.service';
import Collection from '../../../Collection';
import {hideLoader} from '../../app.component';
import {RouterLink} from '@angular/router';
import {localComparing} from '../../../utils/comparators';

@Component({
    selector: 'app-collection-list',
    imports: [
        RouterLink
    ],
    templateUrl: './collection-list.component.html',
    styleUrl: './collection-list.component.css',
})
export class CollectionListComponent implements OnInit {
    private collectionService = inject(CollectionService);
    protected collections: Collection[];

    ngOnInit() {
        this.collections = this.collectionService.getCollections();
        this.collections.sort(localComparing('name'));
        console.log('Collections chargées', this.collections);
        hideLoader();
    }
}
