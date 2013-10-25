import animate;
import ui.View as View;
import ui.SpriteView as SpriteView;

exports = Class(View, function(supr) {

	var controller,
		gameView,
		BG_WIDTH,
		BG_HEIGHT,
		PLAYER_WIDTH = 164,
		PLAYER_HEIGHT = 164,
		PLAYER_FEET = 130,
		GRAVITY = 0.003,
		AIR_RESISTANCE = 0.0032,
		WALL_RESISTANCE = 0.0064,
		WALL_WIDTH = 56,
		JUMP_ACCEL = -0.0125,
		JUMP_ACCEL_TIME = 200;

	var STATES = {},
		STATE_IDLE = 0,
		STATE_RUNNING = 1,
		STATE_FALLING = 2,
		STATE_LANDING = 3,
		STATE_WALL_SLIDING = 4,
		STATE_JUMPING = 5,
		STATE_DEFAULT = STATE_IDLE;

	var PLAYER_URL = "resources/images/game/rogue/rogue";

	this.init = function(opts) {
		opts.width = PLAYER_WIDTH;
		opts.height = PLAYER_HEIGHT;
		supr(this, 'init', [opts]);

		controller = GC.app.controller;
		gameView = opts.gameView;
		BG_WIDTH = controller.bgWidth;
		BG_HEIGHT = controller.bgHeight;

		STATES[STATE_IDLE] = {
			action: "idle",
			opts: { iterations: Infinity }
		};
		STATES[STATE_RUNNING] = {
			action: "run",
			opts: { iterations: Infinity }
		};
		STATES[STATE_FALLING] = {
			action: "fall",
			opts: { iterations: Infinity }
		};
		STATES[STATE_LANDING] = {
			action: "land",
			opts: {
				iterations: 1,
				callback: bind(this, 'finishLanding')
			},
			blockInterrupts: true
		};
		STATES[STATE_WALL_SLIDING] = {
			action: "wallSlide",
			opts: { iterations: Infinity }
		};
		STATES[STATE_JUMPING] = {
			action: "fall",
			opts: { iterations: Infinity }
		};

		this.designView();
		this.reset();
	};

	this.designView = function() {
		this.sprite = new SpriteView({
			parent: this,
			width: PLAYER_WIDTH,
			height: PLAYER_HEIGHT,
			url: PLAYER_URL,
			defaultAnimation: STATES[STATE_DEFAULT].action,
			loop: true,
			autoStart: false,
			canHandleEvents: false
		});

		this.boundJumpAccelEnd = bind(this, function() {
			this.ignoreGravity = false;
		});
	};

	this.reset = function() {
		this.style.x = this.x = this.targetX = (BG_WIDTH - PLAYER_WIDTH) / 2;
		this.style.y = this.y = (BG_HEIGHT - PLAYER_HEIGHT) / 2;
		this.width = this.style.width;
		this.height = this.style.height;
		this.v = { x: 0, y: 0 };
		this.a = { x: 0, y: 0 };
		this.axAnim = animate(this.a, 'ax');
		this.ayAnim = animate(this.a, 'ay');
		this.ignoreGravity = false;
		this.setState(STATE_DEFAULT);
	};

	this.setState = function(state) {
		if (!this.animating && this.state !== state) {
			this.state = state;
			this.stateData = STATES[state];
			this.sprite.startAnimation(this.stateData.action, this.stateData.opts);
			this.stateData.blockInterrupts && (this.animating = true);
		}
	};

	this.jump = function() {
		if (this.state !== STATE_JUMPING
			&& this.state !== STATE_FALLING)
		{
			this.setState(STATE_JUMPING);
			this.ignoreGravity = true;
			this.a.y = 0;

			this.ayAnim.now({ y: JUMP_ACCEL }, JUMP_ACCEL_TIME / 2, animate.easeOut)
			.then({ y: 0 }, JUMP_ACCEL_TIME / 2, animate.easeOut)
			.then(this.boundJumpAccelEnd);
		}
	};

	this.finishLanding = function() {
		this.animating = false;
		this.setState(STATE_IDLE);
	};

	this.step = function(dt) {
		if (this.targetX <= WALL_WIDTH) {
			this.targetX = WALL_WIDTH / 2;
		} else if (this.targetX >= BG_WIDTH - WALL_WIDTH) {
			this.targetX = BG_WIDTH - WALL_WIDTH / 2;
		}

		// flip player x based on direction
		if (this.targetX < this.x && !this.flippedX) {
			this.flippedX = this.style.flipX = true;
		} else if (this.targetX > this.x && this.flippedX) {
			this.flippedX = this.style.flipX = false;
		}

		this.x = (this.targetX + 7 * this.x) / 8;
		this.style.x = this.x - this.width / 2;

		var resistance = AIR_RESISTANCE;
		if (this.x <= WALL_WIDTH || this.x >= BG_WIDTH - WALL_WIDTH) {
			resistance = WALL_RESISTANCE;

			// force opposite flip on walls
			if (!this.flippedX && this.x > WALL_WIDTH) {
				this.flippedX = this.style.flipX = true;
			} else if (this.flippedX && this.x <= WALL_WIDTH) {
				this.flippedX = this.style.flipX = false;
			}
		}

		var startY = this.y;
		this.y += dt * this.v.y / 2;
		this.v.y += dt * this.a.y / 2;
		!this.ignoreGravity && (this.a.y = GRAVITY - this.v.y * resistance);
		this.v.y += dt * this.a.y / 2;
		this.y += dt * this.v.y / 2;
		this.falling = !this.checkPlatformCollision(startY);

		if (resistance !== WALL_RESISTANCE) {
			if (this.falling) {
				this.setState(STATE_FALLING);
			} else if (!~~Math.abs(this.targetX - this.x)) {
				this.setState(STATE_IDLE);
			} else {
				this.setState(STATE_RUNNING);
			}
		} else if (this.falling) {
			this.setState(STATE_WALL_SLIDING);
		}

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
					// player landing
					if (this.state === STATE_FALLING || this.state === STATE_WALL_SLIDING) {
						this.setState(STATE_LANDING);
					}

					this.y = platY - PLAYER_FEET;
					this.v.y = 0;
					this.a.y = 0;
					return true;
				}
			}
		}
		return false;
	};
});