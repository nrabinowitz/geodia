/*
 * Initialization.
 */

// put site-specific stuff into one object for namespace protection
Geodia = { 
    sbopen: false,
    adminopen: false,
    sbside: 'r',
    adminside: 'l',
    tm: null
};

var timer=null;
$(document).ready(function(){
    // set up panels
    Geodia.resizePanels();
    // set up hotzones
    var zones1 = [
        {   
            start:    "-1000",
            end:      "1000",
            magnify:  8,
            unit:     Timeline.DateTime.DECADE
        }
    ];
    var zones2 = [
        {   
            start:    "-1000",
            end:      "1000",
            magnify:  8,
            unit:     Timeline.DateTime.CENTURY
        }
    ];
    // set up themes
    var theme1 = Timeline.ClassicTheme.create();
    theme1.event.track.height = 18;
    theme1.event.track.gap =    3;
    theme1.event.tape.height =  14;
    var theme2 = Timeline.ClassicTheme.create();
    theme2.event.track.height = 2;
    theme2.event.track.gap =    2;
    theme2.event.tape.height =  2;
    Geodia.tm = TimeMap.init({
        mapId: "map",
        timelineId: "timeline",
        options: {
            openInfoWindow: TimeMapItem.openPeriodWindow,
            mapType: G_SATELLITE_MAP
        },
        datasets: [
            {
                id: "sites",
                title: "Sites",
                type: 'json_string',
                options: { 
					url: 'scripts/rome.json',
                    theme: 'red',
                    classicTape: true
                }
            }
        ],
        bands: [
    		Timeline.createHotZoneBandInfo({
                eventSource:    false,
                width:          "80%", 
                intervalUnit:   Timeline.DateTime.CENTURY, 
                intervalPixels: 70,
                theme:          theme1,
                zones:          zones1,
                eventPainter:   Geodia.PeriodEventPainter
            }),
            Timeline.createHotZoneBandInfo({
                eventSource:    false,
                width:          "20%", 
                intervalUnit:   Timeline.DateTime.MILLENNIUM,
                intervalPixels: 100,
                showEventText:  false,
                theme:          theme2,
                zones:          zones2,
                eventPainter:   Geodia.PeriodEventPainter
            })
        ],
        // set up timemap
        dataLoadedFunction: function(tm) {
            // set up periods as an EventIndex
            tm.each(function(ds) {
				Geodia.loadPeriods(ds);
            });
            // add culture filter chain
            tm.addFilterChain("culture",
                // true condition: change marker icon
                function(item) {
                    var p = item.getPeriod();
                    if (p) {
                        item.setPlacemarkTheme(p.theme);
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
            // init timeline
            var d = tm.eventSource.getEarliestDate();
            tm.timeline.getBand(0).setCenterVisibleDate(d);
            tm.timeline.layout();
        }
    });
			GEvent.addListener(Geodia.tm.map,'moveend',function(){
				reDrawSites(Geodia.tm.map.getBounds(),Geodia.tm.map.getZoom());	
			});
    // set up resize function
    window.onresize = function() {
        if (timer === null) {
            timer = window.setTimeout(function() {
                timer = null;
                // call twice to deal w/scrollbar
                Geodia.resizePanels();
                Geodia.resizePanels();
                Geodia.tm.timeline.layout();
            }, 200);
        }
    }
});
function reDrawSites(bounds,zoom){
	var loadedPeriods = false;
	var changed = false;
	//set zoom levels
	var levels = ['15','0','4','8','10'];
	Geodia.tm.each(function(dset) {
		if(dset){
			dset.each(function(item) {
				//Need to check for periods other wise errors are thrown.(the timeline is refresehd twice when new dataset is loaded.
				//The first time it is refreshed the periods are not yet loaded
				//Then check if zoom level is 1.1 should alwasy be shown until Adam gives me list of culturarly important sites. 
				if(item.periods && item.opts.zoom_level != 1 ){
					//if it is not in bounds or has a low value zoom level hide it.
					if(!bounds.contains(item.placemark.getPoint()) || levels[item.opts.zoom_level] >= zoom){
						item.hide();
						item.hidePlacemark();
						changed = true;
					}
					//if it comes here then it should be shown, but nosense in making it visible if it was already visible
					else if(!item.visible){
						item.show();
						item.showPlacemark();
						changed = true;
					}
					loadedPeriods = true;
				}
    	        if(item.event){
	    	        item.event._trackNum = null;
            	}
			});
		}
	});
	//make sure we are dealing with the dataset that has the periods loaded and make sure if anything has changed.
	if(loadedPeriods && changed){
		Geodia.tm.timeline.layout();
	}
}

/**
 * Get the current period, by date, for a particular item
 *
 * @param {Date} d      Current date
 * @return              Period covering that date
 */
TimeMapItem.prototype.getPeriod = function(d) {
    if (!this.periods) return null;
    // get center date if none given
    if (!d) d = this.dataset.timemap.timeline.getBand(0).getCenterVisibleDate();
    var iterator = this.periods.getIterator(d, new Date());
    return iterator.next();
};

/**
 * Set the placemark to a specific theme
 *
 * @param {TimeMapDatasetTheme} theme   Theme to set placemark to
 */
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

/**
 * Test: Show description based on period
 */
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
    var html = '<div class="infotitle">' + site_name + '</div>';
//    html += '<div class="infodescription">' + p.term  + ' Period: ' + p.start + ' - ' + p.end + '</div>';
    html += '<div class="infodescription">Level: '+this.opts.zoom_level+'<br/>Culture: '+p.culture+'</div>';
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
    this.selected = true;
	iniImageViewer(p,this.periods,site_name,this.opts.description);
};

/**
 * Resize the panels to fit the full window
 */
Geodia.resizePanels = function() {
    // get full screen size
    var dh = $(window).height();
    var dw = $(window).width();
    var sbw = Geodia.sbopen ? 350 : 20;
    var adw = Geodia.adminopen ? 350 : 20;
    var hh = 0;//51;
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
    if (Geodia.sbside == 'l') {
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

    if (Geodia.tm && Geodia.tm.map) {
        Geodia.tm.map.checkResize();
    }
}

/*
 * Geodia themes - TimeMapDataSetThemes plus stripes
 */
Geodia.themes = {};
(function() {
    // this is a little hack-ish, but fast
    var tmThemes = TimeMap.themes;
    for (var color in tmThemes) {
        var theme = new tmThemes[color]();
        theme.stripe = 'images/' + color + '_stripe.png';
        Geodia.themes[color] = theme;
    }
    // add a new one for default
    Geodia.themes.grey =  new TimeMapTheme({
        iconImage: 'images/grey-dot.png',
        color: '#5F5F5F'
    });
    Geodia.themes.grey.stripe = 'images/grey_stripe.png';
    Geodia.themes.grey.stripe2 = 'images/tan_stripe.png';
})();

/*
 * Color map for cultures
 */
Geodia.cultureMap = {
    "default": 'grey',
    "Greek": 'green',
    "Roman": 'red',
    "Sumerian": 'orange',
    "Punic": 'purple',
    "Levantine": 'blue',
    "Latial": 'ltblue'
};

Geodia.loadPeriods = function(ds){
            var parser = TimeMapDataset.hybridParser;
			var site_list = $('ul.site_list');
                ds.each(function(item) {
					//add site to site_list
					var site = $('<li>'+item.event._text+'</li>').appendTo(site_list);
					$(site).data('site',item);
					$(site).data('name',item.event._text);
					$(site).data('dataset',ds);
                    item.periods = new SimileAjax.EventIndex(null);
                    var periods = item.opts.periods;
                    // loop through periods
                    for (var x=0; x<periods.length; x++) {
                        (function(x) {
                            // add getStart and getEnd functions
                            periods[x].getStart = function() {
                                return parser(periods[x].start);
                            };
                            periods[x].getEnd = function() {
                                return parser(periods[x].end);
                            };
                            periods[x].getImages = function() {
								if(periods[x].options){
									if(periods[x].options.images){
										return periods[x].options.images;
									}
									else{
										return false;
									}
								}
								else{
									return false;
								}
                            };
                            periods[x].getID = function() {
                                return x;
                            };
                            // add theme and stripe
                            var style = Geodia.getPeriodStyle(periods[x]);
                            periods[x].theme = style.theme;
                            periods[x].stripe = style.stripe;
                        })(x);
                        item.periods.add(periods[x]);
                    }
                });

};
/**
 * Get theme and stripe from period
 * @return {Object}     Style w/theme + stripe
 */
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
        var iterator = eventSource.getAllEventIterator();
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
            if (t < rightEdge) { // NR: Reversed to work with AllEventIterator
                break;
            }
        }
        return i;
    };

    
    // overwrite duration painting
    painter.paintPreciseDurationEvent = function(evt, metrics, theme, highlightIndex) {
        var doc = this._timeline.getDocument();
        
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
    };

    
    // return new painter
    return painter;
}
