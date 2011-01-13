(function($) {
$.fn.ImagesLoad = function(options) {
	var ele = $(this);
	var images = $(this).find('img');
	var originalTotalImagesCount = images.size();
	var totalImagesCount = originalTotalImagesCount;
	var elementsLoaded = 0;

	// Init
	$.fn.ImagesLoad.defaults = {
		loadingCompleteCallback: null, 
		imageLoadedCallback: null
	}
    var opts = $.extend({}, $.fn.ImagesLoad.defaults, options);
		
	// Start
	images.each(function() {
		//console.log($(this));
		// The image has already been loaded (cached)
		if ($(this)[0].complete) {
		//	console.log('cached image found');
			totalImagesCount--;
			if (opts.imageLoadedCallback) opts.imageLoadedCallback(elementsLoaded, originalTotalImagesCount);
		// The image is loading, so attach the listener
		} else {
			$(this).load(function() {
				elementsLoaded++;
				
				if (opts.imageLoadedCallback) opts.imageLoadedCallback(elementsLoaded, originalTotalImagesCount);

				// An image has been loaded
				if (elementsLoaded >= totalImagesCount){
		//			console.log('loaded total: '+originalTotalImagesCount);
					if (opts.loadingCompleteCallback) opts.loadingCompleteCallback(ele);
				}
			});
			$(this).error(function() {
				elementsLoaded++;
				
				if (opts.imageLoadedCallback) opts.imageLoadedCallback(elementsLoaded, originalTotalImagesCount);
					
				// The image has errored
				if (elementsLoaded >= totalImagesCount){
		//			console.log('no unloaded images: '+originalTotalImagesCount);
					if (opts.loadingCompleteCallback) opts.loadingCompleteCallback(ele);
				}
			});
		}
	});

	// There are no unloaded images
	if (totalImagesCount <= 0){
	//	console.log('no unloaded images: '+originalTotalImagesCount);
		if (opts.loadingCompleteCallback) opts.loadingCompleteCallback(ele);
	}
};
})(jQuery);
