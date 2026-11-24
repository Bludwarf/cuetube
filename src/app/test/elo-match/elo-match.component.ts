import {Component, computed, inject, OnInit} from '@angular/core';
import {pad2} from '../../../utils/utils';
import {FormsModule} from '@angular/forms';
import {Disc} from '../../../disc';
import {hideLoader} from '../../app.component';
import {compareTrackHash, currentLocalDate, EloAxis, EloAxisId, EloLogLine, EloOperator, ENERGY, TrackHash, VALENCE} from '../elo/types';
import {EloLogService} from '../elo/elo-log.service';
import {injectABTracks} from '../resolvers';
import Track = Disc.Track;

function reverseOperator(op: EloOperator): EloOperator {
    switch (op) {
        case '<':
            return '>';
        case '=':
            return '=';
        case '>':
            return '<';
    }
}

@Component({
    selector: 'app-elo-match',
    imports: [
        FormsModule
    ],
    templateUrl: './elo-match.component.html',
    styleUrl: './elo-match.component.css',
})
export class EloMatchComponent implements OnInit {

    tracks = injectABTracks();

    sortedTrackHashes = computed<{ aTrackHash: TrackHash, bTrackHash: TrackHash, reversed: boolean } | undefined>(() => {
        const opponents = this.tracks();
        const a = opponents[0];
        const aKey = this.trackHash(a);
        const b = opponents[1];
        const bKey = this.trackHash(b);

        const reversed = compareTrackHash(aKey, bKey) > 0;
        return {
            aTrackHash: reversed ? bKey : aKey,
            bTrackHash: reversed ? aKey : bKey,
            reversed,
        };
    });

    eloAxisList: EloAxis[] = [
        ENERGY,
        VALENCE,
    ];

    eloComparisons: Map<EloAxis, EloComparison> = new Map();
    alreadyAdded = false;
    eloComparisonsText = '';

    eloComparisonButtons: EloComparisonButton[] = [
        {
            label: '←',
            operator: '>',
        },
        {
            label: '=',
            operator: '=',
        },
        {
            label: '→',
            operator: '<',
        }
    ];

    protected readonly eloLogService = inject(EloLogService);

    constructor() {
    }

    async ngOnInit() {
        await this.load();
        hideLoader();
    }

    protected clickEloButton(a: Track, button: EloComparisonButton, axis: EloAxis, b: Track): void {
        const operator = button.operator;
        if (this.eloComparisons.get(axis)?.operator === operator) {
            this.eloComparisons.delete(axis);
        } else {
            const comparison: EloComparison = {
                a,
                operator,
                axis,
                b,
            };
            this.addComparison(comparison);
        }
        this.alreadyAdded = false;
    }

    private addComparison(comparison: EloComparison) {
        this.eloComparisons.set(comparison.axis, comparison);
    }

    protected opponentComparisonLabel(comparison: EloComparison | undefined, o: 'a' | 'b'): string {
        if (!comparison) {
            return '?';
        }

        const operator = comparison.operator;
        if (operator === '=') {
            return '=';
        }

        const isMin = operator === '<' && o === 'a' || operator === '>' && o === 'b';
        if (isMin) {
            return comparison.axis.minLabel;
        } else {
            return comparison.axis.maxLabel;
        }
    }

    protected export() {
        this.eloComparisonsText = this.exportLines();
    }

    private exportLines() {
        return this.eloLogService.export();
    }

    protected trackHash(track: Track): TrackHash {
        return `${track.disc.id}:${pad2(track.number)}` as TrackHash;
    }

    protected async uploadFile(event) {
        const files = event.target.files as FileList;
        const fileContent = await files.item(0).text();
        this.eloLogService.import(fileContent);

        this.addComparisonsFromLines();
    }

    private addComparisonsFromLines() {
        const opponents = this.tracks();
        const a = opponents[0];
        const aKey = this.trackHash(a);
        const b = opponents[1];
        const bKey = this.trackHash(b);

        const comparisons = this.eloLogService.getLines()
            .map(line => this.map(line, aKey, a, bKey, b))
            .filter(comparison => Boolean(comparison));

        for (const comparison of comparisons) {
            this.addComparison(comparison);
            this.alreadyAdded = true;
        }
    }

    protected async load(): Promise<void> {
        await this.eloLogService.load();
        this.addComparisonsFromLines();
    }

    protected addLinesFromComparisons(): void {
        this.eloLogService.addAll(this.getLines());
    }

    getLines(): EloLogLine[] {
        const {aTrackHash, bTrackHash, reversed} = this.sortedTrackHashes();
        const lines: EloLogLine[] = [];
        const date = currentLocalDate();
        for (const axis of this.eloAxisList) {
            const comparison = this.eloComparisons.get(axis);
            if (comparison) {
                const line: EloLogLine = {
                    aTrackHash,
                    op: comparison.operator,
                    axisId: comparison.axis.id,
                    bTrackHash,
                    date,
                };
                if (reversed) {
                    line.op = reverseOperator(line.op);
                }
                lines.push(line);
            }
        }
        return lines;
    }

    protected async save(): Promise<void> {
        await this.eloLogService.save();
    }

    protected map(line: EloLogLine, aKey: string, a: Track, bKey: string, b: Track): EloComparison | undefined {
        if (line.aTrackHash === aKey && line.bTrackHash === bKey) {
            return {
                a,
                operator: line.op,
                axis: this.getAxis(line.axisId),
                b,
            };
        }
        if (line.aTrackHash === bKey && line.bTrackHash === aKey) {
            return {
                a,
                operator: reverseOperator(line.op),
                axis: this.getAxis(line.axisId),
                b,
            };
        }
        return undefined;
    }

    private getAxis(axisId: EloAxisId): EloAxis {
        const eloAxis = this.eloAxisList.find(axis => axis.id === axisId);
        if (!eloAxis) {
            throw new Error(`ID d'axe inconnu : ${axisId}`);
        }
        return eloAxis;
    }

    protected readonly Object = Object;
}

// TODO dans le contexte de ce composant on pourrait supprimer a et b
export interface EloComparison {
    a: Track;
    operator: EloOperator;
    axis: EloAxis;
    b: Track;
}

interface EloComparisonButton {
    label: string;
    operator: EloOperator;
}
