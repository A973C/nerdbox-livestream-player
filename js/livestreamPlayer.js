/**
 * Created by jgonzalez on 11/03/2016.
 */
(function ($) {
    'use strict';
    var LivestreamPlayer = function (container, options) {
        this.container = container;
        this.options = options;

        this.el = {
            $buttonContainer: undefined,
            $playButton: undefined,
            $loadSpinner: undefined,
            $settingsButton: undefined,
            $volumeButton: undefined,
            $volumeRange: undefined,
            $volumeRangeSlider: undefined,
            $canvas: undefined
        };

        this.statuses = {
            PAUSED: 0,
            LOADING: 1,
            PLAYING: 2
        };

        this.playStatus = this.statuses.PAUSED;

        this.audio = {
            ctx: undefined,
            analyzer: undefined,
            source: undefined,
            element: undefined,
            currentTime: undefined,
            defaultVolume: 0.8,
            startVolume: undefined
        };

        this.audio.startVolume = this.audio.defaultVolume;

        this.visualisation = {
            paper: undefined,
            path: undefined,
            pathStyle: (typeof options.pathStyle !== 'undefined') ? options.pathStyle : {
                //strokeColor: 'white',
                //strokeWidth: 1,
                //fillColor: {
                //    gradient: {
                //        stops: ['rgba(255, 255, 255, 0.9)', ['rgba(255, 255, 255, 0.8)', 0.3], 'rgba(255, 255, 255, 0.6)']
                //    },
                //    origin: 'top',
                //    destination: 'bottom'
                //}
                fillColor: 'rgba(255, 255, 255, 0.8)'
            },
            scaleX: (typeof options.scaleX !== 'undefined') ? options.scaleX : 1.35,
            enabled: options.visualisationEnabled
        };

        var uidProperty = 'livestreamPlayer-uid';
        var uid = (typeof $(window).data(uidProperty) === "undefined") ? 0 : $(window).data(uidProperty);
        this.uid = $(window).data(uidProperty, uid++).data(uidProperty);

        // Custom builders
        this.builders.buttonContainer = (typeof options.buttonContainerBuilder === 'undefined') ?
            this.builders.buttonContainer : options.buttonContainerBuilder;
        this.builders.playButton = (typeof options.playButtonBuilder === 'undefined') ?
            this.builders.playButton : options.playButtonBuilder;
        this.builders.loadingSpinner = (typeof options.loadingSpinnerBuilder === 'undefined') ?
            this.builders.loadingSpinner : options.loadingSpinnerBuilder;
    };

    /**
     * Changes the play button status
     *
     * @param status One of this.statuses
     */
    LivestreamPlayer.prototype.updatePlayButton = function (status) {
        switch (status) {
            case this.statuses.PAUSED:
                this.el.$loadSpinner.removeClass('active');
                this.el.$playButton.find('i').text('play_arrow');
                break;
            case this.statuses.LOADING:
                this.el.$loadSpinner.addClass('active');
                this.el.$playButton.find('i').text('play_arrow');
                break;
            case this.statuses.PLAYING:
                this.el.$playButton.find('i').text('pause');
                this.el.$loadSpinner.removeClass('active');
                break;
        }
    };

    LivestreamPlayer.prototype.builders = {
        /**
         * Builds the loading circle spinner
         * @returns {*}
         */
        loadingSpinner: function () {
            return $('<div class="preloader-wrapper big">').append(
                $('<div class="spinner-layer">').append(
                    $('<div class="circle-clipper left"><div class="circle">'),
                    $('<div class="gap-patch"><div class="circle">'),
                    $('<div class="circle-clipper right"><div class="circle">')
                )
            );
        },
        playButton: function () {
            return $('<div>').addClass('player-play-btn-wrapper').append(
                $('<a>').addClass('player-play-btn btn-floating btn-large waves-effect')
                    .append(
                        $('<i class="material-icons">').text('play_arrow')
                    )
            );
        },
        buttonContainer: function () {
            return $('<div class="player-controls">').append(
                $('<div class="player-btn-container">'),
                $('<div class="volume-container">'),
                $('<div class="right-btn-container">')
            );
        },
        settingsButton: function (instance) {
            //<a class='dropdown-button' href='#' data-activates='dropdown1' data-hover="true"><i class="material-icons">volume_up</i></a>
            return $('<a href="#">').append(
                $('<i class="material-icons">').text('settings')
            ).click(function () {
                instance.enableVisualisation(!instance.visualisation.enabled);
            });
        },
        volumeButton: function (instance) {
            //<a class='dropdown-button' href='#' data-activates='dropdown1' data-hover="true"><i class="material-icons">volume_up</i></a>
            return $('<a href="#">').append(
                $('<i class="material-icons">').text('volume_up')
            ).click(function (e) {
                instance.el.$buttonContainer.parent().find('.volume-container').addClass('shown');
                e.preventDefault();
            });
        },
        volumeMuteButton: function (instance) {
            return $('<a href="#">').append(
                $('<i class="material-icons">').text('volume_mute')
            ).click(function (e) {
                instance.setVolume(0);
                e.preventDefault();
            });
        },
        volumeMaxButton: function (instance) {
            return $('<a href="#">').append(
                $('<i class="material-icons">').text('volume_up')
            ).click(function (e) {
                instance.setVolume(instance.audio.defaultVolume);
                e.preventDefault();
            });
        },
        volumePaneClose: function (instance) {
            return $('<div class="volume-pane-close">').click(function (e) {
                instance.el.$buttonContainer.parent().find('.volume-container').removeClass('shown');
            });
        }
    };

    /**
     * Entry point for building content and registers events
     */
    LivestreamPlayer.prototype.build = function () {
        var instance = this;

        // init elements
        this.el.$buttonContainer = this.builders.buttonContainer();
        this.el.$playButton = this.builders.playButton();
        this.el.$settingsButton = this.builders.settingsButton(this);
        this.el.$volumeButton = this.builders.volumeButton(this);
        this.el.$volumeRange = $('<div>');

        // append elements
        $(this.container).append(this.el.$buttonContainer);
        this.el.$buttonContainer.parent().find('.player-btn-container')
            .append(this.el.$playButton);
        this.el.$buttonContainer.parent().find('.right-btn-container')
            .append(this.el.$volumeButton, this.el.$settingsButton);
        this.el.$buttonContainer.parent().find('.volume-container')
            .append(
                $("<div>").append(
                    this.builders.volumeMuteButton(this),
                    this.el.$volumeRange,
                    this.builders.volumeMaxButton(this))
            );
        this.el.$buttonContainer.append(this.builders.volumePaneClose(this));

        // volume slider
        noUiSlider.create(this.el.$volumeRange.get(0), {
            start: this.audio.startVolume * 100,
            connect: 'lower',
            step: 1,
            range: {
                'min': 0,
                'max': 100
            },
            format: wNumb({
                decimals: 0
            })
        });
        this.el.$volumeRangeSlider = this.el.$volumeRange.get(0).noUiSlider;
        var onRangeUpdate = function (values) {
            instance.setVolume(values[0] / 100, true);
        };
        this.el.$volumeRangeSlider.on('change', onRangeUpdate);
        this.el.$volumeRangeSlider.on('update', onRangeUpdate);

        // spinner
        this.el.$loadSpinner = this.builders.loadingSpinner();
        this.el.$loadSpinner.insertBefore(this.el.$playButton.parent().find('a'));

        // play event
        this.el.$playButton.click(function () {
            instance.togglePlay();
        });

        // canvas
        this.el.$canvas = $('<canvas>').attr('data-paper-keepalive', 'true')
            .addClass('livestream-player-canvas').attr('resize', 'true');
        if (typeof this.options.visualisationDestination === 'undefined') {
            $(this.container).prepend(this.el.$canvas);
        } else {
            $(this.options.visualisationDestination).prepend(this.el.$canvas);
        }

        this.createAudio();
    };

    /* VISUALISATION */
    /**
     * Visualisation - Initializes the view
     */
    LivestreamPlayer.prototype.initGraph = function () {
        var instance = this;
        paper = new paper.PaperScope();
        paper.setup(this.el.$canvas.get(0));
        this.visualisation.paper = paper;

        this.visualisation.path = new paper.Path(this.visualisation.pathStyle);

        var amount = this.audio.analyzer.frequencyBinCount;
        var strokeW = this.visualisation.path.getStrokeWidth();

        for (var i = 0; i < amount; i++) {
            var point = new paper.Point((i / amount) * paper.view.size.width * this.visualisation.scaleX, paper.view.size.height + strokeW);
            this.visualisation.path.add(point);
        }
        this.visualisation.path.add(new paper.Point(paper.view.size.width, paper.view.size.height + strokeW));
        this.visualisation.path.add(new paper.Point(0, paper.view.size.height + strokeW));
        paper.view.draw();

        paper.view.onFrame = function () {
            if (instance.visualisation.enabled) {
                instance.updateAudioGraph();
            }
        };
        paper.view.onResize = function () {
            instance.viewResized();
        }
    };

    /**
     * Visualisation - Updates the visualisation
     */
    LivestreamPlayer.prototype.updateAudioGraph = function () {
        var amount = this.audio.analyzer.frequencyBinCount;
        var i, percent;

        if (this.playStatus == this.statuses.PLAYING) {
            var frequencyData = new Uint8Array(amount);
            this.audio.analyzer.getByteFrequencyData(frequencyData);

            for (i = 0; i < amount; i++) {
                percent = frequencyData[i] / 255;
                this.visualisation.path.segments[i].point.y =
                    paper.view.size.height - percent * paper.view.size.height + this.visualisation.path.getStrokeWidth();
            }
            this.visualisation.path.smooth();
        } else {
            for (i = 0; i < amount; i++) {
                var max = paper.view.size.height + this.visualisation.path.getStrokeWidth();
                if (this.visualisation.path.segments[i].point.y < max) {
                    this.visualisation.path.segments[i].point.y += 15;
                }
            }
            this.visualisation.path.smooth();
        }
    };

    /**
     * Visualisation - When the canvas gets resized
     */
    LivestreamPlayer.prototype.viewResized = function () {
        var strokeW = this.visualisation.path.getStrokeWidth();
        var amount = this.audio.analyzer.frequencyBinCount;
        for (var i = 0; i < amount; i++) {
            this.visualisation.path.segments[i].point.x = (i / amount) * paper.view.size.width * this.visualisation.scaleX;
            if (this.playStatus != this.statuses.PLAYING) {
                this.visualisation.path.segments[i].point.y = paper.view.size.height + strokeW;
            }
        }
        this.visualisation.path.segments[amount].point.x = paper.view.size.width;
        this.visualisation.path.segments[amount].point.y = paper.view.size.height + strokeW;
        this.visualisation.path.segments[amount + 1].point.y = paper.view.size.height + strokeW;
    };

    /* AUDIO */
    /**
     * Initializes the audio context and setups the analyzer node
     */
    LivestreamPlayer.prototype.initAudio = function () {
        this.audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.audio.analyzer = this.audio.ctx.createAnalyser();
        this.audio.analyzer.fftSize = this.options.fftSize;
    };

    /**
     * Loads the audio stream in a new <audio> element, creates a WebAudio source node from it, attaches the analyzer
     * and registers our events.
     */
    LivestreamPlayer.prototype.createAudio = function () {
        var streamUrl = this.options.stream + '?nocache=' + (new Date()).getMilliseconds();

        this.audio.element = new Audio();
        this.audio.element.src = streamUrl;
        this.audio.element.controls = false;
        this.audio.element.autoplay = false;
        this.audio.element.preload = 'none';
        this.audio.element.crossOrigin = 'anonymous';
        $(this.container).append(this.audio.element);

        var instance = this;

        // Event listener party \o/
        this.audio.element.addEventListener("progress", function () {
            if (instance.audio.currentTime == this.currentTime) {
                instance.updatePlayButton(instance.statuses.LOADING);
            } else {
                instance.updatePlayButton(instance.statuses.PLAYING);
            }
            instance.audio.currentTime = this.currentTime;
        });

        this.audio.element.addEventListener("canplay", function () {
            instance.audio.source = instance.audio.ctx.createMediaElementSource(instance.audio.element);
            instance.audio.source.connect(instance.audio.analyzer);
            instance.audio.analyzer.connect(instance.audio.ctx.destination);
        });

        this.audio.element.addEventListener("stalled", function () {
            instance.updatePlayButton(instance.statuses.LOADING);
        });

        this.audio.element.addEventListener("error", function audioError(e) {
            instance.updatePlayButton(instance.statuses.PAUSED);
            if (e.target.src == window.location) {
                return;
            }
            console.error("Audio error", e);
        });

        this.audio.element.addEventListener("waiting", function () {
            instance.updatePlayButton(instance.statuses.LOADING);
        });

        this.audio.element.addEventListener("pause", function () {
            instance.updatePlayButton(instance.statuses.PAUSED);
        });
    };

    /**
     * Starts playing the stream
     */
    LivestreamPlayer.prototype.startStream = function () {
        this.audio.element.play();
        var instance = this;
        this.audio.element.addEventListener("play", function () {
            instance.onPlay();
        });
    };

    /**
     * Called when the audio element can start playing
     */
    LivestreamPlayer.prototype.onPlay = function () {
        this.el.$loadSpinner.removeClass('active');
        this.updatePlayButton(this.statuses.PLAYING);
        this.playStatus = this.statuses.PLAYING;
    };


    /* PUBLIC API METHODS */
    /**
     * Enables or disables the audio visualisation
     *
     * @param enabled
     */
    LivestreamPlayer.prototype.enableVisualisation = function (enabled) {
        if (enabled) {
            this.el.$canvas.show();
            this.visualisation.paper.view.play();
        } else {
            this.el.$canvas.hide();
            this.visualisation.paper.view.pause();
        }
        this.visualisation.enabled = enabled;
    };

    /**
     * Changes the audio volume
     *
     * @param volume [0..1]
     * @param noSliderUpdate boolean|undefined doesn't update the slider value if set to true
     */
    LivestreamPlayer.prototype.setVolume = function (volume, noSliderUpdate) {
        if (this.playStatus == this.statuses.PLAYING) {
            this.audio.element.volume = volume;
        } else {
            this.audio.startVolume = volume;
        }
        if (!noSliderUpdate) {
            this.el.$volumeRangeSlider.set(volume * 100);
        }
    };

    /**
     * Returns the current audio volume
     * @returns {*|Number}
     */
    LivestreamPlayer.prototype.getVolume = function () {
        return (typeof this.audio.element !== 'undefined') ? this.audio.element.volume : this.audio.startVolume;
    };

    /**
     * Livestream play entry point
     */
    LivestreamPlayer.prototype.play = function () {
        this.startStream();
    };

    /**
     * Play / Pause toggle entry point
     */
    LivestreamPlayer.prototype.togglePlay = function () {
        if (this.playStatus == this.statuses.PAUSED) {
            this.playStatus = this.statuses.LOADING;
            this.updatePlayButton(this.statuses.LOADING);
            this.play();
        } else {
            this.stop();
        }
    };

    /**
     * Livestream stop entry point
     * Destroys the audio element and prevents the browser from buffering from it (by loading a non exisiting source)
     */
    LivestreamPlayer.prototype.stop = function () {
        this.audio.element.src = '';
        this.audio.element.load();
        this.audio.source.disconnect();
        this.audio.element.remove();
        this.createAudio();
        this.playStatus = this.statuses.PAUSED;
        this.updatePlayButton(this.statuses.PAUSED);
        var instance = this;
    };

    /**
     * JQuery plugin initializer
     *
     * @param options see defaults var
     */
    $.fn.livestreamPlayer = function (options) {
        var defaults = {
            /**
             * Your stream URI
             */
            stream: undefined,
            /**
             * Analyzer FFT size, must be a power of two.
             * See Web Audio API AnalyzerNode spec
             */
            fftSize: 1024,
            /**
             * Where the canvas element will be put, defaults to the container
             */
            visualisationDestination: undefined,
            /**
             * Float, visualisation X scale (e.g. 1.4)
             */
            scaleX: undefined,
            /**
             * Path style
             * @see http://paperjs.org/reference/style/
             */
            pathStyle: undefined,
            /**
             * Callback used to build the loading spinner animation.
             * Expects a jquery object
             */
            loadingSpinnerBuilder: undefined,
            /**
             * Callback used to build the player button.
             * Expects a jquery object
             */
            playButtonBuilder: undefined,
            /**
             * Callback used to build the buttons container.
             * Expects a jquery object
             */
            buttonContainerBuilder: undefined,
            /**
             * Enables or diables audio visualisation by default
             */
            visualisationEnabled: true
        };

        options = $.extend({}, defaults, options);

        if (options.stream == undefined) {
            console.error('Option stream is missing');
            return;
        }

        $(this).each(function () {
            var player = new LivestreamPlayer(this, options);
            player.build();
            player.initAudio();
            player.initGraph();
            $(this).data('livestream-player', player);
        });
    }
})(jQuery);
