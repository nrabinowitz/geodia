var DASE_COLLECTION = 'http://www.laits.utexas.edu/geodia/modules/geodia';
var JSONP = '';
	function iniImageViewer(current,periods,site_name,description){
		if(site_name != $('#site_title').text()){
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
				if(formatName(current.term)+'_'+formatName(current.culture) == formatName(period.term)+'_'+formatName(period.culture)){
					li += '<li class="selected '+formatName(period.term)+'_'+formatName(period.culture)+'"><p><span>'+period.term+'</span> '+period.start+' - '+period.end+'</p>';
				}
				else{
					li += '<li class="'+formatName(period.term)+'_'+formatName(period.culture)+'"><p><span>'+period.term+'</span> '+period.start+' - '+period.end+'</p>';
				}
				if(images){
					for(var i in images){
						if(images[i]['large'] != null){
							li += '<a href="'+images[i]['large']+'"><img src="'+images[i]['thumb']+'"/>';
						}
						else if(images[i]['medium'] != null){
							li += '<a href="'+images[i]['medium']+'"><img src="'+images[i]['thumb']+'"/>';
						}
						else{
							li += '<a href="'+images[i]['small']+'"><img src="'+images[i]['thumb']+'"/>';
						}
						li += '<div style="display:none" class="image_info">';
						if(images[i].metadata['title']){
							li += '<p class="image_title"><span>Description: </span>'+images[i].metadata['title']+'</p>';
						}
						if(images[i].metadata['image_date']){
							li += '<p class="image_date"><span>Date: </span>'+images[i].metadata['image_date']+'</p>';
						}
						if(images[i].metadata['source']){
							li += '<p class="image_source"><span>Source: </span>'+images[i].metadata['source']+'</p>';
						}
						if(images[i].metadata['created_in']){
							li += '<p class="image_created"><span>Created In: </span>'+images[i].metadata['created_in']+'</p>';
						}
						if(images[i].metadata['found_in']){
							li += '<p class="image_found"><span>Found In: </span>'+images[i].metadata['found_in']+'</p>';
						}
						li += '</div></a>';
					}
				}
				li += '</li>';
				var appended = $(li).appendTo(sb_ul);
				$(appended).children('a').lightBox();

				if($(appended).hasClass('selected')){
					$('ul.site_periods').animate({scrollTop:li_sum_heights},'slow');
				}
				li_sum_heights += $(appended).height() + 20; 
			}
		}
		else{
			var li_sum_heights = 0;
			$('ul.site_periods li').each(function(i,n){
				if($(n).hasClass(formatName(current.term)+'_'+formatName(current.culture))){
					$('ul.site_periods').animate({scrollTop:li_sum_heights},'slow');
					$(n).addClass('selected');
				}
				else{
					$(n).removeClass('selected');
				}
				 li_sum_heights += $(n).height() + 20; 
			});
			
		}
	}

