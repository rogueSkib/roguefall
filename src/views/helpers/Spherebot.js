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
		BG_WIDTH,
		BG_HEIGHT,
		SPHEREBOT_WIDTH = 114,
		SPHEREBOT_HEIGHT = 114,
		SPHERE_ANCHOR_X = 58,
		SPHERE_ANCHOR_Y = 47,
		SPHERE_OFFSET_R = 0.7333,
		BOT_FEET_Y = 95,
		ATTACK_COOLDOWN = 2000,
		ATTACK_RANGE = 600,
		ATTACK_RANGE_SQRD = pow(ATTACK_RANGE, 2),
		ATTACK_X = 39,
		ATTACK_Y = 25,
		BARREL_RADIUS = sqrt(pow(ATTACK_X - SPHERE_ANCHOR_X, 2) + pow(ATTACK_Y - SPHERE_ANCHOR_Y, 2));

	var SPHEREBOT_URL = "resources/images/game/spherebot/spherebot",
		SPHERE_URL = "resources/images/game/spherebot/sphere",
		SPHEREBOT_POOL = "SpherebotPool",
		PROJECTILE_POOL = "LaserPool";

	this.init = function(opts) {
		opts.x = 0;
		opts.y = 0;
		opts.width = SPHEREBOT_WIDTH;
		opts.height = SPHEREBOT_HEIGHT;
		supr(this, 'init', [opts]);

		controller = GC.app.controller;
		gameView = opts.gameView;
		BG_WIDTH = controller.bgWidth;
		BG_HEIGHT = controller.bgHeight;

		this.model = {};

		this.designView();
		this.reset();
	};

	this.designView = function() {
		this.sphereSprite = new SpriteView({
			parent: this,
			x: 0,
			y: 0,
			anchorX: SPHERE_ANCHOR_X,
			anchorY: SPHERE_ANCHOR_Y,
			width: SPHEREBOT_WIDTH,
			height: SPHEREBOT_HEIGHT,
			url: SPHERE_URL,
			defaultAnimation: 'idle',
			loop: true,
			autoStart: false,
			canHandleEvents: false
		});
		this.botSprite = new SpriteView({
			parent: this,
			x: 0,
			y: 0,
			anchorX: SPHEREBOT_WIDTH / 2,
			anchorY: SPHEREBOT_HEIGHT / 2,
			width: SPHEREBOT_WIDTH,
			height: SPHEREBOT_HEIGHT,
			url: SPHEREBOT_URL,
			defaultAnimation: 'idle',
			loop: true,
			autoStart: false,
			canHandleEvents: false
		});
	};

	this.reset = function(platform) {
		var model = this.model;
		model.x = 0;
		model.y = 0;
		model.r = 0;
		model.tr = 0;
		model.width = SPHEREBOT_WIDTH;
		model.height = SPHEREBOT_HEIGHT;
		model.hitX = -SPHEREBOT_WIDTH / 3;
		model.hitY = -SPHEREBOT_HEIGHT / 3;
		model.endHitX = SPHEREBOT_WIDTH / 3;
		model.endHitY = SPHEREBOT_HEIGHT / 3;
		model.attackCooldown = ATTACK_COOLDOWN;

		this.platform = platform;

		this.sphereSprite.startAnimation('idle');
		this.botSprite.startAnimation('idle');
	};

	this.fireLaser = function() {
		var style = this.style,
			sphereStyle = this.sphereSprite.style,
			offy = gameView.offsetY,
			cosTheta = cos(sphereStyle.r - SPHERE_OFFSET_R - PI / 2),
			sinTheta = sin(sphereStyle.r - SPHERE_OFFSET_R - PI / 2),
			x1 = style.x + SPHERE_ANCHOR_X + BARREL_RADIUS * cosTheta,
			y1 = style.y + offy + SPHERE_ANCHOR_Y + BARREL_RADIUS * sinTheta,
			x2 = style.x + SPHERE_ANCHOR_X + 2 * ATTACK_RANGE * cosTheta,
			y2 = style.y + offy + SPHERE_ANCHOR_Y + 2 * ATTACK_RANGE * sinTheta;

		var laser = gameView.obtainProjectile(PROJECTILE_POOL);
		laser.fire(x1, y1, x2, y2);
		this.sphereSprite.startAnimation('shoot');
	};

	this.step = function(dt) {
		var player = gameView.player,
			playerModel = player.model,
			playerStyle = player.style,
			model = this.model,
			style = this.style,
			sphereStyle = this.sphereSprite.style,
			plat = this.platform;

		// update aim to face player
		var cx = this.style.x + SPHERE_ANCHOR_X,
			cy = this.style.y + SPHERE_ANCHOR_Y,
			pdx = playerStyle.x + playerStyle.width / 2 - cx,
			pdy = playerStyle.y + 2 * playerStyle.height / 3 - cy,
			pdistSqrd = pdx * pdx + pdy * pdy;

		model.x = plat.style.x + plat.hitX + (plat.hitWidth - SPHEREBOT_WIDTH) / 2;
		model.y = plat.style.y + plat.hitY - BOT_FEET_Y + SPHEREBOT_HEIGHT / 2;
		model.tr = pdx ? atan2(pdy, pdx) + PI / 2 : -PI / 2;
		var dr = model.tr - model.r;
		if (dr > PI) {
			model.r += 2 * PI;
		} else if (dr < -PI) {
			model.r -= 2 * PI;
		}
		model.r = (24 * model.r + model.tr) / 25;

		if (model.attackCooldown > 0) {
			model.attackCooldown -= dt;
		} else if (pdistSqrd <= ATTACK_RANGE_SQRD) {
			model.attackCooldown = ATTACK_COOLDOWN;
			this.fireLaser();
		}

		style.x = model.x - SPHEREBOT_WIDTH / 2;
		style.y = model.y - SPHEREBOT_HEIGHT / 2 - gameView.offsetY;
		sphereStyle.r = model.r + SPHERE_OFFSET_R;

		// collision check player
		if (player.attacking
			&& model.x + model.endHitX >= playerModel.x + playerModel.hitX
			&& model.x + model.hitX <= playerModel.x + playerModel.endHitX
			&& model.y + model.endHitY >= playerModel.y + playerModel.hitY
			&& model.y + model.hitY <= playerModel.y + playerModel.endHitY)
		{
			gameView.effects.emitSpherebotExplosion(model.x, model.y);
			gameView.releaseEnemy(this, SPHEREBOT_POOL);
		} else {
			// release bots that are more than a screen height above
			if (style.y + style.height <= -BG_HEIGHT) {
				gameView.releaseEnemy(this, SPHEREBOT_POOL);
			}
		}
	};
});