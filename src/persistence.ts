import * as _ from 'underscore';
import {Disc} from './disc';
import {CuePrinter} from './CuePrinter';
import {Collection} from './Collection';
import {md5} from './md5';
import {cloneWithout} from './json-utils';
import {remove} from './utils/utils';
import {hideLoader, showLoader} from './app/app.component';

// TODO ce serait mieux d'afficher des notifs quand une action longue est terminée, comme supprimer ou ajouter un disque ou une collection

export abstract class Persistence {

    static DEFAULT_COLLECTION = '_default_';

    private syncState: SyncState;

    private readonly notFoundDiscIds: string[] = [];

    public async getSyncState(): Promise<SyncState> {
        if (!this.syncState) {
            // Chargement de l'état de synchro si pas encore fait
            try {
                console.log(`Chargement de l'état de la synchro...`);
                const loadedSyncState = await this.loadSyncState();
                console.log(`État de la synchro chargé`, loadedSyncState);
                this.syncState = loadedSyncState;
            } catch (e) {
                console.warn(`Impossible de charger l'état de la synchro : on le reconstruit...`, e);
                return this.buildSyncState();
            }
        }
        return this.syncState;
    }

    /**
     * Construit pour la fois 1ère l'état de synchro s'il n'a jamais été calculé
     * @return {Promise<SyncState>}
     */
    private async buildSyncState(): Promise<SyncState> {
        // On doit chercher toutes les collections et tous les disques
        const [collectionsByNames, discs] = await this.getAllCollectionsAndAllDiscs();
        const syncState = new SyncState();
        _.each(collectionsByNames, collection => syncState.collections.push(collection));
        _.each(discs, disc => syncState.discs.push(disc));
        return syncState;
    }

    private async getAllCollectionsAndAllDiscs(): Promise<[Record<string, Collection>, Disc[]]> {
        try {
            return await Promise.all([
                this.getAllCollectionsByNames(),
                this.getAllDiscs()
            ]);
        } catch (e) {
            console.error('Erreur lors du buildSyncState', e);
            throw e;
        }
    }

    public abstract saveSyncState(syncState: SyncState): Promise<void>;

    constructor() {
    }

    /**
     * Titre de cette persistance dans les logs
     * @return {string}
     */
    abstract get title(): string;

    /**
     * @return {Promise<boolean>} true si init OK, false sinon
     */
    public async init(): Promise<boolean> {
        return true;
    }

    public abstract getCollectionNames(): Promise<string[]>;

    public abstract getDiscIds(): Promise<string[]>;

    /**
     *
     * @param {string[]} collectionsNames
     * @return {Promise<string[]>} ne doit pas ressortir la collection '_default_'
     */
    public abstract setCollectionNames(collectionsNames: string[]): Promise<string[]>;

    /**
     * @param collectionName
     * @return la collection portant ce nom ou une nouvelle si la collection n'existe pas encore
     */
    public abstract getCollection(collectionName: string): Promise<Collection>;

    public async getCollectionByNames(collectionsNames: string[]): Promise<{ [key: string]: Collection }> {
        const results = await Promise.all(collectionsNames.map(name => this.getCollection(name)));
        return results.reduce((map, collection) => {
            if (collection) {
                map[collection.name] = collection;
            } else {
                console.error(`getCollectionByNames("${collectionsNames}") : collection inconnue`);
            }
            return map;
        }, {});
    }

    public async saveCollection(collection: Collection, saveSyncState = true): Promise<Collection> {
        const savedCollection = await this.postCollection(collection);
        const syncState = await this.getSyncState();
        syncState.collections.push(savedCollection);

        if (saveSyncState) {
            console.log('Sauvegarde de l\'état de la synchro...');
            await this.saveSyncState(syncState);
            console.log('Sauvegarde de l\'état de la synchro OK');
        }

        return savedCollection;
    }

    protected abstract postCollection(collection: Collection): Promise<Collection>;

    public async deleteCollection(collectionName: string): Promise<void> {
        await this._deleteCollection(collectionName);
        const syncState = await this.getSyncState();
        syncState.collections.removeById(collectionName);
        // TODO ajout d'un débrayage en cas de batch save
        console.log('Sauvegarde de l\'état de la synchro...');
        await this.saveSyncState(syncState);
        console.log('Sauvegarde de l\'état de la synchro OK');
    }

    protected abstract _deleteCollection(collectionName: string): Promise<void>;

    async saveCollections(collections: Collection[]): Promise<void> {
        for (const collection of collections) {
            await this.saveCollection(collection);
        }
    }

