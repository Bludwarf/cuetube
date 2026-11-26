import {Component, inject, OnInit} from '@angular/core';
import {DiscService} from '../../../refacto-2026/disc.service';
import {hideLoader} from '../../app.component';
import {RouterLink} from '@angular/router';
import {YouTubeMappedDiscService} from '../../../refacto-2026/you-tube-mapped-disc.service';
import {Disc} from '../../../refacto-2026/disc';

@Component({
    selector: 'app-list',
    imports: [
        RouterLink
    ],
    templateUrl: './disc-list.component.html',
    styleUrl: './disc-list.component.css',
})
export class DiscListComponent implements OnInit {
    private discService = inject(DiscService);
    private mappedDiscService = inject(YouTubeMappedDiscService);
    protected discsIds: string[];

    async ngOnInit() {
        this.initDiscIds();
        hideLoader();
    }

    private initDiscIds() {
        this.discsIds = this.discService.getDiscIds();
        this.discsIds.sort();
    }

    protected changeDiscId(discId: string) {
        let newDiscId = prompt(`Nouveau discId`, discId);
        if (newDiscId) {
            newDiscId = Disc.normalizeId(newDiscId);
            this.discService.changeDiscId(discId, newDiscId);
            this.mappedDiscService.changeDiscId(discId, newDiscId);
            this.initDiscIds();
        }
    }

    protected removeDisc(discId: string) {
        this.discService.removeDisc(discId);
        this.mappedDiscService.removeDisc(discId);
        this.initDiscIds();
    }

    protected async save() {
        await this.discService.save();
        await this.mappedDiscService.save();
    }
}
