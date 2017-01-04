jQuery(function ($) {

        var startedPlaying = false;
        var playerReady = false;
        var iframe = $("iframe");
        var navbar = $("nav.navbar");
        var closeRight = $(".close-right");
        var playablesList = $("ul#unplayed li");


        var origIframeWidth;
        var origIframeHeight;
        var currentPlaying;

        closeRight.click(function () {
            if ($(this).hasClass("to-close"))
                growVideo();
            else
                shrinkVideo();
        });

        var growVideo = function () {
            var newWidth = $(".container-fluid").width();
            var newHeight = $(window).innerHeight() - $("#url_form").outerHeight(true);
            var colHeight = $(window).innerHeight();
            var navHeight = -1 * (navbar.outerHeight(true));
            $("iframe,#iframe-container")
                .animate(
                    {
                        width: newWidth,
                        height: newHeight
                    },
                    {
                        duration: 800,
                        queue: false,
                        step: function (now) {
                            $(this).attr("width", now);
                            $(this).attr("height", now);
                        }
                    });
            $(".col-lg-8").animate({
                width: newWidth + "px",
                height: colHeight + "px"
            }, {duration: 800, queue: false});

            navbar.animate({
                marginTop: navHeight + "px"
            }, {duration: 800, queue: false});

            $(".session_info").animate({
                right: "-" + $(".session_info").width() + "px"
            }, {
                duration: 800,
                queue: false,
                done: function () {
                    console.log("ho");
                    closeRight.removeClass("to-close");
                    closeRight.addClass("to-open");
                    closeRight.text("<<<");
                }
            });


        };

        var shrinkVideo = function () {
            var newWidth = origIframeWidth;
            var newHeight = origIframeHeight;
            var colHeight = newHeight + $("#url_form").outerHeight(true);
            $("iframe,#iframe-container").animate(
                {
                    width: newWidth,
                    height: newHeight
                },
                {
                    duration: 800,
                    queue: false,
                    step: function (now) {
                        $(this).attr("width", now);
                        $(this).attr("height", now);
                    }
                });
            $(".col-lg-8").animate({
                width: newWidth + "px",
                height: colHeight + "px"
            }, {duration: 800, queue: false});
            navbar.animate({
                marginTop: "0px"
            }, {duration: 800, queue: false});
            $(".session_info").animate({
                right: "0px"
            }, {
                duration: 800,
                queue: false,
                done: function () {
                    console.log("hi");
                    closeRight.removeClass("to-open");
                    closeRight.addClass("to-close");
                    closeRight.text(">>>");
                }
            });


        };

        $.ajaxSetup({cache: false});

        function updatePlayableState(playable_url, state) {
            console.log("update playable state: "+playable_url+" "+state);
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
                    runQuery(url);
                },
                dataType: "json"
            });
            update();
        }

        function setVideo(url) {
            console.log("set video: "+url);
            if (findBootstrapEnvironment() == "lg") {
                player.cueVideoById({
                    'videoId': url,
                    'suggestedQuality': 'large'
                });
                player.playVideo();
                updatePlayableState(url, "playing");
            }
        }

        function getQueryData(query, page_token, page_id) {
            var url = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&embeddable=true&type=video&q=" + query + "&key=AIzaSyDJwKzS-bxmwl4CgqNq9n-6059o9ljuvwM";
            console.log(url);
            $.ajax({
                type: "GET",
                url: url + "&pageToken=" + page_token,
                dataType: "json", // Set the data type so jQuery can parse it for you
                success: function (data) {
                    appendQueryData(query, data, page_id);
                }
            });
        }

        function appendQueryData(query, data, page_id) {
            next_page_token = data['nextPageToken'];


            var items = data['items'];
            console.log(items);
            var toAppend = "";
            for (var i in items) {
                var vid_id = items[i]['id']['videoId'];
                var name = items[i]['snippet']['title'];
                var img_url = items[i]['snippet']['thumbnails']['default']['url'];
                //checks if it's already been played before
                var listItem = $("li.list-group-item[data-url='" + vid_id + "']");
                //only include it if it doens't exist
                if (listItem.length == 0)
                    toAppend += "<li class='row' data-vid='" + vid_id + "'><div class='col-lg-3 col-sm-4'><img src='" +
                        img_url +
                        "' class='img-responsive' /></div>" +
                        "<div class='col-lg-6 col-sm-8'>" + name + "</div>" +
                        "<div class='col-lg-2 col-sm-12 add'>+</div> <span> </li>";
            }
            $("ul.search_results#" + page_id).empty();
            $("ul.search_results#" + page_id).append(toAppend);
            if (page_id == 0)
                $('.search_modal.modal.fade').modal('show');
            if (page_id < 5) {
                getQueryData(query, next_page_token, page_id + 1);
            }
            else {
                return;
                console.log("DONE!");
            }
        }

        function runQuery(query) {
            $(".modal-title").text("Results for '" + query + "'");
            //set to page 1
            $(".search_results").removeClass("active");
            $(".search_results").first().addClass("active");
            var empty = "";
            getQueryData(query, empty, 0);
        }

        $('#url_form').submit(function (event) {
            event.preventDefault();
            var url = $('.add-link .form-control').val();
            addVidUrl(url);
            $(".add-link input.form-control").val("");
        });
        $("#vid-search button").click();
        //add button next to items in search
        $("ul.search_results").on('click', 'li div.add', function () {
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
            origIframeWidth = vWidth;
            origIframeHeight = vHeight;
            //$(".add-link").css("top",vHeight);
            $("#iframe-container").css({
                width: vWidth,
                height: vHeight
                //opacity:.5
            });
            window.onYouTubePlayerAPIReady = function () {
                player = new YT.Player('player', {
                    height: vHeight,
                    width: vWidth,
                    videoId: 'NULL',
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
                console.log("player ready");

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
                alert("go to next");
                //if no items on either list or player isn't ready keep trying
                if ($("#unplayed li").length == 0 || !playerReady) { //was  && $("#now_playing li").length == 0) also
                    setTimeout(goToNext, 500);
                }
                else {
                    player.playVideo();
                    /*if (startedPlaying && $("#unplayed li").length > 0) {
                        $('#history').append($("ul#now_playing li:first"));
                        $('#now_playing').append($('#unplayed li:first'));
                    }

                    var vid_id = $("ul#now_playing li:first").attr("data-url");
                    startedPlaying = true;

                    player.loadVideoById({
                        'videoId': vid_id,
                        'suggestedQuality': 'large'
                    });
                    updatePlayableState(vid_id, "playing");*/
                    setVideo(vid_id);
                }

            }
        }

        else {
            console.log("else");
        }

        $("ul#unplayed").on('click', 'li span.upvote,li span.downvote', function () {
            console.log("VOTE!");
            //$('#unplayed li.list-group-item .upvote, #unplayed li.list-group-item .downvote').click(function () {
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
            if ($("#unplayed li").length > 1)
                sort($(this).parent());
        });

        function update() {
            if (playerReady) {
                currentPlaying = player.getVideoUrl();
                if (currentPlaying != undefined && currentPlaying.length > 30){
                    $("div#iframe-container").addClass("visible");
                    currentPlaying = currentPlaying.substring(currentPlaying.search("v=") + 2, currentPlaying.length);
                }
                else{
                    $("div#iframe-container").removeClass("visible");
                }
            }
            $.ajax({
                type: "GET",
                url: "/session/update/",
                dataType: "json", // Set the data type so jQuery can parse it for you
                success: function (data) {
                    var users = data['users'];
                    var playing = data['playing'];
                    var unplayed = data['unplayed'];
                    var played = data['played'];

                    //first update all unplayed
                    $('#unplayed li').remove();
                    //TODO loading icon here
                    //TODO case when no videos playing
                    //TODO change id playables to unplayed
                        for(var i in unplayed){
                            playable = unplayed[i];
                            html_text = genPlayableHTML(playable['name'],playable['url'],playable['thumb_url'],playable['score']);
                            $('#unplayed').append(html_text);
                            listItem = $('#unplayed').last()
                            if (playable['user_vote'] > 0) {
                                $(listItem).find(".upvote").addClass("clicked")
                            }
                            else if (playable['user_vote'] < 0) {
                                $(listItem).find(".downvote").addClass("clicked")
                            }
                        }
                    //only if need be update now_playing and played
                    //new video must be loaded
                    if(playing[0]['url'] != currentPlaying){
                        console.log("video changed");
                        //load new video
                        currentPlaying = playing.length > 0 ? playing[0]['url'] : "null";
                        setVideo(currentPlaying);
                        //move old li to history
                        $("#history li").remove();
                        for(var i in played){
                            playable = played[i];
                            html_text = genPlayableHTML(playable['name'],playable['url'],playable['thumb_url'],playable['score']);
                            $('#history').append(html_text);
                        }
                        $("#now_playing li").remove();
                        //TODO for loop probably not neccesary
                        for(var i in playing){
                            playable = playing[i];
                            html_text = genPlayableHTML(playable['name'],playable['url'],playable['thumb_url'],playable['score']);
                            $('#now_playing').append(html_text);
                        }
                        //play
                        //update state of other
                        //TODO is this neccesary?
                        //updatePlayableState(currentPlaying, "played");
                    }


                    for (var j in users) {
                        var name = users[j]['Name'];
                        if ($("#users li:contains(" + name + ")").length == 0) {
                            $("#users").append("<li>" + name + "</li>");
                            console.log("Adding: " + users[j]['Name']);
                        }
                    }
                    //if only 1 playable start
                    if (!startedPlaying &&
                        findBootstrapEnvironment() == "lg" &&
                        $("#now_playing li").length == 0
                    ) {
                        console.log("here we are");
                        startedPlaying = true;
                        goToNext();
                    }
                    else if (playerReady && !startedPlaying &&
                        findBootstrapEnvironment() == "lg" &&
                        $("#now_playing li").length == 1
                    ) {
                        player.loadVideoById({
                            'videoId': $("#now_playing li").attr("data-url"),
                            'suggestedQuality': 'large'
                        });
                        player.playVideo();
                        console.log("here we are2");
                        startedPlaying = true;
                    }


                }
            });
        }

        $("ul#now_playing").on('click', 'li div.next', function () {
            console.log("click");
            /*if ($("#unplayed li").length > 0) {
                setVideo($("#unplayed li:first-of-type").attr("data-url"));

            }*/
            updatePlayableState($("#now_playing li:first-of-type").attr("data-url"),'played')
        });
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

        /*$("ul#unplayed").on("click", "li", function () {
         console.log('clicked');
         sort($(this));
         });*/

        $("button#sub_new_score").click(function () {
            var newItem = $("ul").append("<li><span class='score'>" + $("input#new_score").val() + "</span></li>");
            //newItem.ready(sort($(this)));
        });

        function genPlayableHTML(title, url, thumb_url, score){
            text = "<li class='clearfix list-group-item' data-url='" +
                                url + "'>" +
                                "<span class='upvote'>&#x25B2;</span>" +
                                "<span class='downvote'>&#x25BC;</span>" +
                                "<img src='" + thumb_url + "' class='img-rounded' width='60' height='45'>" +
                                "<div class='next'><i class='fa fa-step-forward' aria-hidden='true'></i></div><span class='title'>" + title + "</span>" +
                                "<span class='score label label-default label-pill pull-xs-right'>" + score.toString() + "</span>" +
                                "</li>";
            return text;
        }

        /*end*/
    });

