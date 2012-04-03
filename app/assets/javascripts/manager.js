//= require_tree ./scroller
//= require plupload/plupload
//= require plupload/plupload.html5
//= require date-constants

/********************************FmClient********************************/
function FmManager() {
    this.topPanel = new FmTopPanel(this);
    this.mainPanel = new FmMainPanel(this);
    this.uploader = new FmUploader(this);
    this.webService = new FmWebService(this);

    this.state = {
        lastSearch: {
            tag: null,
            keywords: null
        }
    };
    this.elements = {
        $loader: $("body > .loading")
    };
}
FmManager.prototype.init = function() {
    // init components
    this.topPanel.init();
    this.mainPanel.init();
    this.uploader.init();
    // init slide event
    var that = this;
    function slideView(e) {
        that.topPanel.slideView();
        that.mainPanel.slideView();
        if(e) e.stopPropagation();
    }
    this.topPanel.clickLeftBtn(slideView);
    this.mainPanel.clickRightBtn(slideView);
    // load data
    this.search("all", null);
}
FmManager.prototype.showLoading = function() {
    this.elements.$loader.fadeIn();
}
FmManager.prototype.hideLoading = function() {
    this.elements.$loader.fadeOut();
}
// do a new search
FmManager.prototype.search = function(tag, keywords) {
    // sotre search terms
    this.state.lastSearch.tag = tag;
    this.state.lastSearch.keywords = keywords;
    // clear previous result
    this.mainPanel.clearResult();
    // show loading
    this.showLoading();
    // do search
    var that = this;
    this.webService.docsSearch(tag, keywords, function(response) {
        if(!response.error) {
            that.mainPanel.showResult(response.result);
            that.hideLoading();
        }
        else {  // handle error
            
        }
    });
}
// continue last search
FmManager.prototype.more = function() {
    // continue last search
    var tag = this.state.lastSearch.tag;
    var keywords = this.state.lastSearch.keywords;
    // do the search
    var that = this;
    this.mainPanel.showLoadingMore();
    this.webService.docsSearch(tag, keywords, function(response) {
        if(!response.error) {
            that.mainPanel.showMoreResult(response.result);
            that.mainPanel.hideLoadingMore();
        }
        else {  // handle error
            
        }
    });
}
/*******************************FmTopPanel*******************************/
function FmTopPanel(manager) {
    this.manager = manager;
    this.state = {
        isPrimaryView: true,
        expanded: false,
        currentTab: 'Favourite'
    };
    this.elements = {
        topbarBtns: "#top .tab .button",
        entry: "#top .entries .entry",
        tabs: "#top .content .tabs",
        content: "#top .content",
        mainPanel: "#main",
        bottomBtns: '#top .bottombar .button'
    };
    this.cached = {
        $me: $("#top"),
        $primaryTitle: $("#top .primary .title"),
        $secondaryTitle: $("#top .secondary .title"),
        $slides: $('#top .slide'),
        $mainView: $('#top > .wrapper > .main'),
        btns: {
            $search: $('#top .topbar .search'),
            $left: $('#top .slide.secondary .button.arrow-left-icon'),
            $upload: $('#top .topbar .upload-icon.button'),
            $editTag: $('#top .topbar .slide.primary .button.edit-icon'),
            $addTag: $('#top .topbar .slide.primary .button.plus-icon')
        }
    };
    // scroller
    var scrollContainer = $(this.elements.content).get(0);
    var scrollContent = $(this.elements.tabs).get(0);
    this.scroller = new FmScroller(scrollContainer, scrollContent, scrollContainer);
}
FmTopPanel.prototype.init = function() {
    // toggle event
    var that = this;
    function onToggle(e) {
        that.toggle();
        if(e) e.stopPropagation();
    }
    this.cached.$primaryTitle.click(onToggle);
    $(this.elements.mainPanel).click(function(e) {
        if(that.state.expanded)
            onToggle();
    });
    // resize event
    $(window).resize(function() {
        that.updateHeight();
    });
     $(document).keydown(function(){ 
        if(event.keyCode == 13) {
          if(that.cached.btns.$search.width()==160){
              that.manager.mainPanel.clearResult();
              that.manager.showLoading(); 
              $.get(
                "search",
                {
                  start:0,
                  limit:10,
                  keywords:that.cached.btns.$search.val()
                 },
                 function(response,status,xhr){
                    // show loading
                    that.mainPanel.showResult(response.result);
                    that.hideLoading();
                 },
                 "json"
               );
            }
        }
    });  
    this.updateHeight();
    // click entry event
    var additionalClass = {
        All: 'all',
        Recent: 'recent' 
    };
    this.cached.$me.delegate(this.elements.entry, "fmClick", function() {
        that.toggle();
        var tag = $(this).children('h3').html().trim();
        that.cached.$primaryTitle.empty()
                                 .append('<span class="tag clickable ' + 
                                            additionalClass[tag] + '">' + 
                                            tag + '</span>'); 
        that.manager.search(tag, null);
    });
    // bottom bar click
    var btn2Tab = {
        'Favourite':    $(this.elements.tabs + ' > .fav'),
        'Tags':         $(this.elements.tabs + ' > .tags'),
        'System':       $(this.elements.tabs + ' > .system')
    };
    var currentTab = btn2Tab.Favourite;
    var currentBtn = $(this.elements.bottomBtns + '.fav-icon');
    $(this.elements.bottomBtns).click(function(e) {
        // tab
        var tabName = $(this).text().trim();
        that.state.currentTab = tabName;
        currentTab.removeClass('current');
        currentTab = btn2Tab[tabName];
        currentTab.addClass('current');
        // btn
        currentBtn.removeClass('current');
        currentBtn = $(this);
        currentBtn.addClass('current'); 
        // toggle topbar buttons
        if(tabName == 'Favourite' || tabName == 'System') {
            that.cached.btns.$addTag.hide();
            that.cached.btns.$editTag.hide();
        } 
        else if(tabName == 'Tags') {
            that.cached.btns.$addTag.show();
            that.cached.btns.$editTag.show();
        }
    });
}
FmTopPanel.prototype.toggle = function() {
    this.state.expanded = !this.state.expanded;

    this.cached.$me.toggleClass("expanded");

    if(this.state.expanded) {//expanding
        // toggle btns
        this.cached.btns.$search.hide();
        this.cached.btns.$upload.hide();
        if(this.state.currentTab == 'Tags') {
            this.cached.btns.$addTag.show();
            this.cached.btns.$editTag.show();
        }
        // animate toggle
        var h = 0.95 *　$(window).height() - 48;
        this.cached.$mainView.height(h+'px')
        // activate scroller of top panel
        this.scroller.activate();
    }
    else {
        // activate scroller of main panel
        this.manager.mainPanel.scroller.activate();
        // animate toggle
        this.cached.$mainView.height('0px');
        // toggle btns
        this.cached.btns.$editTag.hide();
        this.cached.btns.$addTag.hide();
        this.cached.btns.$search.show();
        this.cached.btns.$upload.show();
   }
}
FmTopPanel.prototype.slideView = function() {
    if(this.state.isPrimaryView) {
        this.state.isPrimaryView = false;
        this.cached.$slides.animate({"left":"-=100%"});
    }
    else {
        this.state.isPrimaryView = true;
        this.cached.$slides.animate({"left":"+=100%"});
    }
}
FmTopPanel.prototype.clickLeftBtn = function(callback) {
    this.cached.btns.$left.click(callback);
}
// TO-DO: better way to animate toggle and decide height
FmTopPanel.prototype.updateHeight = function() {
    var h = $(window).height();
    var contentH = 0.95*h - 96;
    $(this.elements.content).height(contentH);
    if (this.state.expanded) {
        var h = contentH + 48;
        this.cached.$mainView.height(h+'px')
    }
    this.scroller.updateDimensions();
}
/******************************FmMainPanel*******************************/
function FmMainPanel(manager) {
    this.manager = manager;
    this.elements = {
        me: "#main.slider",
        primaryView: "#main.slider > .slide.primary",
        secondaryView: "#main.slider > .slide.secondary",
        entries: "#main .entry.clickable",
        $result: $('#main > .slide.primary > .result'),
        $slides: $('#main .slide')
    };
    this.state = {
        isPrimaryView: true,
        entriesTotal: 0,
        entriesNum: 0 
    };
    // related to search result
    this.elements.$moreEntry = 
        $( '<div class="entry more">' +
           '<div class="info"><h4><em>More</em></h4></div>' + 
           '<ul class="buttons">' + 
           '<li class="button arrow-down-icon"></li>' + 
           '</ul>' +
           '</div>' )
    this.resultHtmlBuilder = new FmResultHtmlBuilder();
    // scroller for primary view
    var body = $("body")[0];
    var scrollContainer = $(this.elements.primaryView).get(0);
    var scrollContent = this.elements.$result.get(0);
    this.scroller = new FmScroller(scrollContainer, scrollContent, body);
    // scroller for secondary view
    var scrollContainer = $(this.elements.secondaryView).get(0);
    var scrollContent = $(this.elements.secondaryView + ' > .wrapper').get(0);
    this.scroller2 = new FmScroller(scrollContainer, scrollContent, body);
}
FmMainPanel.prototype.init = function() {
    // init variables 
    var mainPanel = this;
    var manager = this.manager;
    // windows resize
    $(window).resize(function(e) {
       mainPanel.resize();
    });
    this.resize();
    // click for more entries
    this.elements.$moreEntry.click(function(e) {
        manager.more();
    });
    // activate the scroller
    this.scroller.activate();
}
FmMainPanel.prototype.slideView = function() {
    if(this.state.isPrimaryView) {
        this.state.isPrimaryView = false;
        this.elements.$slides.animate({"left":"-=100%"});
        this.scroller2.activate();
    }
    else {
        this.state.isPrimaryView = true;
        this.elements.$slides.animate({"left":"+=100%"});
        this.scroller.activate();
    }
}
FmMainPanel.prototype.resize = function() {
    if (this.state.isPrimaryView) {
        this.scroller.updateDimensions();
    }
    else {
        this.scroller2.updateDimensions();
    }
}
FmMainPanel.prototype.clickRightBtn = function(callback) {
    $(this.elements.me).delegate(
            this.elements.entries, 
            "fmClick", 
            callback);
}
FmMainPanel.prototype.clearResult = function() {
    // remove old result
    var $result = this.elements.$result;
    $result.hide();
    this.elements.$moreEntry.detach();
    $result.children().remove();
}
FmMainPanel.prototype.showResult = function(result) {
    var entries = result.entries;
    var $result = this.elements.$result;
    // update counter
    this.state.entriesNum = entries.length;
    this.state.entriesTotal = result.total;
    // build new result HTML elements
    var resultHtml = this.resultHtmlBuilder.newHtml(entries);
    $result.append('<div style="width: 100%; padding-top: 3.5em;"></div>');
    $result.append('<div style="width: 100%; padding-bottom: 0.5em;">')
    $result.append(resultHtml);
    // toggle more indicator
    this.appendMoreEntry();
    // show it
    var that = this;
    $result.fadeIn('fast', function() {
        that.resize();
    });
}
FmMainPanel.prototype.showMoreResult = function(moreResult) {
    var entries = moreResult.entries;
    // update counter
    this.state.entriesNum += entries.length;
    // build more result HTML elements
    var moreResultHtml = this.resultHtmlBuilder.moreHtml(entries);
    // append
    var $moreResultHtml = $(moreResultHtml);
    this.elements.$moreEntry.detach();
    $moreResultHtml.hide();
    this.elements.$result.append($moreResultHtml);
    this.appendMoreEntry();
    // show it
    var that = this;
    $moreResultHtml.fadeIn('fast', function(){
        that.resize();
    });
}
FmMainPanel.prototype.appendMoreEntry = function() {
    if (this.state.entriesNum < this.state.entriesTotal) {
        this.elements.$moreEntry.appendTo(this.elements.$result);
    }
}
FmMainPanel.prototype.showLoadingMore = function() {
    this.elements.$moreEntry.addClass('loading');
}
FmMainPanel.prototype.hideLoadingMore = function() {
    this.elements.$moreEntry.removeClass('loading');
}
/***************************FmScroller**************************************/
/**
 * @para container dom element of container
 * @para content dom element of content
 */
