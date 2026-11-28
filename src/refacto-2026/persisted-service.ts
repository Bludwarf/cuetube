/**
 * Service qui appelle la persistence pour charger (de préférence, au démarrage de l'appli) ou sauvegarder ses données
 */
export interface PersistedService {
    load(): Promise<void>;

    save(): Promise<void>;
}