    public async getOrCreateCollection(collectionName: string): Promise<Collection> {
        if (!collectionName) {
            collectionName = Persistence.DEFAULT_COLLECTION;
        }
        let collection: Collection = await this.getCollection(collectionName);
        if (!collection) {
            collection = await this.newCollection(collectionName);
        }
        return collection;
    }

    public async getCollectionDiscIds(collectionName: string): Promise<string[]> {
        const collection = await this.getOrCreateCollection(collectionName);
        return collection.discIds;
    }

    /**
     * @param {string} collectionName
     * @param {string[]} discIds id des disques présents dans cette collection, annule et remplace les précédents
     * @return {Promise<string[]>}
     */
    public async saveCollectionDiscIds(collectionName: string, discIds: string[]): Promise<string[]> {
        if (!collectionName) {
            collectionName = Persistence.DEFAULT_COLLECTION;
        }

        let collection = await this.getCollection(collectionName);

        if (!collection) {
            collection = new Collection(collectionName);
        }

        collection.discIds = discIds;

        const savedCollection = await this.saveCollection(collection);

        return savedCollection.discIds;
    }

    public async newCollection(collectionName: string): Promise<Collection> {
        const collection = new Collection(collectionName);
        collection.discIds = [];
        const savedCollection = await this.saveCollection(collection);
        console.log('Collection "' + collectionName + '" créée');
        return savedCollection;
    }

    /**
     * Préférer {@link #findDisc} pour éviter de lancer une erreur tout en historisant tous les disques introuvables
     * @throws NotFoundError
     */
    public abstract getDisc(discId: string): Promise<Disc>;

    public async findDisc(discId: string): Promise<Disc | undefined> {
        try {
            const disc = await this.getDisc(discId);
            remove(discId, this.notFoundDiscIds);
            return disc;
        } catch (e) {
            if (e instanceof NotFoundError) {
                console.error(`On ignore le disque suivant, car il est introuvable : ${discId} => on l'ajoute dans la liste des disques introuvables`);
                this.notFoundDiscIds.push(discId);
                return undefined;
            }
            throw e;
        }
    }

    /** Préférer {@link #findDiscs} pour éviter de lancer des erreurs tout en historisant tous les disques introuvables */
    public getDiscs(discIds: string[]): Promise<Disc[]> {
        return Promise.all(discIds.map(discId => this.getDisc(discId)));
    }

    /**
     * Équivalent de {@link #getDiscs} mais en filtrant uniquement les disques qui ont été trouvés,
     * sans lancer d'erreur, mais historisant
     */
    public findDiscs(discIds: string[]): Promise<Disc[]> {
        return Promise.all(
            discIds
                .map(discId => this.findDisc(discId))
                .filter(Boolean)
        );
    }

    public async saveDisc(disc: Disc, saveSyncState = true): Promise<Disc> {
        showLoader();
        const savedDisc = await this.postDisc(disc);
        const syncState = await this.getSyncState();
        syncState.discs.push(savedDisc);
        remove(savedDisc.id, this.notFoundDiscIds);

        if (saveSyncState) {
            console.log('Sauvegarde de l\'état de la synchro...', syncState);
            await this.saveSyncState(syncState);
            console.log('Sauvegarde de l\'état de la synchro OK');
        }

        hideLoader();
        return savedDisc;
    }

    protected abstract postDisc(disc: Disc): Promise<Disc>;

    /**
     * @param discId
     * @param jsonCuesheet {*} un objet JSON contenant la cuesheet à créér
     */
    protected createDisc(discId: string, jsonCuesheet: any): Disc {
        const disc = Disc.fromJSON(jsonCuesheet);
        disc.id = discId;
        return disc;
    }

