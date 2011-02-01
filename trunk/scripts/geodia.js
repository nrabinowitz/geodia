/*----------------------------------------------------------------------------
 * Core class definitions
 *---------------------------------------------------------------------------*/

/**
 * @namespace   Namespace for all Geodia-specific functionality
 */
Geodia = {};

/**
 * @class   
 * Singleton Controller class containing data and functions specific to the Geodia site.
 * XXX: This may need to be tweaked down the road to deal with multiple instantiations
 */
Geodia.controller = new function() {
    var controller = this;
    
    /**
     * Initialize the controller, including the timemap and interface
     */
    this.init = function(options) {
        options = options || {};
        
        /** The associated interface **/
        var ui = this.ui = new Geodia.Interface(this, options);
        
        // initialize loader
        
        /** The associated loader **/
        this.loader = new TimeMap.loaders.dase();
        
        // initialize timemap
        
        // set up the dataset options
        var ds = [{
            id: "site",
            title: "Sites",
			type: 'basic',
            options: {
                theme: 'red',
                classicTape: true,
                eventIconPath: "images/",
				items: []
            }
        },{
            id: "event",
            title: "Events",
			type: 'basic',
            options: {
                theme: 'blue',
                classicTape: true,
                eventIconPath: "images/",
				items: []
            }
		}];
        
        // set up the config object
        var config = {
            mapId: "map",
            timelineId: "timeline",
            options: {
				pleiades_uri: '',
				mapZoom: 4,
				mapCenter: new GLatLng(36.8, 17.18),
                openInfoWindow: TimeMapItem.openPeriodWindow,
				centerOnItems: false,
                mapType: "satellite"
            },
            scrollTo: options.scrollTo,
            datasets: ds,
            bands: Geodia.bands,
            dataLoadedFunction: function(tm) {
				controller.initData(tm);
            	ui.init(tm);
				controller.initFilters(tm);

				tm.setStateFromUrl();
				var params = tm.getState();

				window.onhashchange = function() {
					tm.setStateFromUrl();
					controller.loadSearch(); 
				};

				if(params.pleiades_uri != ''){
					ui.clearBrowse(ui.visibleTab.ele);
					ui.clearSearch(ui.visibleTab.ele);
					ui.visibleTab.removed = [];
					controller.tm = tm;
					ui.sidebar.updateGeodia();

				} else if(params.cultures.length > 0 || params.regions.length > 0 || params.terms.length > 0 || params.site_period != ''){
					controller.tm = tm;
					controller.loadSearch(); 
				}
            }
        };

		//had to remove selected state
		delete TimeMap.state.params.selected;
		TimeMap.state.setConfigFromUrl(config);
        /** The associated TimeMap object */
        this.tm = TimeMap.init(config);
    };

    /**
     * Callback after loading
     */
    this.postload = function() {
        // wrap in a try to ignore cancelled calls
        try {
           	controller.resetTimeMap();
        } catch(e) {};
		controller.ui.loading(false);
    };

	this.currentUID = '';

	this.loadJson = function(json){
		this.currentUID = json[0];
		var params = this.tm.getState();
		var tab = controller.ui[params.item_type];
		if(tab.item_type != 'image'){
			this.tm.datasets[params.item_type].clear();
			this.loader.data = json[1];
			this.loader.load(this.tm.datasets[params.item_type],this.postload);
		}else{
			tab.load(json[0],json[1]);
			controller.ui.loading(false);
		}
	};
	this.loadSidebar = function(tm){
		if(this.currentUID != ''){
			var tab = controller.ui.visibleTab;
			tab.load(this.currentUID,tm.datasets[tab.item_type]);
		}
	}
	this.loadSearch = function(){
        // clear any other async loads
        TimeMap.loaders.cancelAll();
		controller.ui.updateLink(window.location.href);
		controller.ui.loading(true);
		this.loader.search(this);
	};

    this.initData = function(tm) {
        tm.eachItem(function(item) {
			if(!item.event.isInstant()){
	            item.loadPeriods();
			}
			else{
				item.addEventTheme();		
			}
        });
		this.loadSidebar(tm);
		//checkresize to make sure gmap has the right dimesions for its bounds
		this.checkResize(tm);
    };

    
    /**
     * Initialize timemap filters once loaded
     *
     * @param {TimeMap} tm      TimeMap to initialize
     */
    this.initFilters = function(tm) {
        // add culture filter chain
        tm.addFilterChain("culture",
		// true condition: change marker icon
		function(item) {
			if(!item.event.isInstant()){
				var p = item.getPeriod();
				if (p) {
					item.setPlacemarkTheme(p.theme);
				}
			}
		},
		// false condition: do nothing
		function(item) { }
		);
        // filter: change icon if visible
        tm.addFilter("culture", function(item) {
			return item.placemarkVisible;
        });
        // add listener for filter chain
        tm.timeline.getBand(0).addOnScrollListener(function() {
            tm.filter("culture");
        });
        
        tm.addFilter("timeline", function(item) {
			item.state = ("rank" in item) && item.rank !== -1;
			if('toggleState' in item){
				item.toggleState();
			}
			return item.state;
        })

        // filter map placemarks so that hidden events are hidden
        tm.addFilter("map", function(item) {
            return item.eventVisible;
        });
        
        // add listener to filter timeline
	    GEvent.addListener(tm.map, 'moveend', function() {
            controller.rankItems(tm);
            // filter timeline events
		    tm.filter("timeline");
	    });
    };


    this.resetTimeMap = function() { 
        var tm = this.tm;
        // initialize data, adding periods
        this.initData(tm); 
		// scroll appropriately
		if(tm.getState().date.getFullYear() >= 1900){
			var d = tm.eventSource.getEarliestDate();
			tm.timeline.getBand(0).setCenterVisibleDate(d);
		}
		tm.timeline.layout();
    };

    this.checkResize = function(tm) {
		var point = tm.map.getCenter();
		tm.map.checkResize();
		tm.map.setCenter(point);	
		tm.timeline.layout();
    };


    this.getEventLimit = function() {
        return this.ui.getEventLimit();
    }
	
    /**
     * Sort items by rank
     *
     * @param {TimeMap} tm      TimeMap to sort items for
     */
    this.rankItems = function(tm) {
        var bounds = tm.map.getBounds();
        var limit = controller.getEventLimit();
        var cultures = [];
        for(c in Geodia.controller.ui.getCultures(Geodia.controller.ui.visibleTab.ele)){
            cultures.push(c.split('/'));
        }
		var items = [];
		var x = 1;

        tm.eachItem(function(item){
            item.event._trackNum = null;
			item.rank = 0;
			if(!bounds.containsLatLng(item.getInfoPoint())){
				item.rank += 9;
			}
			if('zoom_level' in item.opts){
				item.rank += parseInt(item.opts.zoom_level);
			} else{
				item.rank += 4
			}
			if('cultural_importance' in item.opts){
				var cp_found = false;
				//note: if a site has two culturally important assignments the cultures array then only the first one will go toward the ranking
				for(var i in item.opts.cultural_importance){
					if($.inArray(item.opts.cultural_importance[i].culture, cultures) !== -1 && !cp_found){
						item.rank += parseInt(item.opts.cultural_importance[i].factor);
						cp_found = true;
					}
				}
				if(!cp_found){
					item.rank += 4;
				}
			} else{
				item.rank += 4;
			}

			if('visible_override' in item){
				if(item.visible_override){
					item.rank = 0;
				} else{
					item.rank = Infinity;
				}
			}	

			items.push(item);
		});

        items.sort(function(a, b) {
            return a.rank - b.rank;
        });
        for (var i in items) {
			if(items[i].event.isInstant()){
				if('visible_override' in items[i] && items[i].visible_override === false){
					items[i].rank = -1;
				} 
			} else if(i > limit || items[i].rank === Infinity){
				items[i].rank = -1;
			}
        }
	};

};

