import {Component, input, output} from '@angular/core';
import {GoogleDrivePersistence} from '../../../persistence/GoogleDrivePersistence';
import {notify} from '../../../utils/utils';
import {LocalAndDistantPersistence} from '../../../persistence/LocalAndDistantPersistence';
import {Persistence} from '../../../persistence';
import {LocalStoragePersistence} from '../../../persistence/LocalStoragePersistence';
import {HttpClient} from '@angular/common/http';
import {GapiClientService} from '../../gapi-client.service';
import {AppComponent} from '../../app.component';

@Component({
    selector: 'app-google-drive-button',
    imports: [],
    templateUrl: './google-drive-button.component.html',
    styleUrl: './google-drive-button.component.css',
})
export class GoogleDriveButtonComponent {
    public localPersistence = input<LocalStoragePersistence>(); // debug
    public persistence = input<Persistence>();
    public updatePersistence = output<Persistence>();

    public connectedToGoogleDrive = false;

    constructor(
        public http: HttpClient,
        private gapiClient: GapiClientService,
    ) {
    }

    // gapiClient.isSignedIn(GOOGLE_AUTH_PARAMS.clientId).then(isSignedIn => this.connectedToGoogleDrive = isSignedIn);
    connectGoogleDrive() {

        const loginBtn = document.getElementById('login-btn');
        loginBtn.innerText = 'requestStorageAccess...';
        // this.hidePlayer();

        if ('requestStorageAccess' in document) {
            document.requestStorageAccess().catch(err => {
                alert('requestStorageAccess refusé');
            }).then(() => {
                this.connectGoogleDrive2();
            });
        }
    }

    connectGoogleDrive2() {
        const loginBtn = document.getElementById('login-btn');
        loginBtn.innerText = 'Connexion...';

        const persistence = this.persistence();
        const oldPersistence = persistence instanceof GoogleDrivePersistence ? this.localPersistence() : persistence;
        const googleDrivePersistence = new GoogleDrivePersistence(this.http);
        googleDrivePersistence.init({gapiClient: this.gapiClient}).then(isInit => {

            if (isInit) {
                notify(`Démarrage de la synchro avec ${googleDrivePersistence.title}...`);
                loginBtn.innerText = 'Connecté·e';
                this.connectedToGoogleDrive = true;
                localStorage.setItem('connectedToGoogleDrive', 'true');

                // synchro avec l'ancienne persistance pour ne rien perdre
                oldPersistence.sync(googleDrivePersistence).then(syncResult => {
                    const message = `Synchro terminée avec ${googleDrivePersistence.title}`;
                    console.log(message);
                    console.log(syncResult);
                    notify(message);

                    // On ne change pas de persistence pour accélérer les perfs
                    // puisse qu'on synchronise à chaque démarrage
                    // TODO : attention on crée avec this.persistence et pas localStorage
                    const newPersistence = new LocalAndDistantPersistence(oldPersistence, googleDrivePersistence);
                    this.updatePersistence.emit(newPersistence);
                }).catch(err => {
                    loginBtn.innerText = 'Connecté·e';
                    console.error(err);
                    alert(`Erreur de synchro entre la persistance actuelle et Google Drive. L'appli va être rechargée pour éviter des appels inutiles à Google Drive.`);
                    location.reload();
                });
            } else {
                loginBtn.innerText = 'Google Drive';
                // this.showPlayer();
            }
        }).catch(err => {
            loginBtn.innerText = 'Google Drive';
            // this.showPlayer();
            alert('Erreur de connexion à Google Drive');
            console.error(err);
        });
    }

    disconnectGoogleDrive() {
        // TODO
        this.connectedToGoogleDrive = false;
        const loginBtn = document.getElementById('login-btn');

        localStorage.removeItem('persistence');
        const localPersistence = AppComponent.getPersistence(this.localPersistence(), this.http);
        this.updatePersistence.emit(localPersistence);

        loginBtn.innerText = 'Google Drive';
    }

}
