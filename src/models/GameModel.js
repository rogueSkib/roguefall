import event.Emitter as Emitter;

exports = Class(Emitter, function(supr) {

	this.init = function(opts) {
		supr(this, 'init', [opts]);
	};

	this.reset = function() {

	};
});