TimeMapItem.openPeriodWindow = function() {
	var p;
	var site_name = this.opts.title;
    // user clicked on specific period in event
    if (this.currPeriod) {
        p = this.getPeriod(this.currPeriod.getStart());
        // clear it out so that map clicks get current center
        this.currPeriod = null;
    } else {
        p = this.getPeriod();
    }
	//check if its a site or event
	if(!p){
		//its an event
    	var html = '<p>' + site_name + '</p>';
		if(Geodia.controller.ui.admin){
			html += '<a class="admin_link" target="_blank" href="'+Geodia.controller.loader.EVENT_ADMIN+this.opts.serial_number+'">Edit</a>';
		}
		html += '<div class="infodescription"><p><span>Culture: </span>'+this.opts.culture+'</p>';
		html += '<p><span>Date: </span>'+this.opts.date+'</p></div>';


		Geodia.controller.tm.timeline.getBand(0).setCenterVisibleDate(this.getStartTime());
		Geodia.controller.tm.map.setCenter(this.getInfoPoint());
		Geodia.controller.tm.map.setZoom(5);

	    // open window
    	if (this.getType() == "marker") {
        	this.placemark.openInfoWindowHtml(html);
	    } else {
    	    this.map.openInfoWindowHtml(this.getInfoPoint(), html);
	    }

	    // custom functions will need to set this as well
	    this.selected = false;
		Geodia.controller.ui.sidebar.showSubTab(Geodia.controller.ui.event,Geodia.controller.ui.event.details);
		Geodia.controller.ui.event.generateDetails(this);
	}
	else{
		//its a site
    	var html = '<div class="infotitle">' + site_name + '</div>';
		if(Geodia.controller.ui.admin){
			html += '<a class="admin_link" target="_blank" href="'+Geodia.controller.loader.SITE_ADMIN+'site/'+this.opts.serial_number+'">Edit</a>';
		}
		if(this.opts.pleiades_uri){
	    	html += '<div class="infodescription"><span>Period:</span> '+p.term+' <br/><span>Start: </span>'+p.start+'<br/><span>End: </span> '+p.end+'<br/><span>Culture:</span> '+p.culture+'<br/><a href="'+this.opts.pleiades_uri+'">Pleiades Link</a></div>';
		} else{
	    	html += '<div class="infodescription"><span>Period:</span> '+p.term+' <br/><span>Start: </span>'+p.start+'<br/><span>End: </span> '+p.end+'<br/><span>Culture:</span> '+p.culture+'</div>';

		}
	    // scroll timeline if necessary

    	var topband = this.dataset.timemap.timeline.getBand(0);
	    if (p.getStart().getTime() > topband.getMaxVisibleDate().getTime() || 
    	    p.getEnd().getTime() < topband.getMinVisibleDate().getTime()) {
        	topband.setCenterVisibleDate(p.getStart());
	    }

	    // open window
    	if (this.getType() == "marker") {
        	this.placemark.openInfoWindowHtml(html);
	    } else {
    	    this.map.openInfoWindowHtml(this.getInfoPoint(), html);
	    }
	    // custom functions will need to set this as well
	    this.selected = false;
		
		if(!Geodia.controller.ui.site.site_period){
			Geodia.controller.ui.site.site_period = p.serial;
		}
		Geodia.controller.ui.sidebar.showSubTab(Geodia.controller.ui.site,Geodia.controller.ui.site.details);
		Geodia.controller.ui.site.generateDetails(this);
	}
}

