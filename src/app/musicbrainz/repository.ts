export abstract class Repository<I, T> {

    private readonly cache: Record<string, T> = {};

    constructor(
        private readonly inputTypeTitle: string,
    ) {
    }

    public async get(input: I): Promise<T | undefined> {
        const inputTitle = this.getInputTitle(input);

        const hash = this.computeHash(input);
        if (hash in this.cache) {
            const cached = this.cache[hash];
            // console.debug(`Cache réutilisé pour ${this.inputTypeTitle.toLowerCase()} "${inputTitle}" [${hash}] => ${cached}`);
            return cached;
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
        return found;
    }

    protected abstract getInputTitle(input: I): string;

    protected abstract computeHash(input: I): string;

    protected abstract search(input: I): Promise<T | undefined>;
}
