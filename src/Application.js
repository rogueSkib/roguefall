import src.controllers.Controller as Controller;

exports = Class(GC.Application, function(supr) {
	this._settings = {
		alwaysRepaint: true,
		logsEnabled: true,
		showFPS: false,
		preload: ["resources/images/menu"]
	};

/* ~ ~ ~ MAIN ENTRY POINTS ~ ~ ~ */

	this.initUI = function() {
		this.controller = Controller.get();

		window.addEventListener('pageshow', bind(this, "onAppShow"), false);
		window.addEventListener('pagehide', bind(this, "onAppHide"), false);
		window.addEventListener('onfocus', bind(this, 'onAppFocus'), false);
		window.addEventListener('onblur', bind(this, 'onAppBlur'), false);
	};

	this.launchUI = function() {
		this.controller.transitionToMainMenu();
	};

	this.onAppShow = function() {};
	this.onAppHide = function() {};
	this.onAppFocus = function() {};
	this.onAppBlur = function() {};
});