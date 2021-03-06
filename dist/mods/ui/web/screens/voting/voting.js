var buttons = ["A","B","X","Y","Back"];
var votingType = "voting";
var controllerType;
var hasGP = false;
var interval = 0;
var seconds_left;
var isHost;

$("html").on("keydown", function(e) {
    if (e.which == 113){
        dew.hide();
    }
    if(e.which == 84 || e.which == 89){
        var teamChat = false;
        if(e.which == 89){ teamChat = true };
        dew.show("chat", {'captureInput': true, 'teamChat': teamChat});
    }
    if(e.keyCode == 192 || e.keyCode == 112 || e.keyCode == 223){
        dew.show("console");
    }
});

function vote(number) {
    dew.command("server.SubmitVote " + number).then(function(output) {}).catch(function(error) {});
    if(hasGP){
        $(".votingOption").removeClass("selected");
        $('.votingOption').eq(number-1).addClass("selected");
    }
}

dew.on("show", function(event) {
    dew.getSessionInfo().then(function(i){
        isHost = i.isHost;
    });
    dew.command('Settings.Gamepad', {}).then(function(result){
        if(result == 1){
            onControllerConnect();
            hasGP = true;
        }else{
            onControllerDisconnect();
            hasGP = false;
        }
    });
});

dew.on("hide", function(event) {
    clearInterval(interval);
});

dew.on("Winner", function(event) {
    clearInterval(interval);
    $("#" + event.data.Winner).addClass('winner');
});
dew.on("VetoOptionsUpdated", function(event) {
    clearInterval(interval);
	//console.log(event.data);
	var message = "";
	if(event.data.vetoOption.canveto){
		message = "VETO COUNTDOWN " 
        votingType = "veto";
	}
	else{
		message = "GAME STARTING IN: " 
        votingType = "ended";
	}
	$(".container").html("");
	   $("<a></a>", {
		  "class": "boxclose",
            "id": "boxclose",
            text: "x"
        })
        .appendTo($(".container"));
    $("<h5></h5>", {
            "id": "title"
        })
        .html(message + "<span id='timer_span'></span>")
        .appendTo($(".container"));

		var entry = event.data.vetoOption;

        if (entry.mapname != '') {
            $("<div></div>", {
                    "class": "votingOption",
                    "id": "1"
                })
                .html("<p>" +  entry.typename + " on " + entry.mapname + "</p><img src='dew://assets/maps/small/" + entry.image + ".png'><span id='voteTally1" + "'  class='voteTally'></span> ")
                .appendTo($(".container"));

        }
    
    if(hasGP){
        onControllerConnect(); 
    }

    seconds_left = event.data.timeRemaining; //event.data[0].voteTime;
    interval = setInterval(function() {
        document.getElementById('timer_span').innerHTML = " - " + --seconds_left;

        if (seconds_left <= 0) {
            document.getElementById('timer_span').innerHTML = "";
            clearInterval(interval);
        }
    }, 1000);
    $('#boxclose').click(function(){
        capturedInput = false;
        if(isHost){
            dew.command("server.CancelVote").then(function() {});
        }
        dew.hide();
    });
    if(votingType == "veto"){
        $(".votingOption").click(function() {
            $(".votingOption").removeClass("selected");
            $(this).addClass("selected");
            vote($(this).attr('id'));
        });  
        $(".votingOption").hover(
            function() {
                $( this ).addClass( "selected" );
            }, function() {
                $( this ).removeClass("selected");
            }
        );
    }
});
dew.on("VotingOptionsUpdated", function(event) {
    votingType = "voting";
    clearInterval(interval);
	
    $(".container").html("");
	   $("<a></a>", {
		  "class": "boxclose",
            "id": "boxclose",
            text: "x"
        })
        .appendTo($(".container"));
    $("<h5></h5>", {
            "id": "title"
        })
        .html("VOTE FOR GAME AND MAP <span id='timer_span'></span>")
        .appendTo($(".container"));

    event.data.votingOptions.forEach(function(entry, i) {

        if (entry.mapname == "Revote") {
            $("<div></div>", {
                    "class": "revoteOption votingOption",
                    "id": entry.index
                })
                .html("<h5> NONE OF THE ABOVE </h5><span id='voteTally" + entry.index + "'  class='voteTally'></span> ")
                .appendTo($(".container"));
        } else if (entry.mapname != '') {
            $("<div></div>", {
                    "class": "votingOption",
                    "id": entry.index
                })
                .html("<p>" + entry.index + ". " + entry.typename + " on " + entry.mapname + "</p><img src='dew://assets/maps/small/" + entry.image + ".png'><span id='voteTally" + entry.index + "'  class='voteTally'></span> ")
                .appendTo($(".container"));

        }
    });
    if(hasGP){
        onControllerConnect(); 
    }

    seconds_left = event.data.timeRemaining; //event.data[0].voteTime;
    interval = setInterval(function() {
        document.getElementById('timer_span').innerHTML = " - " + --seconds_left;

        if (seconds_left <= 0) {
            document.getElementById('timer_span').innerHTML = "";
            clearInterval(interval);
        }
    }, 1000);
    $('#boxclose').click(function(){
        capturedInput = false;
        if(isHost){
            dew.command("server.CancelVote").then(function() {});
        }
        dew.hide();
   });
    $(".votingOption").click(function() {
        $(".votingOption").removeClass("selected");
        $(this).addClass("selected");
        vote($(this).attr('id'));
    });    
    $(".votingOption").hover(
        function() {
            $( this ).addClass( "selected" );
        }, function() {
            $( this ).removeClass("selected");
        }
    );
});

dew.on("VoteCountsUpdated", function(event) {
    event.data.forEach(function(entry, i) {
        if (entry.Count == 0)
            $("#voteTally" + entry.OptionIndex).text("");
        else
            $("#voteTally" + entry.OptionIndex).text(entry.Count);
    });
});

function onControllerConnect(){
    dew.command('Game.IconSet', {}).then(function(response){
        controllerType = response;
        if(votingType == 'voting'){
            $(".votingOption").each(function(index){
                $(this).append("<img class='button' src='dew://assets/buttons/"+controllerType+"_"+buttons[index]+".png'>");
            });
        }else if(votingType == 'veto'){
            $(".votingOption").eq(0).append("<img class='button' src='dew://assets/buttons/"+controllerType+"_X.png'>");
        }
        $("#boxclose").html("<img class='button' src='dew://assets/buttons/"+controllerType+"_Start.png'>");  
        $('.playerStats img').eq(0).attr('src','dew://assets/buttons/' + controllerType + '_LB.png');
        $('.playerStats img').eq(1).attr('src','dew://assets/buttons/' + controllerType + '_RB.png');
    });    
}

dew.on('controllerinput', function(e){       
    if(hasGP){
        if(votingType != 'veto'){
            if(e.data.A == 1){
                vote(1);
            }
            if(e.data.B == 1){
                vote(2);
            }
            if(e.data.Y == 1){
                vote(4);
            }
            if(e.data.Select == 1){
                vote(5);
            }
        }
        if(e.data.X == 1){
            if(votingType == 'veto'){
                vote(1);
            }else{
                vote(3);
            }
        }
        if(e.data.Start == 1){
            dew.hide();   
        }
    }
});