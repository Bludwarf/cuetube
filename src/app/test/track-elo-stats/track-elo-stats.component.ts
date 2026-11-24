import {Component, effect, inject, OnInit} from '@angular/core';
import {injectTrack} from '../resolvers';
import {hideLoader, showLoader} from '../../app.component';
import {EloAxisId, EloScore, EloStore, hashTrack, TrackHash} from '../elo/types';
import {calculateStandardDeviation} from '../../../utils/math-utils';
import {PersistenceService} from '../../persistence/persistence.service';
import {EloLogService} from '../elo/elo-log.service';
import {copyToClipboard} from '../../../utils/utils';
import {Disc} from '../../../disc';
import {HashTrackFilter} from '../../track-filter/track-filter';
import {RouterLink} from '@angular/router';
import Track = Disc.Track;

@Component({
    selector: 'app-track-elo-stats',
    imports: [
        RouterLink
    ],
    templateUrl: './track-elo-stats.component.html',
    styleUrl: './track-elo-stats.component.css',
})
export class TrackEloStatsComponent implements OnInit {
    readonly track = injectTrack();
    allScores: Map<EloAxisId, ResolvedEloScore[]>;
    trackScores: EloScore[];
    nearScores: Map<EloAxisId, ResolvedEloScore[]>;
    sd: Map<EloAxisId, number> = new Map();

    private readonly persistenceService = inject(PersistenceService);
    private readonly eloLogService = inject(EloLogService);

    constructor() {
        console.log('constructor');
        effect(async () => {
            showLoader();
            const track = this.track();
            console.log('effect', track);
            await this.computeNearEnergyScores(track);
            hideLoader();
        });
    }

    async ngOnInit(): Promise<void> {
        console.log('ngOnInit');
        await this.eloLogService.load();
    }

    private async computeNearEnergyScores(track: Disc.Track): Promise<void> {
        const eloLogLines = this.eloLogService.getLines();

        const eloStore = new EloStore();
        for (const line of eloLogLines) {
            eloStore.apply(line);
        }

        const persistence = await this.persistenceService.getCurrentPersistenceAndInit();
        const allDiscs = await persistence.getAllDiscs();
        const allTracks = allDiscs.flatMap(disc => disc.tracks);

        const allTrackByHash: Map<TrackHash, Track> = new Map();
        for (const track of allTracks) {
            const hash = hashTrack(track);
            allTrackByHash.set(hash, track);
        }

        this.allScores = new Map();
        for (const score of eloStore.scores) {
            const track = allTrackByHash.get(score.trackHash);
            if (track) {
                const resolvedScore: ResolvedEloScore = {
                    ...score,
                    track,
                };
                if (!this.allScores.has(score.axisId)) {
                    this.allScores.set(score.axisId, []);
                }
                this.allScores.get(score.axisId).push(resolvedScore);
            }
        }

        for (const [_, scores] of this.allScores) {
            scores.sort((a, b) => a.rating - b.rating);
        }

        const trackHash = hashTrack(track);
        this.trackScores = eloStore.scores.filter(score => score.trackHash === trackHash);

        const nearScores: Map<EloAxisId, ResolvedEloScore[]> = new Map();
        for (const axisId of ['E', 'V'] as EloAxisId[]) {

            const sd = calculateStandardDeviation(eloStore.scores
                .filter(score => score.axisId === axisId)
                .map(score => score.rating));
            this.sd.set(axisId, sd);
            const axisTrackScore = this.trackScores.find(score => score.axisId === axisId);  // TODO cache
            if (!axisTrackScore) {
                console.error(`Aucune donnée sur l'axe ${axisId} pour cette piste`);
                continue;
            }
            const rating = axisTrackScore.rating;

            const nearAxisScores = eloStore.scores
                .filter(score => score.axisId === axisId)
                .filter(score => score.rating >= rating - sd && score.rating <= rating + sd);

            for (const track of allTracks) {
                const hash = hashTrack(track);
                const score = nearAxisScores.find(score => score.trackHash === hash); // TODO cache
                if (score) {
                    console.log(`Énergie proche (${score.rating}) : `, track.title);
                    if (!nearScores.has(score.axisId)) {
                        nearScores.set(score.axisId, []);
                    }
                    nearScores.get(score.axisId).push({
                        ...score,
                        track,
                    });
                }
            }
        }

        for (const [_, scores] of nearScores) {
            scores.sort((a, b) => a.rating - b.rating);
        }
        this.nearScores = nearScores;
    }

    protected async copyHashTrackFilter() {
        const lines = this.nearScores.get('E')
            .map(({trackHash, track}) => `'${trackHash}', // ${track.disc.title} - ${track.number}. ${track.title}`);
        await copyToClipboard(lines.join('\r\n'));
    }

    protected async copyHashTrackFilterJson() {
        const hashes = this.nearScores.get('E')
            .map(({trackHash}) => trackHash);
        await copyToClipboard(HashTrackFilter.hashesToJson(hashes));
    }

    protected readonly Math = Math;
    protected readonly hashTrack = hashTrack;

    protected isNear(score: EloScore, axisId: EloAxisId, trackScore: EloScore) {
        const rating = this.trackScores
            .find(score => score.axisId === axisId) // TODO cache
            .rating;
        const sd = this.sd.get(axisId);
        return score.rating >= rating - sd && score.rating <= rating + sd;
    }
}

interface ResolvedEloScore extends EloScore {
    track: Track;
}
