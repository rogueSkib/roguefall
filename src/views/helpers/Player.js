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
		model,
		BG_WIDTH,
		BG_HEIGHT,
		LEFT_WALL_X,
		LEFT_WALL_SLIDE_X,
		RIGHT_WALL_X,
		RIGHT_WALL_SLIDE_X,
		RUSH_DISTANCE,
		DEFAULT_Y,
		RUSH_TIME = 325,
		DIVE_TIME = 650,
		PLAYER_WIDTH = 164,
		PLAYER_HEIGHT = 164,
		PLAYER_FEET = 154,
		GRAVITY = 0.00275,
		AIR_RESISTANCE = 0.0032,
		WALL_RESISTANCE = 0.0072,
		WALL_WIDTH = 58,
		JUMP_ACCEL = -0.02,
		JUMP_ACCEL_TIME = 125,
		JUMP_ROT = 6 * PI,
		JUMP_ROT_TIME = 750,
		FALL_SPEED_MAX = GRAVITY / AIR_RESISTANCE,
		DIVE_SPEED = 2.5 * FALL_SPEED_MAX,
		RUN_SPEED_MAX = 0.9,
		RUN_ACCEL_MAX = 0.009,
		RUN_ACCEL_TIME = 150,
		RUN_DECEL_RANGE = 120,
		RUN_DECEL_MIN = 0.1,
		RUN_DECEL_SLIDE = 2.5 * RUN_DECEL_MIN,
		BASE_HEALTH = 100,
		HEALTH_REGEN = 3,
		BASE_ENERGY = 100,
		ENERGY_REGEN = 15,
		JUMP_ENERGY = 10,
		RUSH_ENERGY = 15,
		DIVE_ENERGY = 20;

	// player states
	var STATES = {},
		STATE_IDLE = 0,
		STATE_RUNNING = 1,
		STATE_RUSHING = 2,
		STATE_FALLING = 3,
		STATE_LANDING = 4,
		STATE_WALL_SLIDING = 5,
		STATE_JUMPING = 6,
		STATE_DIVING = 7,
		STATE_DEFAULT = STATE_IDLE;

	var PLAYER_URL = "resources/images/game/rogue/rogue";

	// bound callback functions
	var boundFinishJump,
		boundFinishFlip,
		boundFinishRush,
		boundFinishDive,
		boundDiveFromFlip;

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
		DEFAULT_X = (BG_WIDTH - PLAYER_WIDTH) / 2;
		DEFAULT_Y = (BG_HEIGHT - PLAYER_HEIGHT) / 2;

		this.FALL_SPEED_MAX = FALL_SPEED_MAX;
		this.DEFAULT_Y = DEFAULT_Y;

		STATES[STATE_IDLE] = {
			action: "idle",
			opts: { iterations: Infinity },
			blockInterrupts: false,
			attacking: false
		};
		STATES[STATE_RUNNING] = {
			action: "run",
			opts: { iterations: Infinity },
			blockInterrupts: false,
			attacking: false
		};
		STATES[STATE_RUSHING] = {
			action: "rush",
			opts: { iterations: Infinity },
			blockInterrupts: true,
			attacking: true
		};
		STATES[STATE_FALLING] = {
			action: "fall",
			opts: { iterations: Infinity },
			blockInterrupts: false,
			attacking: false
		};
		STATES[STATE_LANDING] = {
			action: "land",
			opts: { iterations: 1, callback: bind(this, 'finishLanding') },
			blockInterrupts: true,
			attacking: false
		};
		STATES[STATE_WALL_SLIDING] = {
			action: "wallSlide",
			opts: { iterations: Infinity },
			blockInterrupts: false,
			attacking: false
		};
		STATES[STATE_JUMPING] = {
			action: "jump",
			opts: { iterations: Infinity },
			blockInterrupts: true,
			attacking: true
		};
		STATES[STATE_DIVING] = {
			action: "dive",
			opts: { iterations: Infinity },
			blockInterrupts: true,
			attacking: true
		};

		model = this.model = {};

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

		// prepare animations
		this.xAnim = animate(model, 'x');
		this.yAnim = animate(model, 'y');
		this.vxAnim = animate(model, 'vx');
		this.vyAnim = animate(model, 'vy');
		this.axAnim = animate(model, 'ax');
		this.ayAnim = animate(model, 'ay');
		this.jumpAnim = animate(this.sprite, 'jump');
		this.rushAnim = animate(this.sprite, 'rush');

		// pre-bound functions as callbacks
		boundFinishJump = bind(this, 'finishJump');
		boundFinishFlip = bind(this, 'finishFlip');
		boundFinishRush = bind(this, 'finishRush');
		boundFinishDive = bind(this, 'finishDive');
		boundDiveFromFlip = bind(this, 'diveFromFlip');
	};

	this.reset = function() {
		var style = this.style;
		model.x = style.x = DEFAULT_X;
		model.y = style.y = DEFAULT_Y;
		model.width = style.width;
		model.height = style.height;
		// velocity and acceleration
		model.vx = 0;
		model.vy = 0;
		model.ax = 0;
		model.ay = 0;
		// target values
		model.tx = model.x;
		model.ty = 0;
		model.tvx = 0;
		model.tvy = 0;
		model.tax = 0;
		model.tay = 0;
		// last values (previous tick)
		model.lx = model.x;
		model.ly = model.y;
		// status
		model.health = BASE_HEALTH;
		model.healthMax = model.health;
		model.energy = BASE_ENERGY;
		model.energyMax = model.energy;
		// hit box for enemy attacks
		model.hitX = -PLAYER_WIDTH / 6;
		model.hitY = DEFAULT_Y + PLAYER_HEIGHT / 3;
		model.endHitX = PLAYER_WIDTH / 6;
		model.endHitY = DEFAULT_Y + PLAYER_FEET;

		this.ignoreVert = false;
		this.ignoreHorz = false;
		this.hasLanded = false;
		this.hasJumped = false;
		this.hasDoubleJumped = false;
		this.hasRushed = false;
		this.hasDived = false;
		this.falling = false;
		this.flipping = false;
		this.attacking = false;

		this.setState(STATE_DEFAULT, true);
	};

	this.setState = function(state, force) {
		if (force || (!this.blockInterrupts && this.state !== state)) {
			var stateData = STATES[state];
			this.state = state;
			this.sprite.startAnimation(stateData.action, stateData.opts);
			this.blockInterrupts = stateData.blockInterrupts;
			this.attacking = stateData.attacking;
		}
	};

	this.takeDamage = function(dmg) {
		model.health -= dmg;
		if (model.health <= 0) {
			model.health = 0;
			// TODO: game over
		}
		gameView.statusBars.setHealthPercent(model.health / model.healthMax);
	};

	this.jump = function() {
		if (this.state === STATE_DIVING || model.energy < JUMP_ENERGY) {
			return;
		} else if (this.hasJumped && !this.hasDoubleJumped) {
			this.hasDoubleJumped = true;
		} else if (!this.hasJumped) {
			this.hasJumped = true
		} else {
			return;
		}

		model.energy -= JUMP_ENERGY;
		this.setState(STATE_JUMPING, true);
		this.ignoreVert = true;
		this.flipping = true;
		model.ay > 0 && (model.ay = 0);
		this.sprite.style.r = 0;

		this.ayAnim.now({ ay: JUMP_ACCEL }, JUMP_ACCEL_TIME / 2, animate.easeOut)
		.then({ ay: 0 }, JUMP_ACCEL_TIME / 2, animate.easeOut)
		.then(boundFinishJump);

		this.jumpAnim.now({ r: JUMP_ROT / 3 }, JUMP_ROT_TIME / 3, animate.easeIn)
		.then({ r: 2 * JUMP_ROT / 3 }, JUMP_ROT_TIME / 3, animate.easeOut)
		.then(boundFinishFlip);
	};

	this.finishJump = function() {
		this.ignoreVert = false;
	};

	this.finishFlip = function() {
		this.sprite.style.r = 0;
		this.flipping = false;
		!this.hasRushed && (this.blockInterrupts = false);
	};

	this.rush = function(dx) {
		if (model.energy < RUSH_ENERGY) {
			return;
		} else if (!this.hasRushed && !this.hasDived) {
			this.hasRushed = true;
		} else {
			return;
		}

		model.energy -= RUSH_ENERGY;
		this.flipping && this.jumpAnim.commit();
		this.setState(STATE_RUSHING, true);
		this.ignoreVert = true;
		this.ignoreHorz = true;

		this.stopHorz();

		var runSign = dx >= 0 ? 1 : -1,
			dest = min(RIGHT_WALL_SLIDE_X, max(LEFT_WALL_SLIDE_X, model.x + runSign * RUSH_DISTANCE)),
			dxReal = dest - model.x,
			rushTime = RUSH_TIME * abs(dxReal) / RUSH_DISTANCE;

		this.xAnim.now({ x: dest }, rushTime, animate.easeOut)
		.then(boundFinishRush);

		if (dxReal < 0 && !this.flippedX) {
			this.flippedX = this.style.flipX = true;
		} else if (dxReal > 0 && this.flippedX) {
			this.flippedX = this.style.flipX = false;
		}
	};

	this.finishRush = function() {
		this.sprite.style.r = 0;
		this.blockInterrupts = false;
		this.hasRushed = false;
		this.ignoreVert = false;
		this.ignoreHorz = false;
		this.stopHorz();
		this.setTargetX(model.x);
	};

	this.dive = function() {
		if (model.energy < DIVE_ENERGY) {
			return;
		} else if (!this.hasDived && !this.hasLanded && !this.hasRushed) {
			this.hasDived = true;
		} else {
			return;
		}

		model.energy -= DIVE_ENERGY;

		if (!this.flipping) {
			this.flipping = true;
			this.setState(STATE_JUMPING, true);
			this.jumpAnim.now({ r: JUMP_ROT / 2 }, JUMP_ROT_TIME / 3, animate.easeOut)
			.then(boundDiveFromFlip)
			.wait(DIVE_TIME - JUMP_ROT_TIME / 3)
			.then(boundFinishDive);
		} else {
			this.jumpAnim.commit();
			this.setState(STATE_DIVING, true);
		}

		var vy = model.vy;
		this.stopVert();
		model.vy = max(vy, DIVE_SPEED / 2);
		this.ignoreVert = true;

		this.vyAnim.now({ vy: DIVE_SPEED }, DIVE_TIME, animate.easeOut)
		.then(boundFinishDive);
	};

	this.diveFromFlip = function() {
		if (!this.hasLanded) {
			this.setState(STATE_DIVING, true);
		} else {
			this.blockInterrupts = false;
		}

		this.flipping = false;
		this.sprite.style.r = 0;
	};

	this.finishDive = function() {
		this.blockInterrupts = false;
		this.ignoreVert = false;
	};

	this.finishLanding = function() {
		this.blockInterrupts = false;
		this.flipping = false;
		this.setState(STATE_IDLE);
	};

	this.setTargetX = function(x) {
		// "sticky" walls pull you into wall-sliding
		if (x <= LEFT_WALL_X) {
			x = LEFT_WALL_SLIDE_X;
		} else if (x >= RIGHT_WALL_X) {
			x = RIGHT_WALL_SLIDE_X;
		}

		model.tx = x;
	};

	this.stopHorz = function() {
		this.xAnim.clear();
		this.vxAnim.clear();
		this.axAnim.clear();
		model.vx = 0;
		model.ax = 0;
		model.tvx = 0;
		model.tax = 0;
	};

	this.stopVert = function() {
		this.yAnim.clear();
		this.vyAnim.clear();
		this.ayAnim.clear();
		model.vy = 0;
		model.ay = 0;
		model.tvy = 0;
		model.tay = 0;
	};

	this.step = function(dt) {
		// player movement vars and useful refs
		var startX = model.x,
			startY = model.y,
			dtpct = dt / 1000,
			dx = model.tx - startX,
			runSign = dx >= 0 ? 1 : -1,
			runSpeedMaxSigned = runSign * RUN_SPEED_MAX,
			runAccelMaxSigned = runSign * RUN_ACCEL_MAX,
			runSpeedMult = 1,
			fallResistance = AIR_RESISTANCE,
			style = this.style,
			spriteStyle = this.sprite.style;

		// slow down closer to target (faux-deceleration)
		if (dx && abs(dx) < RUN_DECEL_RANGE && !this.ignoreHorz) {
			runSpeedMult = RUN_DECEL_MIN + (1 - RUN_DECEL_MIN) * pow(dx / RUN_DECEL_RANGE, 2);
		}

		// flip player horizontally based on direction of movement and wall slide state
		if (this.state === STATE_WALL_SLIDING) {
			fallResistance = WALL_RESISTANCE;

			// force opposite flip on walls
			if (!this.flippedX && model.x >= RIGHT_WALL_X) {
				this.flippedX = style.flipX = true;
			} else if (this.flippedX && model.x <= LEFT_WALL_X) {
				this.flippedX = style.flipX = false;
			}
		} else if (!this.ignoreHorz) {
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
		model.x += dt * runSpeedMult * model.vx / 2;
		model.vx += dt * model.ax;
		if (abs(model.vx) > RUN_SPEED_MAX && !this.ignoreHorz) {
			model.vx = runSpeedMaxSigned;
		}
		model.x += dt * runSpeedMult * model.vx / 2;

		// determine when target x or wall boundaries have been passed
		if (!this.ignoreHorz
			&& ((startX < model.tx && model.x >= model.tx) || (startX > model.tx && model.x <= model.tx)))
		{
			this.stopHorz();
			model.x = model.tx;
		} else if (model.x < LEFT_WALL_SLIDE_X) {
			model.x = LEFT_WALL_SLIDE_X;
		} else if (model.x > RIGHT_WALL_SLIDE_X) {
			model.x = RIGHT_WALL_SLIDE_X;
		}

		// animate horizontal acceleration for realistic player movement
		if (!this.ignoreHorz
			&& model.x !== model.tx
			&& model.vx !== runSpeedMaxSigned
			&& model.tax !== runAccelMaxSigned)
		{
			model.tax = runAccelMaxSigned;
			this.axAnim.now({ ax: runAccelMaxSigned }, RUN_ACCEL_TIME, animate.linear);
		}

		// vertical movement
		model.y += dt * model.vy / 2;
		model.vy += dt * model.ay / 2;
		!this.ignoreVert && (model.ay = GRAVITY - model.vy * fallResistance);
		model.vy += dt * model.ay / 2;
		model.y += dt * model.vy / 2;

		// state helper flags
		this.hasLanded = this.checkPlatformCollision(startY);
		this.falling = !this.hasLanded && model.vy > 0;

		// state update checks
		if (this.falling) {
			if (!this.ignoreVert
				&& !this.ignoreHorz
				&& (model.x <= LEFT_WALL_X || model.x >= RIGHT_WALL_X))
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

		// health regeneration each tick
		if (model.health < model.healthMax) {
			model.health += HEALTH_REGEN * dtpct;
			if (model.health > model.healthMax) {
				model.health = model.healthMax;
			}
			gameView.statusBars.setHealthPercent(model.health / model.healthMax);
		}

		// energy regeneration each tick
		if (model.energy < model.energyMax) {
			model.energy += ENERGY_REGEN * dtpct;
			if (model.energy > model.energyMax) {
				model.energy = model.energyMax;
			}
			gameView.statusBars.setEnergyPercent(model.energy / model.energyMax);
		}

		// update styles
		style.x = model.x - PLAYER_WIDTH / 2;
		style.y = DEFAULT_Y + gameView.cameraY;
		// special rushing rotation
		if (this.hasRushed) {
			var ldx = model.x - model.lx,
				ldy = model.y - model.ly,
				lsign = ldx >= 0 ? 1 : -1,
				tr = ldx !== 0 ? lsign * atan(ldy / ldx) : 0;
			spriteStyle.r = (8 * spriteStyle.r + tr) / 9;
		}

		model.lx = model.x;
		model.ly = model.y;

		return model.y;
	};

	this.checkPlatformCollision = function(startY) {
		var platforms = gameView.platforms.active;
		for (var p = 0; p < platforms.length; p++) {
			var platform = platforms[p];
			var platX = platform.style.x + platform.hitX;
			var platY = platform.style.y + platform.hitY;
			var platEndX = platX + platform.hitWidth;
			if (startY + model.endHitY <= platY && model.y + model.endHitY >= platY) {
				if (model.x >= platX && model.x <= platEndX) {
					// force dive finish
					if (this.hasDived) {
						this.jumpAnim.clear();
						this.sprite.style.r = 0;
						this.stopVert();
						this.finishDive();
					}

					// player landing
					if (this.state === STATE_FALLING
						|| this.state === STATE_WALL_SLIDING
						|| this.state === STATE_DIVING)
					{
						this.setState(STATE_LANDING);
					}

					model.y = platY - model.endHitY;
					model.vy = 0;
					model.ay = 0;
					this.hasJumped = false;
					this.hasDoubleJumped = false;
					this.hasDived = false;
					return true;
				}
			}
		}
		return false;
	};
});