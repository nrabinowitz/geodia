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
    
 
	/** SideBar */
	this.sideBar = new Geodia.SideBar(this,this.controller);
 
 
	/** Nav Search **/
	this.navSearch = new Geodia.NavSearch(this,this.controller);
 
	/** browse tab **/
	this.browse = new Geodia.Browse(this,this.controller);
 
	/** browse tab **/
	this.siteDetails = new Geodia.SiteDetails(this,this.controller);
 
	/** Results **/
	this.results = new Geodia.Results(this,this.controller);
    
    
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
		$('#faq-content').dialog({autoOpen:false,modal:true,height:600,width:960,title:'FAQ'});
		$('#faq').click(function(){
			$('#faq-content').dialog('open');
			return false;
		});
 
		$('#login-window').dialog({autoOpen:false,modal:true,height:600,width:800,title:'LOGIN'});
		$('#login').click(function(){
			$('#login-window').dialog('open');
			return false;
		});

		$('#credits-content').dialog({autoOpen:false,modal:true,height:600,width:960,title:'Credits'});
		$('#credits').click(function(){
			$('#credits-content').dialog('open');
			return false;
		});
 
		//setup tab action
		$('#tabs a').click(function(){
			var id = $(this).attr('id');
			controller.ui.sideBar.display(id);
			return false;
		});
		/*
		//for another time..
		$('#sidebar').draggable({axis:'x',handle:'div.toggler',
				start:function(e,ui){
					$(e.originalTarget).unbind('click');
				},
				drag:function(e,ui){
					$('#sbcontent').width($('#sbcontent').width() +ui.position.left);
				},
				stop:function(e){
					setTimeout(function(){
					    $('div.toggler').click(function() {
							ui.toggleSidebar();
					    });
					}, 300);

				}});
		*/

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
        this.results.addSite(item);
    };
    this.getCultures = function() {
        return this.searchPanel.cultures;
    };
 
	this.updateResultsCount = function(count){
		this.results.updateResultsCount(count);
	};
 
	this.clearAll = function(){
		this.results.clear();
		this.siteDetails.clear();
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
		//adds background image to input search box
        (loading) ? $('input[name="search_text"]').addClass('loading') : $('input[name="search_text"]').removeClass('loading');
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
 
 
 
Geodia.NavSearch = function(ui, controller) {
 
    /** The associated interface */
    this.ui = ui;
    
    /** The associated controller */
    this.controller = controller;
 
	var $searchText = $('input[name="search_text"]');
	var $searchType = $('input[name="type"]');
	var $searchButton = $('input[type="submit"]');
 
	$searchButton.click(function(){
		var type = $searchType.filter(':checked').val();
		var text  = $searchText.val();
		var cultures = ui.browse.cultures();
		var regions = ui.browse.regions();
		if(type == 'site'){
        	controller.loadFacets(cultures, regions, text);
		}
		else{
			//last var is start of search
    	   	controller.searchImages(cultures, regions, text, 0);
		}
		return false;
	});
 
 
//    $searchText.val('').end().focus();
    $searchText.keyup(function(e){
		if(e.keyCode == 13){
			var type = $searchType.filter(':checked').val();
			var text  = $searchText.val();
			var cultures = ui.browse.cultures();
			var regions = ui.browse.regions();
			if(type == 'site'){
        		controller.loadFacets(cultures, regions, text);
			}
			else{
    	    	controller.searchImages(cultures, regions, text, 0);
			}
		}
		return false;
	});
 
};
 
 
 
 
 
 
Geodia.Results = function(ui, controller) {
 
    /** The associated interface */
    this.ui = ui;
    
    /** The associated controller */
    this.controller = controller;
 
	this.$tab = $('#results_content');
	this.$site_results = this.$tab.find('table.site_results');
	this.$image_results = this.$tab.find('ul.image_results');
 
 
    /**
     * Add a site to the site list.
     *
     * @param {TimeMapItem} item    Item to add
     */
    this.addSite = function(item) {
		item.state = 1;
        var site = $('<tr class="site_row"><td><a href="" class="site_name">' + item.getTitle() + '</a></td><td><input class="auto" name="'+item.opts.serial_number+'_state" type="radio" checked="checked"/></td><td><input name="'+item.opts.serial_number+'_state" class="show" type="radio"/></td><td><input name="'+item.opts.serial_number+'_state" class="hide" type="radio"/></td></tr>').data('site',item).appendTo(ui.results.$site_results);
 
		$(site).find('input').click(function(){
			controller.toggleState(item,$(this).attr('class'));
			GEvent.trigger(controller.tm.map,'moveend');
		
		});
 
		//when name clicked go to site page and appropriate period
		$(site).find('a.site_name').click(function(){
			item.getImages(function(site,new_site){
				ui.siteDetails.loadImageViewer(site,site.getPeriod(),new_site);
			});
			return false;
		});
    };
	this.addImages= function(results,cultures, regions, term){
		ui.results.$site_results.parent().hide();
		ui.results.$image_results.empty().show();
			var html = '';
			$(results.items).each(function(i,n){
				if(n['metadata']){
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
				}
			});

			var stats = ''
			var total = parseInt(results.total);
			var max = parseInt(results.max);
			var start = parseInt(results.start);
			//check if next and previous are valid
			if((start - 30) >= 0){
				stats += '<a href="" class="prev">Previous</a>';
			}	
			else{
				stats += '<a href="" class="inactive prev">Previous</a>';
			}
			if(total >= (start + 30)){
				stats += '<a href="" class="next">Next</a>';
			}	
			else{
				stats += '<a href="" class="inactive next">Next</a>';
			}
			if (total < (start + max)){
				var shown = total;
			}
			else{
				var shown = start + max;
			}	
			stats += '<p>'+start+' - '+shown+' of '+total+'</p>';

			$('div.image_results_header').show().append(stats)
				.children('a').click(function(){
					if(!$(this).hasClass('inactive')){
						if($(this).hasClass('next')){
		    		   		controller.searchImages(cultures, regions, term, (start + 30));
						}
						else{
		    		   		controller.searchImages(cultures, regions, term, (start - 30));
						}
					}
					return false;
				});



			html += '<div class="spacer"></div>';
			ui.results.updateResultsCount(results.total);
			var imgs = ui.results.$image_results.append(html);
			ui.sideBar.display('results');
			$(imgs).children('li').click(function(e){
					$(this).siblings('li').css('background-color','transparent');
					$(this).css('background-color','#C2CAD1')
					var site = $(this).children('h1').text();
					var region = $(this).children('.region').text();
					ui.ImageClicked = UrlToSernum($(this).children('a').attr('href'));
        			controller.loadSearch('site_name:'+site+' AND region:'+region);
					return false;
			});
 
 
	};
 
	this.updateResultsCount = function(count){
		$('#results_count').text('('+count+')');
	};
 
	this.update = function(){
		$('tr.site_row').each(function(i,n){
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
     * Clear results 
     */
    this.clear = function() {
		//forgive me
		ui.results.$site_results.empty().append('<tr><th>Name</th><th>Auto</th><th>Show</th><th>Hide</th></tr>');
		ui.results.$site_results.parent().hide();
		$('div.image_results_header').empty().hide(); 
		ui.results.$image_results.empty().hide();
		this.updateResultsCount(0);
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
Geodia.Browse = function(ui, controller) {
 
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
	
	this.cultures = function(){
		var cultures = [];
        $('#culture_list')
            .find('input[type="checkbox"]:checked')
            .each(function(i, el){
				if($(el).val().search('/') === false){
                	cultures.push(temp);			
				}
				else{
					var temp = $(el).val().split('/');
					for(var j in temp){
            	    	cultures.push(temp[j]);			
					}
				}
            });
		return cultures;
	};
	
	this.regions = function(){
		var regions = [];
		$('#region_list')
            .children('input[type="checkbox"]:checked')
            .each(function(i, el){
               regions.push($(el).val());			
        	});
		return regions;
	};
 
	this.clearPanel = function(){
	    $('input[type="checkbox"]').attr('checked',false);
	};
 
    
    // Initialize panel
        
    // clear panel
	this.clearPanel();
};
 
 
/*----------------------------------------------------------------------------
 * Site Periods  
 *---------------------------------------------------------------------------*/
Geodia.SiteDetails = function(ui, controller) {
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
		$('#site_details').parent('li').addClass('selected');
		controller.ui.sideBar.display('site_details');	
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
		$('#tabs').show();
		this.toggleToggle('open');
		ui.resizePanels();
	};
	/** close SideBar **/
	this.close = function(){
		ui.opts.sbopen = false;
		$('#tabs').hide();
		this.toggleToggle('close');
		ui.resizePanels();
	};
 
	/** toggle SideBar **/
	this.toggle = function(){
        ui.opts.sbopen = !ui.opts.sbopen;
		this.toggleToggle();
		$('#tabs').toggle();
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
