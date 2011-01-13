/*----------------------------------------------------------------------------
 * Interface Functionality
 *---------------------------------------------------------------------------*/
 
Geodia.Interface = function(controller, options) {
    this.controller = controller;
	var ui = this;

	this.sidebar = new Geodia.SideBar(this,this.controller,$('div#sidebar'));
	this.site = new Geodia.SitesTab(this,this.controller,$('div#site_content'));
	this.image = new Geodia.ImagesTab(this,this.controller,$('div#image_content'));
	this.event = new Geodia.EventsTab(this,this.controller,$('div#event_content'));
	this.map = new Geodia.Map(this,this.controller,$('#mapcontainer'));
	this.timeline = new Geodia.Timeline(this,this.controller,$('#timeline'));
	this.admin = false;

	this.visibleTab = this.site; 
    var defaults = {
        sbopen: true,
        eventLimit: 6
    };
    this.opts = options = TimeMap.util.merge(options, defaults);

    this.init = function(tm) {
		this.resizePanels();
		this.resizePanels();
		controller.checkResize(tm);
		var admin_status = this.admin;
		$.getJSON(Geodia.controller.loader.SERVICE+'check_auth.json?callback=?',function(json){
			if('resp' in json && json.resp){
				controller.ui.admin = true;
			}
		});

        window.timer = null;
        window.onresize = function() {
            if (window.timer === null) {
                window.timer = window.setTimeout(function() {
                    window.timer = null;
                    // call twice to deal w/scrollbar
                    ui.resizePanels();
                    ui.resizePanels();
					controller.checkResize(controller.tm);
                }, 200);
            }
        }
	};
	this.getTerms = function(tab){
		var terms = [];
		tab.ele.find('ul.search_terms input').each(function(i,n){
			if($(n).val() != ''){
				terms.push($(n).val());
			}
		});
		return terms;
	};
    this.getCultures = function(ele){
        var cultures = [];
        ele.find('div.culture_list input:checked').each(function(i,n){
            cultures.push($(n).val());      
        });
        return cultures;
    };
    this.getRegions = function(ele){
        var regions = [];
        ele.find('div.region_list input:checked').each(function(i,n){
            regions.push($(n).val());       
        });
        return regions;
    };

	this.setTerms = function(tab,value){
		if(value.length != 0){
			var list = tab.ele.find('ul.search_terms').empty();
			var html = '';
			for(var i in value){
				html += '<li><a class="remove_search_term" href="">x</a><p>'+value[i]+'</p><input type="hidden" value="'+value[i]+'"/></li>';
			}
			$(html).appendTo(list);
		}
	};
    this.setCultures = function(ele,values){
        ele.find('div.culture_list input').each(function(i,n){
			if($.inArray($(n).attr('name'), values) !== -1){
				$(n).attr('checked','checked');
			} else{
				$(n).attr('checked', false);
			}
        });
    };
    this.setRegions = function(ele,values){
        ele.find('div.region_list input').each(function(i,n){
			if($.inArray($(n).attr('name'), values) !== -1){
				$(n).attr('checked','checked');
			} else{
				$(n).attr('checked', false);
			}
        });
    };

	this.loading = function(state){
		if(state){
			$('div#loading').show();
		} else{
			$('div#loading').hide();
		}
	};

	this.updateLink = function(url){
		ui.visibleTab.ele.find('.result_input').val(url);
	};


    this.resizePanels = function() {
        // get full screen size
        var dh = $(window).height();
        var dw = $(window).width();
        var sbw = this.sidebar.ele.width(); 
        var fh = $('#footer').height();
        var hh = $('#hborder').height();
        var sbh = dh - hh - fh - 1;

		this.sidebar.ele.height(sbh).css('left', dw - sbw);
		$('#timemap').height(sbh);
		this.map.ele.width(dw - sbw);

		var tab_nav_height = $(this.visibleTab.ele.find('ul.tab_nav').get(0)).height();
		var tab_nav_content = this.sidebar.ele.find('div.tab_nav_content').children('div').height(sbh - tab_nav_height - 20);

        // reset event limit based on timeline height
        this.opts.eventLimit = ($("#timeline").height() * .8 - 14) / 21;
    };
	this.getEventLimit = function(){
		return ui.opts.eventLimit;
	};

	$('ul.tab_nav li').click(function(){
		var link = $(this);
		if(!link.attr('href')){
			link = link.children('a');
		}
		link.parent().addClass('selected').siblings('li').removeClass('selected');
		ui.visibleTab.ele.find('div.tab_nav_content').children('div').removeClass('visible');
		ui.visibleTab.visibleSubTab = $(link.attr('href')).addClass('visible');
		return false;
	});

	this.centerItem = function(item){
		controller.tm.map.setCenter(item.getInfoPoint());
		return false;
	};

	this.scrollToItem = function(item){
		controller.tm.timeline.getBand(0).setCenterVisibleDate(item.getStartTime());
		controller.tm.map.setCenter(item.getInfoPoint());
		item.openInfoWindow();
		return false;
	};
	this.scrollTo = function(item,start_date){
		controller.tm.timeline.getBand(0).setCenterVisibleDate(start_date);
		controller.tm.map.setCenter(item.getInfoPoint());
		item.openInfoWindow();
		return false;
	}

	$('form.search_form input[type="submit"]').click(function(){
		var input = $(this).prev('input[type="text"]');
		var term = input.val();
		input.val('');
		if(term != ''){
			ui.visibleTab.removed = [];
			$('<li><a class="remove_search_term" href="">x</a><p>'+term+'</p><input type="hidden" value="'+term+'"/></li>').appendTo($(this).next('ul'));
			ui.sidebar.updateGeodia();
		}
		return false;
	});
	$('a.remove_search_term').live('click',function(){
		$(this).parent().remove();
		ui.visibleTab.removed = [];
		ui.sidebar.updateGeodia();
		return false;
	});

	$('.clear_results').click(function(e){
		ui.clearBrowse(ui.visibleTab.ele);
		ui.clearSearch(ui.visibleTab.ele);
		ui.visibleTab.removed = [];
		ui.sidebar.updateGeodia();
		e.preventDefault();
	});

	this.clearBrowse = function(ele){
		ele.find('form.browse_form input[type="checkbox"]').each(function(){
			$(this).attr('checked',false);
		});
	};
	this.clearSearch = function(ele){
		ele.find('ul.search_terms').empty();
	};

	this.generateSubtitle = function(item){
		var html = '';
		if(item.metadata['title']){
			html += '<h2>'+item.metadata['title'][0]+'</h2>';
		}
		if(item.metadata['image_date']){
			html += '<p><span>Date: </span>'+item.metadata['image_date'][0]+'</p>';
		}
		if(item.metadata['description']){
			html += '<p><span>Description: </span>'+item.metadata['description'][0]+'</p>';
		}
		html += '';
		return html;
	}

};
 
