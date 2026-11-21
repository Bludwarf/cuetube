import {NotFoundError, Persistence, PersistenceWithPublicFields, SyncState} from '../persistence';
import {Disc} from '../disc';
import {Collection} from '../Collection';

/**
 * Persistance pour augmenter largement les perfs d'une persistance distante avec une persistance locale.
 * Tout est lu localement.
 * Tout est écrit localement d'abord puis à distance en parallèle.
 */
export class LocalAndDistantPersistence<L extends Persistence,
    D extends Persistence> extends Persistence {

    constructor(local: L, distant: D) {
        super();
        this.local = local as L & PersistenceWithPublicFields;
        this.distant = distant as D & PersistenceWithPublicFields;
    }

    get title(): string {
        return `${LocalAndDistantPersistence.TITLE}('${this.local.title}', '${this.distant.title}')`;
    }

    get connectedToGoogleDrive(): boolean {
        return this.local.connectedToGoogleDrive || this.distant.connectedToGoogleDrive;
    }

    public static readonly TITLE = 'LocalAndDistant';

    public readonly local: L & PersistenceWithPublicFields;
    public readonly distant: D & PersistenceWithPublicFields;

    static persistenceNames(persistenceName: string): { localName: string, distantName: string } {
        const m = /LocalAndDistant\((.+)\)/.exec(persistenceName);
        if (m) {
            const params = m[1].trim().split(/\s*,\s*/);
            return {
                localName: params[0].slice(1, -1),
                distantName: params[1].slice(1, -1),
            };
        } else {
            throw new Error(`Nom de persistence invalide : ${persistenceName}`);
        }
    }

    async init(): Promise<boolean> {
        const distantWasInit = await this.distant.init();
        const localWasInit = await this.local.init();
        return distantWasInit && localWasInit;
    }

    /**
     * Écrase le local avec le distant
     */
    async setLocalFromDistant(): Promise<void> {
        console.group(`Initialisation locale depuis le distant (les données locales seront totalement écrasées)...`);
        await this.local.setAllCollectionsByNames(await this.distant.getAllCollectionsByNames(), false);
        await this.local.setAllDiscs(await this.distant.getAllDiscs(), false);

        const syncState = await this.local.getSyncState();
        await this.local.saveSyncState(syncState);
        console.log(`Initialisation locale depuis le distant terminée`);
        console.groupEnd();
    }

    getCollection(collectionName: string): Promise<Collection> {
        return this.local.getCollection(collectionName);
    }

    getCollectionNames(): Promise<string[]> {
        return this.local.getCollectionNames();
    }

    getDiscIds(): Promise<string[]> {
        return this.local.getDiscIds();
    }

    async getDisc(discId: string): Promise<Disc> {
        const fn = this.bind(p => p.getDisc(discId));
        try {
            return await fn.local();
        } catch (e) {
            if (e instanceof NotFoundError) {
                console.warn(`Disque "${discId}" introuvable en local, on le récupère du distant...`);

                const disc = await fn.distant();

                if (disc) {
                    console.info(`Disque "${discId}" trouvé sur le distant`);
                    await this.local.saveDisc(disc);
                    console.info(`Disque "${discId}" sauvegardé en local`);
                }

                return disc;
            } else {
                throw e;
            }
        }
    }

    private bind<F extends (p: any) => any>(fn: F): { local: () => any, distant: () => any } {
        return {
            local: () => fn(this.local),
            distant: () => fn(this.distant),
        };
    }

    async postCollection(collection: Collection): Promise<Collection> {
        await this.distant.postCollection(collection);
        return this.local.postCollection(collection);
    }

    protected async _deleteCollection(collectionName: string): Promise<void> {
        await this.distant._deleteCollection(collectionName);
        return this.local._deleteCollection(collectionName);
    }

    async postDisc(disc: Disc): Promise<Disc> {
        await this.distant.postDisc(disc);
        return this.local.postDisc(disc);
    }

    async setCollectionNames(collectionsNames: string[]): Promise<string[]> {
        await this.distant.setCollectionNames(collectionsNames);
        return this.local.setCollectionNames(collectionsNames);
    }

    protected async loadSyncState(): Promise<SyncState> {
        // TODO simplifier la synchro pour ne stocker qu'un lastmod commun à tous les disques, idem pour les collections
        throw new Error(`Cette persistence ne possède pas d'état de synchro propre`);
    }

    public async saveSyncState(): Promise<void> {
        // TODO simplifier la synchro pour ne stocker qu'un lastmod commun à tous les disques, idem pour les collections
        console.warn('TODO simplifier la synchro pour ne stocker qu\'un lastmod commun à tous les disques, idem pour les collections');
    }
}
