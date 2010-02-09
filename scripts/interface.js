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
        sbopen: true,
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
	this.sitePeriods = new Geodia.SitePeriods(this, this.controller);

	/** The associated image search */
	this.imageSearch = new Geodia.ImageSearch(this, this.controller);

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
		
		//faq modal
		$('#faq-content').dialog({autoOpen:false,modal:true,height:600,width:800,title:'FAQ'});
		$('#faq').click(function(){
		//broken since we dont have faq info
	//		$('#faq-content').dialog('open');
			return false;
		});

		$('#login-window').dialog({autoOpen:false,modal:true,height:600,width:800,title:'LOGIN'});
		$('#login').click(function(){
			$('#login-window').dialog('open');
			return false;
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
		var fh = $('#footer').height();
        var hh = $('#hborder').height();
        // size timemap and sidebar
	    var sbh = dh - hh - 2;
		$('#timemap').height(dh - hh - fh - 2);
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

	this.ImageClicked = null;
    
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
                    .appendTo($('#header'));
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
        var site_list = $('table.site_list');
		
        var site = $('<tr class="site_row"><td><a href="" class="site_name">' + item.getTitle() + '</a></td><td><input class="auto" name="'+item.opts.serial_number+'_state" type="radio" checked="checked"/></td><td><input name="'+item.opts.serial_number+'_state" class="show" type="radio"/></td><td><input name="'+item.opts.serial_number+'_state" class="hide" type="radio"/></td></tr>').data('site',item).appendTo(site_list);

		$(site).find('input').click(function(){
			controller.toggleState(item,$(this).attr('class'));
			GEvent.trigger(controller.tm.map,'moveend');
		
		});

		//when name clicked go to site page and appropriate period
		$(site).find('a.site_name').click(function(){
			item.getImages(function(site,new_site){
				ui.sitePeriods.loadImageViewer(site,site.getPeriod(),new_site);
			});
			return false;
		});
    };
	$('a.state-indicator').live('click',function(){
		return false
	});
	this.updateSiteCount = function(count){
		$('#site_count').text('('+count+')');
	};

	this.update = function(){
		$('table.site_list tr.site_row').each(function(i,n){
			var item = $(n).data('site');
			if(item.show && item.rank <= controller.ui.getEventLimit()){
			   	$(n).addClass('visible');
			   	$(n).find('a.site_name').addClass('visible');
			}
			else{
				$(n).removeClass('visible');
			   	$(n).find('a.site_name').removeClass('visible');
			}
		});
	};

    /**
     * Clear site list
     */
    this.clear = function() {
        $('table.site_list tr.site_row').remove();
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
            .find('input[type="checkbox"]:checked')
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

	this.clearPanel = function(){
	    $('input[type="checkbox"]').attr('checked',false);
    	$('#search_text').val('');
	};

    
    // Initialize panel
        
    // clear panel
	this.clearPanel();
    
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
 * Image Search
 *---------------------------------------------------------------------------*/

Geodia.ImageSearch = function(ui, controller) {

    /** The associated interface */
    this.ui = ui;
    
    /** The associated controller */
    this.controller = controller;

	this.search = function(){
		var tab = $('#search_image_content').children('.search_results');
		$(tab).empty();
        controller.searchImages($('#search_image_text').val(),function(results){
			var html = '';
			$(results.items).each(function(i,n){
				if(n.metadata['site_period'] && n.metadata['site_name'] && n.metadata['title']){
					html += '<li>';
					html += '<h1 class="site_name">'+n.metadata['site_name'][0]+'</h1>';
					if(n.metadata['image_date']){
						html += '<p>'+n.metadata['image_date'][0]+'</p>';
					}
					html += '<p style="display:none" class="region">'+n.metadata['region'][0]+'</p>';
					html += '<a href="'+results.app_root+n.media['enclosure']+'"><img src="'+results.app_root+n.media['thumbnail']+'"/></a>';
					html += '<div class="metadata" style="display:none">';
						html += '<p><span>Title: </span>'+n.metadata['title'][0]+'</p>';
						html += '<p><span>Site: </span>'+n.metadata['site_name'][0]+'</p>';
						if(n.metadata['image_date']){
							html += '<p><span>Date: </span>'+n.metadata['image_date'][0]+'</p>';
						}
						if(n.metadata['description']){
							html += '<p><span>Description: </span>'+n.metadata['description'][0]+'</p>';
						}
					html += '</div>';
					html += '<p class="title">'+n.metadata['title'][0]+'</p>';
					html += '</li>';
				}
			});
			html += '<div class="spacer"></div>';
			var imgs = $(tab).append(html);
			$(imgs).children('li').click(function(e){
					controller.ui.searchPanel.clearPanel();
					$(this).siblings('li').css('background-color','transparent');
					$(this).css('background-color','#C2CAD1')
					var site = $(this).children('h1').text();
					var region = $(this).children('.region').text();
					ui.ImageClicked = UrlToSernum($(this).children('a').attr('href'));
        			controller.loadSearch('site_name:'+site+' AND region:'+region);
					return false;
			});
		});
	};

	this.clear = function(){
    	$('#search_image_text').val('');
		$('#search_image_content').children('.search_results').empty();
	};
	
        
    // clear panel
	this.clear();
    
    // set handlers
    $('#search_image_button').click(this.search);
	var search = this.search;
    $('#search_image_text').keyup(function(e){
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
        $('h1.site_title').text(site.opts.title).attr('id',site.opts.serial_number);
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
		var period_array = new Array();
		if(new_site || $('h1.site_title').attr('id') != site.opts.serial_number){
        	$('h1.site_title').text(site.opts.title).attr('id',site.opts.serial_number);
			$(sb_ul).empty();
		   	while(p.hasNext()){
				var period = p.next();
				period_array.push(period);
				var li = '<li class="site_period';
				if(period.term+period.start == current_period.term+current_period.start){
					li += ' selected';
				}
				li += '">';
				if(images[period.serial]){
					var image_set = images[period.serial].images;
					var image_length = 0;
					var ul_size = '';
					if(image_set){
						image_length = image_set.length;
						ul_size = image_length * 114;
					}
					else{
						ul_size = 0;
					}		
					li += '<p class="period_name"><span>'+period.term+'</span> '+period.start+' - '+period.end+'</p><ul class="thumbs" style="width:'+ul_size+'px" >';
					for(var i in image_set){
   		    			li += '<li><a class="thumb" href="'+image_set[i]['large']+'"><img title="'+image_set[i].metadata['title']+'" src="'+image_set[i]['thumb']+'"/></a><div style="display:none" class="metadata">';
						if(image_set[i].metadata['title'] != undefined){
							li += '<p><span>Title: </span>'+image_set[i].metadata['title']+'</p>';
						}
						if(image_set[i].metadata['image_date'] != undefined){
							li += '<p><span>Date: </span>'+image_set[i].metadata['image_date']+'</p>';
						}
						if(image_set[i].metadata['description'] != undefined){
							li += '<p><span>Description: </span>'+image_set[i].metadata['description']+'</p>';
						}
						/*
						if(image_set[i].metadata['source'] != undefined){
							li += '<p><span>Source: </span>'+image_set[i].metadata['source']+'</p>';
						}
						*/
						li += '</div></li>';
					}
					li += '</ul><div class="arrows"><a href="" class="prev ui-icon ui-icon ui-icon-circle-arrow-w"></a><a href="" class="next ui-icon ui-icon ui-icon-circle-arrow-e"></a></div><div class="slider"></div><p style="float:none" class="image-counter"><span>1</span> of '+image_length+'</p>';
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
					$(n).find('a.next').remove();
					$(n).find('a.prev').remove();
					$(n).find('p.image-counter').remove();
				}
				else if(size == 0){
					$(n).find('ul.thumbs').css('height','20px');
					$(n).find('div.slider').remove();
					$(n).find('a.next').remove();
					$(n).find('a.prev').remove();
					$(n).find('p.image-counter').remove();
				}
		        if ($(n).hasClass('selected')){
        	   	    $('ul.site_periods').animate({scrollTop:li_sum_heights + 10},'slow');
	       	    }
				else if(ui.ImageClicked){
					//if ImageClicked global var set, then it was a request made from an image search.
					//we will want to scroll down to the appropriate period
					$(n).find('a.thumb').each(function(l,m){
						if($(m).attr('href').indexOf(ui.ImageClicked) != -1){
						
							$(n).addClass('selected');
        	   	    		$('ul.site_periods').animate({scrollTop:li_sum_heights + 10},'slow');
							var ev = period_array[i];
    	                    controller.tm.timeline.getBand(0).setCenterVisibleDate(ev.getStart());
        	                controller.tm.timeline.layout();
							ui.ImageClicked = null;
						}
					});	
				}
    	        li_sum_heights += $(n).height() + 20; 
			});

		}
		else{
        	$('li.site_period').each(function(i,n){
				if($(n).find('p.period_name').text() == current_period.term+' '+current_period.start+' - '+current_period.end){
                	$('ul.site_periods').animate({scrollTop:li_sum_heights + 10},'slow');
	                $(n).addClass('selected');
				}
				else{
	                $(n).removeClass('selected');
					$(n).find('p.period_name').text().
        	    	li_sum_heights += $(n).height() + 20; 
    	        }
	        });
		}
	};

	function addSlider(appended, size){
		var max = size * 114;
		var val = 0;
		var viewport = $(appended).find('ul.thumbs');
		var nextBtn = $(appended).find('a.next');
		var prevBtn = $(appended).find('a.prev');
		var imgNum = $(appended).find('p.image-counter').children('span');
		var counter = 1;
		var timer = null; //timer variable
		var slider =   $(appended).find('div.slider');
		var slide_viewport = $(slider).siblings('ul.thumbs');
		
						$(slider).slider({
							step: 114,
							min: 0,
							max: max,
							stop: function(event,ui){
			                    $(slide_viewport).animate({
				                    left: '-'+ui.value+'px',
				                    y: 0,
									queue: false
			                    },500,'swing');
								val = ui.value;
								$(imgNum).text(Math.floor(ui.value / 114) + 1);
							}
						});

		var moveNext = function(){
			if(val + 114 < max){
				val = val + 114;
			                    $(slide_viewport).animate({
				                    left: '-'+val+'px',
				                    y: 0,
									queue: false
			                    },0,'swing');
				timer = setTimeout(moveNext,100);
				$(slider).slider('option','value',val);
				$(imgNum).text(Math.floor(val / 114) + 1);
			}
		}
		var movePrevious = function(){
			if(val - 114 >= 0){
				val = val - 114;
			                    $(slide_viewport).animate({
				                    left: '-'+val+'px',
				                    y: 0,
									queue: false
			                    },0,'swing');
				timer = setTimeout(movePrevious,100);
				//setter
				$(slider).slider('option','value',val);
				$(imgNum).text(Math.floor(val / 114) + 1);
			}
		}
		$(nextBtn).mousedown(function(){if(!timer){moveNext();}}).mouseup(function(){clearTimeout(timer);timer= null;}).click(function(){return false;});
		$(prevBtn).mousedown(function(){if(!timer){movePrevious();}}).mouseup(function(){clearTimeout(timer);timer=null;}).click(function(){return false;});
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


//turns url to serial number
function UrlToSernum(url){
	return url.substring(url.lastIndexOf('/') + 1,url.lastIndexOf('.'));
}