Geodia.SideBar = function(ui, controller, ele) {
	var sidebar = this;
    /** The associated interface */
    this.ui = ui;
    /** The associated controller */
    this.controller = controller;
	/** The associated DOM element */
	this.ele = ele;
	this.content = $('#sidebar_content');


	$('div.toggler').click(function(){
		var sb = $('div#sidebar_content').toggle();
		if(sb.is(':visible')){
			ui.opts.sbopen = true;
		} else{
			ui.opts.sbopen = false;
		}
		ui.resizePanels();
		ui.resizePanels();
		//if a site is clicked need to resize the site period images
		if(ui.visibleTab.item_type == 'site' && ui.opts.sbopen && ui.visibleTab.visibleSubTab.attr('id') === 'sites_details'){
			ui.visibleTab.ele.find('li.site_period ul').each(function(i,n){
				var width = 0;
				$(n).find('li').each(function(j,k){
					width += $(k).width() + 15;
				});
				$(n).width(width);
			});
		}
		//this must be called so that bounds are correct.
		controller.tm.map.checkResize();

	});

	$('.result_link').click(function(){
		$(this).toggleClass('active').next('input').toggle();
	});

	$('ul#tabs li').click(function(){
		var tab = $(this).attr('id').replace('_tab','');
		if(ui.visibleTab != ui[tab]){
			ui.sidebar.showTab(ui[tab]);
		}
		return false;
	}).hover(function(){
		$(this).find('img').attr('src',$(this).find('img').attr('src').replace('blue','white'));
	},function(){
		if(!$(this).hasClass('selected')){
			$(this).find('img').attr('src',$(this).find('img').attr('src').replace('white','blue'));
		}
	});

	this.showTab = function(tab){
		if(ui.visibleTab != tab){
			$('ul#tabs').children('li').removeClass('selected');
			tab.tag.addClass('selected');
			tab.tag.find('img').attr('src',tab.tag.find('img').attr('src').replace('blue','white'));
			tab.tag.siblings('li').each(function(i,n){
				$(n).find('img').attr('src',$(n).find('img').attr('src').replace('white','blue'));
			});
			//ele.children('div#sidebar_content').children('div').css('display','none');
			tab.ele.siblings('div').hide();
			tab.ele.show();
			ui.visibleTab = tab;
			if('tm' in controller){
				if(tab.item_type == 'site'){
					controller.tm.hideDatasets();
					controller.tm.showDataset('site');
				} else if(tab.item_type == 'event'){
					controller.tm.hideDatasets();
					controller.tm.showDataset('event');
				}
			}
		}

	}
	this.updateGeodia = function(){
		window.location.hash = controller.tm.getStateParamString();
	};


	this.showSubTab = function(tab,subtab_content){
		if(!tab.ele.is(':visible')){
			this.showTab(tab);
		}
		var subtab = tab.ele.find('a[href="#'+subtab_content.attr('id')+'"]').parent('li');
		subtab.siblings('li').removeClass('selected');
		subtab.addClass('selected');
		subtab_content.siblings('div').removeClass('visible');
		subtab_content.addClass('visible');
		tab.visibleSubTab = subtab_content;
	};



}	
Geodia.Map = function(ui, controller, ele) {
    /** The associated interface */
    this.ui = ui;
    /** The associated controller */
    this.controller = controller;
	/** The associated DOM element */
	this.ele = ele;

}	

