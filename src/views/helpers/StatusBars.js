import ui.View as View;
import ui.ImageView as ImageView;

exports = Class(ImageView, function(supr) {

	var controller,
		gameView,
		model,
		FRAME_WIDTH = 256,
		FRAME_HEIGHT = 128,
		HEALTH_X = 27,
		HEALTH_FILL = 203,
		ENERGY_X = 27,
		ENERGY_FILL = 183;

	this.init = function(opts) {
		opts.width = FRAME_WIDTH;
		opts.height = FRAME_HEIGHT;
		opts.image = "resources/images/game/ui/status_frame.png";
		supr(this, 'init', [opts]);

		controller = GC.app.controller;
		gameView = opts.gameView;

		model = this.model = {};

		this.designView();
		this.reset();
	};

	this.designView = function() {
		this.healthClipper = new View({
			parent: this,
			width: FRAME_WIDTH,
			height: FRAME_HEIGHT,
			clip: true,
			canHandleEvents: false
		});
		this.healthBar = new ImageView({
			parent: this.healthClipper,
			width: FRAME_WIDTH,
			height: FRAME_HEIGHT,
			image: "resources/images/game/ui/status_bar_health.png",
			canHandleEvents: false
		});

		this.energyClipper = new View({
			parent: this,
			width: FRAME_WIDTH,
			height: FRAME_HEIGHT,
			clip: true,
			canHandleEvents: false
		});
		this.energyBar = new ImageView({
			parent: this.energyClipper,
			width: FRAME_WIDTH,
			height: FRAME_HEIGHT,
			image: "resources/images/game/ui/status_bar_energy.png",
			canHandleEvents: false
		});
	};

	this.reset = function(config) {
		model.healthPct = 1;
		model.healthTargetPct = 1;
		model.energyPct = 1;
		model.energyTargetPct = 1;
		this.step(0);
	};

	this.step = function(dt) {
		model.healthPct = (model.healthTargetPct + 4 * model.healthPct) / 5;
		model.energyPct = (model.energyTargetPct + 4 * model.energyPct) / 5;

		if (model.healthPct) {
			this.healthClipper.style.width = HEALTH_X + model.healthPct * HEALTH_FILL;
		} else {
			this.healthClipper.style.width = 0;
		}

		if (model.energyPct) {
			this.energyClipper.style.width = ENERGY_X + model.energyPct * ENERGY_FILL;
		} else {
			this.energyClipper.style.width = 0;
		}
	};

	this.setHealthPercent = function(pct, instant) {
		model.healthTargetPct = pct;
		instant && (model.healthPct = pct);
	};

	this.setEnergyPercent = function(pct, instant) {
		model.energyTargetPct = pct;
		instant && (model.energyPct = pct);
	};
});