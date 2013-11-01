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

	// player constants
	var controller,
		gameView,
		BG_WIDTH,
		BG_HEIGHT,
		LEFT_WALL_X,
		LEFT_WALL_SLIDE_X,
		RIGHT_WALL_X,
		RIGHT_WALL_SLIDE_X,
		RUSH_DISTANCE,
		RUSH_TIME = 333,
		PLAYER_WIDTH = 164,
		PLAYER_HEIGHT = 164,
		PLAYER_FEET = 154,
		GRAVITY = 0.00275,
		AIR_RESISTANCE = 0.0032,
		WALL_RESISTANCE = 0.0075,
		WALL_WIDTH = 56,
		JUMP_ACCEL = -0.02,
		JUMP_ACCEL_TIME = 125,
		JUMP_ROT = 2 * PI,
		JUMP_ROT_TIME = 250,
		RUN_SPEED_MAX = 0.9,
		RUN_ACCEL_MAX = 0.009,
		RUN_ACCEL_TIME = 150,
		RUN_DECEL_RANGE = 120,
		RUN_DECEL_MIN = 0.1,
		RUN_DECEL_SLIDE = 2.5 * RUN_DECEL_MIN;

	// player states
	var STATES = {},
		STATE_IDLE = 0,
		STATE_RUNNING = 1,
		STATE_RUSHING = 2,
		STATE_FALLING = 3,
		STATE_LANDING = 4,
		STATE_WALL_SLIDING = 5,
		STATE_JUMPING = 6,
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
		LEFT_WALL_X = WALL_WIDTH;
		LEFT_WALL_SLIDE_X = WALL_WIDTH / 2;
		RIGHT_WALL_X = BG_WIDTH - WALL_WIDTH;
		RIGHT_WALL_SLIDE_X = BG_WIDTH - WALL_WIDTH / 2;
		RUSH_DISTANCE = BG_WIDTH;

		STATES[STATE_IDLE] = {
			action: "idle",
			opts: { iterations: Infinity }
		};
		STATES[STATE_RUNNING] = {
			action: "run",
			opts: { iterations: Infinity }
		};
		STATES[STATE_RUSHING] = {
			action: "rush",
			opts: { iterations: Infinity },
			blockInterrupts: true
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
			!this.hasRushed && (this.animating = false);
			this.flipping = false;
		});

		this.boundFinishRush = bind(this, function() {
			this.sprite.style.r = 0;
			!this.flipping && (this.animating = false);
			this.hasRushed = false;
			this.ignoreGravity = false;
			this.ignoreTargetX = false;
			this.stopHorz();
			this.targetX = this.x;
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
		this.vxAnim = animate(this.v, 'vx');
		this.vyAnim = animate(this.v, 'vy');
		this.axAnim = animate(this.a, 'ax');
		this.ayAnim = animate(this.a, 'ay');
		this.jumpAnim = animate(this.sprite, 'jump');
		this.rushAnim = animate(this.sprite, 'rush');
		this.ignoreGravity = false;
		this.ignoreTargetX = false;
		this.hasLanded = false;
		this.hasJumped = false;
		this.hasDoubleJumped = false;
		this.hasRushed = false;
		this.falling = false;
		this.flipping = false;
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
		this.flipping = true;
		this.a.y > 0 && (this.a.y = 0);
		this.sprite.style.r = 0;

		this.ayAnim.now({ y: JUMP_ACCEL }, JUMP_ACCEL_TIME / 2, animate.easeOut)
		.then({ y: 0 }, JUMP_ACCEL_TIME / 2, animate.easeOut)
		.then(this.boundAllowGravity);

		this.jumpAnim.now({ r: JUMP_ROT }, JUMP_ROT_TIME, animate.easeIn)
		.then({ r: 2 * JUMP_ROT }, JUMP_ROT_TIME, animate.easeOut)
		.then(this.boundFinishFlip);
	};

	this.rush = function(dx) {
		if (!this.hasRushed) {
			this.hasRushed = true;
		} else {
			return;
		}

		this.setState(STATE_RUSHING, true);
		this.ignoreGravity = true;
		this.ignoreTargetX = true;

		this.stopHorz();
		this.jumpAnim.commit();

		var v = this.v,
			a = this.a,
			runSign = dx >= 0 ? 1 : -1,
			dest = min(RIGHT_WALL_SLIDE_X, max(LEFT_WALL_SLIDE_X, this.x + runSign * RUSH_DISTANCE));

		dx = dest - this.x;
		var rushTime = RUSH_TIME * abs(dx) / RUSH_DISTANCE;
		v.x = dx / rushTime;

		this.rushAnim.wait(rushTime)
		.then(this.boundFinishRush);

		if (dx < 0 && !this.flippedX) {
			this.flippedX = this.style.flipX = true;
		} else if (dx > 0 && this.flippedX) {
			this.flippedX = this.style.flipX = false;
		}
	};

	this.finishLanding = function() {
		this.animating = false;
		this.setState(STATE_IDLE);
	};

	this.setTargetX = function(x) {
		this.targetX = x;
	};

	this.stopHorz = function() {
		this.vxAnim.clear();
		this.axAnim.clear();
		this.v.x = 0;
		this.a.x = 0;
		this.targetAX = 0;
	};

	this.step = function(dt) {
		// player movement vars and useful refs
		var startX = this.x,
			startY = this.y,
			dx = this.targetX - startX,
			runSign = dx >= 0 ? 1 : -1,
			runSpeedMaxSigned = runSign * RUN_SPEED_MAX,
			runAccelMaxSigned = runSign * RUN_ACCEL_MAX,
			v = this.v,
			a = this.a,
			runSpeedMult = 1,
			fallResistance = AIR_RESISTANCE,
			style = this.style,
			spriteStyle = this.sprite.style;

		// slow down closer to target (faux-deceleration)
		if (dx && abs(dx) < RUN_DECEL_RANGE && !this.ignoreTargetX) {
			runSpeedMult = RUN_DECEL_MIN + (1 - RUN_DECEL_MIN) * pow(dx / RUN_DECEL_RANGE, 2);
		}

		// "sticky" walls pull you into wall-sliding
		if (this.targetX <= LEFT_WALL_X) {
			this.targetX = LEFT_WALL_SLIDE_X;
		} else if (this.targetX >= RIGHT_WALL_X) {
			this.targetX = RIGHT_WALL_SLIDE_X;
		}

		// flip player horizontally based on direction of movement and wall slide state
		if (this.state === STATE_WALL_SLIDING) {
			fallResistance = WALL_RESISTANCE;

			// force opposite flip on walls
			if (!this.flippedX && this.x >= RIGHT_WALL_X) {
				this.flippedX = style.flipX = true;
			} else if (this.flippedX && this.x <= LEFT_WALL_X) {
				this.flippedX = style.flipX = false;
			}
		} else if (!this.ignoreTargetX) {
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
		if (abs(v.x) > RUN_SPEED_MAX && !this.ignoreTargetX) {
			v.x = runSpeedMaxSigned;
		}
		this.x += dt * runSpeedMult * v.x / 2;

		if (!this.ignoreTargetX || this.x <= LEFT_WALL_SLIDE_X || this.x >= RIGHT_WALL_SLIDE_X) {
			// determine when the target x has been reached or passed
			if ((startX < this.targetX && this.x >= this.targetX)
				|| (startX > this.targetX && this.x <= this.targetX))
			{
				this.stopHorz();
				this.x = this.targetX;
			}
		}

		if (!this.ignoreTargetX) {
			// animate horizontal acceleration for realistic player movement
			if (this.x !== this.targetX
				&& v.x !== runSpeedMaxSigned
				&& this.targetAX !== runAccelMaxSigned)
			{
				this.targetAX = runAccelMaxSigned;
				this.axAnim.now({ x: runAccelMaxSigned }, RUN_ACCEL_TIME, animate.linear);
			}
		}

		// vertical movement
		var startY = this.y;
		this.y += dt * v.y / 2;
		v.y += dt * a.y / 2;
		!this.ignoreGravity && (a.y = GRAVITY - v.y * fallResistance);
		v.y += dt * a.y / 2;
		this.y += dt * v.y / 2;

		// state helper flags
		this.hasLanded = this.checkPlatformCollision(startY);
		this.falling = !this.hasLanded && v.y > 0;

		// state update checks
		if (this.falling) {
			if (!this.ignoreGravity
				&& !this.ignoreTargetX
				&& (this.x <= WALL_WIDTH || this.x >= BG_WIDTH - WALL_WIDTH))
			{
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

		// update styles
		style.x = this.x - this.width / 2;
		// TODO: style.y change to create camera look ahead based on player vertical speed

		// special rushing rotation
		if (this.hasRushed) {
			spriteStyle.r = runSign * atan(v.y / v.x);
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
					this.hasJumped = false;
					this.hasDoubleJumped = false;
					return true;
				}
			}
		}
		return false;
	};
});