Geodia.Timeline = function(ui, controller, ele) {
    /** The associated interface */
    this.ui = ui;
    /** The associated controller */
    this.controller = controller;
	/** The associated DOM element */
	this.ele = ele;
}	

Geodia.SitesTab = function(ui, controller, ele) {
	var tab = this;
	this.item_type = 'site';
    /** The associated interface */
    this.ui = ui;
    /** The associated controller */
    this.controller = controller;
	/** The associated DOM element */
	this.ele = ele;
	this.removed = [];
	this.browse = ele.find('div.content_browse');

	this.results = ele.find('div.content_results ul');
	this.result_tpl = '<li class="results_item"><input type="checkbox" name="hide_override"/><input type="checkbox" name="show_override" /><p class="remove_result_item ui-icon ui-icon-close"></p><p class="center_item ui-icon ui-icon-pin-s"></p><a href="" class="detail_item">${getTitle()}</a><div class="spacer"></div></li>';

	this.details = ele.find('div.content_details');
	this.details_tpl = '<h1>${getTitle()}</h1><ul class="site_periods">{{each period_array}}<li class="site_period" id="${serial}"><h3><b>${term}</b> ${start} - ${end}</h3><div class="image_portal"><ul>{{each images.items}}<li class="period_image ${serial_number}"><a rel="${metadata_extended.site_period.values[0].url}" href="${app_root}{{if media.large}}${media.large}{{else media.jpeg}}${media.jpeg}{{else}}${media.small}{{/if}}" title="${metadata.title}"><img src="${app_root}${media.thumbnail}"/></a></li>{{/each}}</ul></div></li>{{/each}}</ul>';

	this.tag = $('#'+this.item_type+'_tab');
	this.uid = '';
	this.visibleSubTab = $('#sites_browse');
	this.site_period = '';

	this.generateDetails = function(item){
		var details = this.details;
		var template = this.details_tpl;
		details.empty();
		ui.loading(true);
		item.getPeriodImages(function(){
			ui.loading(false);
			var images = $.tmpl(template,item).appendTo(details).ImagesLoad({loadingCompleteCallback: function(ele){
				$(ele).find('li.site_period ul').each(function(i,n){
					$(n).find('a').each(function(o,l){
						$(l).fancybox({
							titleFormat: function(e){
								var periodIndex = $(n).parents('li.site_period').index();
								var imageIndex = $(l).parent().index();
								return ui.generateSubtitle(item.period_array[periodIndex].images.items[imageIndex]);
							},
							titlePosition:'inside',
							onError: function(){
								$.fancybox('<p>You must login to <a href="'+controller.loader.DASE+'modules/uteid/login?target='+escape(window.location)+'">Dase</a> in order to view larger images.</p>', {
									'scrolling'     : 'no',
									'padding'       : 20,
									'transitionIn'  : 'none',
									'transitionOut' : 'none'
								});
							}
						});
					});

					var width = 0;
					$(n).find('li').each(function(j,k){
						width += $(k).width() + 15;
					});
					$(n).width(width);

				}).end()
				.find('li.site_period h3').click(function(){
					//scrolls to timeline 
					/*
					ui.site.site_period = item.period_array[$(this).parent('li').index()].serial;
					item.currPeriod = item.period_array[$(this).parent('li').index()];
					ui.scrollTo(item,item.period_array[$(this).parent('li').index()].getStart());
					*/
				});
				if(ui.site.site_period != ''){
					var height = 32;
					$(ele).find('li.site_period').each(function(i,n){
						if($(this).attr('id') === ui.site.site_period){
							if(ui.image.image_serial && ui.image.image_serial != ''){
								var width = 0;
								$(n).find('ul li').each(function(o,l){
									if($(l).hasClass(ui.image.image_serial)){
										return false;
									}
									width += $(l).width() + 15;
								});
								$(n).children('div.image_portal').animate({scrollLeft:width},'slow');
								ui.image.image_serial = '';
							}
							$(n).addClass('selected');
							return false;
						}
						height += $(n).height() + 11;
					});
					$('div.tab_nav_content > div:visible').animate({scrollTop:height},'slow');
					ui.site.site_period = '';
				}
				
			}});
		});
	};

	this.updateCount = function(num){
		if(num != 0){
			tab.tag.children('span.count').text(num);
		} else{
			tab.tag.children('span.count').empty();
		}
	};

	this.load = function(uid,dataset){
		this.details.empty();
		var results = this.results.empty();
		var param_string = controller.loader.createParamString(controller.tm.getState());
		this.ele.find('.result_kml').attr('href',controller.loader.SERVICE+'search.kml?'+param_string);
		var visible_items = 0;
		var template = this.result_tpl;
		var removed = this.removed;

		dataset.each(function(item){
			if($.inArray(item.opts.serial_number,removed) === -1){

				visible_items += 1;
				//add item to result list, add event handlers, add the domobject to item
				item.html = $.tmpl(template,item).appendTo(results)
					.find('.remove_result_item').click(function(e){
						removed.push(item.opts.serial_number);
						ui.sidebar.updateGeodia();
						e.preventDefault();
					}).end()
					.find('.center_item').click(function(){
						if(!item.placemarkVisible){
							controller.tm.timeline.getBand(0).setCenterVisibleDate(item.getStartTime());
						}
						ui.centerItem(item);
					}).end()
					.find('.detail_item').click(function(){
						ui.scrollToItem(item);
						return false;
					}).end()
					.find('input[name="hide_override"]').change(function(){
						if($(this).attr('checked')){
							item.visible_override = false
							$(this).next().attr('checked',false);
						} else{
							delete item.visible_override;
						}
						GEvent.trigger(controller.tm.map,'moveend');
					}).end()
					.find('input[name="show_override"]').change(function(){
						if($(this).attr('checked')){
							item.visible_override = true
							$(this).prev().attr('checked',false);
						} else{
							delete item.visible_override;
						}
						GEvent.trigger(controller.tm.map,'moveend');
					}).end();

				item.toggleState = function(){
					$(this.html).toggleClass('hidden',!this.state);
				};

			} else{
				item.hide();
			}

			if(ui.site.site_period != ''){
				ui.scrollToItem(item);
			}
		});
		if(visible_items){
			$('.list_header').show();	
		} else{
			$('.list_header').hide();
		}
		tab.updateCount(visible_items);
		this.uid = uid;
	};

	ele.find('form.browse_form input[type="checkbox"]').change(function(){
		ui.site.removed = [];
		ui.sidebar.updateGeodia();
	});

}	
function in_removed_array(serial){
	if($.inArray(serial,Geodia.controller.ui.image.removed) !== -1){
		return true;	
	} else{
		return false;	
	}
};

