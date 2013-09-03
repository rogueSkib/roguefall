import ui.View as View;
import ui.ImageView as ImageView;

import src.views.helpers.Parallax as Parallax;
import src.views.helpers.Platforms as Platforms;
import src.views.helpers.Player as Player;

exports = Class(View, function(supr) {

	var controller,
		BG_WIDTH,
		BG_HEIGHT;

	this.init = function(opts) {
		supr(this, 'init', [opts]);

		controller = GC.app.controller;
		BG_WIDTH = controller.bgWidth;
		BG_HEIGHT = controller.bgHeight;

		this.designView();
	};

	this.designView = function() {
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
			zIndex: 90,
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
	};

	this.resetView = function() {
		this.parallax.reset();
		this.platforms.reset();
		this.player.reset();

		this.offsetY = 0;
	};

	this.constructView = function() {};
	this.deconstructView = function(callback) { callback && callback(); };

	this.onInputStart = function(evt, pt) {
		this.player.targetX = pt.x;
	};

	this.onInputMove = function(evt, pt) {
		this.player.targetX = pt.x;
	};

	this.tick = function(dt) {
		// step the player first, the others rely on offsetY
		this.offsetY = this.player.step(dt);

		this.platforms.step(dt);
		this.parallax.step(dt);
	};
});