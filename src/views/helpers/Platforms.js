import ui.View as View;
import ui.ImageView as ImageView;
import ui.resource.Image as Image;

import src.lib.ViewPool as ViewPool;

var platformConfig = [
	{
		spaceBase: 0,
		spaceRange: 4,
		hitX: 18,
		hitY: 18,
		hitWidth: 220,
		connectable: true,
		image: "resources/images/game/slab_1.png"
	},
	{
		spaceBase: 0,
		spaceRange: 2,
		hitX: 18,
		hitY: 18,
		hitWidth: 160,
		connectRight: 128,
		connectable: false,
		image: "resources/images/game/slab_2.png"
	},
	{
		spaceBase: 2,
		spaceRange: 2,
		hitX: 18,
		hitY: 18,
		hitWidth: 160,
		connectLeft: 68,
		connectable: false,
		image: "resources/images/game/slab_3.png"
	}
];

exports = Class(View, function(supr) {

	var controller,
		gameView,
		BG_WIDTH,
		BG_HEIGHT,
		SPAWN_X,
		SPAWN_WIDTH = 592,
		SPAWN_SPACES = 4,
		SPAWN_STEP = SPAWN_WIDTH / SPAWN_SPACES,
		SPAWN_GAP_BASE = 128,
		SPAWN_GAP_RANGE = 512;

	this.init = function(opts) {
		supr(this, 'init', [opts]);

		controller = GC.app.controller;
		gameView = opts.gameView;
		BG_WIDTH = controller.bgWidth;
		BG_HEIGHT = controller.bgHeight;
		SPAWN_X = (BG_WIDTH - SPAWN_WIDTH) / 2;

		this.platformPool = new ViewPool({
			ctor: ImageView,
			initCount: 20,
			initOpts: {}
		});

		this.active = [];
		this.lastOffsetY = 0;
		this.spawnY = 0;
	};

	this.reset = function(config) {
		this.config = config || platformConfig;

		// reset platforms
		while (this.active.length) {
			this.platformPool.releaseView(this.active.pop());
		}

		// do some connectable platform planning and image auto-calculations
		this.connectables = [];
		for (var i = 0; i < this.config.length; i++) {
			var platform = this.config[i];

			// automatically process layer image data if we haven't already
			if (typeof platform.image === 'string') {
				platform.image = new Image({ url: platform.image });
				var b = platform.image.getBounds();
				platform.width = platform.width || b.width + (b.marginLeft || 0) + (b.marginRight || 0);
				platform.height = platform.height || b.height + (b.marginTop || 0) + (b.marginBottom || 0);
			}

			if (platform.connectable) {
				this.connectables.push(platform);
			}
		}

		// track y offset for view recycling and spawning
		this.lastOffsetY = 0;
		this.spawnY = 0;
	};

	this.step = function(dt) {
		var y = gameView.offsetY;

		if (this.lastOffsetY !== y) {
			this.lastOffsetY = y;
			this.style.y = -y;

			var random = Math.random;
			var i = 0;
			for (var p = 0, len = this.active.length; p < len; p++) {
				var platform = this.active[i];

				// release views that are more than a screen height above
				if (platform.style.y + platform.style.height <= y - BG_HEIGHT) {
					this.platformPool.releaseView(this.active.shift());
					continue;
				}

				i++;
			}

			// spawn views as they come onto the scren
			var z = 0;
			while (this.spawnY <= y + BG_HEIGHT) {
				var data = this.config[~~(random() * this.config.length)];
				var space = data.spaceBase + ~~(random() * data.spaceRange);
				var x = SPAWN_X + SPAWN_STEP * space;
				x = this.spawnPlatform(x, z++, data);

				// connected platform options
				if (this.connectables.length) {
					if (data.connectLeft !== undefined && x >= BG_WIDTH / 2) {
						var extraData = this.connectables[~~(random() * this.connectables.length)];
						x += data.connectLeft - extraData.width;
						this.spawnPlatform(x, z++, extraData);
					} else if (data.connectRight !== undefined && x + data.width <= BG_WIDTH / 2) {
						var extraData = this.connectables[~~(random() * this.connectables.length)];
						x += data.connectRight;
						this.spawnPlatform(x, z++, extraData);
					}
				}

				this.spawnY += data.height + SPAWN_GAP_BASE + ~~(random() * SPAWN_GAP_RANGE);
			}
		}
	};

	this.spawnPlatform = function(x, z, data) {
		if (x < SPAWN_X) {
			x = SPAWN_X;
		}
		if (x + data.width > SPAWN_X + SPAWN_WIDTH) {
			x = SPAWN_X + SPAWN_WIDTH - data.width;
		}

		var plat = this.platformPool.obtainView({
			parent: this,
			x: x,
			y: this.spawnY,
			zIndex: z,
			width: data.width,
			height: data.height
		});

		plat.hitX = data.hitX;
		plat.hitY = data.hitY;
		plat.hitWidth = data.hitWidth;
		plat.setImage(data.image);
		this.active.push(plat);

		return x;
	};
});