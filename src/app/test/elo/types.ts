import {Disc} from '../../../disc';
import {pad2} from '../../../utils/utils';

export type TrackHash = `${string}:${number}${number}`;

export function hashTrack(track: Disc.Track): TrackHash {
    return (track.disc.id + ':' + pad2(track.number)) as TrackHash;
}

export function splitTrackHash(trackHash: TrackHash): { discId: string, trackNumber: number } {
    const [discId, trackNumberString] = trackHash.split(':');
    return {
        discId,
        trackNumber: Number(trackNumberString),
    };
}

export interface EloAxis {
    id: EloAxisId;
    label: string;
    minLabel: string; // "Calme"
    maxLabel: string; // "Énergique"
}

export type EloAxisId = 'E' | 'V';

export const ENERGY: EloAxis = {
    id: 'E',
    label: 'Énergie',
    minLabel: 'Calme',
    maxLabel: 'Énergique',
};

export const VALENCE: EloAxis = {
    id: 'V',
    label: 'Valence',
    minLabel: 'Triste',
    maxLabel: 'Joyeux',
};

export type EloOperator = '<' | '=' | '>';

export class EloLogParser {

    parse(text: string): EloLogLine[] {
        const lines = text.split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => Boolean(line))
            .filter(line => line.match(/^[A-Z0-9]/i))
        ;

        const log: EloLogLine[] = [];
        for (const line of lines) {
            const [aTrackHash, opString, bTrackHash, prefixedDate] = line.split(/\s+/);
            const op = this.parseOperatorWithAxis(opString);

            const axisIds: EloAxisId[] = op.axisInitial ? [op.axisInitial] : ['E', 'V'];
            for (const axisId of axisIds) {
                // console.log(`${aTrackHash} ${op.operator}${axisIdInitial} ${bTrackHash}`);
                log.push({
                    aTrackHash: aTrackHash as TrackHash, // TODO validation réelle
                    op: op.operator,
                    axisId,
                    bTrackHash: bTrackHash as TrackHash, // TODO validation réelle
                    date: prefixedDate.substring(1) as LocalDate, // TODO validation réelle
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

    format(lines: EloLogLine[]): string {
        return lines.map(line => this.formatLine(line)).join('\r\n');
    }

    private formatLine(line: EloLogLine): string {
        return `${line.aTrackHash} ${line.op}${line.axisId} ${line.bTrackHash} @${line.date}`;
    }

}

type Year4D = `${number}${number}${number}${number}`;
type Month2D = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12';
type Day2D =
    '01'
    | '02'
    | '03'
    | '04'
    | '05'
    | '06'
    | '07'
    | '08'
    | '09'
    | '10'
    | '11'
    | '12'
    | '13'
    | '14'
    | '15'
    | '16'
    | '17'
    | '18'
    | '19'
    | '20'
    | '21'
    | '22'
    | '23'
    | '24'
    | '25'
    | '26'
    | '27'
    | '28'
    | '29'
    | '30'
    | '31';
type LocalDate = `${Year4D}-${Month2D}-${Day2D}`;

export function currentLocalDate(): LocalDate {
    return new Date().toISOString().substring(0, 10) as LocalDate;
}

export interface EloLogLine {
    aTrackHash: TrackHash;
    op: EloOperator;
    axisId: EloAxisId;
    bTrackHash: TrackHash;
    date: LocalDate;
}

export interface EloScore {
    trackHash: TrackHash;        // `${disc.id}:${trackNumber}`
    axisId: EloAxisId;          // 'energy' ou 'valence'
    rating: number;           // commence à 1000
    comparisons: number;      // pour savoir si le score est "fiable"
}

type EloScores = Record<EloAxisId, EloScore>;

function createEloScores(trackHash: TrackHash): EloScores {
    return {
        E: {
            trackHash,
            axisId: 'E',
            rating: 1000,
            comparisons: 0,
        },
        V: {
            trackHash,
            axisId: 'V',
            rating: 1000,
            comparisons: 0,
        },
    };
}

export class EloStore {
    axes: EloAxis[] = [];
    scores: EloScore[] = [];       // toutes les pistes, tous les axes confondus

    apply(line: EloLogLine) {
        const a = this.getOrCreateScore(line.aTrackHash, line.axisId);
        const b = this.getOrCreateScore(line.bTrackHash, line.axisId);
        updateElo(a, line.op, b);
    }

    private getOrCreateScore(trackHash: TrackHash, axisId: EloAxisId): EloScore {
        const found = this.scores.find(score => score.trackHash === trackHash && score.axisId === axisId);
        if (found) {
            return found;
        }

        const created = createEloScore(trackHash, axisId);
        this.scores.push(created);
        return created;
    }

    showScores() {
        console.log('trackId', 'energy', 'valence');

        const scoresByTrackHash: Record<TrackHash, EloScores> = {};
        for (const score of this.scores) {
            if (!(score.trackHash in scoresByTrackHash)) {
                scoresByTrackHash[score.trackHash] = {
                    V: undefined,
                    E: undefined,
                };
            }
            scoresByTrackHash[score.trackHash][score.axisId] = score;
        }

        const trackHashs = Object.keys(scoresByTrackHash).sort();

        for (const trackHash of trackHashs) {
            const scores = scoresByTrackHash[trackHash] as EloScores;
            const energy = scores.E ? Math.round(scores.E.rating) : '';
            const valence = scores.V ? Math.round(scores.V.rating) : '';
            const comparisons = scores.E?.comparisons ?? scores.V?.comparisons ?? 0;
            console.log(trackHash, energy, valence, comparisons);
        }
    }

}

function createEloScore(trackHash: TrackHash, axisId: EloAxisId): EloScore {
    return {
        trackHash,
        axisId,
        rating: 1000,
        comparisons: 0,
    };
}

function updateElo(a: EloScore, operator: EloOperator, b: EloScore, k = 32) {
    const expectedA = 1 / (1 + Math.pow(10, (b.rating - a.rating) / 400));
    const scoreA = operator === '>' ? 1 : operator === '=' ? 0.5 : 0;

    a.rating += k * (scoreA - expectedA);
    b.rating += k * ((1 - scoreA) - (1 - expectedA));
    a.comparisons++;
    b.comparisons++;
}

export function compareTrackHash(a: TrackHash, b: TrackHash): number {
    return a.toLowerCase().localeCompare(b.toLowerCase());
}