function FmScroller(container, content, scrollbarContainer) {
    // init variables
    this.container = container;
    this.content = content;
    // init scrollbar
    this.scrollbar = new FmScrollBar(container, content, scrollbarContainer);
    // init scroller
    var render = this.getRenderFunc(window, container, content, 
                                    this.scrollbar.$bar.get(0), 
                                    scrollbarContainer, 
                                    this.scrollbar.topEnd, 
                                    this.scrollbar.bottomEnd);
    this.scroller = new Scroller(render, {
        scrollingX: false
    });
    // activate
    this.activated = false;
    FmScroller.instances.push(this);
    // handle events
    this.initEventHandler();
}
FmScroller.instances = [];
FmScroller.prototype.activate = function() {
    // only one scroller is allowed to be active
    for(i in FmScroller.instances) {
        FmScroller.instances[i].deactivate();
    }
    this.activated = true;
    this.updateDimensions();
}
FmScroller.prototype.deactivate = function() {
    this.activated = false;
    this.scrollbar.$scrollbar.hide();
}
FmScroller.prototype.initEventHandler = function() {
    var that = this;
    if ('ontouchstart' in window) {
		this.container.addEventListener("touchstart", function(e) {
            if (!that.activated || 
			    // Don't react if initial down happens on a form element
			    e.target.tagName.match(/input|textarea|select/i) ) {
				return;
			}
			that.scroller.doTouchStart(e.touches, e.timeStamp);
			e.preventDefault();
		}, false);

		document.addEventListener("touchmove", function(e) {
            if (!that.activated)
                return;
			that.scroller.doTouchMove(e.touches, e.timeStamp);
		}, false);

		document.addEventListener("touchend", function(e) {
		    if (!that.activated)
                return;
        	that.scroller.doTouchEnd(e.timeStamp);
		}, false);
	} else {
		var mousedown = false;
        var moved = false;
        var $clicked = [];

		this.container.addEventListener("mousedown", function(e) {
			if (!that.activated ||
                // Don't react if initial down happens on a form element
			    e.target.tagName.match(/input|textarea|select/i) ) {
				return;
			}
			
            // if scroller in motion, won't trigger click event
            moved = false || that.scroller.__isDecelerating;
			mousedown = true;
	
            setTimeout(function() { // show click effect after delay
                if (moved)
                    return;
                var $newClicked = $(e.target).closest('.clickable');
                $newClicked.addClass('clicked');
                $clicked.push($newClicked);
            i}, 100);
            
            that.scroller.doTouchStart([{
				pageX: e.pageX,
				pageY: e.pageY
			}], e.timeStamp);

            that.scrollbar.show();
		}, false);

		document.addEventListener("mousemove", function(e) {
            if (!that.activated || !mousedown)
				return;

            moved = true;

			that.scroller.doTouchMove([{
				pageX: e.pageX,
				pageY: e.pageY
			}], e.timeStamp);
		}, false);

		document.addEventListener("mouseup", function(e) {
			if (!that.activated || !mousedown) {
				return;
			}

            if(!moved)
                $(e.target).closest('.clickable').trigger('fmClick');
            if($clicked.length > 0) {
                setTimeout(function() {
                    for(i in $clicked)
                        $clicked[i].removeClass('clicked');
                }, 100);
            }

            that.scroller.doTouchEnd(e.timeStamp);
            that.scrollbar.hide();

			mousedown = false;
		}, false);
		
	} 
}
FmScroller.prototype.updateDimensions = function() {
    this.scroller.setDimensions(
            this.container.clientWidth, 
            this.container.clientHeight, 
            this.content.offsetWidth, 
            this.content.offsetHeight);
    this.scrollbar.updateDimensions();
}
FmScroller.prototype.getRenderFunc = function(global, container, content, 
                                              scrollbar, scrollbarContainer,
                                              scrollbarTopEnd, 
                                              scrollbarBottomEnd) {
	var docStyle = document.documentElement.style;
	
	var engine;
	if (global.opera && Object.prototype.toString.call(opera) === '[object Opera]') {
		engine = 'presto';
	} else if ('MozAppearance' in docStyle) {
		engine = 'gecko';
	} else if ('WebkitAppearance' in docStyle) {
		engine = 'webkit';
	} else if (typeof navigator.cpuClass === 'string') {
		engine = 'trident';
	}
	
	var vendorPrefix = {
		trident: 'ms',
		gecko: 'Moz',
		webkit: 'Webkit',
		presto: 'O'
	}[engine];
	
	var helperElem = document.createElement("div");
	var undef;

	var perspectiveProperty = vendorPrefix + "Perspective";
	var transformProperty = vendorPrefix + "Transform";

    var topShown = false;
    var bottomShown = false;

    // special effect for scrollbar    
    function topAndHeightForScrollbar(top) {
        var h = parseInt(scrollbar.getAttribute('normalHeight'));
        var H = scrollbarContainer.clientHeight - 2 * FmScrollBar.minTop;
        var f = H / content.offsetHeight; 
        top *=f;
        /*if ( top < 0 && !topShown) {
            scrollbarTopEnd.style.display = 'block';
            topShown = true;
            console.debug('overflow top');
        }
        else if ( top > (H - scrollbar.offsetHeight) && !bottomShown) {
            scrollbarBottomEnd.style.display = 'block';
            bottomShown = true;
            console.debug('overflow bottom');
        }
        else if ( 0 <= top && top <= (H - scrollbar.offsetHeight)){
            if (topShown) {
                scrollbarTopEnd.style.display = 'none';
                topShown = false;
                console.debug('restore top');
            }
            else if (bottomShown) {
                scrollbarBottomEnd.style.display = 'none';
                bottomShown = false;
                console.debug('restore bottom');
            }
        }*/
        return {t: top, h:h};
    }
	if (helperElem.style[perspectiveProperty] !== undef) {
		return function(left, top, zoom) {
			content.style[transformProperty] = 'translate3d(' + (-left) + 'px,' + (-top) + 'px,0) scale(' + zoom + ')';
            
            var topAndHeight = topAndHeightForScrollbar(top); 
            scrollbar.style[transformProperty] = 'translate3d(0px,' + (topAndHeight.t) + 'px,0) scale(' + zoom + ')';
		};	
	} else if (helperElem.style[transformProperty] !== undef) {
		return function(left, top, zoom) {
			content.style[transformProperty] = 'translate(' + (-left) + 'px,' + (-top) + 'px) scale(' + zoom + ')';

            var topAndHeight = topAndHeightForScrollbar(top); 
            scrollbar.style[transformProperty] = 'translate(0px,' + (topAndHeight.t) + 'px) scale(' + zoom + ')';
		};
	} else {
		return function(left, top, zoom) {
			content.style.marginLeft = left ? (-left/zoom) + 'px' : '';
			content.style.marginTop = top ? (-top/zoom) + 'px' : '';
			content.style.zoom = zoom || '';
            
            var topAndHeight = topAndHeightForScrollbar(top); 
            scrollbar.style.height = topAndHeight.h + 'px';
            scrollbar.style.marginTop = topAndHeight.t  + 'px';
		};
	}
}
/**************************FmScrollBar**************************************/
/**
 * @arg container the container of scroller
 * @arg content the content of scroller
 * @arg attachTo the element that scrollbar is attached to
 */