Geodia.ImagesTab = function(ui, controller, ele) {
	var tab = this;
	this.item_type = 'image';
    /** The associated interface */
    this.ui = ui;
    /** The associated controller */
    this.controller = controller;
	/** The associated DOM element */
	this.ele = ele;
	this.results = ele.find('div.content_results ul.image_results');
	this.results_tpl = '<li class="image_results_item{{if in_removed_array(serial_number)}} hidden{{/if}}"><a href="" class="remove_result_item ui-icon ui-icon-closethick"></a><h1>${metadata.site_name}</h1><h2>${metadata.title}</h2><a title="${metadata.title}" href="${app_root}${media.large}" class="image_result_fancybox"><img src="${app_root}${media.thumbnail}"/></a></li>';
	this.tag = $('#'+this.item_type+'_tab');
	this.visibleSubTab = $('#image_results');
	this.image_serial = '';
	this.removed = [];

	this.uid = null;

	this.clear = function(){
		this.results.empty();
	};

	this.updateCount = function(num){
		if(num != 0){
			tab.tag.children('span.count').text(num);
		} else{
			tab.tag.children('span.count').empty();
		}
	};

	this.load = function(uid,data){
		this.clear();
		var removed = this.removed;

		$.tmpl(this.results_tpl,data)
			.appendTo(this.results)
			.find('a.remove_result_item').each(function(i,n){
				var item = $.tmplItem($(n).parent());
				$(n).click(function(e){
					removed.push(item.data.serial_number);
					ui.sidebar.updateGeodia();
					e.preventDefault();
				});
			}).end()
			.find('a.image_result_fancybox').each(function(i,n){
				var item = $.tmplItem($(n).parent());
				$(n).fancybox({
					titleFormat: function(e){
						return ui.generateSubtitle(item.data);
					},
					titlePosition:'inside',
					onError: function(){
						$.fancybox('<p>You must login to <a href="'+controller.loader.DASE+'modules/uteid/login?target='+escape(window.location)+'">Dase</a> in order to view larger images.</p>', {
							'scrolling'     : 'no',
							'padding'       : 20,
							'transitionIn'  : 'none',
							'transitionOut' : 'none'
						});
					}
				});

			}).end()
			.find('h1').click(function(){
				ui.site.site_period = UrlToSernum(data[$(this).parent().index()].metadata_extended.site_period.values[0].url);
				ui.image.image_serial = data[$(this).parent().index()].serial_number;
				ui.clearBrowse(ui.site.ele);
				ui.clearSearch(ui.site.ele);
				ui.sidebar.showTab(ui.site);
				ui.sidebar.updateGeodia();
			});
		this.updateCount($(this.results).children(':not(.hidden)').length);
		
	};
}	


