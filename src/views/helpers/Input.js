import ui.View as View;

exports = Class(View, function(supr) {

	var JUMP_PX_PER_MS = 0.25,
		JUMP_PX_MIN = -40;

	var gameView;

	this.init = function(opts) {
		supr(this, 'init', [opts]);
		gameView = opts.parent;

		this.inputStartEvt = null;
		this.inputStartPt = null;
		this.movedThisStep = false;
		this.hasJumped = false;
	};

	this.onInputStart = function(evt, pt) {
		if (this.inputStartEvt === null) {
			this.inputStartEvt = evt;
			this.inputStartPt = pt;
			gameView.player.targetX = pt.x;
		}
	};

	this.onInputMove = function(evt, pt) {
		var startPt = this.inputStartPt,
			startEvt = this.inputStartEvt;

		if (!this.movedThisStep && startEvt && evt.id === startEvt.id) {
			this.movedThisStep = true;
			gameView.player.targetX = pt.x;

			if (!this.hasJumped) {
				var dx = pt.x - startPt.x,
					dy = pt.y - startPt.y,
					elapsed = evt.when - startEvt.when;
				if (dy < JUMP_PX_MIN && elapsed && dy / elapsed < JUMP_PX_PER_MS) {
					gameView.player.jump();
					this.hasJumped = true;
				}
			}
		}
	};

	this.onInputSelect = function(evt, pt) {
		if (evt.id === this.inputStartEvt.id) {
			this.inputStartEvt = null;
			this.inputStartPt = null;
			this.hasJumped = false;
		}
	};

	this.step = function(dt) {
		this.movedThisStep = false;
	};
});