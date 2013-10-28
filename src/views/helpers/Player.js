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
		PLAYER_FEET = 154,
		GRAVITY = 0.003,
		AIR_RESISTANCE = 0.0032,
		WALL_RESISTANCE = 0.0064,
		WALL_WIDTH = 56,
		JUMP_ACCEL = -0.025,
		JUMP_ACCEL_TIME = 100,
		RUN_SPEED_MAX = 0.8,
		RUN_ACCEL_MAX = 0.008,
		RUN_DECEL_RANGE = 100;

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

		this.boundAllowGravity = bind(this, function() {
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
		this.hasLanded = false;
		this.hasJumped = false;
		this.hasDoubleJumped = false;
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
		if (this.hasJumped && !this.hasDoubleJumped) {
			this.hasDoubleJumped = true;
		} else if (!this.hasJumped) {
			this.hasJumped = true
		} else {
			return;
		}

		if (this.state === STATE_WALL_SLIDING) {
			this.hasDoubleJumped = true;
		}

		this.setState(STATE_JUMPING);
		this.ignoreGravity = true;
		this.a.y = 0;

		this.ayAnim.now({ y: JUMP_ACCEL }, JUMP_ACCEL_TIME / 2, animate.easeOut)
		.then({ y: 0 }, JUMP_ACCEL_TIME / 2, animate.easeOut)
		.then(this.boundAllowGravity);
	};

	this.finishLanding = function() {
		this.animating = false;
		this.setState(STATE_IDLE);
	};

	this.setTargetX = function(x) {
		this.targetX = x;
	};

	this.step = function(dt) {
		var abs = Math.abs;

		if (this.targetX <= WALL_WIDTH) {
			this.targetX = WALL_WIDTH / 2;
		} else if (this.targetX >= BG_WIDTH - WALL_WIDTH) {
			this.targetX = BG_WIDTH - WALL_WIDTH / 2;
		}

		var dx = this.targetX - this.x,
			runSign = dx >= 0 ? 1 : -1;

		// flip player x based on direction
		if (dx < 0 && !this.flippedX) {
			this.flippedX = this.style.flipX = true;
		} else if (dx > 0 && this.flippedX) {
			this.flippedX = this.style.flipX = false;
		}

		// slow down closer to target
		var decelMult = 1;
		if (dx && abs(dx) < RUN_DECEL_RANGE) {
			decelMult = 0.01 + abs(dx) / RUN_DECEL_RANGE;
		}

		// horizontal movement
		var startX = this.x;
		this.x += dt * decelMult * this.v.x / 2;
		this.v.x += dt * this.a.x / 2;
		if (this.x !== this.targetX && this.v.x !== runSign * RUN_SPEED_MAX) {
			this.a.x = runSign * RUN_ACCEL_MAX;
		}
		this.v.x += dt * this.a.x / 2;
		if (abs(this.v.x) > RUN_SPEED_MAX) {
			this.v.x = runSign * RUN_SPEED_MAX;
			this.a.x = 0;
		}
		this.x += dt * decelMult * this.v.x / 2;
		if (startX <= this.targetX && this.x >= this.targetX) {
			this.x = this.targetX;
			this.v.x = 0;
			this.a.x = 0;
		} else if (startX >= this.targetX && this.x <= this.targetX) {
			this.x = this.targetX;
			this.v.x = 0;
			this.a.x = 0;
		} else if (this.x < WALL_WIDTH / 2) {
			this.x = WALL_WIDTH / 2;
		} else if ( this.x > BG_WIDTH - WALL_WIDTH / 2) {
			this.x = BG_WIDTH - WALL_WIDTH / 2;
		}
		this.style.x = this.x - this.width / 2;

		var resistance = AIR_RESISTANCE;
		if (!this.ignoreGravity && (this.x <= WALL_WIDTH || this.x >= BG_WIDTH - WALL_WIDTH)) {
			resistance = WALL_RESISTANCE;

			// force opposite flip on walls
			if (!this.flippedX && this.x > WALL_WIDTH) {
				this.flippedX = this.style.flipX = true;
			} else if (this.flippedX && this.x <= WALL_WIDTH) {
				this.flippedX = this.style.flipX = false;
			}
		}

		// vertical movement
		var startY = this.y;
		this.y += dt * this.v.y / 2;
		this.v.y += dt * this.a.y / 2;
		!this.ignoreGravity && (this.a.y = GRAVITY - this.v.y * resistance);
		this.v.y += dt * this.a.y / 2;
		this.y += dt * this.v.y / 2;
		this.falling = !this.checkPlatformCollision(startY) && this.v.y > 0;

		if (resistance !== WALL_RESISTANCE) {
			if (this.falling) {
				this.setState(STATE_FALLING);
			} else if (this.hasLanded && !~~abs(this.targetX - this.x)) {
				this.setState(STATE_IDLE);
			} else if (this.hasLanded) {
				this.setState(STATE_RUNNING);
			}
		} else if (this.falling) {
			this.setState(STATE_WALL_SLIDING);
			this.hasJumped = false;
			this.hasDoubleJumped = false;
		} else {
			if (this.hasLanded && !~~abs(this.targetX - this.x)) {
				this.setState(STATE_IDLE);
			} else if (this.hasLanded) {
				this.setState(STATE_RUNNING);
			}
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
					this.hasLanded = true;
					this.hasJumped = false;
					this.hasDoubleJumped = false;
					return true;
				}
			}
		}
		this.hasLanded = false;
		return false;
	};
});