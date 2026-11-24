import {Component, inject, OnInit} from '@angular/core';
import {injectTrack} from '../resolvers';
import {hideLoader} from '../../app.component';
import {computeHash, EloLogParser, EloScore, EloStore} from '../elo/types';
import {calculateStandardDeviation} from '../../../utils/math-utils';
import {PersistenceService} from '../../persistence/persistence.service';
import {copyToClipboard} from '../../../utils/utils';

@Component({
    selector: 'app-track-elo-stats',
    imports: [],
    templateUrl: './track-elo-stats.component.html',
    styleUrl: './track-elo-stats.component.css',
})
export class TrackEloStatsComponent implements OnInit {
    readonly track = injectTrack();
    scores: EloScore[];

    private readonly persistenceService = inject(PersistenceService);

    ngOnInit(): void {
        hideLoader();
    }

    protected async uploadFile(event) {
        const files = event.target.files as FileList;
        const parser = new EloLogParser();
        const eloLogLines = parser.parse(await files.item(0).text());
        console.log(eloLogLines);

        const eloStore = new EloStore();
        for (const line of eloLogLines) {
            eloStore.apply(line);
        }

        const trackHash = computeHash(this.track());
        this.scores = eloStore.scores.filter(score => score.trackHash === trackHash);

        const eSD = calculateStandardDeviation(eloStore.scores
            .filter(score => score.axisId === 'E')
            .map(score => score.rating));
        console.log('eSD', eSD);

        const persistence = await this.persistenceService.getCurrentPersistenceAndInit();
        const allDiscs = await persistence.getAllDiscs();
        const allTracks = allDiscs.flatMap(disc => disc.tracks);

        const eRating = this.scores
            .find(score => score.axisId === 'E') // TODO cache
            .rating;

        const scoresNearE = eloStore.scores
            .filter(score => score.axisId === 'E')
            .filter(score => score.rating >= eRating - eSD && score.rating <= eRating + eSD);

        const eFilterLines: string[] = []
        for (const track of allTracks) {
            const hash = computeHash(track);
            const score = scoresNearE.find(score => score.trackHash === hash); // TODO cache
            if (score) {
                console.log(`Énergie proche (${score.rating}) : `, track.title);
                eFilterLines.push(`'${hash}', // ${track.disc.title} - ${track.number}. ${track.title}`);
            }
        }

        eFilterLines.sort();
        await copyToClipboard(eFilterLines.join('\r\n'));
    }

    protected readonly Math = Math;
}
