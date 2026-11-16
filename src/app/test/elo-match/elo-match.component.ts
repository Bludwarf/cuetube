import {Component, computed, input, OnInit} from '@angular/core';
import {pad2} from '../../../utils/utils';
import {FormsModule} from '@angular/forms';

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
    aTrackNumber = input<number>(undefined, {alias: 'at'});
    bDiscId = input<string>(undefined, {alias: 'bd'});
    bTrackNumber = input<number>(undefined, {alias: 'bt'});

    opponents = computed<Opponent[]>(() => {
        return [
            // A
            {
                discId: this.aDiscId(),
                trackNumber: this.aTrackNumber(),
            },
            // B
            {
                discId: this.bDiscId(),
                trackNumber: this.bTrackNumber(),
            }
        ];
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

    // TODO : remonter dans app
    get $foreground() {
        return $('#foreground-overlay');
    }

    ngOnInit() {
        this.$foreground.hide();
    }

    protected clickEloButton(a: Opponent, button: EloComparisonButton, axis: EloAxis, b: Opponent): void {
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
        const opponents = this.opponents();
        const aKey = this.opponentKey(opponents[0]);
        const bKey = this.opponentKey(opponents[1]);
        const lines: string[] = [];
        for (const axis of this.eloAxisList) {
            const comparison = this.eloComparisons.get(axis);
            if (comparison) {
                lines.push(`${aKey} ${comparison.operator}${comparison.axis.id} ${bKey}`);
            }
        }
        this.eloComparisonsText = lines.join('\r\n');
    }

    protected opponentKey(o: Opponent): TrackKey {
        return `${o.discId}:${pad2(o.trackNumber)}`;
    }

    protected async uploadFile(event) {
        const files = event.target.files as FileList;
        const parser = new EloLogParser();
        const eloLogLines = parser.parse(await files.item(0).text());
        console.log(eloLogLines);

        const opponents = this.opponents();
        const a = opponents[0];
        const aKey = this.opponentKey(a);
        const b = opponents[1];
        const bKey = this.opponentKey(b);

        const comparisons = eloLogLines
            .map(line => this.map(line, aKey, a, bKey, b))
            .filter(comparison => Boolean(comparison));
        console.log(comparisons);

        for (const comparison of comparisons) {
            this.addComparison(comparison);
        }
    }

    protected map(line: EloLogLine, aKey: string, a: Opponent, bKey: string, b: Opponent): EloComparison | undefined {
        if (line.aTrackKey === aKey && line.bTrackKey === bKey) {
            return {
                a,
                operator: line.op,
                axis: this.getAxis(line.axisId),
                b,
            };
        }
        if (line.aTrackKey === bKey && line.bTrackKey === aKey) {
            return {
                a,
                operator: this.reverseOperator(line.op),
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

    private reverseOperator(op: EloOperator): EloOperator {
        switch (op) {
            case '<':
                return '>';
            case '=':
                return '=';
            case '>':
                return '<';
        }
    }
}

// TODO à renommer en TrackHash ?
type TrackKey = `${string}:${string}`;

interface Opponent {
    discId: string;
    trackNumber: number;
}

interface EloAxis {
    id: EloAxisId;
    label: string;
    minLabel: string; // "Calme"
    maxLabel: string; // "Énergique"
}

type EloAxisId = 'E' | 'V';

const ENERGY: EloAxis = {
    id: 'E',
    label: 'Énergie',
    minLabel: 'Calme',
    maxLabel: 'Énergique',
};

const VALENCE: EloAxis = {
    id: 'V',
    label: 'Valence',
    minLabel: 'Triste',
    maxLabel: 'Joyeux',
};

// TODO dans le contexte de ce composant on pourrait supprimer a et b
interface EloComparison {
    a: Opponent;
    operator: EloOperator;
    axis: EloAxis;
    b: Opponent;
}

type EloOperator = '<' | '=' | '>';

interface EloComparisonButton {
    label: string;
    operator: EloOperator;
}

class EloLogParser {

    parse(text: string): EloLogLine[] {
        const lines = text.split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => Boolean(line))
            .filter(line => line.match(/^[A-Z0-9]/i))
        ;

        const log: EloLogLine[] = [];
        for (const line of lines) {
            const [aTrackKey, opString, bTrackKey] = line.split(/\s+/);
            const op = this.parseOperatorWithAxis(opString);

            const axisIds: EloAxisId[] = op.axisInitial ? [op.axisInitial] : ['E', 'V'];
            for (const axisId of axisIds) {
                // console.log(`${aTrackKey} ${op.operator}${axisIdInitial} ${bTrackKey}`);
                log.push({
                    aTrackKey: aTrackKey as TrackKey, // TODO validation réelle
                    op: op.operator,
                    axisId,
                    bTrackKey: bTrackKey as TrackKey, // TODO validation réelle
                });
            }
        }

        return log;
    }

    private parseOperatorWithAxis(operatorString: string) {
        return {
            operator: operatorString[0] as EloOperator, // TODO validation réelle
            axisInitial: operatorString[1] as EloAxisId, // TODO validatino réelle
        };
    }
}

interface EloLogLine {
    aTrackKey: TrackKey;
    op: EloOperator;
    axisId: EloAxisId;
    bTrackKey: TrackKey;
}