TimeMapItem.prototype.getPeriodImages = function(callback) {
	var period_sernums = [];
	var item = this;
	for(var i in this.period_array){
		if(!('images' in this.period_array[i])){
			period_sernums.push(this.period_array[i].serial);
		}
	}
	if(period_sernums.length){
		var cache = Geodia.getCache(period_sernums.toString());
		if(!cache){
			var url = Geodia.controller.loader.SERVICE+'period_images.json?sernums='+period_sernums.toString()+'&auth=http&callback=?';
			$.getJSON(url,function(json){
				Geodia.addCache(period_sernums.toString(),json);
				for(var i in json){
					item.period_array[i].images = json[i];	
				}
				callback();
			});
		} else{
			for(var i in cache[1]){
				item.period_array[i].images = cache[1][i];	
			}
			callback();
		}
	} else{
		callback();
	}
};

TimeMapItem.prototype.setPlacemarkTheme = function(theme) {
    var pm = this.placemark;
    if (pm) {
        // XXX: might need to support polys eventually
        switch (this.getType()) {
            case 'marker':
                pm.setImage(theme.iconImage);
        }
    }
};

TimeMapItem.prototype.getPeriod = function(d) {
    if (!this.periods) return null;
    // get center date if none given
    if (!d) d = this.dataset.timemap.timeline.getBand(0).getCenterVisibleDate();
    // look for the next date after the center
    var iterator = this.periods.getIterator(d, new Date());
    if (!iterator.hasNext()) {
        // event only exists in the past
        var iterator = this.periods.getReverseIterator(this.event.getStart(), d);
    }
    return iterator.next();
};
TimeMapItem.prototype.loadPeriods = function(){    
    // check if already loaded
    if (this.periods) return;
    
    var parser = TimeMapDataset.hybridParser;
        periods = this.opts.periods;
    
    // set up event index
    this.periods = new SimileAjax.EventIndex(null);
	//SR - need an array of periods for easy access by templates
	this.period_array = [];
    
    // loop through periods
    for (var x=0; x<periods.length; x++) {
        (function(x) {
            var p = periods[x];
            // add getStart and getEnd functions
            p.getStart = function() {
                return parser(p.start);
            };
            p.getEnd = function() {
                return parser(p.end);
            };
            p.getID = function() {
                return x;
            };
            // add theme and stripe
            var style = Geodia.getPeriodStyle(p);
            p.theme = style.theme;
            p.stripe = style.stripe;
        })(x);
        this.periods.add(periods[x]);
		//SR - push to period array
		this.period_array.push(periods[x]);
    }
};
TimeMapItem.prototype.addEventTheme = function(){
	this.changeTheme(Geodia.getEventStyle(this));
}

