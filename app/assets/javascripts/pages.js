$(document).ready(function() {
    var $wrapper = $('body > .container > .wrapper');
	

    var minH = 600;
	
    function resize() {
        var H = $(window).height();
        if (H > minH)
            $wrapper.height(H);
        else
            $wrapper.height(minH);
    }
    $(window).resize(resize);
    resize();
 $("#signup-button").click(function( ){
	$("#signup-button").hide( );
	 $("#signup-wrapper").toggle(600 );});

});