Geodia.EventsTab = function(ui, controller, ele) {
	var tab = this;
	this.item_type = 'event';
    /** The associated interface */
    this.ui = ui;
    /** The associated controller */
    this.controller = controller;
	/** The associated DOM element */
	this.ele = ele;
	this.removed = [];
	this.results = ele.find('div.content_results ul');
	this.details = ele.find('div.content_details');

	this.detail_tpl = '<h1>${getTitle()}</h1><p class="event_detail_info"><span>Date: </span>${opts.date}</p><p class="event_detail_info"><span>Region: </span> ${opts.region}</p><p class="event_detail_info"><span>Cultures: </span>${opts.cultures[0]}{{if opts.cultures[1]}}, ${opts.cultures[1]} {{/if}}</p><p class="event_description">${opts.description}</p>';

	this.result_tpl = '<li class="event_results_item"><div class="event_controls"><a href="" class="toggleEvent">Show/Hide</a><a href="" class="remove_result_item ui-icon ui-icon-closethick"></a></div><div class="spacer"></div><a href="" class="event_link">${getTitle()}</a><p class="event_detail_info"><span>Date: </span>${opts.date}</p><p class="event_detail_info"><span>Region: </span> ${opts.region}</p><p class="event_detail_info"><span>Cultures: </span>${opts.cultures[0]}{{if opts.cultures[1]}}, ${opts.cultures[1]} {{/if}}</p></li>';

	this.tag = $('#'+this.item_type+'_tab');
	this.visibleSubTab = $('#event_browse');

	this.uid = '';

	this.clear = function(){
		this.results.empty();
		this.details.empty();
	};

	this.updateCount = function(num){
		if(num != 0){
			tab.tag.children('span.count').text(num);
		} else{
			tab.tag.children('span.count').empty();
		}
	};

	this.generateDetails = function(item){
		this.details.empty();
		$.tmpl(this.detail_tpl,item).appendTo(this.details);
	};


	this.load = function(uid,dataset){
		var visible_items = 0;
		this.clear();
		var results = this.results;
		var param_string = controller.loader.createParamString(controller.tm.getState());
		this.ele.find('.result_kml').attr('href',controller.loader.SERVICE+'search.kml?'+param_string);
		var template = this.result_tpl;
		var removed = this.removed;

		dataset.each(function(item){
			if($.inArray(item.opts.serial_number,removed) === -1){
				visible_items += 1;
				//add item to result list, add event handlers, add the domobject to item
				item.html = $.tmpl(template,item).appendTo(results)
					.find('a.event_link').click(function(e){
						item.openInfoWindow();
						e.preventDefault();
					}).end()
					.find('a.toggleEvent').click(function(e){
						if($(this).toggleClass('hidden').hasClass('hidden')){
							item.visible_override = false
						} else{
							delete item.visible_override;
						}
						GEvent.trigger(controller.tm.map,'moveend');
						e.preventDefault();
					}).end()
					.find('a.remove_result_item').click(function(e){
						removed.push(item.opts.serial_number);
						ui.sidebar.updateGeodia();
						e.preventDefault();	
					}).end();

				item.toggleState = function(){
					$(this.html).toggleClass('hidden',!this.state);
				}

			} else{
				item.hide();
			}
		});
		this.updateCount(visible_items);
		this.uid = uid;
	};

	ele.find('form.browse_form input[type="checkbox"]').change(function(){
		ui.event.removed = [];
		ui.sidebar.updateGeodia();
	});

}	

//turns url to serial number
function UrlToSernum(url){
	return url.substring(url.lastIndexOf('/') + 1,url.lastIndexOf('.'));
}