    /**
     * Fusionne la persistence src avec la persistence actuelle. À la fin les deux persistence sont égales.
     * @param {Persistence} src persistence à intégrer dans la courante
     * @return {Promise<boolean>} true si la persistence actuelle a été modifiée suite au sync
     */
    public async sync(src: Persistence): Promise<SyncResult> {

        console.group('Synchro entre deux persistances en cours');
        const syncResult = new SyncResult();

        const thisSyncState = await this.getSyncState();
        const srcSyncState = await src.getSyncState();

        const thisCollectionNames = _.keys(thisSyncState.collections.elementsById);
        const srcCollectionNames = _.keys(srcSyncState.collections.elementsById);

        console.log('Début de la synchro des collections...');

        const missingCollectionsInThis = srcCollectionNames.filter(name => !thisCollectionNames.includes(name));
        for (const collectionName of missingCollectionsInThis) {
            const collection = await src.getCollection(collectionName);
            syncResult.collections.pulled.push(collection);
        }

        const missingCollectionsInSource = thisCollectionNames.filter(name => !srcCollectionNames.includes(name));
        for (const collectionName of missingCollectionsInSource) {
            const collection = await this.getCollection(collectionName);
            syncResult.collections.pushed.push(collection);
        }

        // Collections en commun
        const commonCollections = thisCollectionNames.filter(name => srcCollectionNames.includes(name));
        for (const collectionName of commonCollections) {
            const thisChecksum = thisSyncState.collections.elementsById[collectionName].checksum;
            const srcChecksum = srcSyncState.collections.elementsById[collectionName].checksum;
            if (thisChecksum !== srcChecksum) {
                const thisCollection = await this.getCollection(collectionName);
                const srcCollection = await src.getCollection(collectionName);
                syncCommonCollection(thisCollection, srcCollection, syncResult);
            }
        }

        const thisDiscIds = _.keys(thisSyncState.discs.elementsById);
        const srcDiscIds = _.keys(srcSyncState.discs.elementsById);

        const discIdsToProcess = {
            pull: srcDiscIds.filter(id => !thisDiscIds.includes(id)),
            push: thisDiscIds.filter(id => !srcDiscIds.includes(id)),
            common: thisDiscIds.filter(id => srcDiscIds.includes(id)),
        };
        console.log('Début de la synchro des disques...', discIdsToProcess);

        // Disques absents dans this
        for (const id of discIdsToProcess.pull) {
            const srcDisc = await src.getDisc(id);
            syncResult.discs.pulled.push(srcDisc);
        }

        // Disques absents dans la source
        try {
            for (const id of discIdsToProcess.push) {
                const thisDisc = await this.getDisc(id);
                syncResult.discs.pushed.push(thisDisc);
            }
        } catch (e) {
            console.error(`Erreur non bloquante lors de la récupération d'un disque local absent dans la source`, e);
        }

        // Disques en commun
        for (const id of discIdsToProcess.common) {
            const thisChecksum = thisSyncState.discs.elementsById[id].checksum;
            const srcChecksum = srcSyncState.discs.elementsById[id].checksum;
            if (thisChecksum !== srcChecksum) {

                // On prend le plus récent des deux
                const thisLastmod = thisSyncState.discs.elementsById[id].lastmod;
                const srcLastmod = srcSyncState.discs.elementsById[id].lastmod;

                if (thisLastmod < srcLastmod) {
                    const disc = await src.getDisc(id);
                    console.log(`Disque ${disc.id} (${disc.title}) de la source plus récent`);
                    pushOnlyOnce(syncResult.discs.common.pulled, disc);
                } else if (thisLastmod > srcLastmod) {
                    const disc = await this.getDisc(id);
                    console.log(`Disque ${disc.id} (${disc.title}) plus récent que la source`);
                    pushOnlyOnce(syncResult.discs.common.pushed, disc);
                } else {
                    const thisDisc = await this.getDisc(id);
                    const srcDisc = await src.getDisc(id);
                    syncCommonDisc(thisDisc, srcDisc, syncResult);
                }

            }
        }

        // Sauvegardes dans les deux persistences

        // Sauvegardes dans this

        // Collections créés dans this
        for (const collection of syncResult.collections.pulled) {
            await this.saveCollection(collection);
        }
        // Collections modifiées dans this
        for (const collection of syncResult.collections.common.pulled) {
            await this.saveCollection(collection);
        }
        // Disques créés dans this
        for (const disc of syncResult.discs.pulled) {
            await this.saveDisc(disc, false);
        }
        // Disques modifiés dans this
        for (const disc of syncResult.discs.common.pulled) {
            await this.saveDisc(disc, false);
        }

        // Sauvegardes dans src

        // Collections créés dans src
        for (const collection of syncResult.collections.pushed) {
            await src.saveCollection(collection);
        }
        // Collections modifiées dans src
        for (const collection of syncResult.collections.common.pushed) {
            await src.saveCollection(collection);
        }
        // Disques créés dans src
        for (const disc of syncResult.discs.pushed) {
            await src.saveDisc(disc);
        }
        // Disques modifiés dans src
        for (const disc of syncResult.discs.common.pushed) {
            await src.saveDisc(disc);
        }

        console.log('Sauvegarde de l\'état de synchro dans les deux persistances...');
        await this.saveSyncState(thisSyncState);
        await src.saveSyncState(srcSyncState);

        // TODO : post dans les deux persistences
        return syncResult;
    }

