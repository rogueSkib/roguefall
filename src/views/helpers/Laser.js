import animate;
import ui.View as View;
import ui.ImageView as ImageView;
import ui.SpriteView as SpriteView;

exports = Class(View, function(supr) {

	// math shortcuts
	var min = Math.min,
		max = Math.max,
		random = Math.random,
		sin = Math.sin,
		cos = Math.cos,
		atan = Math.atan,
		atan2 = Math.atan2,
		abs = Math.abs,
		pow = Math.pow,
		sqrt = Math.sqrt,
		PI = Math.PI;

	var controller,
		gameView,
		LASER_TIME = 500,
		LASER_THICKNESS = 5,
		LASER_LENGTH = 75,
		LASER_DAMAGE = 10;

	var PROJECTILE_POOL = "LaserPool";

	this.init = function(opts) {
		opts.width = 1;
		opts.height = 1;
		supr(this, 'init', [opts]);

		controller = GC.app.controller;
		gameView = opts.gameView;

		this.model = {};

		this.designView();
		this.reset();
	};

	this.designView = function() {
		this.laser = new ImageView({
			parent: this,
			x: (this.style.width - LASER_LENGTH) / 2,
			y: (this.style.height - LASER_THICKNESS) / 2,
			anchorX: LASER_LENGTH / 2,
			anchorY: LASER_THICKNESS / 2,
			width: LASER_LENGTH,
			height: LASER_THICKNESS,
			image: "resources/images/game/spherebot/laser.png",
			canHandleEvents: false
		});

		// prepare animations
		this.laserAnim = animate(this.model, 'fire');

		// pre-bound functions as callbacks
		this.boundFinishLaser = bind(this, 'finishLaser');
	};

	this.reset = function() {
		var model = this.model;
		model.x = 0;
		model.y = 0;
		model.r = 0;
	};

	this.fire = function(x1, y1, x2, y2) {
		var model = this.model,
			dx = x2 - x1,
			dy = y2 - y1;

		model.x = x1;
		model.y = y1;
		this.laser.style.r = dx ? atan(dy / dx) : -PI / 2;

		this.laserAnim.now({ x: x2, y: y2 }, LASER_TIME, animate.linear)
		.then(this.boundFinishLaser);
	};

	this.finishLaser = function() {
		gameView.releaseProjectile(this, PROJECTILE_POOL);
	};

	this.step = function(dt) {
		var style = this.style,
			model = this.model,
			playerModel = gameView.player.model;

		style.x = model.x;
		style.y = model.y - gameView.offsetY;

		// collision check player
		if (model.x >= playerModel.x + playerModel.hitX
			&& model.x <= playerModel.x + playerModel.endHitX
			&& model.y >= playerModel.y + playerModel.hitY
			&& model.y <= playerModel.y + playerModel.endHitY)
		{
			this.laserAnim.clear();
			this.finishLaser();
			gameView.effects.emitLaserImpact(model.x, model.y);
			gameView.player.takeDamage(LASER_DAMAGE);
		}
	};
});