import animate;
import device;
import Sound;

import ui.View as View;
import ui.TextView as TextView;
import ui.ImageView as ImageView;
import ui.resource.loader as loader;

import event.Emitter as Emitter;

import src.models.AppModel as AppModel;
import src.views.screens.MainMenuView as MainMenuView;
import src.views.screens.GameView as GameView;

var Controller = Class(Emitter, function() {

	var MAX_VOLUME = 127,
		TRANS_TIME = 500;

	this.init = function(opts) {
		this.rootView = GC.app.view;

		this.landscape = false;
		if (this.landscape) {
			this.bgWidth = 1024;
			this.bgHeight = 576;

			this.baseWidth = device.screen.width * (this.bgHeight / device.screen.height);
			this.baseHeight = this.bgHeight;
			this.scale = device.screen.height / this.bgHeight;
		} else {
			this.bgWidth = 576;
			this.bgHeight = 1024;

			this.baseWidth = this.bgWidth;
			this.baseHeight = device.screen.height * (this.bgWidth / device.screen.width);
			this.scale = device.screen.width / this.bgWidth;
		}

		this.appModel = new AppModel();

		this.config = this.readJSON("resources/data/Config.json");
		this.soundConfig = this.readJSON("resources/data/SoundConfig.json");

		this.initAudio();

		this.screenViews = {};
	};

/* ~ ~ ~ VIEW FUNCTIONS ~ ~ ~ */

	// swap active screens
	// this should be called after deconstructView is called on the current screen
	// this fn preloads any directories passed in and then transitions to the next active screen
	// after the transition completes, constructView is called on the now active screen
	var screenUID = 0;
	this.transitionToScreen = function(name, ctor, preloads) {
		this.blockInput();

		var oldView = this.activeView;
		var nextView = this.screenViews[name];

		if (oldView) {
			var boundTransition = bind(this, function() {
				if (nextView) {
					this.activeView = nextView;
					this.activeView.style.visible = true;
				} else {
					this.screenViews[name] = this.activeView = new ctor({
						parent: this.rootView,
						x: 0,
						y: 0,
						width: this.baseWidth,
						height: this.baseHeight,
						scale: this.scale
					});
					this.activeView.screenUID = screenUID++;
				}

				this.activeView.resetView();

				if (oldView.screenUID > this.activeView.screenUID) {
					animate(oldView).now({ opacity: 0 }, TRANS_TIME, animate.linear)
					.then(bind(this, function() {
						oldView.style.visible = false;
						oldView.style.opacity = 1;
						this.unblockInput();
						this.activeView.constructView();
					}));
				} else {
					this.activeView.style.opacity = 0;
					animate(this.activeView).now({ opacity: 1 }, TRANS_TIME, animate.linear)
					.then(bind(this, function() {
						oldView.style.visible = false;
						this.unblockInput();
						this.activeView.constructView();
					}));
				}
			});
		} else {
			var boundTransition = bind(this, function() {
				this.screenViews[name] = this.activeView = new ctor({
					parent: this.rootView,
					x: 0,
					y: 0,
					width: this.baseWidth,
					height: this.baseHeight,
					scale: this.scale
				});
				this.activeView.screenUID = screenUID++;

				this.activeView.resetView();

				this.unblockInput();
				this.activeView.constructView();
			});
		}

		// preload what we need, and then transition
		if (preloads) {
			loader.preload(preloads, boundTransition);
		} else {
			boundTransition();
		}
	};

	this.transitionToMainMenu = function() {
		this.transitionToScreen("MainMenuView", MainMenuView, "resources/images/menu");
	};

	this.transitionToGame = function() {
		this.transitionToScreen("GameView", GameView, "resources/images/game");
	};

	this.blockInput = function() {
		this.rootView.getInput().blockEvents = true;
	};

	this.unblockInput = function() {
		this.rootView.getInput().blockEvents = false;
	};

	this.isInputBlocked = function() {
		return this.rootView.getInput().blockEvents;
	};

/* ~ ~ ~ DATA FUNCTIONS ~ ~ ~ */

	this.getData = function(key) {
		return this.appModel.getData(key);
	};

	this.setData = function(key, value) {
		this.appModel.setData(key, value);
	};

/* ~ ~ ~ SOUND FUNCTIONS ~ ~ ~ */

	this.initAudio = function() {
		this.music = new Sound({
			path: "resources/sounds/music",
			map: {
				//musicName: { background: true }
			}
		});

		this.effects = new Sound({
			path: "resources/sounds/effects",
			map: {
				//effectName: {}
			}
		});

		this.setMusicVolume(this.soundConfig.globals.master);
		this.setEffectVolume(this.soundConfig.globals.master);
	};

	this.setMusicVolume = function(value) {
		for (var key in this.music._map) {
			this.music.setVolume(key, this.calcVolume(value, "music", key));
		}
	};

	this.setEffectVolume = function(value) {
		for (var key in this.effects._map) {
			this.effects.setVolume(key, this.calcVolume(value, "effect", key));
		}
	};

	this.calcVolume = function(volume, type, key) {
		var baseVolume = type === "music"
			? this.soundConfig.volume.music[key]
			: this.soundConfig.volume.effects[key];

		if (baseVolume === undefined) {
			baseVolume = MAX_VOLUME;
		}

		return volume * baseVolume / MAX_VOLUME;
	};

	this.playSound = function(name) {
		if (this.getData("sfxEnabled")) {
			this.effects.play(name);
		}
	};

	this.playSong = function(name) {
		if (this.getData("musicEnabled")) {
			this.playingSong = name;
			this.music.playBackgroundMusic(name);
		}
	};

	this.resumeSong = function() {
		if (this.playingSong) {
			this.playSong(this.playingSong);
		}
	};

	this.pauseSong = function() {
		this.music.pauseBackgroundMusic();
	};

/* ~ ~ ~ UTILITY FUNCTIONS ~ ~ ~ */

	this.readJSON = function(url) {
		try {
			if (typeof window.CACHE[url] === 'string') {
				window.CACHE[url] = JSON.parse(window.CACHE[url]);
			}

			if (window.CACHE[url] === undefined) {
				logger.error('Did you embed the file: ' + url + '? Try restarting Tealeaf.');
				throw new Error('cannot find embedded JSON file');
			}

			return window.CACHE[url];
		} catch (e) {
			logger.error('Invalid JSON file format.');
			throw e;
		}
	};
});

// singleton behavior
var instance;
exports = {
	get: function() {
		if (!instance) { instance = new Controller(); }
		return instance;
	}
};