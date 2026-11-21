import {inject, Injectable} from '@angular/core';
import {Persistence} from '../../persistence';
import {LocalStoragePersistence} from '../../persistence/LocalStoragePersistence';
import {GoogleDrivePersistence} from '../../google/GoogleDrivePersistence';
import {LocalServerPersistence} from '../../persistence/LocalServerPersistence';
import {LocalAndDistantPersistence} from '../../persistence/LocalAndDistantPersistence';
import {getParameterByName, notify} from '../../utils/utils';
import {LocalStoragePrefsService} from '../local-storage-prefs.service';
import {SingleFilesGoogleDrivePersistence} from '../../google/SingleFilesGoogleDrivePersistence';

@Injectable({providedIn: 'root'})
export class PersistenceService {
    readonly localStoragePersistence = inject(LocalStoragePersistence);
    private readonly googleDrivePersistence = inject(GoogleDrivePersistence);
    private readonly googleDrivePersistence2 = inject(SingleFilesGoogleDrivePersistence);
    private readonly localServerPersistence = inject(LocalServerPersistence);
    private readonly prefsService = inject(LocalStoragePrefsService);

    get persistenceName(): string {
        return localStorage.getItem('persistence')
            ?? getParameterByName('persistence', document.location.search)
            ?? this.localStoragePersistence.title;
    }

    set persistenceName(persistence: string) {
        localStorage.setItem('persistence', persistence);
    }

    /**
     * @deprecated Utiliser plutôt {@link #getCurrentPersistenceAndInit}, on conserve cette méthode tant que la migration n'est pas finie,
     * car la première migration s'est soldée par un blocage au chargement des disques
     */
    getCurrentPersistence() {
        return this.getPersistence();
    }

    // TODO semble provoque un blocage du chargement des disques : à migrer progressivement
    async getCurrentPersistenceAndInit(): Promise<Persistence> {
        const persistence = this.getPersistence();
        // if (!persistence.wasInit) {
        await persistence.init();
        // }
        return persistence;
    }

    private get persistences(): Persistence[] {
        return [
            this.googleDrivePersistence,
            this.googleDrivePersistence2,
            this.localStoragePersistence,
            this.localServerPersistence,
        ];
    }

    /**
     *
     * @return {Persistence}
     */
    private getPersistence(persistenceName = this.persistenceName): Persistence {
        for (const persistence of this.persistences) {
            if (persistenceName === persistence.title) {
                return persistence;
            }
        }
        if (persistenceName && persistenceName.startsWith(LocalAndDistantPersistence.TITLE)) {
            const {localName, distantName} = LocalAndDistantPersistence.persistenceNames(persistenceName);
            const local = this.getPersistence(localName);
            const distant = this.getPersistence(distantName);
            if (local !== distant) {
                return new LocalAndDistantPersistence(local, distant);
            } else {
                return local;
            }
        }

        throw new Error(`Persistence inconnue : ${persistenceName}`);
    }

    connectToGoogleDrive(v2: boolean, connectingCb?: (connecting: boolean) => any) {
        if (v2) {
            return this.connectToGoogleDriveV2(connectingCb);
        } else {
            return this.connectToGoogleDriveV1(connectingCb);
        }
    }

    private async connectToGoogleDriveV1(connectingCb?: (connecting: boolean) => any) {
        notify(`Connexion à Google Drive...`);
        connectingCb?.(true);
        const persistence = this.getCurrentPersistence();
        const oldPersistence = persistence instanceof GoogleDrivePersistence ? this.localStoragePersistence : persistence;
        const googleDrivePersistence = this.googleDrivePersistence;

        const isInit = await this.tryToInit(googleDrivePersistence, connectingCb);

        if (isInit) {
            notify(`Démarrage de la synchro avec ${googleDrivePersistence.title}...`);
            this.prefsService.connectedToGoogleDrive = true;

            // synchro avec l'ancienne persistance pour ne rien perdre
            try {
                const syncResult = await oldPersistence.sync(googleDrivePersistence);

                const message = `Synchro terminée avec ${googleDrivePersistence.title}`;
                console.log(message);
                console.log(syncResult);
                notify(message);

                const newPersistence = new LocalAndDistantPersistence(oldPersistence, googleDrivePersistence);
                this.persistenceName = newPersistence.title;
            } catch (err) {
                console.error(err);
                alert(`Erreur de synchro entre la persistance actuelle et Google Drive. L'appli va être rechargée pour éviter des appels inutiles à Google Drive.`);
                location.reload();
            } finally {
                connectingCb?.(false);
            }
        }
    }

    private async connectToGoogleDriveV2(connectingCb?: (connecting: boolean) => any) {
        notify(`Connexion à Google Drive...`);
        connectingCb?.(true);
        const googleDrivePersistence = this.googleDrivePersistence2;

        const isInit = await this.tryToInit(googleDrivePersistence, connectingCb);

        if (isInit) {
            this.prefsService.connectedToGoogleDrive = true;
            const newPersistence = new LocalAndDistantPersistence(this.localStoragePersistence, googleDrivePersistence);
            this.persistenceName = newPersistence.title;
            connectingCb?.(false);
        }
    }

    private async tryToInit(googleDrivePersistence: GoogleDrivePersistence | SingleFilesGoogleDrivePersistence,
                            connectingCb?: (connecting: boolean) => any) {
        try {
            return await googleDrivePersistence.init();
        } catch (err) {
            alert('Erreur de connexion à Google Drive');
            console.error(err);
            throw err;
        } finally {
            connectingCb?.(false);
        }
    }

    get connectedToGoogleDrive(): boolean {
        return this.getCurrentPersistence().connectedToGoogleDrive;
    }

    disconnectFromGoogleDrive() {
        delete this.persistenceName;
        this.prefsService.connectedToGoogleDrive = false;
    }
}
