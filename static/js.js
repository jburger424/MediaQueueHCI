jQuery(function ($) { // First argument is the jQuery object
    var vWidth = $(".add-link.input-group").width();
    var vHeight = vWidth * (9 / 16);
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
        $(".add-link input.form-control").val("")
        /*$.ajax({
         url: '/session/585/add',
         data: $('form').serialize(),
         type: 'POST',
         success: function (response) {
         console.log(response);
         },
         error: function (error) {
         console.log(error);
         }
         });*/
    });
    function update() {
        $.ajax({
            type: "GET",
            url: "/session/update/",
            dataType: "json", // Set the data type so jQuery can parse it for you
            success: function (data) {
                var users = data['users'];
                var playables = data['playables'];
                console.log(users);
                console.log(playables);
                for (var i in playables) {
                    $("#playables").append("<li>" + playables[i]['URL'] + "</li>");
                    console.log("Adding: " + playables[i]['URL']);
                }
                for (var j in users) {
                    $("#users").append("<li>" + users[j]['Name'] + "</li>");
                    console.log("Adding: " + users[j]['Name']);
                }
            }
        });
    }

    //update every second
    setInterval(function () {
        update();
        //console.log("updating")
    }, 1000);

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
    $("#playables").on('click', 'li', function () {
        //alert($(this).text());
        player.loadVideoById({
            'videoId': $(this).text(),
            'suggestedQuality': 'large'
        });

    });
    var player;
    var vWidth = $(".add-link.input-group").width();
    var vHeight = vWidth * (9 / 16);

    function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
            height: vHeight,
            width: vWidth,
            videoId: 'M7lc1UVf-VE',
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }

// 4. The API will call this function when the video player is ready.
    function onPlayerReady(event) {
        event.target.playVideo();
    }

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
    var done = false;

    function onPlayerStateChange(event) {
        /*if (event.data == YT.PlayerState.PLAYING && !done) {
            setTimeout(stopVideo, 6000);
            done = true;
        }*/
    }

    function stopVideo() {
        player.stopVideo();
    }
}

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