function FmScrollBar(container, content, scrollbarContainer) {
    // assumme the container to be relative or absolute positioned 
    this.container = container;
    this.content = content;
    this.scrollbarContainer = scrollbarContainer;
    this.$scrollbar = $('<div class="scrollbar">' + 
                            '<div class="top end"></div>' + 
                            '<div class="wrapper"><div class="bar"></div></div>' + 
                            '<div class="bottom end"></div></div>');
    this.$bar = this.$scrollbar.find('.bar');
    this.topEnd = this.$scrollbar.children('.top.end').get(0);
    this.bottomEnd = this.$scrollbar.children('.bottom.end').get(0);
    $(scrollbarContainer).append(this.$scrollbar[0]);
}
FmScrollBar.prototype.updateDimensions = function() {
    this.overflow = this.content.offsetHeight > this.container.clientHeight;
    if(!this.overflow)
        this.$scrollbar.hide();
    var h =  this.container.clientHeight
           * (this.scrollbarContainer.clientHeight - FmScrollBar.minTop * 2)
           / this.content.offsetHeight;
    if (h < FmScrollBar.minH)
        h = FmScrollBar.minH;
    this.$bar.attr('normalHeight', h+'px');
    this.$bar.height(h);
}
FmScrollBar.prototype.show = function() {
    if(this.overflow) {
        this.$scrollbar.fadeIn();
    }
}
FmScrollBar.prototype.hide = function() {
//    this.topEnd.style.display = 'none';
//    this.bottomEnd.style.display = 'none';
    this.$scrollbar.fadeOut();
}
FmScrollBar.minTop = 8;
/**************************Web Service**************************************/
function FmWebService() {
    this.url = {
        root: "ws/",
        docsSearch: "docs/search",
        docsUpload: "upload",
        docsDelete: "docs/"
    };
}
FmWebService.prototype.docsSearch = function(tag, keywords, callback) {
    var response = {
        id: 1,
        error: null,
        result: {
            sortedBy: "addedOn",
            total: 9,
            entries: [
                {   docId: "1111111",
                    title: "Zephyr: Live Migration in Shared Nothing Databases for Elastic Cloud Platforms",
                    authors: "Peter Bakkum, Kevin Skadron", 
                    publication: "SIGMOD 2011",
                    year: "2011",
                    addedOn: "Feb 19 2012",
                    tags: ["live migration", "SIGMOD'11"] },
                {   docId: "2222222",
                    title: "Brighthouse: An Analytic Data Warehouse for Ad-hoc Queries", 
                    authors: "Dominik Slezak, Jakub Wroblewski, Victoria Eastwood, Piotr Synak", 
                    publication: "VLDB '09", 
                    addedOn: "Feb 19 2012",
                    tags: ["column store", "VLDB'09"] },
                {   docId: "3333333",
                    title: "The End of an Architectural Era", 
                    authors: "Michael Stonebraker, Samuel Madden, Daniel J. Abadi", 
                    publication: "VLDB '07", 
                    addedOn: "Feb 19 2012",
                    tags: ["column store"] } 
            ]
        }
    };
    setTimeout(function() {
        callback(response);
    }, 1000);
}
FmWebService.prototype.docsUpload = function() {
}
FmWebService.prototype.docsDelete = function() {
}
FmWebService.prototype.docsDetail = function() {
}
FmWebService.prototype.docsEdit = function() {
}
FmWebService.prototype.tagsList = function() {
}
FmWebService.prototype.tagAdd = function() {
}
FmWebService.prototype.tagEdit = function() {
}
FmWebService.prototype.tagDelete = function() {
}
/*******************************FmResultConstructor****************************/
function FmResultHtmlBuilder() {
    this.MONTH_STR = ['JAN', 'FEB', 'MAR', 'APR', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    this.init();
}
FmResultHtmlBuilder.prototype.init = function() {
    this.lastGroup = null;
}
FmResultHtmlBuilder.prototype.newHtml = function(entries) {
    this.init();
    return this.toHtml(entries);
}
FmResultHtmlBuilder.prototype.moreHtml = function(entries) {
    return this.toHtml(entries);
}
FmResultHtmlBuilder.prototype.decideTimeGroup = function(entry) {
    var now = new Date().getTime();
    var date = new Date(Date.parse(entry.addedOn));
    var time = date.getTime();
    if (time >= now - 30*60*1000) {  // within in half an hour
        return "just now";
    }
    else if ( time >= DateConstants.TODAY ) {    // within today
        return "today";
    }
    else if ( time >= DateConstants.YESTERDAY ) {
        return "yesterday";
    }
    else if ( time >= DateConstants.THIS_WEEK ) {
        return "this week";
    }
    else if ( time >= DateConstants.LAST_WEEK) {
        return "last week";
    }
    else if ( time >= DateConstants.THIS_MONTH ) {
        return "this month";
    }
    else if ( time >= DateConstants.LAST_MONTH ) {
        return "last month";
    }
    else if ( time >= DateConstants.THIS_YEAR ) {    // within this year
        return this.MONTH_STR[date.getMonth()]; 
    }
    else {  
        return this.MONTH_STR[date.getMonth()] + ' ' + this.getFullYear(); 
    }
}
FmResultHtmlBuilder.prototype.toHtml = function(entries) {
    // According to www.learningjquery.com/2009/03/43439-reasons-to-use-append-correct
    // below is the fastest way to insert many HTML elements into DOM
    var rightBtnHtml = '<ul class="buttons"><li class="button arrow-right-icon"></li></ul>';
    var htmlToInsert = [];
    var l = entries.length;
    var unselectable = " unselectable=on";
    for(var i = 0; i < l; ++i) {
        var e = entries[i];
        var group = this.decideTimeGroup(e);
        var firstInGroup = false;
        if(group != this.lastGroup) {
            htmlToInsert.push('<div class="title"' + unselectable + '><h5>' + 
                                group + '<span class="nip"></span></h5></div>');
            firstInGroup = true;
            this.lastGroup = group;
        }
        htmlToInsert.push('<div class="entry clickable' + 
                          (firstInGroup?' first"':'"') + unselectable + '>');
        htmlToInsert.push('<div class="info"' + unselectable + '>');
        htmlToInsert.push('<h4' + unselectable + '><em' + unselectable + '>' + e.title + '</em></h4>');
        if(e.authors) {
            htmlToInsert.push('<p' + unselectable + '>' + e.authors + 
                (e.publication? '. ' + e.publication : '') + '</p>');
        }
        var k = e.tags.length;
        if(k > 0) {
            htmlToInsert.push('<p' + unselectable + '>');
            for(var j = 0; j < k; ++j) {
                htmlToInsert.push('<span class="tag"' + unselectable + '>' + e.tags[j] + '</span>');
            }
            htmlToInsert.push('</p>');
        }
        htmlToInsert.push('</div>');
        htmlToInsert.push(rightBtnHtml);
        htmlToInsert.push('</div>'); 
    }
    return htmlToInsert.join('');
}
/*******************************Uploader*************************************/
function FmUploader(manager) {
    this.manager = manager;
    this.elements = {
        uploadBtn: 'upload-btn',
    };
    this.state = {
        uploading: false,
        progress: 0
    }
    this.uploader = new plupload.Uploader({
        runtimes : 'html5,flash,html4',
        browse_button : this.elements.uploadBtn,
        drop_element: 'main',
        max_file_size : '10mb',
        url : 'upload.json',
        flash_swf_url : 'plupload/plupload.flash.swf',
        filters : [
            {title : "PDF files", extensions : "pdf"}
        ]
    });
}
FmUploader.prototype.init = function() {
    var that = this;
    
    this.uploader.init();
    
    this.uploader.bind('Init', function(up, params) {
        console.log('init');
    });

    this.uploader.bind('FilesAdded', function(up, files) {
        if (files.length > 0) {
            var file = files[0];
            var filename  = file.name;
            that.state.uploading = file.id;
            that.startMessage(filename);
            that.uploader.start();
            /*setTimeout(function() {
                that.uploader.trigger('UploadProgress', {id: file.id, percent: 50});
            }, 500);
            setTimeout(function() {
                that.uploader.trigger('UploadProgress', {id: file.id, percent: 100});
                that.uploader.trigger('UploadComplete', file);
            }, 1000);*/
        }
    });

    this.uploader.bind('UploadProgress', function(up, file) {
        if (that.state.uploading = file.id) {
            console.log('uploadprogress' + file.percent);
            that.progressMessage(file.percent);
        }
    });

    this.uploader.bind('QueueChanged', function() {
        console.log('queuechanged');
    });

    this.uploader.bind('UploadComplete', function(up, file) {
        if (that.state.uploading == file.id) {
            that.state.uploading = false;
            that.completeMessage(file.name);
        }
    });
}
FmUploader.prototype.startMessage = function(filename) {
	this.state.progress = 0;
	
	$result = this.manager.mainPanel.elements.$result;
	$first = $result.children(':first');
	$first.append(
		'<div class="message"><p>' +  
			'<span><span class="file"> Uploading ' + filename + '</span>' + 
				'<span class="progress"></span></span>' +  
		'</p></div>');
}
FmUploader.prototype.progressMessage = function(percent) {
	if ( this.state.progress >= percent )
		return;
	this.state.progress = percent;
	
	$result = this.manager.mainPanel.elements.$result;
    $message = $result.find('.message > p > span > span');
	$progress = $result.find('.progress');
    console.debug('width='+$message.width());
	$progress.animate({'width': percent / 100.0 * ( $message.width()+64-8 ) });
}
FmUploader.prototype.completeMessage = function(filename) {
	$result = this.manager.mainPanel.elements.$result;
	$file = $result.find('.file');
	$file.html('Uploaded ' + filename);
	$message = $result.find('.message');
	$message.delay(1000).fadeOut(400, function() {$message.detach();});
}
/******************************Initialization********************************/
// disable text selection in IE by setting attribute unselectable to true
function disableIETextSelection(root){
    var $root = $(root);
    $root.attr('unselectable', 'on');
    var children = $root.children();
    var l = children.length;
    for(var i = 0; i < l ; ++i)
        disableIETextSelection(children[i]);
}
$(document).ready(function() {
    // init manager
    var manager = new FmManager();
    manager.init();
    // misc.
    if ($.browser.msie) 
        disableIETextSelection($("#top-panel")[0]); 
});


