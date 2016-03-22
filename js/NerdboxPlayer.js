'use strict';
/**
 * NerdboxPlayer
 * Created by Xorus on 10/03/2016.
 */
function NerdboxPlayer(appConf) {
    this.appConf = appConf;
    this.websocket = new XorusWebSocket(this, this.appConf.api);
    this.oldStatus = this.status;
    this.status = {
        current: []
    };

    this.appConf.updateInterval = (typeof this.appConf.updateInterval === 'undefined') ? 500 : this.appConf.updateInterval;

    this.fallbackSong = {
        title: 'Webradio Nerdbox',
        artist: 'Nerdbox.fr',
        album: 'Nerdbox.fr',
        duration: 0,
        comment: ''
    };

    this.appConf.status = {
        playing: 'PLAYING',
        ready: 'READY'
    };

    this.appConf.source = {
        request: 'REQUEST'
    };

    this.config = {};
    this.connected = false;
    this.timeDiff = 0;
    this.error = {
        serverNotConnected: false
    };

    // server commands
    this.sc = {
        statusSubscribe: 'radio:subscribe',
        status: 'radio:status',
        time: 'time'
    };

    this.lang = {
        connecting: 'Connexion en cours...',
        serverError: 'Oups! Erreur du serveur, revenez un peu plus tard.',
        disconnected: 'Déconnecté du serveur. Reconnexion...',
        windowTitlePrefix: 'Nerdbox.fr -'
    };

    this.el = {
        $loading: $('#loadingOverlay'),
        $document: $('body'),
        $container: $('#illuphisaPlayer'),
        $nowPlaying: undefined,
        $megaCover: undefined,
        $bottomBar: undefined
    };

    this.isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    this.liveStreamPlayer = undefined;
}

NerdboxPlayer.prototype.start = function () {
    this.build();
    this.websocket.connect();
    var instance = this;
    setInterval(function () {
        instance.update();
    }, this.appConf.updateInterval);
};

NerdboxPlayer.prototype.update = function () {
    if (this.connected) {
        this.displaySongProgress();
    }
};

NerdboxPlayer.prototype.build = function () {
    var instance = this;

    // current song display
    this.el.$nowPlaying = $('<div class="nowPlaying">').append(
        $('<div class="cover">').append(
            $('<img>'),
            $('<div class="loadAnim">').html('<i class="fa fa-refresh fa-spin"></i>')
        ),
        $('<div class="info">').append(
            $('<h3 class="title">'),
            $('<p class="artist">'),
            $('<p class="album">'),
            $('<div class="requestIndicator">'),
            $('<a class="url">')
                .html('<i class="material-icons">open_in_new</i> Site de l\'auteur')
                .attr('target', '_blank')
        )
    );

    // player progressbar
    this.el.$bottomBar = $('<div class="bottomBar">').append(
        $('<span class="progressBar">').append(
            $('<span class="currentProgress">')
        ),
        $('<div class="timer">')
    );

    // background album cover
    this.el.$megaCover = $('<div class="backgroundAlbumCover">').append(
        $('<div class="img">'),
        $('<div class="shade">')
    );

    this.el.$document.append(this.el.$megaCover);
    this.el.$document.append(this.el.$bottomBar);
    this.el.$container.append(this.el.$nowPlaying);

    var enableVisu = !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

    $('.player-container').livestreamPlayer({
        stream: this.appConf.stream,
        visualisationDestination: nerdboxPlayer.el.$megaCover,
        buttonContainerBuilder: function () {
            return $('<div class="player-controls">').append(
                $('<div class="container">').append(
                    $('<div class="left-btn-container">'),
                    $('<div class="player-btn-container">'),
                    $('<div class="right-btn-container">')
                ),
                $('<div class="volume-container">')
            );
        },
        visualisationEnabled: enableVisu
    });
    this.liveStreamPlayer = $('.player-container').data('livestream-player');
    this.liveStreamPlayer.enableVisualisation(enableVisu);
    this.onPlayerReady();
};

/** SOCKET RELATED METHODS **/
NerdboxPlayer.prototype.onSocketMessage = function (message) {
    if (message.data[0] != '{') {
        console.warn("Got invalid JSON", message);
        return;
    }

    var data = $.parseJSON(message.data);

    if (data == undefined || data.type == undefined) {
        return;
    }

    if (data.type == this.sc.status) {
        if (!data.connected) {
            this.error.serverNotConnected = true;
            this.showLoadingScreen();
            this.el.$loading.find('.icon').addClass('on');
            this.el.$loading.find('.icon i').removeClass('fa-cog fa-spin').addClass('fa-exclamation-triangle');
            this.el.$loading.find('.status').html(this.lang.serverError);
        } else {
            this.error.serverNotConnected = false;
        }
        this.readStatus(data);
    } else if (data.type == this.sc.time) {
        this.timeDiff = (new Date).getTime() - data.data;
    }
};

