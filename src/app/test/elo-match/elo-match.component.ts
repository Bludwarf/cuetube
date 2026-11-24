import {Component, computed, inject, input, OnInit, resource, ResourceRef, Signal} from '@angular/core';
import {pad2} from '../../../utils/utils';
import {FormsModule} from '@angular/forms';
import {Disc} from '../../../disc';
import {PersistenceService} from '../../persistence/persistence.service';
import {hideLoader} from '../../app.component';
import {EloAxis, EloAxisId, EloLogLine, EloLogParser, EloOperator, ENERGY, TrackHash, VALENCE} from '../elo/types';
import Track = Disc.Track;

function trackResource(persistenceService: PersistenceService, discId: Signal<string>, trackNumber: Signal<number>) {
    return resource({
        params: () => ({
            discId: discId(),
            trackNumber: trackNumber(),
        }),
        loader: async ({params}) => {
            const persistence = await persistenceService.getCurrentPersistenceAndInit();
            const disc = await persistence.getDisc(params.discId);
            return disc.getTrackByNumber(params.trackNumber);
        },
    });
}

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

function reverseLine(line: EloLogLine): EloLogLine {
    return {
        aTrackHash: line.bTrackHash,
        op: reverseOperator(line.op),
        axisId: line.axisId,
        bTrackHash: line.aTrackHash,
    };
}

function formatLine(line: EloLogLine): string {
    return `${line.aTrackHash} ${line.op}${line.axisId} ${line.bTrackHash}`;
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

    aDiscId = input<string>(undefined, {alias: 'ad'});
    aTrackNumber = input<number, string>(0, {alias: 'at', transform: Number});
    aTrack: ResourceRef<Track>;

    bDiscId = input<string>(undefined, {alias: 'bd'});
    bTrackNumber = input<number, string>(0, {alias: 'bt', transform: Number});
    bTrack: ResourceRef<Track>;

    tracks = computed<Track[]>(() => {
        if (!this.aTrack.hasValue() || !this.bTrack.hasValue()) {
            return [];
        }
        return [this.aTrack.value(), this.bTrack.value()];
    });

    eloAxisList: EloAxis[] = [
        ENERGY,
        VALENCE,
    ];

    eloComparisons: Map<EloAxis, EloComparison> = new Map();
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

    constructor() {
        const persistenceService = inject(PersistenceService);
        this.aTrack = trackResource(persistenceService, this.aDiscId, this.aTrackNumber);
        this.bTrack = trackResource(persistenceService, this.bDiscId, this.bTrackNumber);
    }

    ngOnInit() {
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
        const opponents = this.tracks();
        const aKey = this.trackHash(opponents[0]);
        const bKey = this.trackHash(opponents[1]);
        const lines: string[] = [];
        for (const axis of this.eloAxisList) {
            const comparison = this.eloComparisons.get(axis);
            if (comparison) {
                let line: EloLogLine = {
                    aTrackHash: aKey,
                    op: comparison.operator,
                    axisId: comparison.axis.id,
                    bTrackHash: bKey,
                };
                if (aKey.toLowerCase() > bKey.toLowerCase()) {
                    line = reverseLine(line);
                }
                lines.push(formatLine(line));
            }
        }
        this.eloComparisonsText = lines.join('\r\n');
    }

    protected trackHash(track: Track): TrackHash {
        return `${track.disc.id}:${pad2(track.number)}`;
    }

    protected async uploadFile(event) {
        const files = event.target.files as FileList;
        const parser = new EloLogParser();
        const eloLogLines = parser.parse(await files.item(0).text());
        console.log(eloLogLines);

        const opponents = this.tracks();
        const a = opponents[0];
        const aKey = this.trackHash(a);
        const b = opponents[1];
        const bKey = this.trackHash(b);

        const comparisons = eloLogLines
            .map(line => this.map(line, aKey, a, bKey, b))
            .filter(comparison => Boolean(comparison));
        console.log(comparisons);

        for (const comparison of comparisons) {
            this.addComparison(comparison);
        }
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

}

// TODO dans le contexte de ce composant on pourrait supprimer a et b
interface EloComparison {
    a: Track;
    operator: EloOperator;
    axis: EloAxis;
    b: Track;
}

interface EloComparisonButton {
    label: string;
    operator: EloOperator;
}
