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
        adminside: 'l',
        /** number of events to be shown on the timeline */
        eventLimit: 6
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
        
        // reset event limit based on timeline height
        this.opts.eventLimit = ($("#timeline").height() * .8 - 15) / 21;

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
     * Get number of events to show
     */
    this.getEventLimit = function() {
        return this.opts.eventLimit;
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
Geodia.Interface.initImageViewer = function(site,current_period,new_site){

	var p = site.periods.getAllIterator();
	var images = $(site).data('images');
	var sb_ul = $('ul.site_periods');
    var li_sum_heights = 0;
	if(new_site || $('#site_description').text() != site.opts.description){
		$('#site_title').text(site.opts.title);
   		$('#site_description').text(site.opts.description);
		$(sb_ul).empty();
	   	while(p.hasNext()){
			var period = p.next();
			var li = '<li';
			if(period.term+period.start == current_period.term+current_period.start){
				li += ' class="selected" ';
			}
			li += '><p><span>'+period.term+'</span> '+period.start+' - '+period.end+'</p>';
			if(images[period.serial]){
				var image_set = images[period.serial].images;
				for(var i in image_set){
   		    		li += '<a href="'+image_set[i]['large']+'"><img src="'+image_set[i]['thumb']+'"/>';
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
        $('ul.site_periods li').each(function(i,n){
			if($(n).children('p').text() == current_period.term+' '+current_period.start+' - '+current_period.end){
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
