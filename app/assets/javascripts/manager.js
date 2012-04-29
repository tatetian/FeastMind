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
    this.start = 0;
    this.limit = 5;
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
    this.search("All", null);
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
    this.start = 0;
    this.webService.docsSearch(tag, keywords, this.start, this.limit , function(response) {
        if(!response.error) {
            that.mainPanel.showResult(response.result);
            that.hideLoading();
            that.start = that.start + that.limit;
        }
        else {  // handle error
            
        }
    });
}
// find Friends
FmManager.prototype.searchFr = function() {
    // sotre search terms
    // clear previous result
    this.mainPanel.clearResult();
    // show loading
    this.showLoading();
    // do search
    var that = this;
    this.webService.FrSearch(function(response) {
        if(!response.error) {
            that.mainPanel.showFrResult(response.result);
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
    this.webService.docsSearch(tag, keywords,this.start, this.limit, function(response) {
        if(!response.error) {
            that.mainPanel.showMoreResult(response.result);
            that.mainPanel.hideLoadingMore();
            that.start = that.start + that.limit;
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
    //tags data
    this.tags = [
                {   
                    name: "column store",
                    num: 1
                },
                {
                    name: "Computer Vision",
                    num: 6
                },
                {
                    name: "Human Motion",
                    num: 2
                },
                {
                    name: "Human Pose",
                    num: 3
                },
                {
                    name: "Monocular",
                    num: 1
                },
                {
                    name: "Single-Camera",
                    num: 1
                },
                {
                    name: "Tracking",
                    num: 2
                },
                {  
                    name: "VLDB",
                    num: 0
                }
            ];
    //show tag
    this.tagHtmlBuilder =  new FmTagHtmlBuilder();
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
          if(that.cached.btns.$search.width()> 0){
              //alert("OK");
              var tag = that.manager.state.lastSearch.tag;
              that.manager.state.lastSearch.keywords = that.cached.btns.$search.val();
              
              that.manager.mainPanel.clearResult();
              that.manager.showLoading(); 
              that.manager.start = 0;
              that.manager.webService.docsSearch(tag, that.manager.state.lastSearch.keywords,that.manager.start,that.manager.limit, function(response) {
                  if(!response.error) {
                        that.manager.mainPanel.showResult(response.result);
                        that.manager.hideLoading();
                        that.manager.start = that.manager.start+that.manager.limit;
                  }
                  else {  // handle error
                      
                  }
              });
            }
        }
    });
    $.get(
          "/tags",
          {},
          function(response,status,xhr){
              that.showTags(response.tags);
          },
          "json"
     );  
    this.updateHeight();
    // click entry event
    var additionalClass = {
        All: 'all',
        Recent: 'recent',
        MyShare: 'heart-icon myshare',
        MyFriends:'group-icon friends'
    };
    this.cached.$me.delegate(this.elements.entry, "fmClick", function() {
        that.toggle();
        var tag = $(this).children('h3').html().trim();
        that.cached.$primaryTitle.empty()
                                 .append('<span class="tag clickable ' + 
                                            additionalClass[tag] + '">' + 
                                            tag + '</span>'); 
        if(tag=='MyFriends'){
            that.manager.searchFr();
        }
        else if(tag=='MyShare'){
            that.manager.search("!@!#$", null);
        }
        else if(tag=='Recent'){
        }
        else if(tag=='Logout') {
            $.ajax("/signout", {
                type: "delete",
                success: function() {
                    location.href = "/";
                }
            });
        }
        else
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
    that.cached.btns.$editTag.click(function(){
        var debu= $(".tags .entry .button");
        debu.toggle();        
        if(debu.css("display")=="block"){
            debu.parent().removeClass("clickable");
        }
        else{
            debu.parent().addClass("clickable");            
            debu.removeClass("clicked");
        }
        $(".tags .entry .ok").toggle(false);
    });   
    that.cached.$me.delegate(".tags .entry .button","click",function(e){
            var deok = $(this).next();   
            var temp = deok.css("display");
            $(".tags .entry .button").removeClass("clicked");            
            $(".tags .entry .ok").hide();
            if(temp=="none"){                          
                $(this).addClass("clicked");
                $(deok).fadeIn(300);
                $(deok).focus();
            }
            else{
                $(this).removeClass("clicked");
                $(deok).fadeOut(300);
            }
    });
    that.cached.$me.delegate(".tags .entry .ok","blur",function(e){
            alert("OK");
            $(this).next().hide();
    });
    that.cached.btns.$addTag.click(function(){
        $(".tags .entries").append('<li class="entry clickable" id="newtag"><h3 class="tag"><input type="text" class="addtag" autocomplete="off"/></h3><h3 class="num">0</h3></li>');   
        $(".addtag").focus();
        $(".addtag").blur(function(){
            var name = $(".addtag").val();
            if(name!=""){
                  //alert($(".addtag").val());
                  $.post(
                      "/tags",
                      {
                        name: name
                      },
                      function(response,status,xhr){
                          if(!response.error){
                                $("#newtag").removeAttr("id")
                                $(".addtag").replaceWith(name);
                          }
                          else{
                                $("#newtag").remove();
                          }
                      },
                      "json"
                 );
                  //that.tags.push({name: $(".addtag").val(),num: 0});
                  //$("#newtag").removeAttr("id")
                  //$(".addtag").replaceWith($(".addtag").val());
            }
            else{
                $("#newtag").remove();
            }
        })
    });
    /*$(".tags .search").change(function(){
        if($(".tags .search").val()==""){
              that.showTags(that.tags);
              return;
        }
        var tmp = new Array();
        for(var i = 0; i< that.tags.length ; i++){
            if(that.tags[i].name.toLowerCase().indexOf($(".tags .search").val().toLowerCase())>=0){
                  tmp.push(that.tags[i]);
            }
        }
        that.showTags(tmp);
    })*/
    
    var setSearchTag = function()
    {
        //alert($(".tags .search").val());
        if($(".tags .search").val()==""){
              that.showTags(that.tags);
              return;
        }
        var tmp = new Array();
        for(var i = 0; i< that.tags.length ; i++){
            var tmptag = that.tags[i].name+" ";
            var v = $(".tags .search").val()+" "
            tmptag = tmptag.toLowerCase();
            v = v.toLowerCase();
            if(tmptag.trim().indexOf(v.trim())>=0){
                  tmp.push(that.tags[i]);
            }
        }
        that.showTags(tmp);
    }
    
    if($.browser.msie)    // IE浏览器
    {
        //alert("ie");
        $(".tags .search").get(0).onpropertychange = setSearchTag;
    }
    else    // 其他浏览器
    {
        $(".tags .search").get(0).addEventListener("input",setSearchTag,false);
    }
}
FmTopPanel.prototype.showTags = function(tags) {
    var $result = $(".tags .entries");
     $(".tags .entry.clickable").remove();
    // update counter
    // build new result HTML elements
    var resultHtml = this.tagHtmlBuilder.toHtml(tags);
    $result.append(resultHtml);
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
    this.frHtmlBuilder = new FmFrHtmlBuilder();
    // scroller for primary view
    var body = $("body")[0];
    var scrollContainer = $(this.elements.primaryView).get(0);
    var scrollContent = this.elements.$result.get(0);
    this.scroller = new FmScroller(scrollContainer, scrollContent, body);
    // scroller for secondary view
    var scrollContainer = $(this.elements.secondaryView).get(0);
    var scrollContent = $(this.elements.secondaryView + ' > .wrapper').get(0);
    this.scroller2 = new FmScroller(scrollContainer, scrollContent, body);
    $(this.elements.me).delegate('a.fav', "fmClick", function() {
        alert("WOW");
    })
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
FmMainPanel.prototype.showFrResult = function(result) {
    var entries = result.entries;
    var $result = this.elements.$result;
    // update counter
    this.state.entriesNum = entries.length;
    this.state.entriesTotal = result.total;
    // build new result HTML elements
    var resultHtml = this.frHtmlBuilder.toHtml(entries);
    $result.append('<div style="width: 100%; padding-top: 3.5em; position: relative; z-index: -1;"></div>');
    $result.append('<div style="width: 100%; padding-bottom: 0.5em; position: relative; z-index: -1;"></div>')
    $result.append(resultHtml);
    // toggle more indicator
    this.appendMoreEntry();
    // show it
    var that = this;
    $result.fadeIn('fast', function() {
        that.resize();
    });
}
FmMainPanel.prototype.showResult = function(result) {
    var entries = result.entries;
    var $result = this.elements.$result;
    // update counter
    this.state.entriesNum = entries.length;
    this.state.entriesTotal = result.total;
    // build new result HTML elements
    var resultHtml = this.resultHtmlBuilder.newHtml(entries);
    $result.append('<div style="width: 100%; padding-top: 3.5em;position: relative; z-index: -1;"></div>');
    $result.append('<div style="width: 100%; padding-bottom: 0.5em;position: relative; z-index: -1;">')
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

            if(!moved){
                $(e.target).closest('.clickable').trigger('fmClick');
                //alert(e.target);
            }
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
    this.uploaded_entries = [];
}
FmWebService.prototype.docsSearch = function(tag, keywords, start, limit, callback) {
    $.get(
          "/docs",
          {
            start: start,
            limit: limit,
            keywords: keywords||"",
            tag: tag||"All"
          },
          function(response,status,xhr){
              callback(response);
          },
          "json"
     );
    /*if(tag!="All"){
      for(var i = 0; i < response.result.entries.length; i++) {
          var e = response.result.entries[i];
          var tagfind = false;
          for(var j = 0 ; j< e.tags.length ; j++){
          //alert(str.indexOf(tag)+" "+str);
              var str = e.tags[j];
              if(str==tag){
                  tagfind = true;
                  break;
              }
          }
          if(!tagfind){
                response.result.entries.splice(i,1);
                i--;
          }
      }
    }
    if(keywords!=null){
        keywords = keywords.toLowerCase();
        for(var i = 0; i < response.result.entries.length; i++) {
          var e = response.result.entries[i];
          //alert(str.indexOf(tag)+" "+str);   
          //alert(keywords);
          if(e.title.toLowerCase().indexOf(keywords)<0 && e.authors.toLowerCase().indexOf(keywords)<0){
                response.result.entries.splice(i,1);
                i--;
          }
      }
    }
    
    response.result.total = response.result.entries.length;
    
    response.result.entries = response.result.entries.slice(start,start+limit);  
*/
}
FmWebService.prototype.docsUpload = function() {
}
FmWebService.prototype.docsDelete = function() {
}
FmWebService.prototype.docsDetail = function() {
}
FmWebService.prototype.docsEdit = function() {
}
FmWebService.prototype.tagsList = function(callback) {
      
}
FmWebService.prototype.tagAdd = function(newtag) {
}
FmWebService.prototype.tagEdit = function() {
}
FmWebService.prototype.tagDelete = function() {
}
FmWebService.prototype.FrSearch = function(callback) {
    /*$.get(
          "search",
          {
            start:start,
            limit:limit,
            keywords:keywords||""
           },
           function(response,status,xhr){
              callback(response);
           },
           "json"
     );*/
     var response = {
        id: 1,
        error: null,
        result: {
            sortedBy: "addedOn",
            total: 9,
            entries: [
                   {  docId: "777777",
                    title: "Real-Time Human Pose Recognition in Parts from Single Depth Images", 
                    authors: "Jamie Shotton, Andrew Fitzgibbon, Mat Cook, Toby Sharp, Mark Finocchio, Richard Moore, Alex Kipman, Andrew Blake", 
                    publication: "",
                    year: "2011",
                    addedOn: "Apr 4 2012",
                    tags: ["Computer Vision", "Human Pose"] },
                    {
                        docId: "888888",
                        title: "Human Body Pose Recognition Using Spatio-Temporal Templates", 
                        authors: "M. Dimitrijevic, V. Lepetit,P. Fua", 
                        publication: "",
                        addedOn: "Apr 4 2012",
                        tags: ["Computer Vision", "Human Pose"] 
                    },
                    {
                        docId: "999999",
                        title: "Motion segmentation and pose recognition with motion history gradients", 
                        authors: "Gary R. Bradski, James W. Davis", 
                        publication: "",
                        year:"2002",
                        addedOn: "Apr 1 2012",
                        tags: ["Computer Vision", "Human Motion", "Human Pose"] 
                    },
                 {  docId: "444444",
                    title: "Bayesian Reconstruction of 3D Human Motion from Single-Camera Video", 
                    authors: "Nicholas R. Howe, Michael E. Leventon, William T. Freeman", 
                    publication: "",
                    year: "1999",
                    addedOn: "Mar 23 2012",
                    tags: ["Computer Vision", "Single-Camera","Human Motion"] },
                  {  docId: "555555",
                    title: "Monocular 3–D Tracking of the Golf Swing", 
                    authors: "Raquel Urtasun, David J. Fleet, Pascal Fua", 
                    publication: "",
                    year: "2005",
                    addedOn: "Mar 9 2012",
                    tags: ["Computer Vision", "Monocular","Tracking"] },
                   {  docId: "666666",
                    title: "3D ARM MOVEMENT TRACKING USING ADAPTIVE PARTICLE FILTER", 
                    authors: "RFeng Guo, Gang Qian", 
                    publication: "",
                    year: "2009",
                    addedOn: "Mar 2 2012",
                    tags: ["Computer Vision", "ARM","Tracking"] },
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
/*******************************FmTagConstructor****************************/
function FmTagHtmlBuilder() {
}
FmTagHtmlBuilder.prototype.toHtml = function(tags) {
    var htmlToInsert = [];
    var l = tags.length;
    for(var i = 0; i < l; ++i) {
        var e = tags[i]
        htmlToInsert.push('<li class="entry clickable"><h3 class="tag">' + 
                           e.name+ '</h3><h3 class="num">'+e.num
                          +'</h3><h3 class="delete button"></h3>'
                          +'<h3 class="delete ok">delete</h3></li>');
    }
    return htmlToInsert.join('');
}
/*******************************FmFrConstructor****************************/
function FmFrHtmlBuilder() {
}
FmFrHtmlBuilder.prototype.toHtml = function(entries) {
    var user = [
        {
            image:"head1.jpeg",
            name:"Jason",
            date: "2012.04.04 &nbsp;09:20"
        },
        {
            image:"head2.jpeg",
            name:"Ryan",
            date: "2012.03.24 &nbsp;14:35"
        },
        {
            image:"head3.png",
            name:"Jack",
            date: "2012.03.24 &nbsp;10:24"
        },
        {
            image:"head4.jpeg",
            name:"Adam",
            date: "2012.03.21 &nbsp;09:39"
        },
        {
            image:"head5.png",
            name:"Jonny",
            date: "2012.03.02 &nbsp;11:07"
        }
    ];
    var rightBtnHtml = '<ul class="buttons"><li class="button arrow-right-icon"></li></ul>';
    var htmlToInsert = [];
    var l = entries.length;
    var unselectable = " unselectable=on";
    for(var i = 0; i < 5; ++i) {
        var e = entries[i];
        htmlToInsert.push('<div class="entry clickable" ' + unselectable + '>');
        htmlToInsert.push('<div class="friends-info"><img  src="/assets/'+user[i].image+'" width="36" heigt="36"/></div>');
        htmlToInsert.push('<div class="info mf"' + unselectable + '>');
        htmlToInsert.push('<p class="info-detail"><span class="who">'+user[i].name+'</span>:<span class="when">&nbsp;'+user[i].date+'</span></p>');
        htmlToInsert.push('<h4 class="mf"' + unselectable + '><em' + unselectable + '>' + e.title + '</em></h4>');
        var k = e.tags.length;
        if(k > 0) {
            htmlToInsert.push('<p class="info-tags" ' + unselectable + '>');
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
/*******************************FmResultConstructor****************************/
function FmResultHtmlBuilder() {
    this.MONTH_STR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
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
    var date = new Date(Date.parse(entry.created_at));
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
FmResultHtmlBuilder.prototype.entryToHtml = function(e, firstInGroup) {
    var rightBtnHtml = '<ul class="buttons"><li class="button arrow-right-icon"></li></ul>';
    var unselectable = " unselectable=on";
    var htmlToInsert = [];

    htmlToInsert.push('<div class="entry clickable' + 
                          (firstInGroup?' first"':'"') + unselectable + '>');
    htmlToInsert.push('<div class="info"' + unselectable + '>');
    htmlToInsert.push('<h4' + unselectable + '><em' + unselectable + '>' + e.title + '</em></h4>');
    if(e.author) {
        htmlToInsert.push('<p' + unselectable + '>' + e.author + 
                          (e.publication? '. ' + e.publication : '') + '</p>');
    }
    var k = e.tags? e.tags.length : 0;
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
    return htmlToInsert.join(''); 
}
FmResultHtmlBuilder.prototype.toHtml = function(entries) {
    // According to www.learningjquery.com/2009/03/43439-reasons-to-use-append-correct
    // below is the fastest way to insert many HTML elements into DOM
    //var leftBtnHtml = '<ul class="buttons2"><li class="button fav"></li></ul>';
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
        htmlToInsert.push(this.entryToHtml(e, firstInGroup));
    }
    return htmlToInsert.join('');
}
/*******************************Uploader*************************************/
function FmUploader(manager) {
    this.manager = manager;
    this.elements = {
        uploadBtn: 'upload-btn',
        dragAndDropArea: $.browser.msie || $.browser.mozilla || $.browser.opera ? "html" : "body"
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
        url : '/docs.json',
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

    var $progressBar = null;
    var $progressEntry = null;
    var $progressPercent = null;
    this.uploader.bind('FilesAdded', function(up, files) {
        if (files.length > 0) {
            // filename
            var file = files[0];
            var filename  = file.name;
            // show message
            var $result = that.manager.mainPanel.elements.$result;
    	    var $insertPos = $($result.children()[1]);
            $progressEntry = $('<div class="entry progress"><div class="info"><h4><em>Uploading file ' + filename +'<span class="percent">0%</span></em></h4></div>');
            $progressPercent = $progressEntry.find(".percent")
            $progressBar = $('<div style="position:absolute;top:0px;left:0px;z-index:-1;background: url(/assets/bg-tile-blue.png) repeat center top;height:100%;width:0px;"></div>');
            $progressEntry.append($progressBar);
            $progressEntry.insertAfter($insertPos); 
            // start upload
            that.state.uploading = file.id;
            that.uploader.start();
        }
    });

    this.uploader.bind('UploadProgress', function(up, file) {
        if (that.state.uploading == file.id) {
            var percent = file.percent;
            var $result =  that.manager.mainPanel.elements.$result;
            var w = $result.width();
            $progressBar.animate({"width": percent / 100.0 * w + "px"})
            $progressPercent.text(percent + "%");
        }
    });

    this.uploader.bind('QueueChanged', function() {
        console.log('queuechanged');
    });

    this.uploader.bind('FileUploaded', function(up, file, response) {
        if (that.state.uploading == file.id) {
            that.state.uploading = false;
            var fileName = file.name;

            /*var entry = {   
                docId: "890809234",
                title: "Accelerating SQL Database Operations on a GPU with CUDA", 
                authors: "Peter Bakkum, Kevin Skadron", 
                publication: "GPGPU-3", 
                addedOn: "Apr 5 2012",
                tags: [] 
            };*/
//            console.debug(response);
            var entry = $.parseJSON(response.response);
            var now = new Date().toString("MMMM yyyy");
            entry.created_at = now;
            entry.tags = [];

            $progressEntry.delay(1000).slideToggle(400, function() {
                $progressEntry.remove();

                var $newEntry = $(that.manager.mainPanel.resultHtmlBuilder.entryToHtml(entry, false));
                var $result =  that.manager.mainPanel.elements.$result;
                var $insertPos = $($result.children()[2]);
                var $highlight = $('<div style="position:absolute;top:0px;left:0px;z-index:-1;background: url(/assets/bg-tile-blue.png) repeat center top;height:100%;width:100%;"></div>');
                $newEntry.append($highlight);
                $newEntry.hide();
                $newEntry.insertAfter($insertPos);
                that.manager.mainPanel.resize();
                $newEntry.slideToggle(function() {
                    $highlight.fadeOut();
                    that.manager.mainPanel.resize();
                });
            });
        }
    });

    this.initDragAndDrop();
}
FmUploader.prototype.initDragAndDrop = function() {
    var droparea = $(this.elements.dragAndDropArea)[0];
    var noOpHandler = function(e) {
        e.stopPropagation();
        e.preventDefault();
    }
    droparea.addEventListener("dragenter", noOpHandler, false);
    droparea.addEventListener("dragexit", noOpHandler, false);
    droparea.addEventListener("dragover", noOpHandler, false);
    droparea.addEventListener("drop", function() {
    }, false);
}
/*
FmUploader.prototype.upload = function(filename) {
	this.state.progress = 0;
	
	$result = this.manager.mainPanel.elements.$result;
	$first = $result.children(':first');
}
FmUploader.prototype.progressMessage = function(percent) {
	if ( this.state.progress >= percent )
		return;
	this.state.progress = percent;
	
	$result = this.manager.mainPanel.elements.$result;
    $message = $result.find('.message > p > span > span');
	$progress = $result.find('.progress');
	$progress.animate({'width': percent / 100.0 * ( $message.width()+64) }, 300);
}
FmUploader.prototype.completeMessage = function(filename) {
	$result = this.manager.mainPanel.elements.$result;
	$message = $result.find('.message');
    $message.delay(1000).fadeOut(400, function() {$message.remove();});
}*/
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
var Manager;
$(document).ready(function() {
    // init manager
    var manager = new FmManager();
    manager.init();
    // misc.
    if ($.browser.msie) 
        disableIETextSelection($("#top-panel")[0]); 

    Manager = manager ;
});
function progress(){
  var $entry = $("#main > .slide.primary > .result > :nth-child(2)");
  var $progress = $('<div style="position:absolute;top:0px;left:0px;z-index:-1;background: url(/assets/bg-tile-blue.png) repeat center top;height:100%;width:20%;"></div>');
  $entry.insertAfter($progress);
  return $entry;
}

