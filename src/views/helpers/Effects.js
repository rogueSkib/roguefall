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
	var IMG_SPARK = "resources/images/game/spherebot/spark.png";
	var IMG_SPHEREBOT_ARM = "resources/images/game/spherebot/scrap_1.png";
	var IMG_SPHEREBOT_TREAD = "resources/images/game/spherebot/scrap_2.png";
	var IMG_SPHEREBOT_HALF_1 = "resources/images/game/spherebot/scrap_3.png";
	var IMG_SPHEREBOT_HALF_2 = "resources/images/game/spherebot/scrap_4.png";

	this.init = function(opts) {
		controller = GC.app.controller;
		gameView = opts.gameView;

		this.worldEngine = new ParticleEngine({
			parent: gameView.rootView,
			width: 1,
			height: 1,
			zIndex: 500,
			initCount: 50,
			initImage: IMG_LASER
		});

		this.playerEngine = new ParticleEngine({
			parent: gameView.rootView,
			width: 1,
			height: 1,
			zIndex: 500,
			initCount: 50,
			initImage: IMG_LASER
		});
	};

	this.emitLaserImpact = function(x, y) {
		var count = 15,
			data = this.playerEngine.obtainParticleArray(count);

		for (var i = 0; i < count; i++) {
			var pObj = data[i],
				width = 12 + random() * 12,
				height = 12 + random() * 12,
				ttl = 200 + random() * 100,
				stop = -1000 / ttl;

			pObj.image = IMG_LASER;
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
		}

		this.playerEngine.emitParticles(data);
	};

	this.emitSpherebotExplosion = function(x, y) {
		var count = 20,
			data = this.worldEngine.obtainParticleArray(count);

		for (var i = 0; i < count; i++) {
			var pObj = data[i];

			if (i === 0) {
				var width = 25,
					height = 47,
					ttl = 1000,
					stop = -1000 / ttl;

				pObj.image = IMG_SPHEREBOT_ARM;
				pObj.x = x + random() * 20;
				pObj.dx = random() * 400 - 200;
				pObj.ddx = stop * pObj.dx;
				pObj.y = y - height / 2;
				pObj.dy = -200 - random() * 200;
				pObj.ddy = 800;
				pObj.r = 0;
				pObj.dr = random() * 20 - 10;
				pObj.ddr = stop * pObj.dr;
				pObj.anchorX = width / 2;
				pObj.anchorY = height / 2;
				pObj.width = width;
				pObj.height = height;
				pObj.ddopacity = 2 * stop;
				pObj.ttl = ttl;
			} else if (i === 1) {
				var width = 49,
					height = 28,
					ttl = 1000,
					stop = -1000 / ttl;

				pObj.image = IMG_SPHEREBOT_TREAD;
				pObj.x = x - width / 2 - 6;
				pObj.y = y + 12;
				pObj.width = width;
				pObj.height = height;
				pObj.ddopacity = 2 * stop;
				pObj.ttl = ttl;
			} else if (i === 2) {
				var width = 20,
					height = 24,
					ttl = 1000,
					stop = -1000 / ttl;

				pObj.image = IMG_SPHEREBOT_HALF_1;
				pObj.x = x + random() * 10;
				pObj.dx = random() * 200;
				pObj.ddx = stop * pObj.dx;
				pObj.y = y - height / 2;
				pObj.dy = -200 - random() * 200;
				pObj.ddy = 800;
				pObj.r = 0;
				pObj.dr = random() * 20 - 10;
				pObj.ddr = stop * pObj.dr;
				pObj.anchorX = width / 2;
				pObj.anchorY = height / 2;
				pObj.width = width;
				pObj.height = height;
				pObj.ddopacity = 2 * stop;
				pObj.ttl = ttl;
			} else if (i === 3) {
				var width = 23,
					height = 23,
					ttl = 1000,
					stop = -1000 / ttl;

				pObj.image = IMG_SPHEREBOT_HALF_1;
				pObj.x = x - width - random() * 10;
				pObj.dx = -random() * 200;
				pObj.ddx = stop * pObj.dx;
				pObj.y = y - height / 2;
				pObj.dy = -200 - random() * 200;
				pObj.ddy = 800;
				pObj.r = 0;
				pObj.dr = random() * 20 - 10;
				pObj.ddr = stop * pObj.dr;
				pObj.anchorX = width / 2;
				pObj.anchorY = height / 2;
				pObj.width = width;
				pObj.height = height;
				pObj.ddopacity = 2 * stop;
				pObj.ttl = ttl;
			} else {
				var width = 20 + random() * 20,
					height = 20 + random() * 20,
					ttl = 250 + random() * 250,
					stop = -1000 / ttl;

				pObj.image = IMG_SPARK;
				pObj.x = x - width / 2 + random() * 100 - 50;
				pObj.dx = random() * 300 - 150;
				pObj.ddx = stop * pObj.dx;
				pObj.y = y - height / 2 + random() * 100 - 50;
				pObj.dy = random() * 300 - 150;
				pObj.ddy = stop * pObj.dy;
				pObj.r = random() * 6.28;
				pObj.dr = random() * 20 - 10;
				pObj.ddr = stop * pObj.dr;
				pObj.anchorX = width / 2;
				pObj.anchorY = height / 2;
				pObj.width = width;
				pObj.height = height;
				pObj.dscale = stop;
				pObj.ttl = ttl;
			}
		}

		this.worldEngine.emitParticles(data);
	};

	this.step = function(dt) {
		this.worldEngine.runTick(dt);
		this.playerEngine.runTick(dt);

		this.worldEngine.style.y = -gameView.offsetY;
	};
});