$(document).ready(function(){

	$('#clear_all').click(function(){
		Geodia.tm.clear();
		$('ul.site_list').empty();
		$('#site_title').empty();
		$('#site_description').empty();
		$('ul.site_periods').empty();
		return false;
	});

	$('#show').click(function(){
//		console.log(Geodia.tm.datasets);
		return false;
	});

	$('input[type="checkbox"]').attr('checked',false);
	$('input[type="text"]').val('');
	$('input[type="checkbox"]').click(function(){
		var val = $(this).val().toLowerCase();
		var type = $(this).parent('div').attr('id');
		var url = DASE_COLLECTION+'/search.json?c=geodia&q=item_type:site_period';
		var cultures = $('#culture_list').children('input[type="checkbox"]:checked');
		var regions = $('#region_list').children('input[type="checkbox"]:checked');
		var total = $(cultures).size() + $(regions).size();
		cancelJSONP();

		if(total > 0){ 
			var loader = $('<img id="ajax_loader" src="images/ajax-loader.gif"/>').insertAfter($('div.site_admin h1'));
			if($(cultures).size() > 0){
				url += ' AND parent_period:(';
				$(cultures).each(function(i,n){
					url += 	$(n).val().replace('/','* OR ')+'* OR ';			
				});
				url = url.substring(0,url.length - 4)+')';
			}
			if($(regions).size() > 0){
				url += ' AND site_region:(';
				$(regions).each(function(i,n){
					url += $(n).val()+' OR ';
				});
				url = url.substring(0,url.length - 4)+')';
			}
			url += '&max=999&auth=http&callback=?';
			Geodia.tm.clear();
			$('ul.site_list').empty();
			$.getJSON(url,function(json){
				var site_array = [];
				$('#admin_bar').find('p').remove();
				$.each(json,function(i,n){
					if(n.itemtype.term == 'site'){
						if(!exists(site_array,UrlToSerial(n.editlink))){
							site_array.push(UrlToSerial(n.editlink));
						}
					}
					else if(n.metadata.site_region){
						if(!exists(site_array,UrlToSerial(n.metadata.site_region[0].url))){
							site_array.push(UrlToSerial(n.metadata.site_region[0].url));
						}
					}
				});
				if(site_array.length > 0){
					loadDataSet(Geodia.tm,site_array,val,loader);
				}
				else{
					$('<p>No Results Found</p>').appendTo($('ul.site_list'));
					$(loader).remove();
				}
			});
		}
		else{
		Geodia.tm.clear();
		$('ul.site_list').empty();
	}
});

function cancelJSONP(){
	for(var i in TimeMap.loaders.jsonp){
		if(i.substr(0,1) == '_'){
			TimeMap.loaders.jsonp[i] = function(){
				delete TimeMap.loaders.jsonp[i];
			};
		}
	}
	for (var i in window){
		if(i.substr(0,5) == 'jsonp'){
			window[i] = function(){
				window[ i ] = undefined;
				try{ delete window[ i ]; } catch(e){}
			};
		}
	}
	$('#ajax_loader').remove();
}

	$('#search_button').click(function(){
		var val = $(this).prev('input').val().toLowerCase();
		var loader = $('<img src="images/ajax-loader.gif"/>').insertAfter($('div.site_admin h1'));
		var url = DASE_COLLECTION+'/search.json?c=geodia&q='+val+'* NOT item_type:image&max=999&callback=?'
		var x = $.getJSON(url,function(json){
			var site_array = [];
			$('#admincontent').find('p').remove();
			$.each(json,function(i,n){
				if(n.metadata.site_region ){
					if(n.metadata.parent_period[1].text.toLowerCase().search(val) != -1 || n.metadata.site_region[0].text.toLowerCase().search(val) != -1){
						if(!exists(site_array,UrlToSerial(n.metadata.site_region[0].url))){
							site_array.push(UrlToSerial(n.metadata.site_region[0].url));
						}
					}
				}
				else if(n.metadata.site_name){
					if(!exists(site_array,UrlToSerial(n.editlink)) ){
						site_array.push(UrlToSerial(n.editlink));
					}
				}
			});
				if(site_array.length > 0){
					loadDataSet(Geodia.tm,site_array,val,loader);
				}
				else{
					$('<p>No Results Found</p>').appendTo($('ul.site_list'));
				}
		});
	});
	function loadDataSet(tm,site_array,name,gif){
		var ds = tm.createDataset(name,{
			title: name,
			classicTape:true
		});
		ds.eventSource = tm.eventSource;
		var loader = new TimeMap.loaders.jsonp({url:DASE_COLLECTION+'/dataset?site_sernums='+escape(site_array.toString())+'&auth=http&callback='});
		loader.load(ds,function(){
			Geodia.loadPeriods(ds);
			Geodia.tm.each(function(dset) {
				if(dset){
					dset.each(function(item) {
						if(item.event){
					        item.event._trackNum = null;
						}
				    });
				}
			});
				$(gif).remove();
        	    var d = tm.eventSource.getEarliestDate();
    	        tm.timeline.getBand(0).setCenterVisibleDate(d);
	            tm.timeline.layout();
		});

	}

	//toggle sidebars
	$('div.toggler').click(function(){
			var id = $(this).parent('div').attr('id');
			if(id == 'sidebar'){
				if($(this).parent('div').width() > 20){
					Geodia.sbopen = false;
				}
				else{
					Geodia.sbopen = true;
				}
			}
			if(id == 'admin_bar'){
				if($(this).parent('div').width() > 20){
					Geodia.adminopen = false;
				}
				else{
					Geodia.adminopen = true;
				}
			}
			$(this).siblings().toggle();
			Geodia.resizePanels();
	});

	
	function exists(ar,o) {
		for(var i = 0; i < ar.length; i++)
			   if(ar[i] === o)
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
		if(name == $('#site_title').text()){
			$('#site_title').empty();
			$('#site_description').empty();
			$('ul.site_periods').empty();
		}
		item.hide();
		item.hidePlacemark();
//		console.log(item);
//		item.clear();
		if(dataset.items.length == 1){
			dataset.clear();
			if(name == $('#site_title').text()){
				$('#site_title').empty();
				$('#site_description').empty();
				$('ul.site_periods').empty();
			}
			delete dataset;
		}
		$(this).remove();
		delete item;
					dataset.each(function(i) {
						if(i.event){
					        i.event._trackNum = null;
						}
				    });
        	    //var d = Geodia.tm.eventSource.getEarliestDate();
    	        //Geodia.tm.timeline.getBand(0).setCenterVisibleDate(d);
	            Geodia.tm.timeline.layout();
	});

});


	function formatName(name){
		name = name.replace(/ /g,'_').toLowerCase().replace(/\//g,'_');
		return name;
	}

