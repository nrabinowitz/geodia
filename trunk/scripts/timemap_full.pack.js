/* 
 * Timemap.js Copyright 2008 Nick Rabinowitz.
 * Licensed under the MIT License (see LICENSE.txt)
 */
(function(){var i=this,f,g=i.Timeline,h=g.DateTime,d=i.G_DEFAULT_MAP_TYPES,k=i.G_NORMAL_MAP,r=i.G_PHYSICAL_MAP,p=i.G_SATELLITE_MAP,n=i.GLatLng,c=i.GLatLngBounds,b=i.GEvent,j="http://www.google.com/intl/en_us/mapfiles/ms/icons/",l,q,o,m,e;l=function(t,v,u){this.mElement=v;this.tElement=t;this.datasets={};this.chains={};var w={mapCenter:new n(0,0),mapZoom:0,mapType:r,mapTypes:[k,p,r],showMapTypeCtrl:true,showMapCtrl:true,syncBands:true,mapFilter:"hidePastFuture",centerOnItems:true,theme:"red"};this.opts=u=a.merge(u,w);u.mergeOnly=["mergeOnly","theme","eventIconPath","openInfoWindow","closeInfoWindow","noPlacemarkLoad","noEventLoad"];u.mapType=a.lookup(u.mapType,l.mapTypes);u.mapFilter=a.lookup(u.mapFilter,l.filters);u.theme=m.create(u.theme,u);this.initMap()};l.prototype.initMap=function(){var t=this.opts,v,u;if(GBrowserIsCompatible()){this.map=v=new GMap2(this.mElement);for(u=d.length-1;u>0;u--){v.removeMapType(d[u])}v.addMapType(t.mapTypes[0]);v.removeMapType(d[0]);for(u=1;u<t.mapTypes.length;u++){v.addMapType(t.mapTypes[u])}v.setCenter(t.mapCenter,t.mapZoom,t.mapType);v.enableDoubleClickZoom();v.enableScrollWheelZoom();v.enableContinuousZoom();if(t.showMapCtrl){v.addControl(new GLargeMapControl())}if(t.showMapTypeCtrl){v.addControl(new GMapTypeControl())}this.mapBounds=v.getBounds()}};l.version="1.6pre";var a=l.util={};l.init=function(v){var C="TimeMap.init: No id for ";if(!("mapId" in v)||!v.mapId){throw C+"map"}if(!("timelineId" in v)||!v.timelineId){throw C+"timeline"}var B={options:{},datasets:[],bands:false,bandInfo:false,bandIntervals:"wk",scrollTo:"earliest"};v=a.merge(v,B);if(!v.bandInfo&&!v.bands){var F=a.lookup(v.bandIntervals,l.intervals);v.bandInfo=[{width:"80%",intervalUnit:F[0],intervalPixels:70},{width:"20%",intervalUnit:F[1],intervalPixels:100,showEventText:false,overview:true,trackHeight:0.4,trackGap:0.2}]}var I=new l(document.getElementById(v.timelineId),document.getElementById(v.mapId),v.options);var D=[],H,u,y,A,t;for(H=0;H<v.datasets.length;H++){u=v.datasets[H];A={title:u.title,theme:u.theme,dateParser:u.dateParser};y=a.merge(u.options,A);t=u.id||"ds"+H;D[H]=I.createDataset(t,y);if(H>0){D[H].eventSource=D[0].eventSource}}I.eventSource=D[0].eventSource;var z=[];var w=(D[0]&&D[0].eventSource)||new g.DefaultEventSource();if(v.bands){z=v.bands;for(H=0;H<z.length;H++){if(z[H].eventSource!==null){z[H].eventSource=w}}}else{for(H=0;H<v.bandInfo.length;H++){var G=v.bandInfo[H];if(!(("eventSource" in G)&&!G.eventSource)){G.eventSource=w}else{G.eventSource=null}z[H]=g.createBandInfo(G);if(H>0&&a.TimelineVersion()=="1.2"){z[H].eventPainter.setLayout(z[0].eventPainter.getLayout())}}}I.initTimeline(z);var E=l.loadManager;E.init(I,v.datasets.length,v);for(H=0;H<v.datasets.length;H++){(function(K){var O=v.datasets[K],L,N,P,M,J;L=O.data||O.options||{};N=O.type||L.type;P=function(){E.increment()};M=(typeof(N)=="string")?l.loaders[N]:N;J=new M(L);J.load(D[K],P)})(H)}return I};var s=l.init;l.loadManager=new function(){this.init=function(t,v,u){this.count=0;this.tm=t;this.target=v;this.opts=u||{}};this.increment=function(){this.count++;if(this.count>=this.target){this.complete()}};this.complete=function(){var t=this.tm;var u=this.opts.dataLoadedFunction;if(u){u(t)}else{t.scrollToDate(this.opts.scrollTo,true);u=this.opts.dataDisplayedFunction;if(u){u(t)}}}};l.prototype.parseDate=function(t){var v=new Date(),u=this.eventSource,x=o.hybridParser,w=u.getCount()>0?true:false;switch(t){case"now":break;case"earliest":case"first":if(w){v=u.getEarliestDate()}break;case"latest":case"last":if(w){v=u.getLatestDate()}break;default:v=x(t)}return v};l.prototype.scrollToDate=function(z,w){var z=this.parseDate(z),x=this.timeline,t;if(z){var y=x.getBand(0),u=y.getMinDate().getTime(),v=y.getMaxDate().getTime();t=(w&&z.getTime()>u&&z.getTime()<v);x.getBand(0).setCenterVisibleDate(z)}if(t||(w&&!z)){x.layout()}};l.prototype.createDataset=function(x,t){var w=new o(this,t);this.datasets[x]=w;if(this.opts.centerOnItems){var v=this.map,u=this.mapBounds;b.addListener(w,"itemsloaded",function(){v.setCenter(u.getCenter(),v.getBoundsZoomLevel(u))})}return w};l.prototype.initTimeline=function(y){for(var t=1;t<y.length;t++){if(this.opts.syncBands){y[t].syncWith=(t-1)}y[t].highlight=true}this.timeline=g.create(this.tElement,y);var v=this;this.timeline.getBand(0).addOnScrollListener(function(){v.filter("map")});var u=this.timeline.getBand(0).getEventPainter().constructor;u.prototype._showBubble=function(A,C,B){B.item.openInfoWindow()};this.addFilterChain("map",function(x){x.showPlacemark()},function(x){x.hidePlacemark()});this.addFilter("map",function(x){return x.visible});this.addFilter("map",function(x){return x.dataset.visible});this.addFilter("map",this.opts.mapFilter);this.addFilterChain("timeline",function(x){x.showEvent()},function(x){x.hideEvent()},null,function(){var x=this.timemap;x.eventSource._events._index();x.timeline.layout()});this.addFilter("timeline",function(x){return x.visible});this.addFilter("timeline",function(x){return x.dataset.visible});var z=null;var w=this.timeline;i.onresize=function(){if(z===null){z=i.setTimeout(function(){z=null;w.layout()},500)}}};l.prototype.each=function(t){for(var u in this.datasets){if(this.datasets.hasOwnProperty(u)){t(this.datasets[u])}}};l.prototype.eachItem=function(t){this.each(function(u){u.each(function(v){t(v)})})};l.prototype.getItems=function(){var t=[];this.eachItem(function(u){t.push(u)});return t};l.loaders={};l.loaders.cb={};l.loaders.cancelAll=function(){var t=l.loaders.cb;for(var u in t){if(t.hasOwnProperty(u)){t[u]=function(){delete t[u]}}}};l.loaders.counter=0;l.loaders.base=function(t){var u=function(v){return v};this.parse=t.parserFunction||u;this.preload=t.preloadFunction||u;this.transform=t.transformFunction||u;this.scrollTo=t.scrollTo||"earliest";this.getCallbackName=function(y,z){var v=this,w=l.loaders.cb,x="_"+l.loaders.counter++,z=z||function(){y.timemap.scrollToDate(v.scrollTo,true)};w[x]=function(A){var B=v.parse(A);B=v.preload(B);y.loadItems(B,v.transform);z();delete w[x]};return x};this.getCallback=function(w,x){var v=this.getCallbackName(w,x);return l.loaders.cb[v]}};l.loaders.basic=function(u){var t=new l.loaders.base(u);t.data=u.items||u.value||[];t.load=function(v,w){(this.getCallback(v,w))(this.data)};return t};l.loaders.remote=function(u){var t=new l.loaders.base(u);t.url=u.url;t.load=function(v,w){GDownloadUrl(this.url,this.getCallback(v,w))};return t};q=function(v,u,t,y,w){this.timemap=v;this.chain=[];var x=function(z){};this.on=u||x;this.off=t||x;this.pre=y||x;this.post=w||x};q.prototype.add=function(t){this.chain.push(t)};q.prototype.remove=function(v){var u=this.chain;if(!v){u.pop()}else{for(var t=0;t<u.length;t++){if(u[t]==v){u.splice(t,1)}}}};q.prototype.run=function(){var u=this,t=u.chain;if(!t.length){return}u.pre();u.timemap.eachItem(function(x){var v=false;F_LOOP:while(!v){for(var w=t.length-1;w>=0;w--){if(!t[w](x)){u.off(x);break F_LOOP}}u.on(x);v=true}});u.post()};l.prototype.filter=function(u){var t=this.chains[u];if(t){t.run()}};l.prototype.addFilterChain=function(x,u,t,w,v){this.chains[x]=new q(this,u,t,w,v)};l.prototype.removeFilterChain=function(t){this.chains[t]=null};l.prototype.addFilter=function(v,u){var t=this.chains[v];if(t){t.add(u)}};l.prototype.removeFilter=function(v,u){var t=this.chains[v];if(t){t.remove(u)}};l.filters={};l.filters.hidePastFuture=function(w){var y=w.dataset.timemap.timeline.getBand(0),u=y.getMaxVisibleDate().getTime(),v=y.getMinVisibleDate().getTime(),t=w.getStartTime(),x=w.getEndTime();if(t){if(t>u){return false}else{if(x<v||(w.event.isInstant()&&t<v)){return false}}}return true};l.filters.showMomentOnly=function(u){var w=u.dataset.timemap.timeline.getBand(0),x=w.getCenterVisibleDate().getTime(),t=u.getStartTime(),v=u.getEndTime();if(t){if(t>x){return false}else{if(v<x||(u.event.isInstant()&&t<x)){return false}}}return true};o=function(t,u){this.timemap=t;this.eventSource=new g.DefaultEventSource();this.items=[];this.visible=true;var v={title:"Untitled",dateParser:o.hybridParser};this.opts=u=a.merge(u,v,t.opts);u.dateParser=a.lookup(u.dateParser,l.dateParsers);u.theme=m.create(u.theme,u);this.getItems=function(w){if(w!==f){if(w<this.items.length){return this.items[w]}else{return null}}return this.items};this.getTitle=function(){return this.opts.title}};o.gregorianParser=function(u){if(!u){return null}var v=Boolean(u.match(/b\.?c\.?/i));var t=parseInt(u,10);if(!isNaN(t)){if(v){t=1-t}var w=new Date(0);w.setUTCFullYear(t);return w}else{return null}};o.hybridParser=function(t){if(t instanceof Date){return t}var v=new Date(Date.parse(t));if(isNaN(v)){if(typeof(t)=="string"){if(t.match(/^-?\d{1,6} ?(a\.?d\.?|b\.?c\.?e?\.?|c\.?e\.?)?$/i)){v=o.gregorianParser(t)}else{try{v=h.parseIso8601DateTime(t)}catch(u){v=null}}}else{return null}}return v};o.prototype.each=function(u){for(var t=0;t<this.items.length;t++){u(this.items[t])}};o.prototype.loadItems=function(v,u){for(var t=0;t<v.length;t++){this.loadItem(v[t],u)}b.trigger(this,"itemsloaded")};o.prototype.loadItem=function(Q,G){if(G!==f){Q=G(Q)}if(!Q){return}options=a.merge(Q.options,this.opts);var P=options.theme=m.create(options.theme,options);var x=this.opts.dateParser,C=Q.start,A=Q.end,w;C=C?x(C):null;A=A?x(A):null;w=!A;var v=P.eventIcon,R=Q.title,L=null;if(C!==null){var E=g.DefaultEventSource.Event;if(a.TimelineVersion()=="1.2"){L=new E(C,A,null,null,w,R,null,null,null,v,P.eventColor,P.eventTextColor)}else{var B=P.eventTextColor;if(!B){B=(P.classicTape&&!w)?"#FFFFFF":"#000000"}L=new E({start:C,end:A,instant:w,text:R,icon:v,color:P.eventColor,textColor:B})}}var t=P.icon,y=this.timemap,D=y.mapBounds;var I=function(W){var V=null,Y="",ab=null;if(W.point){var X=W.point.lat,T=W.point.lon;if(X===f||T===f){return null}ab=new n(parseFloat(W.point.lat),parseFloat(W.point.lon));if(y.opts.centerOnItems){D.extend(ab)}V=new GMarker(ab,{icon:t,title:W.title});Y="marker";ab=V.getLatLng()}else{if(W.polyline||W.polygon){var ac=[],ad;if(W.polyline){ad=W.polyline}else{ad=W.polygon}if(ad&&ad.length){for(var Z=0;Z<ad.length;Z++){ab=new n(parseFloat(ad[Z].lat),parseFloat(ad[Z].lon));ac.push(ab);if(y.opts.centerOnItems){D.extend(ab)}}if("polyline" in W){V=new GPolyline(ac,P.lineColor,P.lineWeight,P.lineOpacity);Y="polyline";ab=V.getVertex(Math.floor(V.getVertexCount()/2))}else{V=new GPolygon(ac,P.polygonLineColor,P.polygonLineWeight,P.polygonLineOpacity,P.fillColor,P.fillOpacity);Y="polygon";ab=V.getBounds().getCenter()}}}else{if("overlay" in W){var aa=new n(parseFloat(W.overlay.south),parseFloat(W.overlay.west));var U=new n(parseFloat(W.overlay.north),parseFloat(W.overlay.east));if(y.opts.centerOnItems){D.extend(aa);D.extend(U)}var S=new c(aa,U);V=new GGroundOverlay(W.overlay.image,S);Y="overlay";ab=S.getCenter()}}}return{placemark:V,type:Y,point:ab}};var O=[],J=[],u=null,z="",K=null,M;if("placemarks" in Q){J=Q.placemarks}else{var F=["point","polyline","polygon","overlay"];for(M=0;M<F.length;M++){if(F[M] in Q){u={title:R};u[F[M]]=Q[F[M]];J.push(u)}}}if(J){for(M=0;M<J.length;M++){var H=I(J[M]);if(H&&H.placemark){K=K||H.point;z=z||H.type;O.push(H.placemark)}}}if(O.length>1){z="array"}options.title=R;options.type=z;if(options.infoPoint){options.infoPoint=new n(parseFloat(options.infoPoint.lat),parseFloat(options.infoPoint.lon))}else{options.infoPoint=K}var N=new e(O,L,this,options);if(L!==null){L.item=N;if(!this.opts.noEventLoad){this.eventSource.add(L)}}if(O.length>0){for(M=0;M<O.length;M++){O[M].item=N;b.addListener(O[M],"click",function(){N.openInfoWindow()});if(!this.opts.noPlacemarkLoad){y.map.addOverlay(O[M])}O[M].hide()}}this.items.push(N);return N};m=function(u){var w={color:"#FE766A",lineOpacity:1,lineWeight:2,fillOpacity:0.25,eventTextColor:null,eventIconPath:"timemap/images/",eventIconImage:"red-circle.png",classicTape:false,iconImage:j+"red-dot.png"};var v=a.merge(u,w);delete v.mergeOnly;if(!v.icon){var t=new GIcon(G_DEFAULT_ICON);t.image=v.iconImage;t.iconSize=new GSize(32,32);t.shadow=j+"msmarker.shadow.png";t.shadowSize=new GSize(59,32);t.iconAnchor=new GPoint(16,33);t.infoWindowAnchor=new GPoint(18,3);v.icon=t}w={lineColor:v.color,polygonLineColor:v.color,polgonLineOpacity:v.lineOpacity,polygonLineWeight:v.lineWeight,fillColor:v.color,eventColor:v.color,eventIcon:v.eventIconPath+v.eventIconImage};v=a.merge(v,w);return v};m.create=function(v,t){if(v){v=l.util.lookup(v,l.themes)}else{return new m(t)}var w=false,u;for(u in t){if(v.hasOwnProperty(u)){w={};break}}if(w){for(u in v){if(v.hasOwnProperty(u)){w[u]=t[u]||v[u]}}w.eventIcon=t.eventIcon||w.eventIconPath+w.eventIconImage;return w}else{return v}};e=function(u,w,y,t){var v=this;v.event=w;v.dataset=y;v.map=y.timemap.map;if(u&&a.isArray(u)&&u.length===0){u=null}if(u&&u.length==1){u=u[0]}v.placemark=u;var x={type:"none",title:"Untitled",description:"",infoPoint:null,infoHtml:"",infoUrl:"",closeInfoWindow:e.closeInfoWindowBasic};v.opts=t=a.merge(t,x,y.opts);if(!t.openInfoWindow){if(t.infoUrl!==""){t.openInfoWindow=e.openInfoWindowAjax}else{t.openInfoWindow=e.openInfoWindowBasic}}v.getType=function(){return v.opts.type};v.getTitle=function(){return v.opts.title};v.getInfoPoint=function(){return v.opts.infoPoint||v.map.getCenter()};v.getStart=function(){if(v.event){return v.event.getStart()}};v.getEnd=function(){if(v.event){return v.event.getEnd()}};v.getStartTime=function(){var z=v.getStart();if(z){return z.getTime()}};v.getEndTime=function(){var z=v.getEnd();if(z){return z.getTime()}};v.selected=false;v.visible=true;v.placemarkVisible=false;v.eventVisible=true;v.openInfoWindow=function(){t.openInfoWindow.call(v);v.selected=true};v.closeInfoWindow=function(){t.closeInfoWindow.call(v);v.selected=false}};e.prototype.showPlacemark=function(){var u=this,t;if(u.placemark){if(u.getType()=="array"){for(t=0;t<u.placemark.length;t++){u.placemark[t].show()}}else{u.placemark.show()}u.placemarkVisible=true}};e.prototype.hidePlacemark=function(){var u=this,t;if(u.placemark){if(u.getType()=="array"){for(t=0;t<u.placemark.length;t++){u.placemark[t].hide()}}else{u.placemark.hide()}u.placemarkVisible=false}u.closeInfoWindow()};e.prototype.showEvent=function(){if(this.event){if(this.eventVisible===false){this.dataset.timemap.timeline.getBand(0).getEventSource()._events._events.add(this.event)}this.eventVisible=true}};e.prototype.hideEvent=function(){if(this.event){if(this.eventVisible){this.dataset.timemap.timeline.getBand(0).getEventSource()._events._events.remove(this.event)}this.eventVisible=false}};e.openInfoWindowBasic=function(){var u=this,t=u.opts.infoHtml;if(t===""){t='<div class="infotitle">'+u.opts.title+"</div>";if(u.opts.description!==""){t+='<div class="infodescription">'+u.opts.description+"</div>"}}if(u.placemark&&!u.placemarkVisible&&u.event){u.dataset.timemap.scrollToDate(u.event.getStart())}if(u.getType()=="marker"){u.placemark.openInfoWindowHtml(t)}else{u.map.openInfoWindowHtml(u.getInfoPoint(),t)}u.closeListener=b.addListener(u.map,"infowindowclose",function(){u.selected=false;b.removeListener(u.closeListener)})};e.openInfoWindowAjax=function(){var t=this;if(!t.opts.infoHtml){if(t.opts.infoUrl){GDownloadUrl(t.opts.infoUrl,function(u){t.opts.infoHtml=u;t.openInfoWindow()});return}}t.openInfoWindow=function(){e.openInfoWindowBasic.call(t);t.selected=true};t.openInfoWindow()};e.closeInfoWindowBasic=function(){if(this.getType()=="marker"){this.placemark.closeInfoWindow()}else{var t=this.map.getInfoWindow();if(t.getPoint()==this.getInfoPoint()&&!t.isHidden()){this.map.closeInfoWindow()}}};l.util.trim=function(t){t=t&&String(t)||"";return t.replace(/^\s\s*/,"").replace(/\s\s*$/,"")};l.util.isArray=function(t){return t&&!(t.propertyIsEnumerable("length"))&&typeof t==="object"&&typeof t.length==="number"};l.util.getTagValue=function(x,t,v){var w="";var u=l.util.getNodeList(x,t,v);if(u.length>0){x=u[0].firstChild;while(x!==null){w+=x.nodeValue;x=x.nextSibling}}return w};l.util.nsMap={};l.util.getNodeList=function(w,u,v){var t=l.util.nsMap;if(v===f){return w.getElementsByTagName(u)}if(w.getElementsByTagNameNS&&t[v]){return w.getElementsByTagNameNS(t[v],u)}return w.getElementsByTagName(v+":"+u)};l.util.makePoint=function(v,w){var u=null,t=l.util.trim;if(v.lat&&v.lng){u=[v.lat(),v.lng()]}if(l.util.isArray(v)){u=v}if(!u){v=t(v);if(v.indexOf(",")>-1){u=v.split(",")}else{u=v.split(/[\r\n\f ]+/)}}if(u.length>2){u=u.slice(0,2)}if(w){u.reverse()}return{lat:t(u[0]),lon:t(u[1])}};l.util.makePoly=function(w,z){var v=[],u;var y=l.util.trim(w).split(/[\r\n\f ]+/);if(y.length===0){return[]}for(var t=0;t<y.length;t++){u=(y[t].indexOf(",")>0)?y[t].split(","):[y[t],y[++t]];if(u.length>2){u=u.slice(0,2)}if(z){u.reverse()}v.push({lat:u[0],lon:u[1]})}return v};l.util.formatDate=function(z,y){y=y||3;var A="";if(z){var x=z.getUTCFullYear(),u=z.getUTCMonth(),B=z.getUTCDate();if(x<1000){return(x<1?(x*-1+"BC"):x+"")}if(z.toISOString&&y==3){return z.toISOString()}var t=function(D){return((D<10)?"0":"")+D};A+=x+"-"+t(u+1)+"-"+t(B);if(y>1){var v=z.getUTCHours(),w=z.getUTCMinutes(),C=z.getUTCSeconds();A+="T"+t(v)+":"+t(w);if(y>2){A+=t(C)}A+="Z"}}return A};l.util.TimelineVersion=function(){if(g.version){return g.version}if(g.DurationEventPainter){return"1.2"}else{return"2.2.0"}};l.util.getPlacemarkType=function(t){if("getIcon" in t){return"marker"}if("getVertex" in t){return"setFillStyle" in t?"polygon":"polyline"}return false};l.util.merge=function(){var w={},u=arguments,A,v,t,B;var z=function(C,y,x){if(C.hasOwnProperty(x)&&y[x]===f){y[x]=C[x]}};for(t=0;t<u.length;t++){A=u[t];if(A){if(t>0&&"mergeOnly" in A){for(B=0;B<A.mergeOnly.length;B++){v=A.mergeOnly[B];z(A,w,v)}}else{for(v in A){z(A,w,v)}}}}return w};l.util.lookup=function(t,u){if(typeof(t)=="string"){return u[t]}else{return t}};l.intervals={sec:[h.SECOND,h.MINUTE],min:[h.MINUTE,h.HOUR],hr:[h.HOUR,h.DAY],day:[h.DAY,h.WEEK],wk:[h.WEEK,h.MONTH],mon:[h.MONTH,h.YEAR],yr:[h.YEAR,h.DECADE],dec:[h.DECADE,h.CENTURY]};l.mapTypes={normal:k,satellite:p,hybrid:G_HYBRID_MAP,physical:r,moon:G_MOON_VISIBLE_MAP,sky:G_SKY_VISIBLE_MAP};l.dateParsers={hybrid:o.hybridParser,iso8601:h.parseIso8601DateTime,gregorian:o.gregorianParser};l.themes={red:new m(),blue:new m({iconImage:j+"blue-dot.png",color:"#5A7ACF",eventIconImage:"blue-circle.png"}),green:new m({iconImage:j+"green-dot.png",color:"#19CF54",eventIconImage:"green-circle.png"}),ltblue:new m({iconImage:j+"ltblue-dot.png",color:"#5ACFCF",eventIconImage:"ltblue-circle.png"}),purple:new m({iconImage:j+"purple-dot.png",color:"#8E67FD",eventIconImage:"purple-circle.png"}),orange:new m({iconImage:j+"orange-dot.png",color:"#FF9900",eventIconImage:"orange-circle.png"}),yellow:new m({iconImage:j+"yellow-dot.png",color:"#ECE64A",eventIconImage:"yellow-circle.png"}),pink:new m({iconImage:j+"pink-dot.png",color:"#E14E9D",eventIconImage:"pink-circle.png"})};i.TimeMap=l;i.TimeMapFilterChain=q;i.TimeMapDataset=o;i.TimeMapTheme=m;i.TimeMapItem=e})();if(!this.JSON){JSON={}}(function(){function f(n){return n<10?"0"+n:n}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(key){return this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z"};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];if(typeof c==="string"){return c}return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==="object"&&typeof value.toJSON==="function"){value=value.toJSON(key)}if(typeof rep==="function"){value=rep.call(holder,key,value)}switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value){return"null"}gap+=indent;partial=[];if(typeof value.length==="number"&&!value.propertyIsEnumerable("length")){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||"null"}v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]";gap=mind;return v}if(rep&&typeof rep==="object"){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==="string"){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}";gap=mind;return v}}if(typeof JSON.stringify!=="function"){JSON.stringify=function(value,replacer,space){var i;gap="";indent="";if(typeof space==="number"){for(i=0;i<space;i+=1){indent+=" "}}else{if(typeof space==="string"){indent=space}}rep=replacer;if(replacer&&typeof replacer!=="function"&&(typeof replacer!=="object"||typeof replacer.length!=="number")){throw new Error("JSON.stringify")}return str("",{"":value})}}if(typeof JSON.parse!=="function"){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==="object"){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver==="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")}}})();TimeMap.prototype.toJSON=function(){var a={options:this.makeOptionData,datasets:this.datasets};a=this.addExportData(a);return a};TimeMap.prototype.makeOptionData=function(){var f={},g=TimeMap.util;var a=this.opts;for(var e in a){if(a.hasOwnProperty(e)){f[e]=a[e]}}if(f.mapCenter){f.mapCenter=g.makePoint(f.mapCenter)}if(f.mapType){f.mapType=g.revHash(TimeMap.mapTypes,f.mapType)}if(f.mapTypes){var d=[],b;for(var i=0;i<f.mapTypes.length;i++){b=g.revHash(TimeMap.mapTypes,f.mapTypes[i]);if(b){d.push(b)}}f.mapTypes=d}if(f.bandIntervals){f.bandIntervals=g.revHash(TimeMap.intervals,f.bandIntervals)}var h=[],j,c;for(c in this.datasets){if(this.datasets.hasOwnProperty(c)){j=g.revHash(TimeMapDataset.themes,this.datasets[c].opts.theme);if(j){h.push(j)}}}f.themes=j;return f};TimeMap.prototype.addExportData=function(a){a.options=a.options||{};a.options.saveOpts=this.opts.saveOpts;return a};TimeMapDataset.prototype.toJSON=function(){var a={title:this.getTitle(),theme:TimeMap.util.revHash(TimeMapDataset.themes,this.opts.theme),data:{type:"basic",value:this.getItems()}};a=this.addExportData(a);return a};TimeMapDataset.prototype.addExportData=function(a){a.options=a.options||{};a.options.saveOpts=this.opts.saveOpts;return a};TimeMapItem.prototype.toJSON=function(){var d={title:this.getTitle(),options:{description:this.opts.description}};if(this.event){d.start=this.event.getStart();if(!this.event.isInstant()){d.end=this.event.getEnd()}}if(this.placemark){var a=TimeMap.util;var c=function(h,g,i){h=h||a.getPlacemarkType(g);switch(h){case"marker":i.point=a.makePoint(g.getLatLng());break;case"polyline":case"polygon":var f=[];for(var e=0;e<g.getVertexCount();e++){f.push(a.makePoint(g.getVertex(e)))}i[h]=f;break}return i};if(this.getType()=="array"){d.placemarks=[];for(var b=0;b<this.placemark.length;b++){d.placemarks.push(c(false,this.placemark[b],{}))}}else{d=c(this.getType(),this.placemark,d)}}d=this.addExportData(d);return d};TimeMapItem.prototype.addExportData=function(a){a.options=a.options||{};a.options.saveOpts=this.opts.saveOpts;return a};TimeMap.util.revHash=function(b,c){for(var a in b){if(b[a]==c){return a}}return null};TimeMap.prototype.clear=function(){this.eachItem(function(a){a.event=a.placemark=null});this.map.clearOverlays();this.eventSource.clear();this.datasets=[]};TimeMap.prototype.deleteDataset=function(a){this.datasets[a].clear();delete this.datasets[a]};TimeMap.prototype.hideDataset=function(a){if(a in this.datasets){this.datasets[a].hide()}};TimeMap.prototype.hideDatasets=function(){this.each(function(a){a.visible=false});this.filter("map");this.filter("timeline")};TimeMap.prototype.showDataset=function(a){if(a in this.datasets){this.datasets[a].show()}};TimeMap.prototype.showDatasets=function(){this.each(function(a){a.visible=true});this.filter("map");this.filter("timeline")};TimeMap.prototype.changeMapType=function(a){if(a==this.opts.mapType){return}if(typeof(a)=="string"){a=TimeMap.mapTypes[a]}if(!a){return}this.opts.mapType=a;this.map.setMapType(a)};TimeMap.prototype.refreshTimeline=function(){var b=this.timeline.getBand(0);var a=b.getCenterVisibleDate();if(TimeMap.util.TimelineVersion()=="1.2"){b.getEventPainter().getLayout()._laidout=false}this.timeline.layout();b.setCenterVisibleDate(a)};TimeMap.prototype.changeTimeIntervals=function(c){if(c==this.opts.bandIntervals){return}if(typeof(c)=="string"){c=TimeMap.intervals[c]}if(!c){return}this.opts.bandIntervals=c;var d=function(g,f){g.getEther()._interval=Timeline.DateTime.gregorianUnitLengths[f];g.getEtherPainter()._unit=f};var e=this.timeline.getBand(0);var b=e.getCenterVisibleDate();for(var a=0;a<this.timeline.getBandCount();a++){d(this.timeline.getBand(a),c[a])}e.getEventPainter().getLayout()._laidout=false;this.timeline.layout();e.setCenterVisibleDate(b)};TimeMap.prototype.scrollTimeline=function(b){var d=this.timeline.getBand(0);var a=d.getCenterVisibleDate();var c=a.getFullYear()+parseFloat(b);a.setFullYear(c);d.setCenterVisibleDate(a)};TimeMapDataset.prototype.clear=function(){this.each(function(a){a.clear()});this.items=[];this.timemap.timeline.layout()};TimeMapDataset.prototype.deleteItem=function(b){for(var a=0;a<this.items.length;a++){if(this.items[a]==b){b.clear();this.items.splice(a,1);break}}this.timemap.timeline.layout()};TimeMapDataset.prototype.show=function(){if(!this.visible){this.visible=true;this.timemap.filter("map");this.timemap.filter("timeline");this.timemap.timeline.layout()}};TimeMapDataset.prototype.hide=function(){if(this.visible){this.visible=false;this.timemap.filter("map");this.timemap.filter("timeline")}};TimeMapDataset.prototype.changeTheme=function(a){this.opts.theme=a;this.each(function(b){b.changeTheme(a)});this.timemap.timeline.layout()};TimeMapItem.prototype.show=function(){this.showEvent();this.showPlacemark();this.visible=true};TimeMapItem.prototype.hide=function(){this.hideEvent();this.hidePlacemark();this.visible=false};TimeMapItem.prototype.clear=function(){if(this.event){this.dataset.timemap.timeline.getBand(0).getEventSource()._events._events.remove(this.event)}if(this.placemark){this.hidePlacemark();var b=function(d){try{this.map.removeOverlay(d)}catch(c){}};if(this.getType()=="array"){for(var a=0;a<this.placemark.length;a++){b(this.placemark[a])}}else{b(this.placemark)}}this.event=this.placemark=null};TimeMapItem.prototype.createEvent=function(b,d){var a=(d===undefined);var f=this.getTitle();var c=new Timeline.DefaultEventSource.Event(b,d,null,null,a,f,null,null,null,this.opts.theme.eventIcon,this.opts.theme.eventColor,null);c.item=this;this.event=c;this.dataset.eventSource.add(c)};TimeMapItem.prototype.changeTheme=function(c){this.opts.theme=c;if(this.placemark){var b=function(d,e,f){e=e||TimeMap.util.getPlacemarkType(d);switch(e){case"marker":d.setImage(f.icon.image);break;case"polygon":d.setFillStyle({color:c.fillColor,opacity:c.fillOpacity});case"polyline":d.setStrokeStyle({color:c.lineColor,weight:c.lineWeight,opacity:c.lineOpacity});break}};if(this.getType()=="array"){for(var a=0;a<this.placemark.length;a++){b(this.placemark[a],false,c)}}else{b(this.placemark,this.getType(),c)}}if(this.event){this.event._color=c.eventColor;this.event._icon=c.eventIcon}};TimeMapItem.prototype.getNextPrev=function(a,b){if(!this.event){return}var e=this.dataset.timemap.timeline.getBand(0).getEventSource();var c=a?e.getEventReverseIterator(new Date(e.getEarliestDate().getTime()-1),this.event.getStart()):e.getEventIterator(this.event.getStart(),new Date(e.getLatestDate().getTime()+1));var d=null;while(d===null){if(c.hasNext()){d=c.next().item;if(b&&d.dataset!=this.dataset){d=null}}else{break}}return d};TimeMapItem.prototype.getNext=function(a){return this.getNextPrev(false,a)};TimeMapItem.prototype.getPrev=function(a){return this.getNextPrev(true,a)};TimeMap.Param=function(a){this.get=a.get;this.set=a.set;this.setConfig=a.setConfig||function(b,c){};this.fromString=a.fromStr||function(b){return b};this.toString=a.toStr||function(b){return b.toString()};this.setString=function(b,c){this.set(this.fromString(c))}};TimeMap.prototype.setState=function(b){var c=TimeMap.state.params,a;for(a in b){if(b.hasOwnProperty(a)){if(a in c){c[a].set(this,b[a])}}}};TimeMap.prototype.getState=function(){var b={},c=TimeMap.state.params,a;for(a in c){if(c.hasOwnProperty(a)){b[a]=c[a].get(this)}}return b};TimeMap.prototype.initState=function(){var a=this;a.setStateFromUrl();window.onhashchange=function(){a.setStateFromUrl()}};TimeMap.prototype.setStateFromUrl=function(){this.setState(TimeMap.state.fromUrl())};TimeMap.prototype.getStateParamString=function(){return TimeMap.state.toParamString(this.getState())};TimeMap.prototype.getStateUrl=function(){return TimeMap.state.toUrl(this.getState())};TimeMap.state={fromUrl:function(){var d=location.hash.substring(1).split("&"),f=TimeMap.state.params,c={},a,e,b;for(a=0;a<d.length;a++){if(d[a]!=""){e=d[a].split("=");b=e[0];if(b&&b in f){c[b]=f[b].fromString(decodeURI(e[1]))}}}return c},toParamString:function(c){var d=TimeMap.state.params,a=[],b;for(b in c){if(c.hasOwnProperty(b)){if(b in d){a.push(b+"="+encodeURI(d[b].toString(c[b])))}}}return a.join("&")},toUrl:function(b){var c=TimeMap.state.toParamString(b),a=location.href.split("#")[0];return a+"#"+c},setConfig:function(a,c){var d=TimeMap.state.params,b;for(b in c){if(c.hasOwnProperty(b)){if(b in d){d[b].setConfig(a,c[b])}}}},setConfigFromUrl:function(a){TimeMap.state.setConfig(a,TimeMap.state.fromUrl())}};TimeMap.state.params={zoom:new TimeMap.Param({get:function(a){return a.map.getZoom()},set:function(a,b){a.map.setZoom(b)},setConfig:function(a,b){a.options=a.options||{};a.options.mapZoom=b},fromStr:function(a){return parseInt(a)}}),center:new TimeMap.Param({get:function(a){return a.map.getCenter()},set:function(a,b){a.map.setCenter(b)},setConfig:function(a,b){a.options=a.options||{};a.options.mapCenter=b},fromStr:function(a){var b=a.split(",");if(b.length<2){return null}return new GLatLng(parseFloat(b[0]),parseFloat(b[1]))},toStr:function(a){return a.lat()+","+a.lng()}}),date:new TimeMap.Param({get:function(a){return a.timeline.getBand(0).getCenterVisibleDate()},set:function(a,b){a.scrollToDate(b)},setConfig:function(a,b){a.scrollTo=b},fromStr:function(a){return TimeMapDataset.hybridParser(a)},toStr:function(a){return TimeMap.util.formatDate(a)}}),selected:new TimeMap.Param({get:function(a){var b=a.getItems(),c=b.length-1;while(c>=0&&c--){if(b[c].selected){break}}return c},set:function(a,c){if(c>=0){var b=a.getItems()[c];if(b){b.openInfoWindow()}}},fromStr:function(a){return parseInt(a)}})};TimeMap.loaders.flickr=function(b){var a=new TimeMap.loaders.jsonp(b);a.preload=function(c){return c.items};a.transform=function(d){var c={title:d.title,start:d.date_taken,point:{lat:d.latitude,lon:d.longitude},options:{description:d.description.replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&quot;/g,'"')}};if(b.transformFunction){c=b.transformFunction(c)}return c};return a};TimeMap.loaders.georss=function(b){var a=new TimeMap.loaders.remote(b);a.parse=TimeMap.loaders.georss.parse;return a};TimeMap.loaders.georss.parse=function(n){var j=[],w,l,f,r;l=GXml.parse(n);var a=TimeMap.util;var c=a.getTagValue,s=a.getNodeList,p=a.makePoint,b=a.makePoly,g=a.formatDate,e=a.nsMap;e.georss="http://www.georss.org/georss";e.gml="http://www.opengis.net/gml";e.geo="http://www.w3.org/2003/01/geo/wgs84_pos#";e.kml="http://www.opengis.net/kml/2.2";var u=(l.firstChild.tagName=="rss")?"rss":"atom";var q=(u=="rss"?"item":"entry");f=s(l,q);for(var o=0;o<f.length;o++){r=f[o];w={options:{}};w.title=c(r,"title");q=(u=="rss"?"description":"summary");w.options.description=c(r,q);var v=s(r,"TimeStamp","kml");if(v.length>0){w.start=c(v[0],"when","kml")}if(!w.start){v=s(r,"TimeSpan","kml");if(v.length>0){w.start=c(v[0],"begin","kml");w.end=c(v[0],"end","kml")||g(new Date())}}if(!w.start){if(u=="rss"){var t=new Date(Date.parse(c(r,"pubDate")));w.start=g(t)}else{w.start=c(r,"updated")}}var h=false;PLACEMARK:while(!h){var m,k;m=c(r,"point","georss");if(m){w.point=p(m);break PLACEMARK}v=s(r,"Point","gml");if(v.length>0){m=c(v[0],"pos","gml");if(!m){m=c(v[0],"coordinates","gml")}if(m){w.point=p(m);break PLACEMARK}}if(c(r,"lat","geo")){m=[c(r,"lat","geo"),c(r,"long","geo")];w.point=p(m);break PLACEMARK}m=c(r,"line","georss");if(m){w.polyline=b(m);break PLACEMARK}m=c(r,"polygon","georss");if(m){w.polygon=b(m);break PLACEMARK}v=s(r,"LineString","gml");if(v.length>0){k="polyline"}else{v=s(r,"Polygon","gml");if(v.length>0){k="polygon"}}if(v.length>0){m=c(v[0],"posList","gml");if(!m){m=c(v[0],"coordinates","gml")}if(m){w[k]=b(m);break PLACEMARK}}h=true}j.push(w)}l=null;f=null;r=null;v=null;return j};TimeMap.loaders.gss=function(b){var a=new TimeMap.loaders.jsonp(b);if(!a.url){a.url="http://spreadsheets.google.com/feeds/list/"+b.key+"/1/public/values?alt=json-in-script&callback="}a.map=b.map||TimeMap.loaders.gss.map;a.preload=function(c){return c.feed.entry};a.transform=function(g){var e=a.map;var d=function(i){var h=g["gsx$"+e[i]];if(h){return h.$t}else{return false}};var f={title:d("title"),start:d("start"),end:d("end"),point:{lat:d("lat"),lon:d("lon")},options:{description:d("description")}};var c=b.transformFunction;if(c){f=c(f)}return f};return a};TimeMap.loaders.gss.map={title:"title",description:"description",start:"start",end:"end",lat:"lat",lon:"lon"};TimeMap.loaders.jsonp=function(b){var a=new TimeMap.loaders.remote(b);a.load=function(e,f){var d=this.getCallbackName(e,f),c=document.createElement("script");c.src=this.url+"TimeMap.loaders.cb."+d;document.body.appendChild(c)};return a};TimeMap.loaders.json_string=function(b){var a=new TimeMap.loaders.remote(b);a.parse=JSON.parse;return a};TimeMap.loaders.json=TimeMap.loaders.jsonp;TimeMap.loaders.kml=function(b){var a=new TimeMap.loaders.remote(b);a.parse=TimeMap.loaders.kml.parse;return a};TimeMap.loaders.kml.parse=function(t){var g=[],s,n,e,o,l,h;n=GXml.parse(t);var a=TimeMap.util;var c=a.getTagValue,q=a.getNodeList,m=a.makePoint,b=a.makePoly,f=a.formatDate;var d=function(w,v){var i=false;var u=q(w,"TimeStamp");if(u.length>0){v.start=c(u[0],"when");i=true}else{u=q(w,"TimeSpan");if(u.length>0){v.start=c(u[0],"begin");v.end=c(u[0],"end")||f(new Date());i=true}}if(!i){var j=w.parentNode;if(j.nodeName=="Folder"||j.nodeName=="Document"){d(j,v)}j=null}};e=q(n,"Placemark");for(l=0;l<e.length;l++){o=e[l];s={options:{}};s.title=c(o,"name");s.options.description=c(o,"description");d(o,s);var r,k,p;s.placemarks=[];r=q(o,"Point");for(h=0;h<r.length;h++){p={point:{}};k=c(r[h],"coordinates");p.point=m(k,1);s.placemarks.push(p)}r=q(o,"LineString");for(h=0;h<r.length;h++){p={polyline:[]};k=c(r[h],"coordinates");p.polyline=b(k,1);s.placemarks.push(p)}r=q(o,"Polygon");for(h=0;h<r.length;h++){p={polygon:[]};k=c(r[h],"coordinates");p.polygon=b(k,1);s.placemarks.push(p)}g.push(s)}e=q(n,"GroundOverlay");for(l=0;l<e.length;l++){o=e[l];s={options:{},overlay:{}};s.title=c(o,"name");s.options.description=c(o,"description");d(o,s);r=q(o,"Icon");s.overlay.image=c(r[0],"href");r=q(o,"LatLonBox");s.overlay.north=c(r[0],"north");s.overlay.south=c(r[0],"south");s.overlay.east=c(r[0],"east");s.overlay.west=c(r[0],"west");g.push(s)}n=null;e=null;o=null;r=null;return g};TimeMap.loaders.metaweb=function(b){var a=new TimeMap.loaders.jsonp(b),d=b.query||{},c=encodeURIComponent(JSON.stringify({qname:{query:d}}));a.HOST=b.host||"http://www.freebase.com";a.QUERY_SERVICE=b.service||"/api/service/mqlread";a.url=a.HOST+a.QUERY_SERVICE+"?queries="+c+"&callback=";a.preload=function(e){var f=e.qname;if(f.code.indexOf("/api/status/ok")!==0){return[]}return f.result};return a};TimeMap.loaders.progressive=function(o){var l=o.loader,j=o.type;if(!l){var e=(typeof(j)=="string")?TimeMap.loaders[j]:j;l=new e(o)}function b(p){if(typeof(p)=="string"){p=TimeMapDataset.hybridParser(p)}return p}var h=l.url,i=l.load,d=o.interval,n=o.formatDate||TimeMap.util.formatDate,k=o.formatUrl,m=b(o.start),f=b(o.dataMinDate),c=b(o.dataMaxDate),g={};if(!k){k=function(q,r,p){return q.replace("[start]",n(r)).replace("[end]",n(p))}}var a=function(p){var q=p.timemap.timeline.getBand(0);q.addOnScrollListener(function(){var s=q.getCenterVisibleDate(),t=Math.floor((s.getTime()-m.getTime())/d),r=m.getTime()+(d*t);nextBlockTime=r+d,prevBlockTime=r-d,callback=function(){p.timemap.timeline.layout()};if((!c||r<c.getTime())&&(!f||r>f.getTime())&&!g[t]){l.load(p,callback,new Date(r),t)}if(nextBlockTime<q.getMaxDate().getTime()&&(!c||nextBlockTime<c.getTime())&&!g[t+1]){l.load(p,callback,new Date(nextBlockTime),t+1)}if(prevBlockTime>q.getMinDate().getTime()&&(!f||prevBlockTime>f.getTime())&&!g[t-1]){l.load(p,callback,new Date(prevBlockTime),t-1)}});a=false};l.load=function(r,t,s,q){s=b(s)||m;q=q||0;var p=new Date(s.getTime()+d);g[q]=true;l.url=k(h,s,p);i.call(l,r,function(){if(a){a(r)}t()})};return l};