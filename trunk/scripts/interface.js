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
       // adminopen: false,
        /** Which side the sidebar is on */
        sbside: 'r',
        /** Which side the admin panel is on */
      //  adminside: 'l',
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
	this.searchPanel = new Geodia.SearchPanel(this, this.controller);

    /** The associated image viewer */
	this.sitePeriods= new Geodia.SitePeriods(this, this.controller);

	/** SideBar */
	this.sideBar = new Geodia.SideBar(this,this.controller);
    
    
    var ui = this;
    
    /**
     * Initialize the interface
     */
    this.init = function() {
        
	    // handler to toggle sidebars
	    $('div.toggler').click(function() {
			ui.toggleSidebar();
	    });

		//setup tab action
		$('#tabs a').click(function(){
			var id = $(this).attr('id');
			controller.ui.sideBar.display(id);
			return false;
		});

        // set up panels
        this.resizePanels();
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
        var sbw = options.sbopen ? 350 : 30;
        var adw = 0;// options.adminopen ? 350 : 20;
        var hh = 32;
        // size timemap and sidebar
	    var sbh = dh - hh;
		$('#timemap').height(dh - hh);
        $('#mapcontainer').width(dw - sbw + 30);
		$('#sbcontent').height(sbh);
        $('#sidebar').height(sbh)
            .width(sbw);
        $('#admin_bar').height(dh - hh)
            .width(adw);
        // choose sidebar side
        var border = '0px solid #CCCCCC';
        if (options.sbside == 'l') {
            // left side
            $('#sidebar')
                .css('border-right', border);
            $('#mapcontainer')
                .css('margin-right', sbw)
                .css('left', sbw);
        }
       	else {
            // right side
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
    this.getCultures = function() {
        return this.searchPanel.cultures;
    };

	this.updateSiteCount = function(count){
		this.siteList.updateSiteCount(count);
	};

    /**
     * Clear site list
     */
//    this.clearSiteList = function() {
  //      this.siteList.clear();
    //};

	this.clearAll = function(){
		this.siteList.clear();
		this.sitePeriods.clear();
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
            if ($("#" + loaderId).length < 1) {
                // add loader image
                $('<img id="' + loaderId + '" src="images/ajax-loader.gif"/>')
                    .insertAfter($('#search_button'));
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
    this.toggleSidebar = function() {
		this.sideBar.toggle();
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
		item.state = 1;
        var site_list = $('ul.site_list');
        var site = $('<li>' + item.getTitle() + '<a href="" class="state-indicator" ></a></li>')
            // add item reference
            .data('site', item)
            // add click handler
            .click(function() {
				controller.toggleState(item); 
				GEvent.trigger(controller.tm.map,'moveend');
            })
            // add to site list
            .appendTo(site_list);
    };
	$('a.state-indicator').live('click',function(){
		return false
	});
	this.updateSiteCount = function(count){
		$('#site_count').text('('+count+')');
	};

	this.update = function(){
		$('ul.site_list li').each(function(i,n){
			var item = $(n).data('site');
			var $indicator = $(n).children('a.state-indicator').attr('class','');
			if(item.state == 0){
				$indicator.attr('class','ui-icon ui-icon-circle-close state-indicator');
			}
			else if(item.state == 1){
				$indicator.attr('class','state-indicator');
			}
			else{
				$indicator.attr('class','ui-icon ui-icon-circle-plus state-indicator');
			}
			//change color if it is displayed on timeline and add to top
			if(item.show && item.rank <= controller.ui.getEventLimit()){
			   	$(n).addClass('visible');
				$(n).prependTo($('ul.site_list'));
			}
			else{
				$(n).removeClass('visible');
			}
		});
	};

    /**
     * Clear site list
     */
    this.clear = function() {
        $('ul.site_list').empty();
		this.updateSiteCount(0);
    };
};


/*----------------------------------------------------------------------------
 * Search Panel
 *---------------------------------------------------------------------------*/

/**
 * @class
 * This class holds all functionality for managing the admin panel
 * Making a separate class here allows re-using the panel in different interfaces.
 *
 * @param {Geodia.Interface} ui             Associated interface
 * @param {Geodia.Controller} controller    Associated controller
 */
Geodia.SearchPanel = function(ui, controller) {

    /** The associated interface */
    this.ui = ui;
    
    /** The associated controller */
    this.controller = controller;
    
    /**
     * Clear all ui elements and all data.
     */
    this.clear = function() {
		controller.clear();
		$('#site_title').empty();
		$('#site_description').empty();
		$('ul.site_periods').empty();
		return false;
	};
	
	this.cultures = [];

	/**
	 * Load data based on facets
	 */
	this.loadFacets = function() {
		var cultures = [], regions = [];
		controller.ui.searchPanel.cultures = [];
        $('#culture_list')
            .children('input[type="checkbox"]:checked')
            .each(function(i, el){
				var temp = $(el).val();
                cultures.push(temp);			
				temp = temp.split('/');
				for(var j in temp){
                	controller.ui.searchPanel.cultures.push(temp[j]);			
				}
            });
		$('#region_list')
            .children('input[type="checkbox"]:checked')
            .each(function(i, el){
                regions.push($(el).val());			
            });
		if($('#search_text').val() != ''){
			controller.ui.searchPanel.cultures.push($('#search_text').val());
		}
        var term = $('#search_text').val();
        controller.loadFacets(cultures, regions, term);
    };

    
    // Initialize panel
        
    // clear panel
    $('input[type="checkbox"]').attr('checked',false);
    $('#search_text').val('');
    
    // set handlers
    $('#clear_all').click(this.clear);
    $('#culture_list input[type="checkbox"]').click(this.loadFacets);
    $('#region_list input[type="checkbox"]').click(this.loadFacets);
    $('#search_button').click(this.loadFacets);
	var search = this.loadFacets;
    $('#search_text').keyup(function(e){
		if(e.keyCode == 13){
			search();
		}
	});

};


/*----------------------------------------------------------------------------
 * Site Periods  
 *---------------------------------------------------------------------------*/
Geodia.SitePeriods = function(ui, controller) {
    /** The associated interface */
    this.ui = ui;
    
    /** The associated controller */
    this.controller = controller;

	this.displayLoading = function(site){
		this.display();
        $('#site_title').text(site.opts.title);
        $('#site_description').text(site.opts.description);
        $('ul.site_periods').empty();
        $('<h1>Downloading Images ... </h1>').appendTo($('ul.site_periods'));
	};

	this.clear = function(){
		$('ul.site_periods').empty();
		$('#site_title').empty();
	};

	this.display = function(){
		$('#tabs').children('li').removeClass('selected');
		$('#site_periods').parent('li').addClass('selected');
		controller.ui.sideBar.display('site_periods');	
	};

	this.loadImageViewer = function(site,current_period,new_site){
		this.display();

		var p = site.periods.getAllIterator();
		var images = $(site).data('images');
		var sb_ul = $('ul.site_periods');
		var period_list = '';
    	var li_sum_heights = 0;
		if(new_site || $('#site_description').text() != site.opts.description){
			$('#site_title').text(site.opts.title);
   			$('#site_description').text(site.opts.description);
			$(sb_ul).empty();
		   	while(p.hasNext()){
				var period = p.next();
				var li = '<li class="site_period';
				if(period.term+period.start == current_period.term+current_period.start){
					li += ' selected';
				}
				li += '">';
				if(images[period.serial]){
					var image_set = images[period.serial].images;
					var ul_size = '';
					if(image_set){
						ul_size = image_set.length * 110;
					}
					else{
						ul_size = 0;
					}		
					li += '<p class="period_name"><span>'+period.term+'</span> '+period.start+' - '+period.end+'</p><ul class="thumbs" style="width:'+ul_size+'px" >';
					for(var i in image_set){
   		    			li += '<li><a class="thumb" href="'+image_set[i]['large']+'"><img src="'+image_set[i]['thumb']+'"/></a><div style="display:none" class="metadata">';
						li += '<p><span>Title: </span>'+image_set[i].metadata['title']+'</p>';
						li += '<p><span>Site: </span>'+image_set[i].metadata['site_name']+'</p>';
						li += '<p><span>Source: </span>'+image_set[i].metadata['source']+'</p>';
						li += '</div></li>';
					}
					li += '</ul><div class="slider"></div>';
				}
				li += '<div class="spacer"></div></li>';
				period_list += li;
			}
			$(sb_ul).append(period_list);
			$('li.site_period').each(function(i,n){
				var size = $(n).children('ul.thumbs').find('img').length; 
				$(n).children('ul.thumbs').find('a.thumb').lightBox();
				if(size > 2){
					addSlider(n,size);
				}
				else if(size > 0 && size <= 2){
					$(n).find('div.slider').remove();
				}
				else if(size == 0){
					$(n).find('ul.thumbs').css('height','20px');
					$(n).find('div.slider').remove();
				}
		        if ($(n).hasClass('selected')){
        	   	    $('ul.site_periods').animate({scrollTop:li_sum_heights},'slow');
	       	    }
    	        li_sum_heights += $(n).height() + 20; 
			});

		}
		else{
        	$('ul.site_periods li').each(function(i,n){
				if($(n).find('p.period_name').text() == current_period.term+' '+current_period.start+' - '+current_period.end){
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


	function addSlider(appended, size){
		var max = size * 100;
		var viewport = $(appended).find('ul.thumbs');
						$(appended).find('div.slider').slider({
							step: 100,
							min: 0,
							max: max,
							stop: function(event,ui){
								var slide_viewport = $(this).siblings('ul.thumbs');
			                    $(slide_viewport).animate({
				                    left: '-'+ui.value+'px',
				                    y: 0,
									queue: false
			                    },500,'swing');
							}
						});

	}

};
/*----------------------------------------------------------------------------
 * Sidebar Panel
 *---------------------------------------------------------------------------*/

/**
 * Initialize images for a selected site
 * XXX: This needs some love - conflates the sidebar set up with the image viewer
 */
Geodia.SideBar = function(ui, controller) {
    /** The associated interface */
    this.ui = ui;
    
    /** The associated controller */
    this.controller = controller;
    
	/** open SideBar **/
	this.open = function(){
		ui.opts.sbopen = true;
		this.toggleToggle('open');
		ui.resizePanels();
	};
	/** close SideBar **/
	this.close = function(){
		ui.opts.sbopen = false;
		this.toggleToggle('close');
		ui.resizePanels();
	};

	/** toggle SideBar **/
	this.toggle = function(){
        ui.opts.sbopen = !ui.opts.sbopen;
		this.toggleToggle();
		ui.resizePanels();
	};

	/** Display specified content in side bar **/
	this.display = function(type){
		/* Types --------------------
		 sitePeriods = site_periods
		 siteList = site_list
		 searchPanel = search
		 details = details
		*--------------------------*/

		$('div.tab_content').removeClass('selected');
		$('#'+type+'_content').addClass('selected');
		$('#tabs').children('li').removeClass('selected').find('a').removeClass('selected');
		$('#'+type).parent('li').addClass('selected').children('a').addClass('selected');
		this.open();
	};

	this.toggleToggle = function(command){
		$('div.toggler').children('div').each(function(i,item){
			if(command){
				if(command == 'close'){
					$(item).removeClass('east').addClass('west');
				}
				else{
					$(item).removeClass('west').addClass('east');
				}
			}
			else{
				if($(item).hasClass('west')){
					$(item).removeClass('west').addClass('east');
				}
				else{
					$(item).removeClass('east').addClass('west');
				}	
			}
		});
	};

};
