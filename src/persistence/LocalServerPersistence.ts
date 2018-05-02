import {Persistence} from '../persistence';
import {Disc} from '../disc';
import {HttpClient} from '@angular/common/http';
import {PlayerComponent} from '../app/player/player.component';
import {Collection} from '../Collection';

export class LocalServerPersistence extends Persistence {

    constructor($scope: PlayerComponent, $http: HttpClient) {
        super($scope, $http);
    }

    get title(): string {
        return 'Serveur local';
    }

    public getCollectionNames(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.$http.get<string[]>(`/collectionNames`).toPromise().then(collectionNames => {
                resolve(collectionNames);
            }, resKO => {
                console.error('Error GET collectionNames != 200');
                return reject(resKO);
            });
        });
    }

    public setCollectionNames(collectionsNames: string[]): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.$http.post<string[]>(`/collectionNames`, collectionsNames).toPromise().then(res => {
                resolve(collectionsNames);
            }, resKO => {
                return reject(resKO);
            });
        });
    }

    public getCollection(collectionName: string): Promise<Collection> {
        return new Promise((resolve, reject) => {
            this.$http.get<string[]>(`/collection/${collectionName}/discs`).toPromise().then(discIds => {
                const collection = new Collection(collectionName);
                collection.discIds = discIds;
                resolve(collection);
            }, resKO => {
                console.error('Error GET collection != 200');
                return reject(resKO);
            });
        });
    }

    public postCollection(collection: Collection): Promise<Collection> {
        const collectionName = collection.name ? collection.name : Persistence.DEFAULT_COLLECTION;
        return new Promise((resolve, reject) => {
            this.$http.post<Collection>(`/collection/${collectionName}/discs`, collection.discIds).toPromise().then(res => {
                return resolve(collection);
            }, resKO => {
                console.error('Error POST collection != 200');
                return reject(resKO);
            });
        });
    }

    public getDisc(discId: string, discIndex: number): Promise<Disc> {
        return new Promise((resolve, reject) => {
            this.$http.get('/' + discId + '.cue.json').toPromise().then(res => {
                const disc = super.createDisc(discId, discIndex, res);
                resolve(disc);
            }, reject);
        });
    }

    // TODO : renvoyer plutôt le disc que le résultat du post
    public postDisc(discId: string, disc): Promise<Disc> {
        return new Promise((resolve, reject) => {
            this.$http.post(`/${discId}.cue.json`, disc).toPromise().then(resolve, reject);
        });
    }
}
