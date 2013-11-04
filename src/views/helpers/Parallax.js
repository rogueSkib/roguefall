import ui.View as View;
import ui.ImageView as ImageView;
import ui.resource.Image as Image;

import src.lib.ViewPool as ViewPool;

var parallaxConfig = [
	{
		name: "background",
		speed: 0.01,
		zIndex: 0,
		pieces: [
			{
				image: "resources/images/game/background.png",
				gapBase: 0,
				gapRange: 0
			}
		]
	},
	{
		name: "lax_1",
		speed: 0.15,
		zIndex: 10,
		pieces: [
			{
				image: "resources/images/game/lax_1_1.png",
				gapBase: 0,
				gapRange: 0
			},
			{
				image: "resources/images/game/lax_1_2.png",
				gapBase: 0,
				gapRange: 0
			}
		]
	},
	{
		name: "lax_2",
		speed: 0.15,
		zIndex: 10,
		pieces: [
			{
				image: "resources/images/game/lax_2_1.png",
				gapBase: 0,
				gapRange: 0
			},
			{
				image: "resources/images/game/lax_2_2.png",
				gapBase: 0,
				gapRange: 0
			}
		]
	},
	{
		name: "lax_3",
		speed: 0.30,
		zIndex: 50,
		pieces: [
			{
				image: "resources/images/game/lax_3_1.png",
				gapBase: 0,
				gapRange: 0
			},
			{
				image: "resources/images/game/lax_3_2.png",
				gapBase: 0,
				gapRange: 0
			}
		]
	},
	{
		name: "lax_4",
		speed: 1,
		zIndex: 90,
		pieces: [
			{
				image: "resources/images/game/lax_4_1.png",
				gapBase: 0,
				gapRange: 0
			}
		]
	},
	{
		name: "lax_5",
		speed: 1,
		zIndex: 90,
		pieces: [
			{
				image: "resources/images/game/lax_5_1.png",
				gapBase: 0,
				gapRange: 0
			}
		]
	}
];

exports = Class(function() {

	var controller,
		gameView,
		rootView,
		BG_WIDTH,
		BG_HEIGHT;

	this.init = function(opts) {
		controller = GC.app.controller;
		gameView = opts.gameView;
		rootView = gameView.rootView;
		BG_WIDTH = controller.bgWidth;
		BG_HEIGHT = controller.bgHeight;

		this.layerPool = new ViewPool({
			ctor: View,
			initCount: 5,
			initOpts: {}
		});

		this.piecePool = new ViewPool({
			ctor: ImageView,
			initCount: 50,
			initOpts: {}
		});

		this.layers = {};
		this.lastOffsetY = 0;
	};

	this.reset = function(config) {
		config = config || parallaxConfig;

		// reset parallax layers
		for (var l in this.layers) {
			var layer = this.layers[l];
			while (layer.pieces.length) {
				var piece = layer.pieces.pop();
				piece.removeFromSuperview();
				this.piecePool.releaseView(piece);
			}
			layer.removeFromSuperview();
			this.layerPool.releaseView(layer);
		}

		this.layers = {};

		// initialize parallax layers based on config
		for (var i = 0; i < config.length; i++) {
			var data = config[i];
			var layer = this.layerPool.obtainView({
				parent: rootView,
				width: data.width || 1,
				height: data.height || 1,
				zIndex: data.zIndex
			});

			// automatically process layer image data if we haven't already
			for (var p in data.pieces) {
				var piece = data.pieces[p];
				if (typeof piece.image === 'string') {
					piece.image = new Image({ url: piece.image });
					var b = piece.image.getBounds();
					piece.width = piece.width || b.width + (b.marginLeft || 0) + (b.marginRight || 0);
					piece.height = piece.height || b.height + (b.marginTop || 0) + (b.marginBottom || 0);
				}
			}

			layer.data = data;
			layer.spawnY = 0;
			layer.pieces = [];
			this.layers[data.name] = layer;
		}

		// track y offset for view recycling and spawning
		this.lastOffsetY = 0;
	};

	this.step = function(dt) {
		var y = gameView.offsetY;

		if (this.lastOffsetY !== y) {
			this.lastOffsetY = y;

			var random = Math.random;
			for (var l in this.layers) {
				var layer = this.layers[l];
				var layerY = layer.style.y = layer.data.speed * -y;

				// release views that are more than a screen height above
				var topPiece = layer.pieces[0];
				while (topPiece && topPiece.style.y + topPiece.style.height <= -layerY - BG_HEIGHT) {
					layer.pieces.shift();
					this.piecePool.releaseView(topPiece);
					topPiece = layer.pieces[0];
				}

				// spawn views as they come onto the scren
				while (layer.spawnY <= -layerY + BG_HEIGHT) {
					var data = layer.data.pieces[~~(random() * layer.data.pieces.length)];
					var piece = this.piecePool.obtainView({
						parent: layer,
						x: 0,
						y: layer.spawnY,
						width: data.width,
						height: data.height
					});

					piece.setImage(data.image);
					layer.spawnY += data.height + data.gapBase + ~~(random() * data.gapRange);
					layer.pieces.push(piece);
				}
			}
		}
	};
});