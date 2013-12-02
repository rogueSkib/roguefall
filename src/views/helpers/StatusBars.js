import ui.View as View;
import ui.ImageView as ImageView;
import src.lib.ParticleEngine as ParticleEngine;

exports = Class(ImageView, function(supr) {

	var random = Math.random;

	var controller,
		gameView,
		model,
		FRAME_WIDTH = 256,
		FRAME_HEIGHT = 128,
		HEALTH_X = 27,
		HEALTH_Y = 23,
		HEALTH_FILL = 203,
		ENERGY_X = 27,
		ENERGY_Y = 71,
		ENERGY_FILL = 183,
		SPARK_HEALTH = "resources/images/game/particles/spark_health.png",
		SPARK_ENERGY = "resources/images/game/particles/spark_energy.png";

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

		this.pEngine = new ParticleEngine({
			parent: this,
			width: FRAME_WIDTH,
			height: FRAME_HEIGHT,
			initCount: 20,
			initImage: "resources/images/game/particles/spark_energy.png"
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
		var hcs = this.healthClipper.style;
		var ecs = this.energyClipper.style;
		var initialHealth = hcs.width;
		var initialEnergy = ecs.width;
		model.healthPct = (model.healthTargetPct + 5 * model.healthPct) / 6;
		model.energyPct = (model.energyTargetPct + 5 * model.energyPct) / 6;

		if (model.healthPct) {
			hcs.width = HEALTH_X + model.healthPct * HEALTH_FILL;
		} else {
			hcs.width = 0;
		}

		if (model.energyPct) {
			ecs.width = ENERGY_X + model.energyPct * ENERGY_FILL;
		} else {
			ecs.width = 0;
		}

		var dh = hcs.width - initialHealth;
		if (dh > 0.1) {
			this.emitGainParticle(hcs.width, HEALTH_Y, SPARK_HEALTH);
		} else if (dh < -0.1) {
			this.emitLossParticle(hcs.width, HEALTH_Y, SPARK_HEALTH);
		}

		var de = ecs.width - initialEnergy;
		if (de > 0.1) {
			this.emitGainParticle(ecs.width, ENERGY_Y, SPARK_ENERGY);
		} else if (de < -0.1) {
			this.emitLossParticle(ecs.width, ENERGY_Y, SPARK_ENERGY);
		}

		this.pEngine.runTick(dt);
	};

	this.setHealthPercent = function(pct, instant) {
		model.healthTargetPct = pct;
		instant && (model.healthPct = pct);
	};

	this.setEnergyPercent = function(pct, instant) {
		model.energyTargetPct = pct;
		instant && (model.energyPct = pct);
	};

	this.emitGainParticle = function(x, y, img) {
		var data = this.pEngine.obtainParticleArray(1),
			pObj = data[0],
			size = 10 + random() * 20,
			ttl = 500,
			stop = -1000 / ttl;

		pObj.x = x - size / 2;
		pObj.y = y - size / 2 + random() * 10 - 5;
		pObj.r = random() * 6.28;
		pObj.dr = random() * 6.28 - 3.14;
		pObj.ddr = stop * pObj.dr;
		pObj.anchorX = pObj.anchorY = size / 2;
		pObj.width = pObj.height = size;
		pObj.dscale = stop;
		pObj.dopacity = stop;
		pObj.image = img;
		pObj.ttl = ttl;

		this.pEngine.emitParticles(data);
	};

	this.emitLossParticle = function(x, y, img) {
		var data = this.pEngine.obtainParticleArray(1),
			pObj = data[0],
			size = 16 + random() * 32,
			ttl = 500,
			stop = -1000 / ttl;

		pObj.x = x - size / 2;
		pObj.dx = -30 - random() * 90;
		pObj.ddx = stop * pObj.dx;
		pObj.y = y - size / 2 + random() * 10 - 5;
		pObj.dy = -90 - random() * 30;
		pObj.ddy = stop * pObj.dy;
		pObj.r = random() * 6.28;
		pObj.dr = random() * 6.28 - 3.14;
		pObj.ddr = stop * pObj.dr;
		pObj.anchorX = pObj.anchorY = size / 2;
		pObj.width = pObj.height = size;
		pObj.dscale = stop;
		pObj.image = img;
		pObj.ttl = ttl;

		this.pEngine.emitParticles(data);
	};
});