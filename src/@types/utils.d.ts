/**
 * Created by mlavigne on 22/08/2017.
 */
declare function getParameterByName(name: string, url: string): string;
declare function setParameterByName(name: string, value: string, url?: string): string;
declare function pad2(i: number): string;
declare function notify(message: string, options?: any): void;

// Fonction dépréciée mais utile pour décoder de l'UTF-8
declare function escape(s:string): string;

declare function formatHHMMSS(time): string;
declare function formatMMSS(time): string;
declare function formatHMSS(time): string;

declare function shuffle(elements: Array<any>);
declare function weightedRandom(elements, weight);