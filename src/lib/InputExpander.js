import ui.View as View;

exports = Class(View, function(supr) {

	var realView;

	this.init = function(opts) {
		//opts.backgroundColor = 'rgba(0, 0, 0, 0.75)';
		supr(this, 'init', [opts]);
		this.realView = realView = opts.realView;
	};

	this.setRealView = function(view) {
		this.realView = realView = view;
	};

	this.onInputStart = function() {
		realView.onInputStart && realView.onInputStart.apply(realView, arguments);
	};

	this.onInputSelect = function() {
		realView.onInputSelect && realView.onInputSelect.apply(realView, arguments);
	};

	this.onInputMove = function() {
		realView.onInputMove && realView.onInputMove.apply(realView, arguments);
	};

	this.onDrag = function() {
		realView.onDrag && realView.onDrag.apply(realView, arguments);
	};

	this.onDragStart = function() {
		realView.onDragStart && realView.onDragStart.apply(realView, arguments);
	};

	this.onDragStop = function() {
		realView.onDragStop && realView.onDragStop.apply(realView, arguments);
	};

	this.onInputOut = function() {
		realView.onInputOut && realView.onInputOut.apply(realView, arguments);
	};

	this.onInputOver = function() {
		realView.onInputOver && realView.onInputOver.apply(realView, arguments);
	};
});