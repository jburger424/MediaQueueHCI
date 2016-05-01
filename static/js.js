jQuery(function ($) { // First argument is the jQuery object
    //var vWidth = $(".add-link.input-group").width();
    //var vHeight = vWidth * (9 / 16);
    $('#url_form').submit(function (event) {
        event.preventDefault();
        var url = $('.add-link .form-control').val();
        //TODO figure out how to do added by

        $.ajax({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            url: "/session/add",
            data: JSON.stringify({newPlayable: url}),
            success: function (data) {
                //console.log(data.title);
                //console.log(data.article);
            },
            dataType: "json"
        });
        update();

        $(".add-link input.form-control").val("");
    });
    function findBootstrapEnvironment() {
        var envs = ['xs', 'sm', 'md', 'lg'];

        var $el = $('<div>');
        $el.appendTo($('body'));

        for (var i = envs.length - 1; i >= 0; i--) {
            var env = envs[i];

            $el.addClass('hidden-' + env);
            if ($el.is(':hidden')) {
                $el.remove();
                return env;
            }
        }
        console.log("hello");
    }

    console.log("ho");


    if (findBootstrapEnvironment() == "lg") {
        console.log("if");

        var player;
        var vWidth = $(".add-link.input-group").width();
        var vHeight = vWidth * (9 / 16);
        window.onYouTubePlayerAPIReady = function () {
            console.log("something working");
            player = new YT.Player('player', {
                height: vHeight,
                width: vWidth,
                videoId: 'g4mHPeMGTJM',
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
        };


        $("ul#playables").on('click', 'li', function () {
            //alert($(this).text());
            $("ul#playables .active").removeClass("active");
            $(this).addClass("active");
            player.loadVideoById({
                'videoId': $(this).attr("data-url"),
                'suggestedQuality': 'large'
            });

        });

// 4. The API will call this function when the video player is ready.
        /* function onPlayerReady(event) {
         //event.target.playVideo();
         player.loadVideoById({
         'videoId': "g4mHPeMGTJM",
         });
         }*/
        var ready = false;

        /*function onPlayerReady(event) {
         ready = true;
         console.log("Player:");
         console.log(player);
         }*/
        function onPlayerReady(event) {
            event.target.playVideo();
        }

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
        var done = false;

        function onPlayerStateChange(event) {
            if (event['data'] == 0) {
                console.log("video_ended");
                goToNext();
            }
        }

        /*function onPlayerStateChange(event) {
         if (event.data == YT.PlayerState.PLAYING && !done) {
         setTimeout(stopVideo, 6000);
         done = true;
         }
         }*/

        function stopVideo() {
            player.stopVideo();
        }

        //start queue code
        function goToNext() {
            $("#playables li:first").remove();
            $("#playables li:first").addClass("active");
            player.loadVideoById({
                'videoId': $("ul#playables li:first").attr("data-url"),
                'suggestedQuality': 'large'
            });
        }
    }
    else {
        console.log("else");
    }

    $("ul#playables").on('click', 'li span.upvote,li span.downvote', function () {
        console.log("VOTE!");
        //$('#playables li.list-group-item .upvote, #playables li.list-group-item .downvote').click(function () {
        var url = $(this).parent("li").attr("data-url");
        var voteVal = $(this).hasClass("upvote") ? 1 : -1;

        $.ajax({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            url: "/session/vote",
            data: JSON.stringify({url: url, vote: voteVal}),
            success: function (data) {
                console.log("New Score: " + data.new_score);
                //console.log(data.article);
            },
            dataType: "json"
        });
        update();
        sort($(this).parent("li")).delay(400);
    });
    function update() {
        //console.log("updating");
        $.ajax({
            type: "GET",
            url: "/session/update/",
            dataType: "json", // Set the data type so jQuery can parse it for you
            success: function (data) {
                var users = data['users'];
                var playables = data['playables'];
                //console.log(users);
                //console.log(playables);
                for (var i in playables) {
                    var url = playables[i]['url'];
                    var score = playables[i]['score'];

                    //sees if this url already exists in list
                    var listItem = $("li.list-group-item[data-url='" + url + "']");
                    if (!listItem.length) {
                        $("#playables").append("<li class='list-group-item' data-url='" +
                            playables[i]['url'] + "'>" +
                            "<span class='upvote'>&#x25B2;</span>" +
                            "<span class='downvote'>&#x25BC;</span>" +
                                "<img src='"+playables[i]['thumb_url']+"' class='img-rounded' width='60' height='45'>"+
                            "<span class='title'>" + playables[i]['name'] + "</span>" +
                            "<span class='score label label-default label-pill pull-xs-right'>" + (playables[i]['score']).toString() + "</span>" +
                            "</li>"
                        );
                    }
                    else {
                        listItem.find(".score").text(score);
                    }
                    sort(listItem);

                    console.log("Adding: " + playables[i]['name'] + " with score" + playables[i]['score']);
                }
                for (var j in users) {
                    $("#users").append("<li>" + users[j]['Name'] + "</li>");
                    console.log("Adding: " + users[j]['Name']);
                }
            }
        });
    }

    //update every second
    var doUpdate = function () {
        update();
        setTimeout(doUpdate, 1000);
        //console.log("updating")
    };
    doUpdate();
    /*var check = function(){
     if(condition){
     // run when condition is met
     }
     else {
     setTimeout(check, 1000); // check again in a second
     }*/
//}


//});


//reordering animation http://zurb.com/forrst/posts/Animated_list_item_reordering_in_jQuery-RR1


    /*Start Sliding Playables for voting*/
    var allItems = $("ul li");
    var numItems = allItems.length;
    /*for(i=0; i<allItems.length; i++){
     sort($(allItems[numItems-i+1]));
     }*/

    $("ul#playables").on("click", "li", function () {
        console.log('clicked');
        sort($(this));
    });

    $("button#sub_new_score").click(function () {
        var newItem = $("ul").append("<li><span class='score'>" + $("input#new_score").val() + "</span></li>");
        newItem.ready(sort($(this)));
    });

    function sort(thisObj) {
        var clicked = thisObj;
        var clickedScore = parseInt($(clicked).find(".score").text(), 10);
        console.log("Clicked Score:  " + clickedScore);
        // all the LIs above the clicked one
        var previousAll = clicked.prevAll();

        // only proceed if it's not already on top (no previous siblings)
        // top LI

        //this is doing for each from bottom to top except for selected
        var top;
        var topScore = parseInt($("ul#playables li").first().find(".score").text(), 10);
        var bottomScore = parseInt($("ul#playables li").last().find(".score").text(), 10);
        if (clickedScore > topScore) {
            top = $("ul#playables li").first();
        }
        else if (clickedScore < bottomScore) {
                top = clicked;
                clicked = $("ul#playables li").last();
        }
        else {

            $("li").not(clicked.add(clicked.prev())).each(function () {
                var thisScore = parseInt($(this).find(".score").text(), 10);
                var nextScore = parseInt($(this).next().find(".score").text(), 10);
                //console.log(thisScore, nextScore);
                //was or equal to
                if (nextScore < clickedScore && thisScore >= clickedScore && $(this) != clicked) {
                    // console.log("Move score " + clickedScore + " to before " + $(this).next().text());
                    top = $(this).next().length ? $(this).next() : top;
                }
                else {
                    //#console.log("Not Match: \n \tClicked Score: " + clickedScore + "\n\tThis Score: " + thisScore + "\n\tNext Score: " + nextScore + "\n\n")
                }
            });


        }

        if (typeof top == 'undefined') {
            console.log("No Swap Necessary");
        }
        else {
            previousAll = top.index() < clicked.index() ? clicked.prevUntil(top.prev()) : previousAll = clicked.nextUntil(top);
            var previous = $(previousAll[0]);

            //if moving item up
            var moveUp = top.index() < clicked.index() ? clicked.offset().top - top.offset().top : (top.offset().top - clicked.offset().top - clicked.outerHeight()) * -1;
            var moveDown = (clicked.offset().top + clicked.outerHeight()) - (previous.offset().top + previous.outerHeight());


            console.log("Move Up: " + moveUp);
            console.log("Move Down: " + moveDown);
            // let's move stuff
            clicked.css('position', 'relative');
            previousAll.css('position', 'relative');
            clicked.animate({
                'top': -moveUp
            });
            previousAll.animate({
                'top': moveDown
            }, {
                complete: function () {
                    clicked.insertBefore(top);
                    clicked.css({
                        'position': 'static',
                        'top': 0
                    });
                    previousAll.css({
                        'position': 'static',
                        'top': 0
                    });
                }
            });
        }
    }

    /*end*/
});

//old stuff starts
/*var substringMatcher = function (strs) {
 return function findMatches(q, cb) {
 var matches, substringRegex;

 // an array that will be populated with substring matches
 matches = [];

 // regex used to determine if a string contains the substring `q`
 substrRegex = new RegExp(q, 'i');

 // iterate through the pool of strings and for any string that
 // contains the substring `q`, add it to the `matches` array
 $.each(strs, function (i, str) {
 if (substrRegex.test(str)) {
 matches.push(str);
 }
 });

 cb(matches);
 };
 };*/


/*function getTags() {
 var tags = [];
 $.ajax({
 type: "GET",
 url: "/getTags/",
 dataType: "json",
 complete: function (xhr, textStatus) {
 var oldTags = xhr.responseJSON;
 for (var x = 0; x < oldTags.length; x++) {
 tags.push(oldTags[x]);
 }
 }
 });
 return tags;
 };*/

/*function getArtists() {
 var artists = [];
 $.ajax({
 type: "GET",
 url: "/getArtists/",
 dataType: "json",
 complete: function (xhr, textStatus) {
 var oldArtists = xhr.responseJSON;
 for (var x = 0; x < oldArtists.length; x++) {
 artists.push(oldArtists[x]);
 }
 }
 });
 return artists;
 };*/


/*$("button#addTag").on("click", function () {
 var newTag = ($("#tagInput").val());
 var artistName = $("input#artistName").val();
 var data = {
 newTag: newTag,
 artistName: artistName
 };

 $.ajax({
 type: 'POST',
 url: window.location.href + 'tag/',
 data: JSON.stringify(data),
 dataType: 'json',
 contentType: 'application/json; charset=utf-8',
 success: function (msg) {
 //if duplicate tag
 if (msg.tag_id == -1) {
 $("#tag_error").remove();
 $('#tagInput').css({
 'border': '2px solid red'
 });
 $("<div class='row text-center' id='tag_error'>Error:<b>'" + newTag + "'</b> Already exists</div>").insertBefore(".addTag .row .col-md-12 .row");
 }
 else {
 $('#artistTags').append($('<option>', {
 value: msg.tag_id,
 text: data.newTag
 }));//TODO: insert where it should be in abc order
 $('#artistTags').val(msg.tag_id);
 $('.addTag').modal('hide');
 }
 }

 })
 });*/

