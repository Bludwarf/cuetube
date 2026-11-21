export abstract class CheckboxSelector<I> {

    private items: I[];
    private lastCheckedIndex: number | undefined;

    afterClickCheckbox(e: MouseEvent, index: number) {
        const input = e.currentTarget as HTMLInputElement;

        // Alt + Click => activer/désactiver tous les autres
        if (e.altKey) {
            // Cochage => on décoche tous les autres
            // et vice-versa
            for (let i = 0; i < this.items.length; ++i) {
                const item = this.items[i];
                if (!item || item === this) {
                    continue;
                }
                item.enabledByUser = !input.checked;
            }
        }

        // Maj + click => activer/désactiver tous entre les deux
        if (e.shiftKey) {
            const startIndex = Math.min(this.lastCheckedIndex, index);
            const endIndex = Math.max(this.lastCheckedIndex, index);
            const tracks = this.disc.tracks.slice(startIndex, endIndex + 1);
            tracks.forEach(function (trackI) {
                if (!trackI || trackI === this) {
                    return;
                }
                trackI.enabledByUser = input.checked;
            });
        }

        // Sauvegarde du dernier click (sans Maj)
        if (!e.shiftKey) {
            player.lastCheckedTrack = this;
        }

        e.stopPropagation();
    }
}
