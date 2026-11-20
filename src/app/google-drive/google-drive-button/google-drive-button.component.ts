import {Component, inject, NgZone} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {PersistenceService} from '../../persistence/persistence.service';

@Component({
    selector: 'app-google-drive-button',
    imports: [],
    templateUrl: './google-drive-button.component.html',
    styleUrl: './google-drive-button.component.css',
})
export class GoogleDriveButtonComponent {
    protected connecting = false;
    private readonly persistenceService = inject(PersistenceService);

    constructor(
        public http: HttpClient,
        public ngZone: NgZone,
    ) {
    }

    protected get connected(): boolean {
        return this.persistenceService.connectedToGoogleDrive;
    }

    // gapiClient.isSignedIn(GOOGLE_AUTH_PARAMS.clientId).then(isSignedIn => this.connectedToGoogleDrive = isSignedIn);
    async connectGoogleDrive() {
        if (await this.checkStorageAccess()) {
            await this.connectGoogleDrive2();
        }
    }

    async checkStorageAccess() {
        if ('requestStorageAccess' in document) {
            try {
                await document.requestStorageAccess();
                return true;
            } catch (err) {
                alert('requestStorageAccess refusé');
                return false;
            }
        }
    }

    async connectGoogleDrive2() {
        await this.persistenceService.connectToGoogleDrive(connecting => {
            this.ngZone.run(() => this.connecting = connecting);
        });
    }

    disconnectGoogleDrive() {
        this.ngZone.run(() => localStorage.removeItem('persistence'));
    }

}
