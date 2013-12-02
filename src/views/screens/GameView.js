import ui.View as View;
import ui.ImageView as ImageView;

import src.lib.ViewPool as ViewPool;

import src.models.AppTick as AppTick;
import src.models.Camera as Camera;

import src.views.helpers.Parallax as Parallax;
import src.views.helpers.Platforms as Platforms;
import src.views.helpers.Player as Player;
import src.views.helpers.Input as Input;
import src.views.helpers.Effects as Effects;
import src.views.helpers.StatusBars as StatusBars;

import src.views.helpers.Spherebot as Spherebot;
import src.views.helpers.Laser as Laser;

exports = Class(View, function(supr) {

	var controller,
		BG_WIDTH,
		BG_HEIGHT;

	this.init = function(opts) {
		supr(this, 'init', [opts]);

		controller = GC.app.controller;
		BG_WIDTH = controller.bgWidth;
		BG_HEIGHT = controller.bgHeight;

		// smooth out the game's ticks
		this.appTick = new AppTick();

		this.designView();
	};

	this.designView = function() {
		// all game views are children of rootView except for input
		this.rootView = new View({
			parent: this,
			x: (this.style.width - BG_WIDTH) / 2,
			y: (this.style.height - BG_HEIGHT) / 2,
			width: BG_WIDTH,
			height: BG_HEIGHT,
			canHandleEvents: false,
			blockEvents: true
		});

		this.parallax = new Parallax({
			gameView: this
		});

		this.platforms = new Platforms({
			parent: this.rootView,
			gameView: this,
			zIndex: 95,
			width: 1,
			height: 1,
			canHandleEvents: false,
			blockEvents: true
		});

		this.player = new Player({
			parent: this.rootView,
			gameView: this,
			zIndex: 100
		});

		this.sphereBot = new Spherebot({
			parent: this.rootView,
			gameView: this,
			zIndex: 100
		});

		this.camera = new Camera({
			gameView: this,
			panningBounds: {
				minY: -0.35 * this.style.height,
				maxY: 0.35 * this.style.height
			}
		});

		this.statusBars = new StatusBars({
			parent: this.rootView,
			x: -this.rootView.style.x,
			y: -this.rootView.style.y,
			zIndex: 1000,
			canHandleEvents: false,
			blockEvents: true
		});

		this.projectilePools = {};
		this.projectilePools["LaserPool"] = new ViewPool({
			ctor: Laser,
			initCount: 5,
			initOpts: {
				parent: this.rootView,
				gameView: this,
				zIndex: 200
			}
		});

		this.effects = new Effects({
			gameView: this
		});

		this.input = new Input({
			parent: this,
			x: (this.style.width - BG_WIDTH) / 2,
			y: (this.style.height - BG_HEIGHT) / 2,
			zIndex: 10000,
			width: BG_WIDTH,
			height: BG_HEIGHT
		});
	};

	this.resetView = function() {
		this.parallax.reset();
		this.platforms.reset();
		this.player.reset();

		this.offsetY = 0;
		this.cameraY = 0;
	};

	this.constructView = function() {};
	this.deconstructView = function(callback) { callback && callback(); };

	this.tick = function(dt) {
		// step the player and camera first, the others rely on their offsets
		this.cameraY = this.camera.step(dt);
		this.offsetY = this.player.step(dt) - this.cameraY;

		this.platforms.step(dt);
		this.parallax.step(dt);
		this.statusBars.step(dt);
		this.effects.step(dt);
		this.input.step(dt);

		this.sphereBot.step(dt);

		// step through active projectiles
		for (var p in this.projectilePools) {
			var pool = this.projectilePools[p];
			for (var i = 0; i < pool._freshViewIndex; i++) {
				pool.views[i].step(dt);
			}
		}
	};

	this.obtainProjectile = function(poolName) {
		return this.projectilePools[poolName].obtainView({
			parent: this.rootView,
			gameView: this,
			zIndex: 200
		});
	};

	this.releaseProjectile = function(projectile, poolName) {
		this.projectilePools[poolName].releaseView(projectile);
	};
});