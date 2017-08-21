
// TODO : clean
function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * @author https://stackoverflow.com/a/2450976/1655155
 */
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

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

/**
 * @author http://stackoverflow.com/a/16737459/1655155
 */
function getCtrl() {
    if (typeof(angular) === undefined) document.location.reload(); // FIXME
    return angular.element(document.getElementById('ctrl')).scope();
}

/* global Notification */
/**
 * @author
 */
// TODO : doc pour Chrome : https://developer.chrome.com/apps/richNotifications
function notify(message, options) {

    /**
     * dir : Le sens du texte de la notification ; Ce peut être auto, ltr, or rtl.
     * lang : Spécifie la langue utilisée dans la notification. Cette chaîne doit être un BCP 47 language tag.
     * body : Une chaîne représentant un contenu supplémentaire à afficher dans la notification.
     * tag : Un identifiant pour une notification donnée qui permet de la récupérer, la remplacer ou la supprimer si besoin.
     * icon : l'URL d'une image à utiliser comme icône par la notification
     */
    options = {
        lang: options.lang || 'fr-FR',
        tag: options.tag || 'm3u-player',
        icon: options.icon || "https://img.youtube.com/vi/"+getCtrl().getVideoId()+"/default.jpg" //'/img/M3U.png' // http://stackoverflow.com/a/2068371/1655155
    };

    // Voyons si le navigateur supporte les notifications
    if (!("Notification" in window)) {
        alert("Ce navigateur ne supporte pas les notifications desktop");
    }

    // Voyons si l'utilisateur est OK pour recevoir des notifications
    else if (Notification.permission === "granted") {
        // Si c'est ok, créons une notification
        var notification = new Notification(message, options);
    }

    // Sinon, nous avons besoin de la permission de l'utilisateur
    // Note : Chrome n'implémente pas la propriété statique permission
    // Donc, nous devons vérifier s'il n'y a pas 'denied' à la place de 'default'
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {

            // Quelque soit la réponse de l'utilisateur, nous nous assurons de stocker cette information
            if(!('permission' in Notification)) {
                Notification.permission = permission;
            }

            // Si l'utilisateur est OK, on crée une notification
            if (permission === "granted") {
                var notification = new Notification(message, options);
            }
        });
    }

    // Comme ça, si l'utlisateur a refusé toute notification, et que vous respectez ce choix,
    // il n'y a pas besoin de l'ennuyer à nouveau.

    // TODO : notification.onclick = ...
}

/**
 *
 * @param time
 * @return {string}
 * @author https://stackoverflow.com/a/6313008
 */
function formatHHMMSS(time) {
  let sec_num = parseInt(time, 10); // don't forget the second param
  let hours   = Math.floor(sec_num / 3600);
  let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  let seconds = sec_num - (hours * 3600) - (minutes * 60);

  if (hours   < 10) {hours   = "0"+hours;}
  if (minutes < 10) {minutes = "0"+minutes;}
  if (seconds < 10) {seconds = "0"+seconds;}
  return hours+':'+minutes+':'+seconds;
}

/**
 * Formattage des timecode dans les tracklist YouTube
 * @param time
 * @return {string}
 * @author https://stackoverflow.com/a/6313008
 */
function formatHMSS(time) {
  let sec_num = parseInt(time, 10); // don't forget the second param
  let hours   = Math.floor(sec_num / 3600);
  let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  let seconds = sec_num - (hours * 3600) - (minutes * 60);

  if (seconds < 10) {seconds = "0"+seconds;}
  if (hours && minutes < 10) {minutes = "0"+minutes;}

  let out = minutes+':'+seconds;
  if (minutes && hours) out = hours+':'+out;
  return out;
}

/**
 *
 * @param time
 * @return {string}
 */
function formatMMSS(time) {
  let sec_num = parseInt(time, 10); // don't forget the second param
  let minutes = Math.floor(sec_num / 60);
  let seconds = sec_num % 60;

  if (minutes < 10) {minutes = "0"+minutes;}
  if (seconds < 10) {seconds = "0"+seconds;}
  return minutes+':'+seconds;
}