NerdboxPlayer.prototype.onSocketConnecting = function () {
    this.el.$loading.removeClass('off');
    this.el.$loading.find('.icon').addClass('on');
    this.el.$loading.find('.status').html(this.lang.connecting);
};

NerdboxPlayer.prototype.onSocketConnected = function () {
    this.websocket.send(this.sc.time);
    this.websocket.send(this.sc.statusSubscribe);
    this.connected = true;
};

NerdboxPlayer.prototype.onSocketDisconnected = function (message) {
    this.el.$loading.removeClass('off');
    this.el.$loading.find('.icon').removeClass('on');
    this.el.$loading.find('.status').html(this.lang.disconnected);
    //console.warn('Disconnected: ' + message);
    this.connected = false;
};

/** LOADING SCREEN **/

NerdboxPlayer.prototype.showLoadingScreen = function (message) {
    this.el.$loading.removeClass('off');
    this.el.$loading.find('.icon').addClass('on');
    this.el.$loading.find('.status').html(this.lang.disconnected);
};

NerdboxPlayer.prototype.hideLoadingScreen = function () {
    this.el.$loading.addClass('off');
    this.el.$loading.find('.icon').removeClass('on');
    this.el.$loading.find('.icon i').removeClass('fa-exclamation-triangle fa-times-circle');
    this.el.$loading.find('.status').html('');
};

/** PARSERS **/
NerdboxPlayer.prototype.readStatus = function (data) {
    this.status = data;
    this.displayCurrentSong();
    //this.displayPlaylist();
    this.oldStatus = this.status;
};

NerdboxPlayer.prototype.displayCurrentSong = function () {
    var $elm = this.el.$nowPlaying;

    var current = this.status.current;
    if (current == undefined) {
        return;
    }

    if (current.song == undefined) {
        current.song = this.fallbackSong;
    }

    window.document.title = this.lang.windowTitlePrefix + ' ' + current.song.title;
    $elm.find('.title').html(current.song.title);
    $elm.find('.artist').html(current.song.artist);
    $elm.find('.album').html(current.song.album);
    if (current.source == this.appConf.source.request) {
        $elm.find('.requestIndicator').addClass('shown');
    } else {
        $elm.find('.requestIndicator').removeClass('shown');
    }
    if (typeof current.song.url !== "undefined" && current.song.url != null) {
        $elm.find('.url').attr('href', current.song.url).addClass('shown');
    } else {
        $elm.find('.url').attr('href', '#').removeClass('shown');
    }

    // update cover image
    if (this.oldStatus === undefined ||
        this.oldStatus.current === undefined ||
        JSON.stringify(this.oldStatus.current.song) !== JSON.stringify(current.song)) {
        var coverURI = this.appConf.cover + '?nocache=' + (new Date()).getTime();

        var $cover = $elm.find('.cover');
        $cover.addClass('loading');

        var instance = this;

        this.imgPreload(coverURI, function () {
            $cover.find('img').fadeOut(50, function () {
                $cover.removeClass('loading');
                $(this).attr('src', coverURI).fadeIn(50);
            });
            instance.el.$megaCover.find('.img').fadeOut(250, function () {
                $(this).css('background-image', 'url(' + coverURI + ')').fadeIn(250);
            });
            instance.hideLoadingScreen();
        });
    }
};

NerdboxPlayer.prototype.displaySongProgress = function (song) {
    if (this.status.current == undefined) {
        return;
    }

    var airtime = (new Date(this.status.current.airtime)).getTime();
    var now = (new Date()).getTime() - this.timeDiff;
    var elapsed = (now - airtime) / 1000;
    var duration = (this.status.current.song != null) ? this.status.current.song.duration : 0;
    var progress = (elapsed / duration) * 100;

    elapsed = parseInt(elapsed);
    if (elapsed > duration) {
        elapsed = duration;
        progress = 100;
    }

    elapsed = ('' + elapsed).toMMSS();
    duration = ('' + duration).toMMSS();

    this.el.$bottomBar.find('.timer').html(elapsed + ' | ' + duration);
    this.el.$bottomBar.find('.currentProgress').css({width: progress + '%'});
};

NerdboxPlayer.prototype.imgPreload = function (imgs, callback) {
    var loaded = 0;
    var images = [];
    imgs = Object.prototype.toString.apply(imgs) === '[object Array]' ? imgs : [imgs];
    var inc = function () {
        loaded += 1;
        if (loaded === imgs.length && callback) {
            callback(images);
        }
    };
    for (var i = 0; i < imgs.length; i++) {
        images[i] = new Image();
        images[i].onabort = inc;
        images[i].onerror = inc;
        images[i].onload = inc;
        images[i].src = imgs[i];
    }
};

/**
 * Called when everything is initialised and ready to play
 */
NerdboxPlayer.prototype.onPlayerReady = function () {
    if (!this.isMobile && this.appConf.autoPlay) {
        this.liveStreamPlayer.play();
    }
};