Geodia.cache = [];
Geodia.getCache = function(uid){
	var json = false;
	for(var i in Geodia.cache){
		if(Geodia.cache[i][0] === uid){
			json = Geodia.cache[i];
			break;
		}
	}
	return json;
};
Geodia.addCache = function(uid,json){
	Geodia.cache.push([uid,json]);	
};



Geodia.getPeriodStyle = function(period) {
    var culture = period.culture || 'default', stripeCulture, theme, stripe=null;
    // check for hybrid cultures
    if (culture.indexOf('/') > 0) {
        var cultures = culture.split('/');
        if (cultures[0] in Geodia.cultureMap) {
            culture = cultures[0];
            stripeCulture = cultures[1];
        }
        else {
            culture = cultures[1];
            stripeCulture = cultures[0];
        }
        if (!(stripeCulture in Geodia.cultureMap)) stripeCulture = 'default';
    }
    if (!(culture in Geodia.cultureMap)) culture = 'default';
    // get theme
    theme = Geodia.themes[Geodia.cultureMap[culture]];
    // get stripe
    if (stripeCulture) {
        // check for dual default
        if (stripeCulture == culture)
            stripe = Geodia.themes[Geodia.cultureMap['default']].stripe2;
        else stripe = Geodia.themes[Geodia.cultureMap[stripeCulture]].stripe;
    }
    // return both
    return { theme:theme, stripe:stripe };
};

Geodia.getEventStyle = function(item){
	var culture = item.opts.culture;
	var theme = null;
	if (culture.indexOf('/') > 0) {
        var cultures = culture.split('/');
        if (cultures[0] in Geodia.cultureMap) {
			theme = Geodia.themes[Geodia.cultureMap[cultures[0]]];
        }
        else if(cultures[1] in Geodia.cultureMap){
			theme = Geodia.themes[Geodia.cultureMap[cultures[1]]];
        }
    }
	else if(culture){
		theme = Geodia.themes[Geodia.cultureMap[culture]];
	}
	if(theme == null){
		theme = Geodia.themes[Geodia.cultureMap['default']];
	}
	theme.eventColor = theme.eventColor.replace('timemap/','');
	theme.eventIcon = theme.eventIcon.replace('timemap/','');
	return theme;
}
/*
 * New event painter for periods
 */
