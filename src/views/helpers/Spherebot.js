import animate;
import ui.View as View;
import ui.SpriteView as SpriteView;

exports = Class(View, function(supr) {

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
		gameView,
		SPHEREBOT_WIDTH = 114,
		SPHEREBOT_HEIGHT = 114,
		SPHERE_ANCHOR_X = 58,
		SPHERE_ANCHOR_Y = 47,
		SPHERE_OFFSET_R = 0.7333,
		BOT_FEET_Y = 95;

	var SPHEREBOT_URL = "resources/images/game/spherebot/spherebot",
		SPHERE_URL = "resources/images/game/spherebot/sphere";

	this.init = function(opts) {
		opts.x = 0;
		opts.y = 0;
		opts.width = SPHEREBOT_WIDTH;
		opts.height = SPHEREBOT_HEIGHT;
		supr(this, 'init', [opts]);

		controller = GC.app.controller;
		gameView = opts.gameView;

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

	this.reset = function() {
		var model = this.model;
		model.x = 0;
		model.y = 0;
		model.r = 0;
		model.tr = 0;

		this.sphereSprite.startAnimation('idle');
		this.botSprite.startAnimation('idle');
	};

/*	this.getLineView = function(parent, x1, y1, x2, y2, lineThickness) {
		lineThickness = lineThickness || 4;

		var dx = x2 - x1,
			dy = y2 - y1,
			lineLength = Math.sqrt((dx * dx) + (dy * dy));

		return new ImageView({
			superview: parent,
			x: x1 + (dx - lineLength) / 2,
			y: y1 + (dy - lineThickness) / 2,
			r: dx ? Math.atan(dy / dx) : -Math.PI / 2,
			anchorX: lineLength / 2,
			anchorY: lineThickness / 2,
			width: lineLength,
			height: lineThickness,
			image: "resources/images/game/grid_color.png",
			canHandleEvents: false
		});
	};
*/

	this.step = function(dt) {
		var playerModel = gameView.player.model,
			model = this.model,
			style = this.style,
			sphereStyle = this.sphereSprite.style,
			plat = this._platform;

		// if not on a platform ... temp code
		var activePlatforms = gameView.platforms.active;
		if (!plat && activePlatforms.length) {
			plat = this._platform = activePlatforms[0];
			model.x = plat.style.x + plat.hitX + (plat.hitWidth - SPHEREBOT_WIDTH) / 2;
			model.y = plat.style.y + plat.hitY - BOT_FEET_Y + SPHEREBOT_HEIGHT / 2;
		} else {
			// update aim to face player
			var cx = model.x + SPHERE_ANCHOR_X,
				cy = model.y + SPHERE_ANCHOR_Y,
				pdx = playerModel.x - cx,
				pdy = playerModel.y - cy;

			model.x = plat.style.x + plat.hitX + (plat.hitWidth - SPHEREBOT_WIDTH) / 2;
			model.y = plat.style.y + plat.hitY - BOT_FEET_Y + SPHEREBOT_HEIGHT / 2;
			model.tr = pdx ? -atan(pdy / pdx) : -PI / 2;
			model.r = (9 * model.r + model.tr) / 10;

			style.x = model.x - SPHEREBOT_WIDTH / 2;
			style.y = model.y - SPHEREBOT_HEIGHT / 2 - gameView.offsetY;
			sphereStyle.r = model.r + SPHERE_OFFSET_R;
		}
	};
});