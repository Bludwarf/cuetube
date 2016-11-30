# Tracklist

Plusieurs pistes dans une même vidéo.

Format dans YouTube :

	<a href="#" onclick="yt.www.watch.player.seekTo(4*60+40);return false;">4:40</a>

Format de l’extérieur :

	https://www.youtube.com/watch?v=Dg0IjOzopYU&t=4m40s

La durée ne peut être déduite qu’avec lé début de la piste suivante.

[ ] Comment faire pour la dernière piste.

# Player

Exemple de soundsgood :

<div class="big-player-youtube sg-player-youtube-container" ng-show="player.videoVisible &amp;&amp; player.playlist.track.data.platform === 'youtube'" player-video-resizer="" src="sections/player/views/youtube_video.html">
		<iframe id="player-youtube" frameborder="0" allowfullscreen="1" title="YouTube video player" width="355" height="200" src="https://www.youtube.com/embed/Dg0IjOzopYU?origin=https%3A%2F%2Fsoundsgood.co&amp;feature=player_embedded&amp;html5=true&amp;enablejsapi=1&amp;controls=0&amp;modestbranding=1&amp;showinfo=0&amp;rel=0&amp;autoplay=0&amp;disablekb=1&amp;playsinline=1&amp;widgetid=2"></iframe>
		<i class="icon icon-resize-normal player-video-resizer"></i>
		<div class="overlay" ng-class="{
      iphone: client.isIphone()
    }">
		</div></div>

source :

	<div class="big-player-youtube sg-player-youtube-container" ng-show="player.videoVisible &amp;&amp; player.playlist.track.data.platform === 'youtube'" player-video-resizer="" src="sections/player/views/youtube_video.html">
		<iframe id="player-youtube" frameborder="0" allowfullscreen="1" title="YouTube video player" width="355" height="200" src="https://www.youtube.com/embed/Dg0IjOzopYU?origin=https%3A%2F%2Fsoundsgood.co&amp;feature=player_embedded&amp;html5=true&amp;enablejsapi=1&amp;controls=0&amp;modestbranding=1&amp;showinfo=0&amp;rel=0&amp;autoplay=0&amp;disablekb=1&amp;playsinline=1&amp;widgetid=2"></iframe>
		<i class="icon icon-resize-normal player-video-resizer"></i>
		<div class="overlay" ng-class="{
      iphone: client.isIphone()
    }">
		</div>
	</div>

