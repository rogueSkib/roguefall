import ui.View as View;

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

	// player input constants
	var JUMP_PX_PER_MS = -1,
		JUMP_PX_MIN = -40,
		RUSH_PX_PER_MS = 1.5,
		RUSH_PX_MIN = 90,
		DIVE_PX_PER_MS = 1,
		DIVE_PX_MIN = 40;

	var gameView;

	this.init = function(opts) {
		supr(this, 'init', [opts]);
		gameView = opts.parent;

		this.inputStartEvt = null;
		this.inputStartPt = null;
		this.movedThisStep = false;
		this.hasJumped = false;
		this.hasRushed = false;
		this.hasDived = false;
	};

	this.onInputStart = function(evt, pt) {
		if (this.inputStartEvt === null) {
			this.inputStartEvt = evt;
			this.inputStartPt = pt;
			gameView.player.setTargetX(pt.x);
		}
	};

	this.onInputMove = function(evt, pt) {
		var startPt = this.inputStartPt,
			startEvt = this.inputStartEvt;

		if (!this.movedThisStep && startEvt && evt.id === startEvt.id) {
			this.movedThisStep = true;
			gameView.player.setTargetX(pt.x);

			var dx = pt.x - startPt.x,
				dy = pt.y - startPt.y,
				elapsed = evt.when - startEvt.when;

			// jump check
			if (!this.hasJumped
				&& dy < JUMP_PX_MIN
				&& elapsed
				&& dy / elapsed <= JUMP_PX_PER_MS)
			{
				gameView.player.jump();
				this.hasJumped = true;
			}

			// dive check
			if (!this.hasDived
				&& dy > DIVE_PX_MIN
				&& elapsed
				&& dy / elapsed >= DIVE_PX_PER_MS)
			{
				gameView.player.dive(dx, dy);
				this.hasDived = true;
			}

			// rush check
			if (!this.hasRushed
				&& abs(dx) >= RUSH_PX_MIN
				&& elapsed
				&& abs(dx / elapsed) >= RUSH_PX_PER_MS)
			{
				gameView.player.rush(dx);
				this.hasRushed = true;
			}
		}
	};

	this.onInputSelect = function(evt, pt) {
		if (this.inputStartEvt && evt.id === this.inputStartEvt.id) {
			this.inputStartEvt = null;
			this.inputStartPt = null;
			this.hasJumped = false;
			this.hasRushed = false;
			this.hasDived = false;
		}
	};

	this.step = function(dt) {
		this.movedThisStep = false;
	};
});