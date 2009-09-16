/*----------------------------------------------------------------------------
 * Interface Functionality
 *---------------------------------------------------------------------------*/

/**
 * @class
 * Geodia interface: currently featuring two side panels. This class deals with the
 * layout, panels, and full-page interface stuff.
 *
 * @param {Geodia.Controller} controller    Associated controller
 * @param {Object} options                  Container for optional params (probably to load state)
 */
Geodia.Interface = function(controller, options) {

    /** The associated controller */
    this.controller = controller;
    
    var defaults = {
        /** Whether the detail sidebar is open */
        sbopen: false,
        /** Whether the admin query panel sidebar is open */
        adminopen: false,
        /** Which side the sidebar is on */
        sbside: 'r',
        /** Which side the admin panel is on */
        adminside: 'l'
    };
    
    /** 
     * Container for optional settings passed in the "options" parameter
     * @type Object
     */
    this.opts = options = TimeMap.util.merge(options, defaults);
    
    /** The associated site list */
    this.siteList = new Geodia.SiteList(this, this.controller);
    
    /** The associated admin panel */
    this.adminPanel = new Geodia.AdminPanel(this, this.controller);
    
    
    var ui = this;
    
    /**
     * Initialize the interface
     */
    this.init = function() {
        
	    // handler to toggle sidebars
	    $('div.toggler').click(function() {
	        var id = $(this).parent('div').attr('id');
	        ui.toggleSidebar(id);
		    $(this).siblings().toggle();
	    });
        
        // set up panels
        this.resizePanels();
        
        // set up resize function
        // XXX: with more than one Geodia object, we'd need a chain here
        window.timer = null;
        window.onresize = function() {
            if (window.timer === null) {
                window.timer = window.setTimeout(function() {
                    window.timer = null;
                    // call twice to deal w/scrollbar
                    ui.resizePanels();
                    ui.resizePanels();
                }, 200);
            }
        }
    };
    
    /**
     * Resize the panels to fit the full window
     */
    this.resizePanels = function() {
        // get full screen size
        var dh = $(window).height();
        var dw = $(window).width();
        var sbw = options.sbopen ? 350 : 20;
        var adw = options.adminopen ? 350 : 20;
        var hh = 31;
        // size timemap and sidebar
	    var sbh = dh - hh;
        $('#timemap').height(dh - hh)
            .width(dw - sbw - adw);
	    $('ul.site_periods').height(sbh * .9);
        $('#sidebar').height(dh - hh)
            .width(sbw);
        $('#admin_bar').height(dh - hh)
            .width(adw);
        // choose sidebar side
        var border = '0px solid #CCCCCC';
        if (options.sbside == 'l') {
            // left side
            $('#sidebar')
                .css('border-right', border);
            $('#timemap')
                .css('margin-right', sbw)
                .css('left', sbw);
        }
       	else {
            // right side
            $('#admin_bar')
                .css('border-right', border)
                .css('left', 0);
            $('#timemap')
                .css('left', adw);
            $('#sidebar')
                .css('border-left', border)
                .css('left', dw - sbw);
        }

        this.controller.checkResize();
    };
    
    /**
     * Add a site to the site list.
     *
     * @param {TimeMapItem} item    Item to add
     */
    this.addToSiteList = function(item) {
        this.siteList.add(item);
    };

    /**
     * Clear site list
     */
    this.clearSiteList = function() {
        this.siteList.clear();
    };
    
    /**
     * Show or hide loading animation
     *
     * @param {Boolean} loading     Whether loading is on or off     
     */
    this.toggleLoading = function(loading) {
        var loaderId = "ajax_loader";
        if (loading) {
            // check that the loader isn't already visible
            if ($("#" + loaderId).size() < 1) {
                // add loader image
                $('<img id="' + loaderId + '" src="images/ajax-loader.gif"/>')
                    .insertAfter($('div.site_admin h1'));
            }
        }
        else {
            $("#" + loaderId).remove();
        }
    };
    
    /**
     * Toggle a sidebar open or closed
     *
     * @param {String} sb       sidebar to toggle ("sidebar" or "admin_bar")
     */
    this.toggleSidebar = function(sb) {
        switch (sb) {
            case 'sidebar':
                options.sbopen = !options.sbopen;
                break;
            case 'admin_bar':
                options.adminopen = !options.adminopen;
                break;
        }
		ui.resizePanels();
    };
};

