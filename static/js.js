jQuery(function ($) { // First argument is the jQuery object
        //var vWidth = $(".add-link.input-group").width();
        //var vHeight = vWidth * (9 / 16);
        var startedPlaying = false;
        var playerReady = false;
        var currentPlaying;

        function updatePlayableState(playable_url, state) {
            $.ajax({
                type: "POST",
                contentType: "application/json; charset=utf-8",
                url: "/session/state",
                data: JSON.stringify({playable_url: playable_url, state: state}),
                success: function (data) {
                    //console.log("New Score: " + data.new_score);
                    //console.log(data.article);
                },
                dataType: "json"
            });
        }

        function addVidUrl(url) {
            $.ajax({
                type: "POST",
                contentType: "application/json; charset=utf-8",
                url: "/session/add",
                data: JSON.stringify({newPlayable: url}),
                success: function (data) {
                    //console.log(data.title);
                    //console.log(data.article);
                },
                //figure out better way to do this
                error: function (data) {
                    console.log("error");
                    console.log(data);
                    query(url);
                },
                dataType: "json"
            });
            update();
        }

        function query(query) {
            //var query = $("#vid-search input").val();
            var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&max_results=10&embeddable=true&type=video&q=" + query + "&key=AIzaSyDJwKzS-bxmwl4CgqNq9n-6059o9ljuvwM";
            $("ul#search_results").empty();
            $.ajax({
                type: "GET",
                url: url,
                dataType: "json", // Set the data type so jQuery can parse it for you
                success: function (data) {
                    $("ul#search_results h2").remove();
                    $("ul#search_results").prepend("<h2>Results for '" + query + "'</h2>");

                    var items = data['items'];
                    console.log(items);
                    for (var i in items) {
                        var vid_id = items[i]['id']['videoId'];
                        var name = items[i]['snippet']['title'];
                        var img_url = items[i]['snippet']['thumbnails']['default']['url'];
                        //checks if it's already been played before
                        var listItem = $("li.list-group-item[data-url='" + vid_id + "']");
                        //only include it if it doens't exist
                        if(listItem.length == 0)
                            $("ul#search_results").append("<li class='row' data-vid='" + vid_id + "'><div class='col-lg-3'><img src='" +
                                img_url +
                                "' class='img-responsive' /></div>" +
                                "<div class='col-lg-6'>" + name + "</div>" +
                                "<div class='col-lg-2 add'>+</div> <span> </li>");
                    }
                    $('.search_modal.modal.fade').modal('show');
                }
            });

        }

        $('#url_form').submit(function (event) {
            event.preventDefault();
            var url = $('.add-link .form-control').val();
            addVidUrl(url);
            $(".add-link input.form-control").val("");
        });
        $("#vid-search button").click();
        //add button next to items in search
        $("ul#search_results").on('click', 'li div.add', function () {
            console.log($(this).parent("li").attr("data-vid"));
            addVidUrl($(this).parent("li").attr("data-vid"));
            $('.search_modal.modal.fade').modal('hide');
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
        }


        if (findBootstrapEnvironment() == "lg") {
            console.log("if");

            var player;
            var vWidth = $(".add-link.input-group").width();
            var vHeight = vWidth * (9 / 16);
            //$(".add-link").css("top",vHeight);
            $("#iframe-container").css({
                width: vWidth,
                height: vHeight
            });
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

// 4. The API will call this function when the video player is ready.
            function onPlayerReady(event) {
                playerReady = true;
                event.target.playVideo();
                //event.target.playVideo();
                if ($("#playables li").length > 0) {
                    startedPlaying = true;
                }
                //goToNext()

            }

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
            var done = false;

            function onPlayerStateChange(event) {
                if (event['data'] == 0) {
                    console.log("video_ended");
                    var vid_id = $("ul#now_playing li:first").attr("data-url");
                    updatePlayableState(vid_id, "played");
                    goToNext();
                }
            }

            function stopVideo() {
                player.stopVideo();
            }

            //start queue code
            function goToNext() {
                //if no items on either list or player isn't ready keep trying
                if (($("#playables li").length == 0 && $("#now_playing li").length == 0) || !playerReady) {
                    setTimeout(goToNext, 500);
                }
                else {
                    player.playVideo();
                    if (startedPlaying && $("#playables li").length > 0) {
                        $('#history').append($("ul#now_playing li:first"));
                        $('#now_playing').append($('#playables li:first'));
                    }

                    var vid_id = $("ul#now_playing li:first").attr("data-url");
                    startedPlaying = true;

                    player.loadVideoById({
                        'videoId': vid_id,
                        'suggestedQuality': 'large'
                    });
                    updatePlayableState(vid_id, "playing");
                }

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
            if ($(this).hasClass("clicked")) {
                $(this).toggleClass("clicked");
                voteVal = 0; //unclicked a vote
            }
            else {
                $(this).parent().children(".clicked").removeClass("clicked");
                $(this).addClass("clicked");
            }

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
            console.log("this: ");
            console.log($(this));
            //update();
            if ($("#playables li").length > 1)
                sort($(this).parent());
        });

        function update() {
            if(playerReady){
                currentPlaying = player.getVideoUrl();
                if(currentPlaying != undefined)
                    currentPlaying = currentPlaying.substring(currentPlaying.search("v=") + 2, currentPlaying.length);

            }

            $.ajax({
                type: "GET",
                url: "/session/update/",
                dataType: "json", // Set the data type so jQuery can parse it for you
                success: function (data) {
                    var users = data['users'];
                    var playables = data['playables'];
                    for (var i in playables) {
                        var url = playables[i]['url'];
                        var score = playables[i]['score'];
                        var state = playables[i]['state'];

                        //sees if this url already exists in list
                        var listItem = $("li.list-group-item[data-url='" + url + "']");
                        if (!listItem.length) {
                            //doesn't exist yet
                            var appendTo = $("#playables");
                            if (state == "playing") {
                                if (playerReady) {
                                    var playerURL = player.getVideoUrl();
                                    currentPlaying = playerURL.substring(playerURL.search("v=") + 2, playerURL.length);
                                    console.log("Current Playing: " + currentPlaying);
                                    console.log("URL: " + url);
                                    if (currentPlaying != url) {
                                        console.log("vid needs to be changed");
                                        player.cueVideoById({
                                            'videoId': url,
                                            'suggestedQuality': 'large'
                                        });
                                        updatePlayableState(currentPlaying, "played");
                                        updatePlayableState(url, "playing");
                                        player.playVideo();
                                        currentPlaying = url;
                                    }
                                }
                                appendTo = $("#now_playing");
                            }
                            else if (state == "played")
                                appendTo = $("#history");
                            $(appendTo).append("<li class='clearfix list-group-item' data-url='" +
                                playables[i]['url'] + "'>" +
                                "<span class='upvote'>&#x25B2;</span>" +
                                "<span class='downvote'>&#x25BC;</span>" +
                                "<img src='" + playables[i]['thumb_url'] + "' class='img-rounded' width='60' height='45'>" +
                                "<span class='title'>" + playables[i]['name'] + "</span>" +
                                "<span class='score label label-default label-pill pull-xs-right'>" + (playables[i]['score']).toString() + "</span>" +
                                "</li>"
                            );
                        }
                        //if it already exists, update the score, check that it's in the right place
                        else {
                            listItem.find(".score").text(score);
                            if (state == "playing" && listItem.parent().is("#playables")) { //shoud be playing but in playables
                                if(currentPlaying != url){ //if player is playing something else
                                    //load new video
                                    player.cueVideoById({
                                        'videoId': url,
                                        'suggestedQuality': 'large'
                                    });
                                    //move old li to history
                                    $("#history").append($("#now_playing li"));
                                    //move this to now_playing
                                    $("#now_playing").append(listItem);
                                    //play
                                    player.playVideo();
                                    //update state of other
                                    updatePlayableState(currentPlaying, "played");
                                    currentPlaying = url;
                                }
                                else if($("#now_playing li").first().attr("data-url") != url){ //if it is playing right vid
                                    $("#history").append($("#now_playing li")); //if something's playing move it to history
                                    $("#now_playing").append(listItem);
                                }
                                else if($("#now_playing li").length ==0){
                                    $("#now_playing").append(listItem);
                                }
                                currentPlaying = url;
                            }
                            if (state == "played" && (listItem.parent().is("#playables") || listItem.parent().is("#now_playing"))) {
                                $("#history").append(listItem);
                                console.log("condition 2!!!");
                            }
                        }
                        $(listItem).children(".clicked").removeClass("clicked");
                        if (playables[i]['user_vote'] > 0) {
                            $(listItem).find(".upvote").addClass("clicked")
                        }
                        else if (playables[i]['user_vote'] < 0) {
                            $(listItem).find(".downvote").addClass("clicked")
                        }
                        sort(listItem);
                        console.log("Adding: " + playables[i]['name'] + " with score" + playables[i]['score']);
                    }
                    for (var j in users) {
                        var name = users[j]['Name'];
                        if ($("#users li:contains(" + name + ")").length == 0) {
                            $("#users").append("<li>" + name + "</li>");
                            console.log("Adding: " + users[j]['Name']);
                        }
                    }
                    //if only 1 playable start
                    if (!startedPlaying && findBootstrapEnvironment() == "lg") {
                        startedPlaying = true;
                        goToNext();
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

        /*$("ul#playables").on("click", "li", function () {
         console.log('clicked');
         sort($(this));
         });*/

        $("button#sub_new_score").click(function () {
            var newItem = $("ul").append("<li><span class='score'>" + $("input#new_score").val() + "</span></li>");
            newItem.ready(sort($(this)));
        });

        function sort(thisObj) {
            if($("ul#playables li").length < 2)
                return;
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
    }
);

