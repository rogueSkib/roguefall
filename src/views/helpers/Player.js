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
		GRAVITY = 0.00275,
		AIR_RESISTANCE = 0.0032,
		WALL_RESISTANCE = 0.0064,
		WALL_WIDTH = 56,
		JUMP_ACCEL = -0.02,
		JUMP_ACCEL_TIME = 125,
		JUMP_ROT = 2 * Math.PI,
		JUMP_ROT_TIME = 250,
		RUN_SPEED_MAX = 0.9,
		RUN_ACCEL_MAX = 0.009,
		RUN_ACCEL_TIME = 150,
		RUN_DECEL_RANGE = 120,
		RUN_DECEL_MIN = 0.1,
		RUN_DECEL_SLIDE = 2.5 * RUN_DECEL_MIN;

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
			action: "jump",
			opts: { iterations: Infinity },
			blockInterrupts: true
		};

		this.designView();
		this.reset();
	};

	this.designView = function() {
		this.sprite = new SpriteView({
			parent: this,
			anchorX: PLAYER_WIDTH / 2,
			anchorY: PLAYER_HEIGHT / 2,
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

		this.boundFinishFlip = bind(this, function() {
			this.sprite.style.r = 0;
			this.animating = false;
		});
	};

	this.reset = function() {
		this.style.x = this.x = this.targetX = (BG_WIDTH - PLAYER_WIDTH) / 2;
		this.style.y = this.y = (BG_HEIGHT - PLAYER_HEIGHT) / 2;
		this.width = this.style.width;
		this.height = this.style.height;
		this.v = { x: 0, y: 0 };
		this.a = { x: 0, y: 0 };
		this.targetX = BG_WIDTH / 2;
		this.targetAX = 0;
		this.axAnim = animate(this.a, 'ax');
		this.ayAnim = animate(this.a, 'ay');
		this.jumpAnim = animate(this.sprite, 'jump');
		this.ignoreGravity = false;
		this.hasLanded = false;
		this.hasJumped = false;
		this.hasDoubleJumped = false;
		this.falling = false;
		this.setState(STATE_DEFAULT);
	};

	this.setState = function(state, force) {
		if (force || (!this.animating && this.state !== state)) {
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

		this.setState(STATE_JUMPING, true);
		this.ignoreGravity = true;
		this.a.y > 0 && (this.a.y = 0);
		this.sprite.style.r = 0;

		this.ayAnim.now({ y: JUMP_ACCEL }, JUMP_ACCEL_TIME / 2, animate.easeOut)
		.then({ y: 0 }, JUMP_ACCEL_TIME / 2, animate.easeOut)
		.then(this.boundAllowGravity);

		this.jumpAnim.now({ r: JUMP_ROT }, JUMP_ROT_TIME, animate.easeIn)
		.then({ r: 2 * JUMP_ROT }, JUMP_ROT_TIME, animate.easeOut)
		.then(this.boundFinishFlip);
	};

	this.finishLanding = function() {
		this.animating = false;
		this.setState(STATE_IDLE);
	};

	this.setTargetX = function(x) {
		this.targetX = x;
	};

	this.stopHorz = function() {
		this.axAnim.clear();
		this.x = this.targetX;
		this.v.x = 0;
		this.a.x = 0;
		this.targetAX = 0;
	};

	this.step = function(dt) {
		// player movement vars and useful refs
		var abs = Math.abs,
			pow = Math.pow,
			startX = this.x,
			startY = this.y,
			dx = this.targetX - startX,
			runSign = dx >= 0 ? 1 : -1,
			runSpeedMaxSigned = runSign * RUN_SPEED_MAX,
			runAccelMaxSigned = runSign * RUN_ACCEL_MAX,
			v = this.v,
			a = this.a,
			runSpeedMult = 1,
			fallResistance = AIR_RESISTANCE,
			style = this.style;

		// slow down closer to target (faux-deceleration)
		if (dx && abs(dx) < RUN_DECEL_RANGE) {
			runSpeedMult = RUN_DECEL_MIN + (1 - RUN_DECEL_MIN) * pow(dx / RUN_DECEL_RANGE, 2);
		}

		// "sticky" walls pull you into wall-sliding
		if (this.targetX <= WALL_WIDTH) {
			this.targetX = WALL_WIDTH / 2;
		} else if (this.targetX >= BG_WIDTH - WALL_WIDTH) {
			this.targetX = BG_WIDTH - WALL_WIDTH / 2;
		}

		// flip player horizontally based on direction of movement and wall slide state
		if (this.state === STATE_WALL_SLIDING) {
			fallResistance = WALL_RESISTANCE;

			// force opposite flip on walls
			if (!this.flippedX && this.x > WALL_WIDTH) {
				this.flippedX = style.flipX = true;
			} else if (this.flippedX && this.x <= WALL_WIDTH) {
				this.flippedX = style.flipX = false;
			}
		} else {
			if (dx < 0 && !this.flippedX) {
				this.flippedX = style.flipX = true;
			} else if (dx > 0 && this.flippedX) {
				this.flippedX = style.flipX = false;
			}
		}

		/* NOTE: horizontal and vertical movement calculated 1/2 before changing this tick
		 *	and 1/2 after changing this tick for a more frame-rate-independent animation
		 */

		// horizontal movement
		this.x += dt * runSpeedMult * v.x / 2;
		v.x += dt * a.x;
		if (abs(v.x) > RUN_SPEED_MAX) {
			v.x = runSpeedMaxSigned;
		}
		this.x += dt * runSpeedMult * v.x / 2;

		// determine when the target x has been reached or passed
		if ((startX < this.targetX && this.x >= this.targetX)
			|| (startX > this.targetX && this.x <= this.targetX))
		{
			this.stopHorz();
		}

		// animate horizontal acceleration for realistic player movement
		if (this.x !== this.targetX && v.x !== runSpeedMaxSigned && this.targetAX !== runAccelMaxSigned) {
			this.targetAX = runAccelMaxSigned;
			this.axAnim.now({ x: runAccelMaxSigned }, RUN_ACCEL_TIME, animate.linear);
		}

		// vertical movement
		var startY = this.y;
		this.y += dt * this.v.y / 2;
		this.v.y += dt * this.a.y / 2;
		!this.ignoreGravity && (this.a.y = GRAVITY - this.v.y * fallResistance);
		this.v.y += dt * this.a.y / 2;
		this.y += dt * this.v.y / 2;

		// state helper flags
		this.hasLanded = this.checkPlatformCollision(startY);
		this.falling = !this.hasLanded && this.v.y > 0;

		// state update checks
		if (this.falling) {
			if (!this.ignoreGravity && (this.x <= WALL_WIDTH || this.x >= BG_WIDTH - WALL_WIDTH)) {
				this.setState(STATE_WALL_SLIDING);
				this.hasJumped = false;
			} else {
				this.setState(STATE_FALLING);
			}
		} else if (this.hasLanded && (dx === 0 || runSpeedMult <= RUN_DECEL_SLIDE)) {
			this.setState(STATE_IDLE);
		} else if (this.hasLanded) {
			this.setState(STATE_RUNNING);
		}

		// update style coords
		style.x = this.x - this.width / 2;
		// TODO: style.y change to create camera look ahead based on player vertical speed

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
					this.hasJumped = false;
					this.hasDoubleJumped = false;
					return true;
				}
			}
		}
		return false;
	};
});