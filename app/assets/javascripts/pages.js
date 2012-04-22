$(document).ready(function() {
    var $wrapper = $('body > .container > .wrapper');
	

    var minH = 600;
    $(".signup .field-email").focus(function (){
    this.css("background","#fff url(/assets/bg-email2.png) no-repeat 5px center").css("border","1px solid red");});
    $(".signup .field-name").focus(function (){
    this.css("background","#fff url(/assets/bg-name2.png) no-repeat 5px center").css("outline","1px solid red");});
	
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
