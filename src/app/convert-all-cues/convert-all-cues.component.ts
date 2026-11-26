import {Component, inject, OnInit} from '@angular/core';
import {PersistenceService} from '../persistence/persistence.service';
import {MappedDisc} from '../../refacto-2026/mapped-disc';
import {convertCue} from '../test/convert-cue/convert-cue.component';
import {hideLoader} from '../app.component';
import {localComparing} from '../../utils/comparators';
import {Disc} from '../../refacto-2026/disc';
import {DiscService} from '../../refacto-2026/disc.service';
import {YouTubeMappedDiscService} from '../../refacto-2026/you-tube-mapped-disc.service';


@Component({
    selector: 'app-convert-all-cues',
    imports: [],
    templateUrl: './convert-all-cues.component.html',
    styleUrl: './convert-all-cues.component.css',
})
export class ConvertAllCuesComponent implements OnInit {
    protected allMappedDiscs: MappedDisc[];
    private readonly persistenceService = inject(PersistenceService);
    private discService = inject(DiscService);
    private mappedDiscService = inject(YouTubeMappedDiscService);

    ngOnInit(): void {
        hideLoader();
    }

    protected async loadAllCues() {
        const persistence = await this.persistenceService.getCurrentPersistenceAndInit();
        const allCues = await persistence.getAllDiscs();
        this.allMappedDiscs = allCues.map(cue => convertCue(cue));
        this.allMappedDiscs.sort(localComparing(md => md.disc.title));
    }

    protected async saveAllDiscs() {
        for (const mappedDisc of this.allMappedDiscs) {
            this.saveDisc(mappedDisc);
        }
        await this.discService.save();
        await this.mappedDiscService.save();
    }

    private saveDisc(mappedDisc: MappedDisc) {
        const discId = Disc.suggestId(mappedDisc.disc.title);
        this.discService.setDisc(discId, mappedDisc.disc);
        this.mappedDiscService.setMappedDisc(discId, mappedDisc);
    }
}