    /**
     * Charge l'état actuel de cette persistence pour faciliter la synchronisation
     * @throws Error si aucun état actuel
     */
    protected abstract loadSyncState(): Promise<SyncState>;

    public async getAllCollectionsByNames(): Promise<Record<string, Collection>> {
        const collectionNames = await this.getCollectionNames();
        return this.getCollectionByNames(collectionNames);
    }

    public async setAllCollectionsByNames(allCollectionsByNames: Record<string, Collection>, saveSyncState = true): Promise<void> {
        for (const collectionName in allCollectionsByNames) {
            await this.saveCollection(allCollectionsByNames[collectionName], false);
        }

        if (saveSyncState) {
            const syncState = await this.getSyncState();
            await this.saveSyncState(syncState);
        }
    }

    public async getAllDiscs(): Promise<Disc[]> {
        const discIds = await this.getDiscIds();
        return this.getDiscs(discIds);
    }

    public async setAllDiscs(discs: Disc[], saveSyncState = true): Promise<void> {
        for (const disc of discs) {
            await this.saveDisc(disc, false);
        }

        if (saveSyncState) {
            const syncState = await this.getSyncState();
            await this.saveSyncState(syncState);
        }
    }

    abstract get connectedToGoogleDrive(): boolean;
}


export class SyncResult {
    collections = new SyncResultPart<Collection>();
    discs = new SyncResultPart<Disc>();
}

export class SyncResultPart<T> {
    /** existaient que dans src */
    pulled: T[] = [];
    /** existaient que dans this */
    pushed: T[] = [];
    /** objets en commun avec une autre source peut être modifiés */
    common: {
        /** modifiés dans this */
        pulled: T[];
        /** modifiés dans src */
        pushed: T[];
    } = {
        pulled: [],
        pushed: [],
    };
}

export class SyncState {

    readonly discs: SyncStateDiscs = new SyncStateDiscs(this);
    readonly collections: SyncStateCollections = new SyncStateCollections(this);

    /** date de la dernière modif d'un élément */
    public lastmod: Date;

    /**
     * @param json objet ou chaîne JSON
     * @return {SyncState}
     */
    public static load(json: any): SyncState {
        if (typeof json === 'string') {
            json = JSON.parse(json);
        }
        // TODO : sale... moche... bouh ! => reprendre cycle.js et voir s'il propose une méthode pour parse
        const syncState = new SyncState();
        syncState.lastmod = new Date(json.lastmod);
        syncState.collections.load(json.collections);
        syncState.discs.load(json.discs);
        return syncState;
    }

    containsDisc(discId: string): boolean {
        return this.discs.contains(discId);
    }
}

export abstract class SyncStateElements<T> {

    // On utilise plus de Map car elle se converti très mal en JSON
    // cf commentaires : http://2ality.com/2015/08/es6-map-json.html
    readonly elementsById: { [key: string]: SyncStateElement<T> } = {};

    /** date de la dernière modif d'un élément */
    public lastmod: Date = new Date();

    protected constructor(public parent: SyncState) {
    }

    /**
     * Ajoute un élément ou le met à jour uniquement s'il a été modifié
     * @return l'élément synchronisé avec des infos sur sa synchronisation
     */
    push(element: T): SyncStateElement<T> {
        const id = this.getId(element);
        let ssElement: SyncStateElement<T>;
        if (!(id in this.elementsById)) {
            ssElement = new SyncStateElement<T>(element, this);
            this.elementsById[id] = ssElement;
            return ssElement;
        } else {
            ssElement = this.elementsById[id];
            if (ssElement.hasChanged(element)) {
                ssElement.update(element);
            }
            return ssElement;
        }
    }

    removeById(id: string) {
        delete this.elementsById[id];
    }

    /**
     * @param {T} element
     * @return {string} l'id dans la map qui stocke l'état de chaque élément
     */
    abstract getId(element: T): string;

    contains(id: string): boolean {
        return Boolean(this.elementsById[id]);
    }

    abstract getChecksum(element: T): string;

    // noinspection JSUnusedGlobalSymbols : utilisée lorsqu'on appelle SyncStateDiscs.stringify
    toJSON(): any {
        return cloneWithout(this, ['parent']);
    }

    // TODO méthodes save et load dans la persistence qui utilise un SyncState
    load(json: any) {
        this.lastmod = new Date(json.lastmod);
        _.each(json.elementsById, (elementJSON, key) => {
            const element = new SyncStateElement<T>(undefined, this);
            element.load(elementJSON);
            this.elementsById[key] = element;
        });
    }
}

