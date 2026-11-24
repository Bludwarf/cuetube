import {Injectable} from '@angular/core';
import {compareTrackHash, EloLogLine, EloLogParser, TrackHash} from './types';
import {sortedMerge} from '../../../utils/array-utils';
import {notify} from '../../../utils/utils';

const LOCAL_STORAGE_KEY = 'eloLog';

@Injectable({providedIn: 'root'})
export class EloLogService {

    private lines: EloLogLine[] = [];
    private readonly parser = new EloLogParser();

    async save(): Promise<void> {
        localStorage.setItem(LOCAL_STORAGE_KEY, this.export());
    }

    async load(): Promise<void> {
        const json = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (json) {
            this.lines = this.parser.parse(json);
            notify(`${this.lines.length} ligne(s) Elo chargées`);
        }
    }

    import(fileContent: string) {
        const linesToAdd = this.parser.parse(fileContent);
        this.addAll(linesToAdd);
    }

    export(): string {
        return this.parser.format(this.lines);
    }

    getLines(): EloLogLine[] {
        return this.lines;
    }

    /**
     * @param linesToAdd lignes déjà triées
     */
    addAll(linesToAdd: EloLogLine[]) {
        this.lines = sortedMerge(this.lines, linesToAdd, (existingLine, lineToAdd) => {
            const aComparison = compareTrackHash(existingLine.aTrackHash, lineToAdd.aTrackHash);
            if (aComparison !== 0) {
                return aComparison;
            }

            const bComparison = compareTrackHash(existingLine.bTrackHash, lineToAdd.bTrackHash);
            if (bComparison !== 0) {
                return bComparison;
            }

            return existingLine.axisId.localeCompare(lineToAdd.axisId);
        }, (existingLine, lineToAdd) => lineToAdd.date >= existingLine.date);
    }

    includes(aTrackHash: TrackHash, bTrackHash: TrackHash): boolean {
        return this.getLines().some(line =>
            line.aTrackHash === aTrackHash && line.bTrackHash === bTrackHash ||
            line.aTrackHash === bTrackHash && line.bTrackHash === aTrackHash
        );
    }
}