Geodia.PeriodEventPainter = function(params) {

    var painter = new Timeline.OriginalEventPainter(params);

    // fix for long track problem :(
    painter.paint = function() {
        // Paints the events for a given section of the band--what is
        // visible on screen and some extra.
        var eventSource = this._band.getEventSource();
        if (eventSource == null) {
            return;
        }
        
        this._eventIdToElmt = {};
        this._fireEventPaintListeners('paintStarting', null, null);
        this._prepareForPainting();
        

        var eventTheme = this._params.theme.event;
        // NR: changed to fix track heights
        var trackHeight = eventTheme.track.height;
        
        var metrics = {
            trackOffset: eventTheme.track.offset,
            trackHeight: trackHeight,
            trackGap: eventTheme.track.gap,
            trackIncrement: trackHeight + eventTheme.track.gap,
            icon: eventTheme.instant.icon,
            iconWidth: eventTheme.instant.iconWidth,
            iconHeight: eventTheme.instant.iconHeight,
            labelWidth: eventTheme.label.width,
            maxLabelChar: eventTheme.label.maxLabelChar,
            impreciseIconMargin: eventTheme.instant.impreciseIconMargin
        }
        
        var filterMatcher = (this._filterMatcher != null) ? 
            this._filterMatcher :
            function(evt) { return true; };
        var highlightMatcher = (this._highlightMatcher != null) ? 
            this._highlightMatcher :
            function(evt) { return -1; };
        
        // NR: this is the only changed line - Ugh
//        var iterator = eventSource.getAllEventIterator();
    	var minDate = this._band.getMinDate();
		var maxDate = this._band.getMaxDate();
		var iterator = eventSource.getEventReverseIterator(minDate, maxDate)

        while (iterator.hasNext()) {
            var evt = iterator.next();
            if (filterMatcher(evt)) {
                this.paintEvent(evt, metrics, this._params.theme, highlightMatcher(evt));
            }
        }
        
        this._highlightLayer.style.display = "block";
        this._lineLayer.style.display = "block";
        this._eventLayer.style.display = "block";
        // update the band object for max number of tracks in this section of the ether
        this._band.updateEventTrackInfo(this._tracks.length, metrics.trackIncrement); 
        this._fireEventPaintListeners('paintEnded', null, null);
    };


    // Continue fix for long event tracks
    painter._findFreeTrack = function(event, rightEdge) {
        var trackAttribute = event.getTrackNum();
        if (trackAttribute != null) {
            return trackAttribute; // early return since event includes track number
        }
        // normal case: find an open track
        for (var i = 0; i < this._tracks.length; i++) {
            var t = this._tracks[i];
				if(!event.isInstant()){
	    			if (t < rightEdge) { // NR: Reversed to work with AllEventIterator
    		   			break;
				    }
				}
				else{
		    		if (t > rightEdge) { // SR: Reversed to work with Events
    		   			break;
				    }
				}
        }
        return i;
    };
    
    // overwrite duration painting
    painter.paintPreciseDurationEvent = function(evt, metrics, theme, highlightIndex) {
        // get the track for the whole event
        var startDate = evt.getStart(),
            endDate = evt.getEnd(),
            startPixel = Math.round(this._band.dateToPixelOffset(startDate)),
            endPixel = Math.round(this._band.dateToPixelOffset(endDate));
        
        // NR: note that these are reversed from SIMILE to work with AllEventIterator 
        var track = this._findFreeTrack(evt, startPixel);
        this._tracks[track] = endPixel;
        // set track for later reuse
        evt._trackNum = track;
        
        // loop through periods
        if (evt.item.periods) {
            var iterator = evt.item.periods.getAllIterator();
            while (iterator.hasNext()) {
                var period = iterator.next(), text, tooltip;
                if (period.term) {
                    // add period to text
                    text = evt.getText() + (period.term ? ' (' + period.term +')' : '');
                    // make tooltip
                    tooltip = evt.getText() + " \n Period: " + period.term + 
                        " (" + period.start + " - " + period.end + ")" +
                        " \n Culture: " + period.culture;
                } 
                else {
                    text = evt.getText();
                    tooltip = false;
                }
                // get dates from period
                startDate = period.getStart();
                endDate = period.getEnd();
                startPixel = Math.round(this._band.dateToPixelOffset(startDate));
                endPixel = Math.round(this._band.dateToPixelOffset(endDate));
                // get color from period theme
                var color = period.theme.eventColor;
                
                // make tape
                var tapeElmtData = this._paintEventTape(evt, track, startPixel, endPixel, color, 100, metrics, theme, 0);
                // add stripe if necessary
                if (period.stripe) {
                    tapeElmtData.elmt.style.background = color + ' url(' + period.stripe + ')';
                }
                // add tooltip
                if (tooltip) tapeElmtData.elmt.title = tooltip;
                var els = [tapeElmtData];
                
                // fix scope for handler
                var self = this, clickHandler;
                (function(p, e) {
                    clickHandler = function(elmt, domEvt, target) {
                            e.item.currPeriod = p;
                        return self._onClickDurationEvent(tapeElmtData.elmt, domEvt, evt);
                    };
                })(period, evt);
                SimileAjax.DOM.registerEvent(tapeElmtData.elmt, "mousedown", clickHandler);
                
                // make label
                if (this._params.showText !== false) {
                    var labelDivClassName = this._getLabelDivClassName(evt);
                    var labelSize = this._frc.computeSize(text, labelDivClassName);
                    var labelLeft = startPixel;
                    var labelRight = labelLeft + labelSize.width;
                    
                    var rightEdge = Math.max(labelRight, endPixel);
                    var labelTop = Math.round(metrics.trackOffset + track * metrics.trackIncrement);
                    var labelElmtData = this._paintEventLabel(evt, text, labelLeft, labelTop, labelSize.width, labelSize.height, theme, labelDivClassName, highlightIndex);
                    // more legible over stripe
                    if (period.stripe) {
                        labelElmtData.elmt.style.background = color;
                    }
                    // add tooltip
                    if (tooltip) labelElmtData.elmt.title = tooltip;
                    els.push(labelElmtData.elmt);
                    SimileAjax.DOM.registerEvent(labelElmtData.elmt, "mousedown", clickHandler);
                }
                
                var hDiv = this._createHighlightDiv(highlightIndex, tapeElmtData, theme, evt);
                if (hDiv != null) {els.push(hDiv);}
                this._fireEventPaintListeners('paintedEvent', evt, els);
                
                this._eventIdToElmt[evt.getID()] = tapeElmtData.elmt;
            }
        }

    };

    // return new painter
    return painter;
}


