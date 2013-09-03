import ui.ImageView as ImageView;

exports = Class(ImageView, function(supr) {
	var uid = 0,
		uidInput = null;

	this.init = function(opts) {
		supr(this, 'init', [opts]);

		if (!opts.imagePressed) {
			opts.imagePressed = opts.image;
		}

		if (!opts.imageDisabled) {
			opts.imageDisabled = opts.image;
		}

		this.opts = opts;
		this._uid = uid++;

		// sound up and down fns
		this.soundOnStart = opts.soundOnStart || function() {};
		this.soundOnEnd = opts.soundOnEnd || function() {};

		// button action
		this.onClick = opts.onClick || function() {};

		// only allow one click
		this.clickOnce = opts.clickOnce || false;
		this.hasBeenClicked = false;

		// pressed state subview offsets, i.e. text subview is lowered to look pressed
		this.pressedOffsetX = opts.pressedOffsetX || 0;
		this.pressedOffsetY = opts.pressedOffsetY || 0;

		// button states
		this.pressed = false;
		this.disabled = false;
	};

	this.setDisabled = function(disabled) {
		this.disabled = disabled;
		this.pressed = false;

		if (disabled) {
			this.setImage(this.opts.imageDisabled);
		} else {
			this.setImage(this.opts.image);
		}
	};

	this.setPressed = function(pressed) {
		this.pressed = pressed;
		this.disabled = false;

		if (pressed) {
			this.setImage(this.opts.imagePressed);
		} else {
			this.setImage(this.opts.image);
		}
	};

	this.onInputStart = function(evt) {
		if (!this.pressed && !this.disabled) {
			this.setImage(this.opts.imagePressed);
			this.pressed = true;
			this.soundOnStart();

			this.offsetSubviews();

			// save the currently depressed button at the class level
			uidInput = this._uid;
		}
	};

	this.onInputSelect = function(evt, srcPt) {
		if (this.clickOnce && this.hasBeenClicked) {
			return;
		}

		if (this.pressed && !this.disabled) {
			this.setImage(this.opts.image);
			this.pressed = false;
			this.hasBeenClicked = true;
			this.soundOnEnd();
			this.onClick(evt, srcPt);

			this.onsetSubviews();

			// wipe our class level button state
			uidInput = null;
		}
	};

	this.onInputOut = function() {
		if (this.pressed && uidInput == this._uid && !this.disabled) {
			this.setImage(this.opts.image);
			this.pressed = false;
			this.soundOnEnd();

			this.onsetSubviews();
		}
	};

	this.onInputOver = function() {
		if (!this.pressed && uidInput == this._uid && !this.disabled) {
			this.setImage(this.opts.imagePressed);
			this.pressed = true;
			this.soundOnStart();

			this.offsetSubviews();
		}
	};

	this.offsetSubviews = function() {
		var subviews = this.getSubviews();
		for (var i in subviews) {
			var view = subviews[i];
			view.style.x += this.pressedOffsetX;
			view.style.y += this.pressedOffsetY;
		}
	};

	this.onsetSubviews = function() {
		var subviews = this.getSubviews();
		for (var i in subviews) {
			var view = subviews[i];
			view.style.x -= this.pressedOffsetX;
			view.style.y -= this.pressedOffsetY;
		}
	};
});