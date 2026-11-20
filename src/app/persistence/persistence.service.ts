import {inject, Injectable} from '@angular/core';
import {Persistence} from '../../persistence';
import {LocalStoragePersistence} from '../../persistence/LocalStoragePersistence';
import {HttpClient} from '@angular/common/http';
import {GoogleDrivePersistence} from '../../persistence/GoogleDrivePersistence';
import {LocalServerPersistence} from '../../persistence/LocalServerPersistence';
import {LocalAndDistantPersistence} from '../../persistence/LocalAndDistantPersistence';
import {getParameterByName, notify} from '../../utils/utils';
import {GapiClientService} from '../gapi-client.service';

@Injectable({providedIn: 'root'})
export class PersistenceService {
    private readonly httpClient = inject(HttpClient);
    private readonly localPersistence = new LocalStoragePersistence(this.httpClient);
    private readonly googleDrivePersistence = new GoogleDrivePersistence(this.httpClient);
    private readonly gapiClient = inject(GapiClientService);

    getCurrentPersistence() {
        return this.getPersistence();
    }

    // TODO faire un cache plutôt que de recréer les instances à chaque appel
    /**
     *
     * @return {Persistence}
     */
    private getPersistence(
        persistenceName = localStorage.getItem('persistence')
    ): Persistence {
        const http = this.httpClient;
        const localPersistence = this.localPersistence;

        if (persistenceName === GoogleDrivePersistence.TITLE) {
            return new GoogleDrivePersistence(http);
        }
        if (persistenceName === LocalStoragePersistence.TITLE) {
            return localPersistence;
        }
        if (persistenceName === LocalServerPersistence.TITLE) {
            return new LocalServerPersistence(http);
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

        // Prod
        if (window.location.host === 'bludwarf.github.io' || window.location.port !== '3000') {
            return localPersistence;
        }

        // Cas par défaut
        const persistenceParam = getParameterByName('persistence', document.location.search);
        return persistenceParam === LocalServerPersistence.TITLE ? new LocalServerPersistence(http) : localPersistence;
    }

    async connectToGoogleDrive(connectingCb?: (connecting: boolean) => any) {
        connectingCb?.(true);
        const persistence = this.getCurrentPersistence();
        const oldPersistence = persistence instanceof GoogleDrivePersistence ? this.localPersistence : persistence;
        const googleDrivePersistence = this.googleDrivePersistence;

        const isInit = await this.tryToInit(googleDrivePersistence, connectingCb);

        if (isInit) {
            notify(`Démarrage de la synchro avec ${googleDrivePersistence.title}...`);
            localStorage.setItem('connectedToGoogleDrive', 'true');

            // synchro avec l'ancienne persistance pour ne rien perdre
            try {
                const syncResult = await oldPersistence.sync(googleDrivePersistence);

                const message = `Synchro terminée avec ${googleDrivePersistence.title}`;
                console.log(message);
                console.log(syncResult);
                notify(message);

                // On ne change pas de persistence pour accélérer les perfs
                // puisse qu'on synchronise à chaque démarrage
                const newPersistence = new LocalAndDistantPersistence(oldPersistence, googleDrivePersistence);
                const newPersistenceName = `${newPersistence.title}('${oldPersistence.title}', '${googleDrivePersistence.title}')`;
                console.log('SersistenceService:localStorage.setItem(persistence)', newPersistenceName);
                localStorage.setItem('persistence', newPersistenceName);
            } catch (err) {
                console.error(err);
                alert(`Erreur de synchro entre la persistance actuelle et Google Drive. L'appli va être rechargée pour éviter des appels inutiles à Google Drive.`);
                location.reload();
            } finally {
                connectingCb?.(false);
            }
        }
    }

    private async tryToInit(googleDrivePersistence: GoogleDrivePersistence, connectingCb?: (connecting: boolean) => any) {
        try {
            return await googleDrivePersistence.init({gapiClient: this.gapiClient});
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
        localStorage.removeItem('persistence');
    }
}