/*----------------------------------------------------------------------------
 * Site List
 *---------------------------------------------------------------------------*/

/**
 * @class
 * This class holds all functionality for managing the site list.
 * Making a separate class here allows re-using the site list in different interfaces.
 *
 * @param {Geodia.Interface} ui             Associated interface
 * @param {Geodia.Controller} controller    Associated controller
 */
Geodia.SiteList = function(ui, controller) {

    /** The associated interface */
    this.ui = ui;
    
    /** The associated controller */
    this.controller = controller;

    /**
     * Add a site to the site list.
     *
     * @param {TimeMapItem} item    Item to add
     */
    this.add = function(item) {
        var site_list = $('ul.site_list');
        var site = $('<li>' + item.getTitle() + '</li>')
            // add item reference
            .data('site', item)
            // add click handler
            .click(function() {
                item.openInfoWindow();
            })
            // add to site list
            .appendTo(site_list);
            
        /* XXX: Not sure why clicking these items deletes the site now -
        we probably want a separate function for that. Also
        not sure about the performance consequences of the .live()
        function - better to add the handler when a site is added to the list,
        now in a separate function.
            
	    site.click(function(){
		    var item = $(this).data('site');
		    var dataset = $(this).data('dataset');
		    var name = $(this).data('name');
		    if (name == $('#site_title').text()){
			    $('#site_title').empty();
			    $('#site_description').empty();
			    $('ul.site_periods').empty();
		    }
		    item.hide();
		    item.hidePlacemark();
		    if (dataset.items.length == 1){
			    dataset.clear();
			    if (name == $('#site_title').text()){
				    $('#site_title').empty();
				    $('#site_description').empty();
				    $('ul.site_periods').empty();
			    }
			    delete dataset;
		    }
		    $(this).remove();
		    delete item;
            dataset.each(function(i) {
                if (i.event){
                    i.event._trackNum = null;
                }
            });
            Geodia.controller.tm.timeline.layout();
	    });
	    */
    };

    /**
     * Clear site list
     */
    this.clear = function() {
        $('ul.site_list').empty();
    };
};


/*----------------------------------------------------------------------------
 * Admin Panel
 *---------------------------------------------------------------------------*/

/**
 * @class
 * This class holds all functionality for managing the admin panel
 * Making a separate class here allows re-using the panel in different interfaces.
 *
 * @param {Geodia.Interface} ui             Associated interface
 * @param {Geodia.Controller} controller    Associated controller
 */
Geodia.AdminPanel = function(ui, controller) {

    /** The associated interface */
    this.ui = ui;
    
    /** The associated controller */
    this.controller = controller;
    
    /**
     * Clear all ui elements and all data.
     */
    this.clear = function() {
		controller.clear();
		$('ul.site_list').empty();
		$('#site_title').empty();
		$('#site_description').empty();
		$('ul.site_periods').empty();
		return false;
	};
	
	/**
	 * Load data based on facets
	 */
	this.loadFacets = function() {
		var cultures = [], regions = [];
        $('#culture_list')
            .children('input[type="checkbox"]:checked')
            .each(function(i, el){
                cultures.push($(el).val());			
            });
		$('#region_list')
            .children('input[type="checkbox"]:checked')
            .each(function(i, el){
                regions.push($(el).val());			
            });
        controller.loadFacets(cultures, regions);
    };
	
	/**
	 * Load data based on search query
	 */
	this.loadSearch = function(){
        var term = $('#search_text').val();
        controller.loadSearch(term);
	};
    
    // Initialize panel
        
    // clear panel
    $('#admin_bar input[type="checkbox"]').attr('checked',false);
    $('#search_text').val('');
    
    // set handlers
    $('#clear_all').click(this.clear);
    $('#culture_list input[type="checkbox"]').click(this.loadFacets);
    $('#region_list input[type="checkbox"]').click(this.loadFacets);
    $('#search_button').click(this.loadSearch);

};