/*----------------------------------------------------------------------------
 * Static settings
 *---------------------------------------------------------------------------*/

/**
 * Geodia themes - TimeMapDataSetThemes plus stripes
 */
Geodia.themes = {};
(function() {
    // this is a little hack-ish, but fast
    var tmThemes = TimeMap.themes, 
        gThemes = Geodia.themes;
    for (var color in tmThemes) {
        var theme = tmThemes[color];
        theme.stripe = 'images/' + color + '_stripe.png';
        gThemes[color] = theme;
    }
    // add a new one for default
    gThemes.grey =  new TimeMapTheme({
        iconImage: 'images/grey-dot.png',
        color: '#5F5F5F'
    });
    gThemes.grey.stripe = 'images/grey_stripe.png';
    gThemes.grey.stripe2 = 'images/tan_stripe.png';
	//added brown
    gThemes.brown =  new TimeMapTheme({
        iconImage: 'images/brown-dot.png',
        color: '#9E7151'
    });
    gThemes.brown.stripe = 'images/brown_stripe.png';
	//added dkgreen
    gThemes.dkgreen =  new TimeMapTheme({
        iconImage: 'images/dkgreen-dot.png',
        color: '#215E21'
    });
    gThemes.dkgreen.stripe = 'images/dkgreen_stripe.png';
})();

/**
 * Static Geodia band info
 */
Geodia.bands = [];
(function() {
    // add settings for themes
    var themes = [ 
        Timeline.ClassicTheme.create(), 
        Timeline.ClassicTheme.create()
    ];
    themes[0].event.track.height = 18;
    themes[0].event.track.gap =    3;
    themes[0].event.tape.height =  14;
    themes[1].event.track.height = 2;
    themes[1].event.track.gap =    2;
    themes[1].event.tape.height =  2;
    
    // add settings for hotzones
    var zones = [
        // show decades between 1000 BC and 1000 AD in top band
        [
            {   
                start:    "-1000",
                end:      "1000",
                magnify:  8,
                unit:     Timeline.DateTime.DECADE
            }
        ], 
        // show centuries between 1000 BC and 1000 AD in bottom band
        [
            {   
                start:    "-1000",
                end:      "1000",
                magnify:  8,
                unit:     Timeline.DateTime.CENTURY
            }
        ]
    ];
    
    Geodia.bands = [
        Timeline.createHotZoneBandInfo({
            eventSource:    false,
            width:          "80%", 
            intervalUnit:   Timeline.DateTime.CENTURY, 
            intervalPixels: 70,
            theme:          themes[0],
            zones:          zones[0],
			eventPainter:   Geodia.PeriodEventPainter
        }),
        Timeline.createHotZoneBandInfo({
            eventSource:    null,
            width:          "20%", 
            intervalUnit:   Timeline.DateTime.MILLENNIUM,
            intervalPixels: 100,
            showEventText:  false,
            theme:          themes[1],
            zones:          zones[1]
        })
    ];
})();

