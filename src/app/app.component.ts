import { Component } from '@angular/core';
import {LocalAndDistantPersistence} from '../persistence/LocalAndDistantPersistence';
import {LocalStoragePersistence} from '../persistence/LocalStoragePersistence';
import {Persistence} from '../persistence';
import {LocalServerPersistence} from '../persistence/LocalServerPersistence';
import {GoogleDrivePersistence} from '../persistence/GoogleDrivePersistence';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent {
  title = 'app';

    // TODO Impossible à mettre en static dans Persistence sans une erreur avec les prototypes
    // TODO créer un service à la place pour toutes les autres méthodes utilitaires
    /**
     *
     * @return {Persistence}
     */
    static getPersistence(localPersistence: LocalStoragePersistence, http: HttpClient, persistenceName = localStorage.getItem('persistence')): Persistence {
        if (persistenceName === GoogleDrivePersistence.TITLE) {
            if (!GoogleDrivePersistence) {
                window.location.reload(); // FIXME bug à chaque démarrage auto en mode GoogleDrive
            }
            return new GoogleDrivePersistence(http);
        }
        if (persistenceName === LocalStoragePersistence.TITLE) {
            return localPersistence;
        }
        if (persistenceName === LocalServerPersistence.TITLE) {
            return new LocalServerPersistence(http);
        }
        if (persistenceName && persistenceName.startsWith(LocalAndDistantPersistence.TITLE)) {
            const m = /LocalAndDistant\('(\w+)', '(\w+)'\)/.exec(persistenceName);
            if (m) {
                const local = AppComponent.getPersistence(localPersistence, http, m[1]);
                const distant = AppComponent.getPersistence(localPersistence, http, m[2]);
                if (local !== distant) {
                    return new LocalAndDistantPersistence(local, distant);
                } else {
                    return local;
                }
            }
            return localPersistence;
        }

        // Prod
        if (window.location.host === 'bludwarf.github.io' || window.location.port !== '3000') {
            return localPersistence;
        }

        // Cas par défaut
        const persistenceParam = getParameterByName('persistence', document.location.search);
        return persistenceParam === LocalServerPersistence.TITLE ? new LocalServerPersistence(http) : localPersistence;
    }
}
