import ui.View as View;
import ui.ImageView as ImageView;

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
		this.background = new ImageView({
			parent: this,
			x: (this.style.width - BG_WIDTH) / 2,
			y: (this.style.height - BG_HEIGHT) / 2,
			width: BG_WIDTH,
			height: BG_HEIGHT,
			image: "resources/images/menu/background.png"
		});
	};

	this.resetView = function() {};
	this.constructView = function() {};
	this.deconstructView = function(callback) { callback && callback(); };

	this.onInputStart = function() {
		this.deconstructView(bind(controller, 'transitionToGame'));
	};
});