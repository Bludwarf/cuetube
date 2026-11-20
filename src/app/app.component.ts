import { Component } from '@angular/core';
import {LocalAndDistantPersistence} from '../persistence/LocalAndDistantPersistence';
import {LocalStoragePersistence} from '../persistence/LocalStoragePersistence';
import {Persistence} from '../persistence';
import {LocalServerPersistence} from '../persistence/LocalServerPersistence';
import {GoogleDrivePersistence} from '../persistence/GoogleDrivePersistence';
import { HttpClient } from '@angular/common/http';
import {getParameterByName} from '../utils/utils';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent {
  title = 'app';

}