export class SyncStateElement<T> {

    public /* readonly */ created = new Date();
    public lastmod = new Date();
    public checksum: string;

    constructor(syncedElement: T, public parent: SyncStateElements<T>) {
        if (syncedElement) {
            this.checksum = this.parent.getChecksum(syncedElement);
        }
    }

    hasChanged(syncedElement: T): any {
        return this.checksum !== this.parent.getChecksum(syncedElement);
    }

    update(syncedElement: T): this {
        this.checksum = this.parent.getChecksum(syncedElement);
        this.lastmod = new Date();
        this.parent.lastmod = this.lastmod;
        this.parent.parent.lastmod = this.lastmod;
        return this;
    }

    // noinspection JSUnusedGlobalSymbols : utilisée lorsqu'on appelle SyncStateDiscs.stringify
    toJSON(): any {
        return cloneWithout(this, ['parent']);
    }

    load(json: any) {
        _.extend(this, json);
        this.created = new Date(this.created);
        this.lastmod = new Date(this.lastmod);
    }
}

export class SyncStateDiscs extends SyncStateElements<Disc> {

    constructor(public parent: SyncState) {
        super(parent);
    }

    getId(disc: Disc): string {
        return disc.id;
    }

    getChecksum(disc: Disc): string {
        return md5(disc.toJSON());
    }
}

export class SyncStateCollections extends SyncStateElements<Collection> {

    constructor(public parent: SyncState) {
        super(parent);
    }

    getId(collection: Collection): string {
        return collection.name;
    }

    getChecksum(collection: Collection): string {
        return md5(JSON.stringify(collection));
    }
}

/**
 * Synchro de deux collections qui sont différentes (checksum)
 * @param {Collection} thisCollection
 * @param {Collection} srcCollection
 * @param {SyncResult} syncResult
 * @return {Collection} thisCollection
 */
function syncCommonCollection(thisCollection: Collection, srcCollection: Collection, syncResult: SyncResult): Collection {

    console.log(`Synchro des collections communes`, thisCollection, srcCollection);

    /** Disques absents dans this */
    const pulledDiscIds = srcCollection.discIds.filter(discId => !thisCollection.discIds.includes(discId))
        .map(discId => discId);
    if (pulledDiscIds.length) {
        syncResult.collections.common.pulled.push(srcCollection);
    }

    /** Disques absents dans la source */
    const pushedDiscIds = thisCollection.discIds.filter(discId => !srcCollection.discIds.includes(discId))
        .map(discId => discId);
    if (pushedDiscIds.length) {
        pushOnlyOnce(syncResult.collections.common.pushed, thisCollection);
    }

    // Modification des collections
    if (pulledDiscIds.length || pushedDiscIds.length) {
        // On ajoute les disques de this à la fin de src
        pushedDiscIds.map(discId => srcCollection.push(discId));
        // On reporte la même collection dans this
        thisCollection.replaceWith(srcCollection);
    }

    return thisCollection;
}

/**
 * Synchro de deux disques qui sont différents (checksum)
 * @param {Disc} thisDisc
 * @param {Disc} srcDisc
 * @param {SyncResult} syncResult
 * @return {Disc} thisDisc
 */
function syncCommonDisc(thisDisc: Disc, srcDisc: Disc, syncResult: SyncResult): Disc {
    // Comparaison de la cuesheet pour diff
    // FIXME utiliser plutôt toJSON car print affiche la date courante !
    const thisCueData = CuePrinter.print(thisDisc.cuesheet);
    const srcCueData = CuePrinter.print(srcDisc.cuesheet);
    if (thisCueData === srcCueData) {
        console.log(`Disque ${srcDisc.id} (${srcDisc.title}) inchangé`);
    } else {
        console.log(`Disque ${srcDisc.id} (${srcDisc.title}) différent. On prend celui de la source...`,
            thisCueData, srcCueData);
        pushOnlyOnce(syncResult.discs.common.pulled, srcDisc);
    }

    return thisDisc;
}

function pushOnlyOnce<T>(array: T[], item: T) {
    if (!array.includes(item)) {
        array.push(item);
    }
}

// Pour permettre à LocalAndDistantPersistence d'appeler des méthodes protected
export interface PersistenceWithPublicFields {
    loadSyncState(): Promise<SyncState>;

    postCollection(collection: Collection): Promise<Collection>;

    _deleteCollection(collectionName: string): Promise<void>;

    postDisc(discId: string, disc: Disc): Promise<Disc>;
}

export class NotFoundError extends Error {
}
