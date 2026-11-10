import {IRelation} from 'musicbrainz-api';

// Type pour corriger les résultats réellement reçus de l'API au 10/11/2026
// "relation-list" ne semble pas modélisé dans la lib JS
export interface RelationListItem {
    relations: IRelation[];
}
