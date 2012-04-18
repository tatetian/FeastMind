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
        $("#signup-wrapper").toggle(600 );
    });

	  $("#register").click(function( ){
        $(".login").hide( );
        $(".signup").fadeIn(1000 );
    });
    
    $("#signup-wrapper").submit(function() {
        $("#user_password_confirmation").val($("#user_password").val());
        return true;
    });
});