/**
 * Color map for cultures
 */
Geodia.cultureMap = {
    "default": 'grey',
    "Greek": 'green',
    "Roman": 'red',
    "Sumerian": 'orange',
    "Babylonian": 'orange',
    "Punic": 'dkgreen',
    "Levantine": 'purple',
    "Egyptian": 'pink',
    "Celtic": 'yellow',
    "Akkadian": 'ltblue',
    "Assyrian": 'ltblue',
    "Persian": 'blue',
    "Etruscan": 'brown'
};

TimeMap.state.params.item_type = new TimeMap.params.Param('item_type', {
	get: function(tm){
		return Geodia.controller.ui.visibleTab.item_type;
	},
	set: function(tm, value){
		if(value !== '' && value in Geodia.controller.ui){
			var tab = Geodia.controller.ui[value];
			Geodia.controller.ui.sidebar.showTab(tab);
		}
	},
	fromStr: function(s){
		return s;
	},
	toStr: function(s){
		return s;
	}
});
TimeMap.state.params.cultures = new TimeMap.params.Param('cultures', {
	get: function(tm){
		var ele = Geodia.controller.ui.visibleTab.ele;
		return Geodia.controller.ui.getCultures(ele);
	},
	set: function(tm, value){
		var ele = Geodia.controller.ui.visibleTab.ele;
		Geodia.controller.ui.setCultures(ele,value);
	},
	fromStr: function(s){
		return s.split(',');
	},
	toStr: function(s){
		return	s.toString();
	}
});


TimeMap.state.params.regions = new TimeMap.params.Param('regions', {
	get: function(tm){
		var ele = Geodia.controller.ui.visibleTab.ele;
		return Geodia.controller.ui.getRegions(ele);
	},
	set: function(tm, value){
		var ele = Geodia.controller.ui.visibleTab.ele;
		Geodia.controller.ui.setRegions(ele,value);
	},
	fromStr: function(s){
		return s.split(',');
	},
	toStr: function(s){
		return	s.toString();
	}
});
TimeMap.state.params.terms = new TimeMap.params.Param('terms', {
	get: function(tm){
		var tab = Geodia.controller.ui.visibleTab;
		return Geodia.controller.ui.getTerms(tab);
	},
	set: function(tm, value){
		var tab = Geodia.controller.ui.visibleTab;
		Geodia.controller.ui.setTerms(tab,value);
	},
	fromStr: function(s){
		if(s === ''){
			return [];
		} else{
			return s.split(',');
		}
	},
	toStr: function(s){
		return	s.toString();
	}
});
TimeMap.state.params.site_period = new TimeMap.params.Param('site_period', {
	get: function(tm){
		return Geodia.controller.ui.site.site_period;
	},
	set: function(tm, value){
		Geodia.controller.ui.site.site_period = value;
	},
	fromStr: function(s){
		return s.toString();
	},
	toStr: function(s){
		return s.toString();
	}
});
TimeMap.state.params.removed = new TimeMap.params.Param('removed', {
	get: function(tm){
		return Geodia.controller.ui.visibleTab.removed;
	},
	set: function(tm, value){
		Geodia.controller.ui.visibleTab.removed = value;
	},
	fromStr: function(s){
		if(s === ''){
			return [];
		} else{
			return s.split(',');
		}
	},
	toStr: function(s){
		return s.toString();
	}
});

TimeMap.state.params.pleiades_uri = new TimeMap.params.Param('pleiades_uri', {
	get: function(tm){
		return tm.opts.pleiades_uri;
	},
	set: function(tm, value){
		tm.opts.pleiades_uri = value;
	},
	fromStr: function(s){
		return s;
	},
	toStr: function(s){
		return s;
	}
});
