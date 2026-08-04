// TODO : clean
import _ from 'underscore';

export function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) {
        return null;
    }
    if (!results[2]) {
        return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Usage 1 : url2 = setParameterByName('paramName', 'paramValue', url);
 * Usage 2 : window.location.href = setParameterByName('paramName', 'paramValue');
 * @param name
 * @param value
 * @param url
 * @return {string}
 */
export function setParameterByName(name, value, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('([?&])' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results || !results[3]) {
        return url + (url.indexOf('?') === -1 ? '?' : '&') + `${name}=${value}`;
    }
    return url.replace(results[0], `${results[1]}${name}=${value}`);
}

/**
 * @author https://stackoverflow.com/a/2450976/1655155
 */
export function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

/* global Notification */
/**
 * @author
 */
// TODO : doc pour Chrome : https://developer.chrome.com/apps/richNotifications
export function notify(message, options?) {

    /**
     * dir : Le sens du texte de la notification ; Ce peut être auto, ltr, or rtl.
     * lang : Spécifie la langue utilisée dans la notification. Cette chaîne doit être un BCP 47 language tag.
     * body : Une chaîne représentant un contenu supplémentaire à afficher dans la notification.
     * tag : Un identifiant pour une notification donnée qui permet de la récupérer, la remplacer ou la supprimer si besoin.
     * icon : l'URL d'une image à utiliser comme icône par la notification
     */
    options = _.extend({
        lang: 'fr-FR',
        tag: 'm3u-player',
        icon: '/img/M3U.png' // "https://img.youtube.com/vi/"+getCtrl().getVideoId()+"/default.jpg" // http://stackoverflow.com/a/2068371/1655155
    }, options);

    // Voyons si le navigateur supporte les notifications
    if (!('Notification' in window)) {
        alert('Ce navigateur ne supporte pas les notifications desktop');
    } else if (Notification.permission === 'granted') {
        // Si c'est ok, créons une notification
        const notification = new Notification(message, options);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {

            // Quelque soit la réponse de l'utilisateur, nous nous assurons de stocker cette information
            if (!('permission' in Notification)) {
                (Notification as any).permission = permission;
            }

            // Si l'utilisateur est OK, on crée une notification
            if (permission === 'granted') {
                const notification = new Notification(message, options);
            }
        });
    }

    // Comme ça, si l'utlisateur a refusé toute notification, et que vous respectez ce choix,
    // il n'y a pas besoin de l'ennuyer à nouveau.

    // TODO : notification.onclick = ...
}

/**
 * Formattage des timecode dans les tracklist YouTube
 * @author https://stackoverflow.com/a/6313008
 */
export function formatHMSS(time: number): string {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time - (hours * 3600)) / 60);
    const seconds = Math.floor(time - (hours * 3600) - (minutes * 60));

    const secondsString = pad2(seconds);
    const minutesString = hours ? pad2(minutes) : '' + minutes;

    return (hours ? hours + ':' : '') + minutesString + ':' + secondsString;
}

/**
 * Sélectionne un élément parmi une liste en fonction du poids de chaque élément
 * @param elements {Array<T>}
 * @param weight {function(T): number} fonction pour calculer le poids de chaque élément
 * @return T
 * @template T
 * @author https://stackoverflow.com/a/8435261
 */
export function weightedRandom(elements, weight) {

    if (!elements || !elements.length) {
        return null;
    }
    if (elements.length === 1) {
        return elements[0];
    }

    const weights = elements.map(element => weight(element));
    const total = weights.reduce((a, b) => a + b, 0);
    const r = Math.random() * total;
    let sum = 0;
    const i = weights.findIndex(weight => {
        sum += weight;
        return r <= sum;
    });
    return elements[i];
}

export function pad2(i: number): string {
    if (!i) {
        return '00';
    }
    return (i < 10 ? '0' : '') + i;
}
