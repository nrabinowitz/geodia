/*----------------------------------------------------------------------------
 * Collection Functionality
 *---------------------------------------------------------------------------*/

/**
 * @class
 * DASe Collection loader class
 *
 * @augments TimeMap.loaders.jsonp
 */
TimeMap.loaders.dase = function() {
    var loader = new TimeMap.loaders.basic({});
    /** 
     * Base URL of the service 
     * @type String
     */
	/* TEST URL */
   	loader.SERVICE = "http://www.laits.utexas.edu/geodia/modules/geodia/";
   	loader.DASE = "http://www.laits.utexas.edu/geodia/";
   	loader.SITE_ADMIN = "http://www.laits.utexas.edu/geodia/modules/geodia/";
   	loader.EVENT_ADMIN = "http://www.laits.utexas.edu/geodia/modules/events/";
	/* PRODUCTION URL */
    //loader.PROD = "http://www.laits.utexas.edu/geodia/modules/geodia/dataset/"
	loader.CACHE = false;

	loader.createParamString = function(params){
		if(!params.terms.length){
			var term = 'term='; 
		} else{
			var term = 'term='+params.terms; 
		}
		if(!params.cultures.length){
			var cultures = 'cultures=';
		} else{
			var cultures = 'cultures='+params.cultures.toString();
		}
		if(!params.regions.length){
			var regions = 'regions=';

		} else{
			var regions = 'regions='+params.regions.toString();
		}
		if(!params.removed.length){
			var removed = 'removed=';

		} else{
			var removed = 'removed='+params.removed.toString();
		}
		if(!params.pleiades_uri.length){
			var pleiades_uri = 'pleiades_uri=';

		} else{
			var pleiades_uri = 'pleiades_uri='+params.pleiades_uri;
		}
		if(params.site_period == ''){
			var site_period = 'site_period=';
		} else if(params.item_type == 'site'){
			var site_period = 'site_period='+params.site_period;
		}
		return cultures+'&'+regions+'&'+term+'&'+removed+'&'+site_period+'&'+pleiades_uri+'&item_type='+params.item_type+'&auth=http';
	}

	loader.search = function(controller){
		var params = controller.tm.getState();
		var uid = params.cultures.toString()+'_'+params.regions.toString()+'_'+params.terms+'_'+params.site_period+'_'+params.pleiades_uri+'_'+params.item_type;
		if(uid.replace(params.item_type,'') != "_____"){
			cache = Geodia.getCache(uid);
			if(!cache){
				if(params.pleiades_uri){
					controller.tm.opts.pleiades_uri = '';
				}
				var param_string = loader.createParamString(params);
				var url = loader.SERVICE+'search.json?'+param_string+'&callback=?';
				$.getJSON(url,function(json){
					Geodia.addCache(uid,json);
					controller.loadJson([uid,json]);
				});
			} else{
				controller.loadJson(cache);
			}
		} else{
			controller.loadJson([uid,[]]);
		}
	};
    
    return loader;
};
