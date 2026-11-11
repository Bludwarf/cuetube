export abstract class Repository<I, T> {

    private readonly cache: Record<string, T>;

    protected constructor(
        private readonly inputTypeTitle: string,
        /** Si on souhaite stocker le cache */
        private readonly storageKey?: string,
    ) {
        this.cache = this.restoreCache() ?? {};
    }

    public async get(input: I): Promise<T | undefined> {
        const inputTitle = this.getInputTitle(input);

        const hash = this.computeHash(input);
        if (hash in this.cache) {
            return this.cache[hash];
        }

        console.group(`Recherche ${this.inputTypeTitle.toLowerCase()} "${inputTitle}" dans MusicBrainz...`);
        const found = await this.search(input);
        if (found) {
            console.log(`Trouvé ! => ${found}`);
        } else {
            console.warn(`${this.inputTypeTitle} "${inputTitle} introuvable dans MusicBrainz`);
        }
        console.groupEnd();

        this.cache[hash] = found;
        this.storeCache();
        return found;
    }

    protected abstract getInputTitle(input: I): string;

    protected abstract computeHash(input: I): string;

    protected abstract search(input: I): Promise<T | undefined>;

    private storeCache(): void {
        if (!this.storageKey) {
            return;
        }
        if (this.cache) {
            localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
        } else {
            localStorage.removeItem(this.storageKey);
        }
    }

    private restoreCache(): typeof this.cache | null {
        if (!this.storageKey) {
            return null;
        }
        const jsonCache = localStorage.getItem(this.storageKey);
        if (!jsonCache) {
            return null;
        }
        const cache = JSON.parse(jsonCache);
        console.debug(`Cache ${this.storageKey} à restaurer`, cache);
        return cache;
    }
}
