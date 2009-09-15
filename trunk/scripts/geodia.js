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
 */
Geodia.controller = new function() {
    
    /**
     * Initialize the controller, including the timemap and interface
     *
     * @param {Object} options      Container for optional params (probably to load state)
     */
    this.init = function(options) {
        
        // set defaults
        var defaults = {
            mapId: "map",
            timelineId: "timeline",
            mapType: "satellite"
        };
        
        /** 
         * Container for optional settings passed in the "options" parameter
         * @type Object
         */
        this.opts = options = TimeMap.util.merge(options, defaults);
        
        // initialize interface
        
        /** The associated interface **/
        this.ui = Geodia.Interface;
        var ui = this.ui;
        
        // initialize loader
        
        /** The associated loader **/
        this.loader = new TimeMap.loaders.dase();
        
        // initialize timemap
        
        // set up the dataset options
        var ds = {
            id: "sites",
            title: "Sites",
            options: {
                theme: 'red',
                classicTape: true
            }
        };
        // look for supplied data parameters
        if (options.dataUrl) {
            ds.type = "json_string";
            ds.options.url = options.dataUrl
        }
        else {
            ds.type = "basic";
            ds.options.items = [];
        }
        
        // XXX: Setting Geodia.tm is a temporary measure; 
        // w/multiple objects, you'd need an array
        
        /** The associated TimeMap object */
        this.tm = TimeMap.init({
            mapId: options.mapId,
            timelineId: options.timelineId,
            options: {
                openInfoWindow: TimeMapItem.openPeriodWindow,
                mapType: options.mapType
            },
            scrollTo: options.scrollTo,
            datasets: [ ds ],
            bands: Geodia.bands,
            dataLoadedFunction: function(tm) {
                ui.init();
                Geodia.initData(tm);
            }
        });
        
    };
    
    /**
     * Clean up before loading
     */
    this.preloadCleanUp = function() {
        var ds = this.tm.datasets.sites,
            ui = this.ui;
        // clear any other async loads
        TimeMap.loaders.jsonp.cancelAll();
        // clear dataset and site list
        this.clear();
        // start load animation
        ui.toggleLoading(true);
    };
    
    /**
     * Callback after loading
     */
    this.postload = function() {
        // wrap in a try to ignore cancelled calls
        try {
            Geodia.resetTimeMap(Geodia.controller.tm);
        } catch(e) {}
        Geodia.controller.ui.toggleLoading(false);
    };
    
    /**
     * Load data by facet selection
     *
     * @param {String[]} cultures       List of cultures for the query
     * @param {String[]} regions        List of regions for the query
     */
    this.loadFacets = function(cultures, regions){
        var total = cultures.length + regions.length;
        if (total > 0) {
            this.preloadCleanUp();
            // load data
            this.loader.loadFacets(cultures, regions, this.tm.datasets.sites, this.postload);
        }
        else {
            this.clear();
        }
	};
    
    /**
     * Load data by search query
     *
     * @param {String} term             Term to search on
     */
    this.loadSearch = function(term){
        if (term) {
            this.preloadCleanUp();
            // load data
            this.loader.loadSearch(term, this.tm.datasets.sites, this.postload);
        }
        else {
            this.clear();
        }
	};
    
    /**
     * Clear dataset(s)
     */
    this.clear = function() {
        // XXX: may need to deal with multiples
        this.tm.datasets.sites.clear();
        this.ui.clearSiteList();
    };
};

$(document).ready(function(){
    // initialize
    Geodia.controller.init();
});

/*----------------------------------------------------------------------------
 * TimeMap extensions
 *---------------------------------------------------------------------------*/

/**
 * Static function: initialize timemap data once loaded
 *
 * @param {TimeMap} tm      TimeMap for which to initialize data
 */
Geodia.initData = function(tm) {
    // set up periods as an EventIndex
    tm.eachItem(function(item) {
        item.loadPeriods();
        Geodia.Interface.addToSiteList(item);
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
    
    // filter timeline events according to map
    tm.addFilter("timeline", TimeMap.filters.visibleOnMap);
    // add listener to filter timeline
	GEvent.addListener(tm.map, 'moveend', function(){
		tm.filter("timeline");
		var loadedPeriods = false;
		tm.eachItem(function(item) {
            if (item.periods && !loadedPeriods){
                loadedPeriods = true;
            }
            item.event._trackNum = null;
		});
		if (loadedPeriods){
			tm.timeline.layout();
		}
	});
};

/**
 * Static function - reset the timemap when loading new data
 *
 * @param {TimeMap} tm      TimeMap to reset
 */
Geodia.resetTimeMap = function(tm) { 
    Geodia.initData(tm); 
    var d = tm.eventSource.getEarliestDate();
    tm.timeline.getBand(0).setCenterVisibleDate(d);
    tm.timeline.layout();
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
 * Filter: Determine whether the current item is visible on the map
 *
 * @param {TimeMapItem} item    Item to test
 */
TimeMap.filters.visibleOnMap = function(item){
	var bounds = item.map.getBounds();
	return bounds.containsLatLng(item.getInfoPoint());
};
 
/*----------------------------------------------------------------------------
 * Periodization
 *---------------------------------------------------------------------------*/

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
 * Show description based on period
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
	Geodia.Interface.initImageViewer(p,this.periods,site_name,this.opts.description);
};

TimeMapItem.prototype.loadPeriods = function(){    
    // check if already loaded
    if (this.periods) return;
    
    var parser = TimeMapDataset.hybridParser;
        periods = this.opts.periods;
    
    // set up event index
    this.periods = new SimileAjax.EventIndex(null);
    
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
            p.getImages = function() {
                if(p.options){
                    if(p.options.images){
                        return p.options.images;
                    }
                    else{
                        return false;
                    }
                }
                else{
                    return false;
                }
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
    }
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
            eventSource:    false,
            width:          "20%", 
            intervalUnit:   Timeline.DateTime.MILLENNIUM,
            intervalPixels: 100,
            showEventText:  false,
            theme:          themes[1],
            zones:          zones[1],
            eventPainter:   Geodia.PeriodEventPainter
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
    "Punic": 'purple',
    "Levantine": 'blue',
    "Latial": 'ltblue'
};