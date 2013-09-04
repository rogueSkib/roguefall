import ui.View as View;
import ui.ImageView as ImageView;

exports = Class(View, function(supr) {

	var controller,
		gameView,
		BG_WIDTH,
		BG_HEIGHT,
		PLAYER_WIDTH = 128,
		PLAYER_HEIGHT = 128,
		PLAYER_FEET = 108,
		GRAVITY = 0.003,
		AIR_RESISTANCE = 0.0025,
		WALL_RESISTANCE = 0.006,
		WALL_WIDTH = 56;

	this.init = function(opts) {
		opts.width = PLAYER_WIDTH;
		opts.height = PLAYER_HEIGHT;
		supr(this, 'init', [opts]);

		controller = GC.app.controller;
		gameView = opts.gameView;
		BG_WIDTH = controller.bgWidth;
		BG_HEIGHT = controller.bgHeight;

		this.designView();
		this.reset();
	};

	this.designView = function() {
		this.imageView = new ImageView({
			parent: this,
			width: PLAYER_WIDTH,
			height: PLAYER_HEIGHT,
			image: "resources/images/game/rogue.png",
			canHandleEvents: false
		});
	};

	this.reset = function() {
		this.style.x = this.x = this.targetX = (BG_WIDTH - PLAYER_WIDTH) / 2;
		this.style.y = this.y = (BG_HEIGHT - PLAYER_HEIGHT) / 2;
		this.width = this.style.width;
		this.height = this.style.height;
		this.vx = 0;
		this.vy = 0;
		this.ax = 0;
		this.ay = 0;
	};

	this.step = function(dt) {
		if (this.targetX <= WALL_WIDTH) {
			this.targetX = WALL_WIDTH / 2;
		} else if (this.targetX >= BG_WIDTH - WALL_WIDTH) {
			this.targetX = BG_WIDTH - WALL_WIDTH / 2;
		}

		this.x = (this.targetX + 7 * this.x) / 8;
		this.style.x = this.x - this.width / 2;

		var resistance = AIR_RESISTANCE;
		if (this.x <= WALL_WIDTH || this.x >= BG_WIDTH - WALL_WIDTH) {
			resistance = WALL_RESISTANCE;
		}

		var startY = this.y;
		this.y += dt * this.vy / 2;
		this.vy += dt * this.ay / 2;
		this.ay = GRAVITY - this.vy * resistance;
		this.vy += dt * this.ay / 2;
		this.y += dt * this.vy / 2;
		this.checkPlatformCollision(startY);

		return this.y;
	};

	this.checkPlatformCollision = function(startY) {
		var platforms = gameView.platforms.active;
		for (var p = 0; p < platforms.length; p++) {
			var platform = platforms[p];
			var platX = platform.style.x + platform.hitX;
			var platY = platform.style.y + platform.hitY - this.style.y;
			var platEndX = platX + platform.hitWidth;
			if (startY + PLAYER_FEET <= platY && this.y + PLAYER_FEET >= platY) {
				if (this.x >= platX && this.x <= platEndX) {
					this.y = platY - PLAYER_FEET;
					this.vy = 0;
					this.ay = 0;
				}
			}
		}
	};
});