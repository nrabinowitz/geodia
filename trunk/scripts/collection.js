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
    var loader = new TimeMap.loaders.jsonp({});
    
    /** 
     * Base URL of the service 
     * @type String
     */
	/* TEST URL */
   	// loader.SERVICE = "http://dev.laits.utexas.edu/geodia/dase/modules/geodia";
	/* PRODUCTION URL */
    loader.SERVICE = "http://www.laits.utexas.edu/geodia/modules/geodia/dataset/sites.json";
    
    /**
     * Retrieve a query with a list of cultures and regions
     * 
     * @param {String[]} cultures       List of cultures for the query
     * @param {String[]} regions        List of regions for the query
     * @param {TimeMapDataset} dataset  Dataset to load data into
     * @param {Function} callback       Function to call once data is loaded
     */
    loader.loadFacets = function(cultures, regions, dataset, callback) {
        // build query
        var url = loader.SERVICE + '?c=geodia&q=item_type:site_period';
            query = "";
			var cache = true;
        // add cultures
        if (cultures && cultures.length > 0) {
            query += ' AND parent_period:(';
            for (var x=0; x<cultures.length; x++) {
                query += cultures[x].toLowerCase().replace('/','* OR ') + ' OR ';
            }
            query = query.substring(0,query.length - 4)+')';
        }
        // add regions
        if (regions && regions.length > 0) {
            query += ' AND site_region:(';
            for (var x=0; x<regions.length; x++) {
                query += regions[x].toLowerCase() + ' OR ';
            }
            query = query.substring(0,query.length - 4)+')';
        }
        // finish query URL
        url += escape(query) + '&max=999&auth=http&cache='+cache+'&callback=';
        loader.url = url;
        loader.load(dataset, callback);
    };
    
    /**
     * Retrieve a query with a search term
     * 
     * @param {String} term             Term to search on
     * @param {TimeMapDataset} dataset  Dataset to load data into
     * @param {Function} callback       Function to call once data is loaded
     */
    loader.loadSearch = function(term, dataset, callback) {
        term = term.toLowerCase();
		var cache = true;
        // build query
        var url = loader.SERVICE + '?c=geodia&q=' + escape(term) + '* NOT item_type:(image OR period)&max=999&auth=http&cache='+cache+'&callback=';
        loader.url = url
        loader.load(dataset, callback);
    };
    
    return loader;
};

// XXX: all of the loading functionality should be moved here
// Probably, this should work like one of the loader services,
// swappable for another service as needed
