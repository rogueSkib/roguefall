import ui.View as View;
import ui.ImageView as ImageView;
import ui.resource.Image as Image;

/* ScoreView.js
 * This class is designed for high performance text-rendering using images.
 * It is ideal for scores or other in-game counters that update often.
 */

exports = Class(View, function(supr) {

	this.init = function(opts) {
		opts.blockEvents = true;
		opts.canHandleEvents = false;
		supr(this, 'init', arguments);

		// characters that should be rendered
		this.activeCharacters = [];
		this.imageViews = [];

		// text options
		this.textAlign = opts.textAlign || opts.horizontalAlign || 'center';
		this.spacing = opts.spacing || 0;
		this.srcHeight = opts.srcHeight;

		// used for internal scaling / fitting text within bounds
		this.textContainer = new View({
			parent: this,
			x: 0,
			y: 0,
			anchorX: this.style.width / 2,
			anchorY: this.style.height / 2,
			width: this.style.width,
			height: this.style.height
		});

		// get our image data and set up Images
		if (opts.characterData) {
			this.setCharacterData(opts.characterData);
			if (opts.text) {
				this.setText(opts.text);
			}
		}
	};

	this.setCharacterData = function(data) {
		this.characterData = data;

		for (var i in data) {
			var d = data[i];
			d.img = new Image({ url: d.image });

			var map = d.img.getMap();
			d.width = d.width || (map.width + map.marginLeft + map.marginRight);
			this.srcHeight = this.srcHeight || (map.height + map.marginTop + map.marginBottom);
		}

		if (this.text) {
			this.setText(this.text);
		}
	};

	this.setText = function(text) {
		var style = this.style;

		this.text = text = text + "";
		this.textWidth = 0;

		// scale to fit vertically based on source height
		var scale = style.height / this.srcHeight,
			spacing = this.spacing * scale;

		var i = 0, data;
		while (i < text.length) {
			var character = text.charAt(i),
				data = this.characterData[character];
			if (data) {
				this.activeCharacters[i] = data;
				this.textWidth += data.width * scale + spacing;
			} else {
				logger.warn("Invalid character in ScoreView, no data for: " + character);
			}
			i++;
		}

		// scale-to-fit horizontally within width
		if (style.width < this.textWidth) {
			this.textContainer.style.scale = style.width / this.textWidth;
		} else {
			this.textContainer.style.scale = 1;
		}

		// text alignment logic
		if (this.textAlign == 'center') {
			this.offset = (style.width - this.textWidth) / 2;
			this.textContainer.style.anchorX = this.style.width / 2;
		} else if (this.textAlign == 'right') {
			this.offset = style.width - this.textWidth;
			this.textContainer.style.anchorX = this.style.width;
		} else {
			this.offset = 0;
			this.textContainer.style.anchorX = 0;
		}

		// create new ImageViews if we need them
		while (text.length > this.imageViews.length) {
			var newView = new ImageView({
				parent: this.textContainer,
				x: 0,
				y: 0,
				width: 1,
				height: 1,
				canHandleEvents: false,
				inLayout: false
			});
			newView.needsReflow = function() {};
			this.imageViews.push(newView);
		}

		// trim excess characters
		this.activeCharacters.length = text.length;

		var x = this.offset, y = 0;
		for (i = 0; i < this.activeCharacters.length; i++) {
			var data = this.activeCharacters[i],
				view = this.imageViews[i],
				s = view.style,
				w = data.width * scale;

			s.x = x;
			s.y = y;
			s.width = w;
			s.height = style.height; // all characters should have the same height
			s.visible = true;
			view.setImage(data.img);

			x += w + spacing;
		}

		while (i < this.imageViews.length) {
			this.imageViews[i].style.visible = false;
			i++;
		}
	};

	this.needsReflow = function() {};
});