/*----------------------------------------------------------------------------
 * Sidebar Panel
 *---------------------------------------------------------------------------*/

/**
 * Initialize images for a selected site
 * XXX: This needs some love - conflates the sidebar set up with the image viewer
 */
Geodia.Interface.initImageViewer = function(current, periods, site_name, description){
        
    // utility function
    function formatName(name){
        name = name.replace(/ /g,'_').toLowerCase().replace(/\//g,'_');
        return name;
    }
    
    if (site_name != $('#site_title').text()){
        var sb_ul = $('ul.site_periods');
        var li_sum_heights = 0;
        $(sb_ul).empty();
        $('#site_title').text(site_name);
        $('#site_description').text(description);
        var p = periods.getAllIterator();
        while(p.hasNext()){
            var period = p.next();
            var images = period.getImages();
            var li = '';
            if (formatName(current.term)+'_'+formatName(current.culture) == formatName(period.term)+'_'+formatName(period.culture)) {
                li += '<li class="selected '+formatName(period.term)+'_'+formatName(period.culture)+'"><p><span>'+period.term+'</span> '+period.start+' - '+period.end+'</p>';
            }
            else{
                li += '<li class="'+formatName(period.term)+'_'+formatName(period.culture)+'"><p><span>'+period.term+'</span> '+period.start+' - '+period.end+'</p>';
            }
            if (images) {
                for(var i in images){
                    if (images[i]['large'] != null){
                        li += '<a href="'+images[i]['large']+'"><img src="'+images[i]['thumb']+'"/>';
                    }
                    else if (images[i]['medium'] != null){
                        li += '<a href="'+images[i]['medium']+'"><img src="'+images[i]['thumb']+'"/>';
                    }
                    else{
                        li += '<a href="'+images[i]['small']+'"><img src="'+images[i]['thumb']+'"/>';
                    }
                    li += '<div style="display:none" class="image_info">';
                    if (images[i].metadata['title']){
                        li += '<p class="image_title"><span>Description: </span>'+images[i].metadata['title']+'</p>';
                    }
                    if (images[i].metadata['image_date']){
                        li += '<p class="image_date"><span>Date: </span>'+images[i].metadata['image_date']+'</p>';
                    }
                    if (images[i].metadata['source']){
                        li += '<p class="image_source"><span>Source: </span>'+images[i].metadata['source']+'</p>';
                    }
                    if (images[i].metadata['created_in']){
                        li += '<p class="image_created"><span>Created In: </span>'+images[i].metadata['created_in']+'</p>';
                    }
                    if (images[i].metadata['found_in']){
                        li += '<p class="image_found"><span>Found In: </span>'+images[i].metadata['found_in']+'</p>';
                    }
                    li += '</div></a>';
                }
            }
            li += '</li>';
            var appended = $(li).appendTo(sb_ul);
            $(appended).children('a').lightBox();

            if ($(appended).hasClass('selected')){
                $('ul.site_periods').animate({scrollTop:li_sum_heights},'slow');
            }
            li_sum_heights += $(appended).height() + 20; 
        }
    }
    else{
        var li_sum_heights = 0;
        $('ul.site_periods li').each(function(i,n){
            if ($(n).hasClass(formatName(current.term)+'_'+formatName(current.culture))){
                $('ul.site_periods').animate({scrollTop:li_sum_heights},'slow');
                $(n).addClass('selected');
            }
            else{
                $(n).removeClass('selected');
            }
             li_sum_heights += $(n).height() + 20; 
        });
        
    }
};
