import ui.View as View;
import ui.ImageView as ImageView;

import src.lib.ViewPool as ViewPool;

exports = Class(View, function(supr) {

	var controller,
		gameView,
		BG_WIDTH,
		BG_HEIGHT,
		PLATFORM_WIDTH = 128,
		PLATFORM_HEIGHT = 64;

	this.init = function(opts) {
		supr(this, 'init', [opts]);

		controller = GC.app.controller;
		gameView = opts.gameView;
		BG_WIDTH = controller.bgWidth;
		BG_HEIGHT = controller.bgHeight;

		this.designView();
	};

	this.designView = function() {
		this.platformPool = new ViewPool({
			ctor: ImageView,
			initCount: 20,
			initOpts: {
				parent: this,
				width: PLATFORM_WIDTH,
				height: PLATFORM_HEIGHT
			}
		});
	};

	this.reset = function() {};
	this.step = function(dt) {};
});