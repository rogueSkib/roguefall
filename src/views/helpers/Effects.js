import src.lib.ParticleEngine as ParticleEngine;

exports = Class(function() {

	// math shortcuts
	var min = Math.min,
		max = Math.max,
		random = Math.random,
		sin = Math.sin,
		cos = Math.cos,
		atan = Math.atan,
		abs = Math.abs,
		pow = Math.pow,
		PI = Math.PI;

	var controller,
		gameView;

	var IMG_LASER = "resources/images/game/spherebot/laser.png";

	this.init = function(opts) {
		controller = GC.app.controller;
		gameView = opts.gameView;

		this.mainEngine = new ParticleEngine({
			parent: gameView.rootView,
			width: 1,
			height: 1,
			zIndex: 500,
			initCount: 100,
			initImage: IMG_LASER
		});
	};

	this.emitLaserImpact = function(x, y) {
		var count = 25,
			data = this.mainEngine.obtainParticleArray(count);

		for (var i = 0; i < count; i++) {
			var pObj = data[i],
				width = 16 + random() * 16,
				height = 16 + random() * 16,
				ttl = 250 + random() * 100,
				stop = -1000 / ttl;

			pObj.x = x - width / 2 + random() * 6 - 3;
			pObj.dx = random() * 300 - 150;
			pObj.ddx = stop * pObj.dx;
			pObj.y = y - height / 2 + random() * 6 - 3;
			pObj.dy = random() * 300 - 150;
			pObj.ddy = stop * pObj.dy;
			pObj.r = random() * 6.28;
			pObj.dr = random() * 6.28 - 3.14;
			pObj.ddr = stop * pObj.dr;
			pObj.anchorX = width / 2;
			pObj.anchorY = height / 2;
			pObj.width = width;
			pObj.height = height;
			pObj.dscale = stop;
			pObj.ttl = ttl;
			pObj.image = IMG_LASER;
		}

		this.mainEngine.emitParticles(data);
	};

	this.step = function(dt) {
		this.mainEngine.runTick(dt);
	};
});