import animate;

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
		gameView,
		PAN_SPEED_MAX = 0.3,
		PAN_ACCEL_MAX = 0.001,
		PAN_ACCEL_TIME = 150,
		PAN_DECEL_RANGE = 90,
		PAN_DECEL_MIN = 0.067,
		PAN_SETTLE = 0.65;

	this.init = function(opts) {
		controller = GC.app.controller;
		gameView = opts.gameView;

		this.panningBounds = opts.panningBounds;

		this.ayAnim = animate(this, 'ay');

		this.reset();
	};

	this.reset = function() {
		this.y = 0;
		this.vy = 0;
		this.ay = 0;
		this.ty = 0;
		this.tay = 0;
	};

	this.stopVert = function() {
		this.ayAnim.clear();
		this.vy = 0;
		this.ay = 0;
		this.tay = 0;
	};

	this.step = function(dt) {
		// update target y
		var pb = this.panningBounds,
			focus = gameView.player.model,
			fallSpeedMax = gameView.player.FALL_SPEED_MAX;
		if (focus.vy > 0) {
			this.ty = pb.minY * min(1, abs(focus.vy / fallSpeedMax));
		} else if (focus.vy < 0) {
			this.ty = pb.maxY * min(1, abs(focus.vy / fallSpeedMax));
		} else if (this.ty > PAN_SETTLE * pb.maxY || this.ty < PAN_SETTLE * pb.minY) {
			this.ty = PAN_SETTLE * this.ty;
		}

		// camera movement vars and useful refs
		var startY = this.y,
			dy = this.ty - startY,
			panSign = dy >= 0 ? 1 : -1,
			panSpeedMaxSigned = panSign * PAN_SPEED_MAX,
			panAccelMaxSigned = panSign * PAN_ACCEL_MAX,
			panSpeedMult = 1;

		// slow down closer to target (faux-deceleration)
		if (dy && abs(dy) < PAN_DECEL_RANGE) {
			panSpeedMult = PAN_DECEL_MIN + (1 - PAN_DECEL_MIN) * pow(dy / PAN_DECEL_RANGE, 2);
		}

		/* NOTE: horizontal and vertical movement calculated 1/2 before changing this tick
		 *	and 1/2 after changing this tick for a more frame-rate-independent animation
		 */

		// vertical movement
		this.y += dt * panSpeedMult * this.vy / 2;
		this.vy += dt * this.ay;
		if (abs(this.vy) > PAN_SPEED_MAX) {
			this.vy = panSpeedMaxSigned;
		}
		this.y += dt * panSpeedMult * this.vy / 2;

		// determine when target y or pan boundaries have been passed
		if ((startY <= this.ty && this.y >= this.ty)
			|| (startY >= this.ty && this.y <= this.ty))
		{
			this.stopVert();
			this.y = this.ty;
		} else if (this.y < pb.minY) {
			this.y = pb.minY;
		} else if (this.y > pb.maxY) {
			this.y = pb.maxY;
		}

		// animate vertical acceleration for realistic camera movement
		if (this.y !== this.ty
			&& this.vy !== panSpeedMaxSigned
			&& this.tay !== panAccelMaxSigned)
		{
			this.tay = panAccelMaxSigned;
			this.ayAnim.now({ ay: panAccelMaxSigned }, PAN_ACCEL_TIME, animate.linear);
		}

		return this.y;
	};
});