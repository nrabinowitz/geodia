/*----------------------------------------------------------------------------
 * Interface Functionality
 *---------------------------------------------------------------------------*/

/**
 * @namespace   Namespace to hold functions dealing with the interface
 */
Geodia.Interface = { 
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
 * Initialize the interface
 */
Geodia.Interface.init = function() {
    // set up panels
    Geodia.Interface.resizePanels();
    
    // set up resize function
    // XXX: with more than one Geodia object, we'd need a chain here
    window.timer = null;
    window.onresize = function() {
        if (window.timer === null) {
            window.timer = window.setTimeout(function() {
                window.timer = null;
                // call twice to deal w/scrollbar
                Geodia.Interface.resizePanels();
                Geodia.Interface.resizePanels();
                Geodia.controller.tm.timeline.layout();
            }, 200);
        }
    }
};
  
/**
 * Resize the panels to fit the full window
 */
Geodia.Interface.resizePanels = function() {
    // get full screen size
    var dh = $(window).height();
    var dw = $(window).width();
    var sbw = Geodia.Interface.sbopen ? 350 : 20;
    var adw = Geodia.Interface.adminopen ? 350 : 20;
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
    if (Geodia.Interface.sbside == 'l') {
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

    if (Geodia.controller.tm && Geodia.controller.tm.map) {
        Geodia.controller.tm.map.checkResize();
    }
};

/**
 * Add a site to the site list.
 *
 * @param {TimeMapItem} item    Item to add
 */
Geodia.Interface.addToSiteList = function(item) {
    var site_list = $('ul.site_list');
    var site = $('<li>' + item.getTitle() + '</li>').appendTo(site_list);
    $(site).data('site', item);
    $(site).data('name', item.getTitle());
    $(site).data('dataset', item.dataset);
};

/**
 * Clear site list
 */
Geodia.Interface.clearSiteList = function() {
    $('ul.site_list').empty();
};

/**
 * Show or hide loading animation
 *
 * @param {Boolean} loading     Whether loading is on or off     
 */
Geodia.Interface.toggleLoading = function(loading) {
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

/*----------------------------------------------------------------------------
 * Admin Panel
 *---------------------------------------------------------------------------*/

$(document).ready(function(){

	$('#clear_all').click(function(){
		Geodia.controller.clear();
		$('ul.site_list').empty();
		$('#site_title').empty();
		$('#site_description').empty();
		$('ul.site_periods').empty();
		return false;
	});

	$('#show').click(function(){
//		console.log(Geodia.controller.tm.datasets);
		return false;
	});

	$('input[type="checkbox"]').attr('checked',false);
	$('input[type="text"]').val('');
	$('input[type="checkbox"]').click(function() {
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
        Geodia.controller.loadFacets(cultures, regions);
    });

	$('#search_button').click(function(){
        var term = $(this).prev('input').val();
        Geodia.controller.loadSearch(term);
	});

	//toggle sidebars
	$('div.toggler').click(function(){
			var id = $(this).parent('div').attr('id');
			if (id == 'sidebar'){
				if ($(this).parent('div').width() > 20){
					Geodia.Interface.sbopen = false;
				}
				else{
					Geodia.Interface.sbopen = true;
				}
			}
			if (id == 'admin_bar'){
				if ($(this).parent('div').width() > 20){
					Geodia.Interface.adminopen = false;
				}
				else{
					Geodia.Interface.adminopen = true;
				}
			}
			$(this).siblings().toggle();
			Geodia.Interface.resizePanels();
	});

	
	function exists(ar,o) {
		for(var i = 0; i < ar.length; i++)
			   if (ar[i] === o)
				        return true;
		return false;
	}
	function UrlToSerial(url){
		return url.substring(url.lastIndexOf('/')+1,url.length).replace('.atom','');
	}
	$('ul.site_list li').live('click',function(){
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
//		console.log(item);
//		item.clear();
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
        	    //var d = Geodia.controller.tm.eventSource.getEarliestDate();
    	        //Geodia.controller.tm.timeline.getBand(0).setCenterVisibleDate(d);
	            Geodia.controller.tm.timeline.layout();
	});

});

/*----------------------------------------------------------------------------
 * Sidebar Panel
 *---------------------------------------------------------------------------*/

/**
 * Initialize images for a selected site
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