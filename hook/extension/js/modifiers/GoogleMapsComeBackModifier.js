/**
 *   GoogleMapsComeBackModifier is responsible of ...
 */
function GoogleMapsComeBackModifier(activityId) {
    this.activityId = activityId;
}

/**
 * Define prototype
 */

// Setup callback in window object when gmaps ready
window.googleMapsApiLoaded = function() {
    $(window).trigger('gMapsLoaded');
}

GoogleMapsComeBackModifier.prototype = {

    modify: function modify() {

        // Bind function for be called when Google API loaded
        $(window).bind('gMapsLoaded', this.googleMapsApiLoaded(this.activityId));

        // Next load the Google API from external
        this.getGoogleMapsApi();


        // If segment Item has been clicked then fetch info on segment and display
        /* 
        var self = this;
        $('[data-segment-effort-id]').click(function() {
            var effortIdClicked = $(this).attr('data-segment-effort-id');
            self.fetchSegmentInfoAndDisplayWithGoogleMap(self.pathArray, effortIdClicked);
        });
        */

    },

    googleMapsApiLoaded: function(activityId) {

        // Place show button over MapBox activity main map
        $('#map-canvas').before('<a class="button btn-block btn-primary" id="showInGoogleMap">View in Google Maps</a>').each(function() {

            $('#showInGoogleMap').on('click', function() {

                // Show loading message while loading gmaps and path
                $.fancybox('<span style="width:100px;height:50px">Loading...</span>', {
                    'autoScale': true
                });

                this.fetchPathFromStream(activityId, function(pathArray) {

                    this.pathArray = pathArray;

                    // Check if effort id is given
                    var effortId = (window.location.pathname.split('/')[4] || window.location.hash.replace('#', '')) || false;

                    if (effortId) {
                        this.fetchSegmentInfoAndDisplayWithGoogleMap(this.pathArray, effortId);
                    } else {
                        this.displayGoogleMapWithPath(this.pathArray);
                    }

                }.bind(this));

            }.bind(this));

        }.bind(this));

        // PLACE SEGMENT AREA BUTTON 'View in Google Maps'
        // Listening for Segment Change visualization
        if (!Strava.Labs) return;

        var view = Strava.Labs.Activities.SegmentLeaderboardView;

        if (!view) return;

        var functionRender = view.prototype.render;
        var self = this;

        view.prototype.render = function() {

            var r = functionRender.apply(this, Array.prototype.slice.call(arguments));

            var effortId = (window.location.pathname.split('/')[4] || window.location.hash.replace('#', '')) || false;

            $('.effort-map').before('<a class="button btn-block btn-primary"  id="showSegInGoogleMap">View in Google Maps</a>').each(function() {

                $('#showSegInGoogleMap').on('click', function() {

                    self.fetchPathFromStream(activityId, function(pathArray) {

                        this.pathArray = pathArray;

                        // Check if effort id is given
                        var effortId = (window.location.pathname.split('/')[4] || window.location.hash.replace('#', '')) || false;

                        if (effortId) {
                            self.fetchSegmentInfoAndDisplayWithGoogleMap(this.pathArray, effortId);
                        }

                    }.bind(this));

                }.bind(this));

            }.bind(this));

            return r;
        };

    },

    fetchPathFromStream: function(activityId, callback) {
        var streamPathUrl = "/activities/" + activityId + "/streams?stream_types[]=latlng";
        $.ajax(streamPathUrl).done(function(jsonResponse) {
            callback(jsonResponse.latlng);
        }.bind(this));
    },

    fetchSegmentInfoFromEffortId: function(effortId, callback)  {

        var segmentInfosResponse;

        $.ajax({
            url: '/segment_efforts/' + effortId,
            type: 'GET',
            beforeSend: function(xhr) {
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            },
            dataType: 'json',
            success: function(xhrResponseText) {
                segmentInfosResponse = xhrResponseText;
            },
            error: function(err) {
                console.error(err);
            }
        }).then(function() {

            // Call Activity Processor with bounds
            if (!segmentInfosResponse.start_index && segmentInfosResponse.end_index) {
                console.error('No start_index end_index found for');
            }
            callback(segmentInfosResponse);
        });
    },

    fetchSegmentInfoAndDisplayWithGoogleMap: function(pathArray, effortId) {

        // Display GoogleMap With Path And Segment Effort highlighted
        this.fetchSegmentInfoFromEffortId(effortId, function(segmentInfosResponse) {
            // Slice latlong array
            this.displayGoogleMapWithPath(
                pathArray, [segmentInfosResponse.start_index, segmentInfosResponse.end_index]
            );
        }.bind(this));
    },

    displayGoogleMapWithPath: function(mainPathArray, highlightFromTo) {

        var mapSize = [
            window.innerWidth * 0.9,
            window.innerHeight * 0.9
        ];

        var html = '<div style="padding-bottom:10px;"><div style="height:' + mapSize[1] + 'px;width:' + mapSize[0] + 'px;" id="gmaps_canvas"></div></div>';

        $.fancybox(html, {
            'autoScale': true,
            'transitionIn': 'fade',
            'transitionOut': 'fade'
        });

        // Test if exit then no append before
        if (!$('#gmaps_canvas').length) {

            $('#map-canvas').before(html).each(function() {
                this.applyToMap(mainPathArray, highlightFromTo);
            }.bind(this));
        } else {
            this.applyToMap(mainPathArray, highlightFromTo);
        }

    },

    applyToMap: function(mainPathArray, highlightFromTo) {

        // if (!this.map) {
        this.map = new google.maps.Map(document.getElementById("gmaps_canvas"), {
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            overviewMapControl: true
        });
        // }

        var points = [];
        var bounds = new google.maps.LatLngBounds();

        _.each(mainPathArray, function(position) {
            var p = new google.maps.LatLng(position[0], position[1]);
            points.push(p);
            bounds.extend(p);
        });

        var mainPathPoly = new google.maps.Polyline({
            // use your own style here
            path: points,
            strokeColor: "#FF0000",
            strokeOpacity: .7,
            strokeWeight: 4
        });

        // Set path to map
        mainPathPoly.setMap(this.map);

        // fit bounds to track
        this.map.fitBounds(bounds);

        if (highlightFromTo) {

            var secondPathPoly = new google.maps.Polyline({
                path: points.slice(highlightFromTo[0], highlightFromTo[1]),
                strokeColor: "#105cb6",
                strokeOpacity: 1,
                strokeWeight: 4
            });

            // Erase bounds and computed new ones with highlighted path
            bounds = new google.maps.LatLngBounds();
            _.each(mainPathArray.slice(highlightFromTo[0], highlightFromTo[1]), function(position) {
                var p = new google.maps.LatLng(position[0], position[1]);
                bounds.extend(p);
            });

            // Update with new bounds from highlighted path
            this.map.fitBounds(bounds);

            // Apply new poly line
            secondPathPoly.setMap(this.map);
        }
    },

    getGoogleMapsApi: function() {
        var script_tag = document.createElement('script');
        script_tag.setAttribute("type", "text/javascript");
        script_tag.setAttribute("src", "https://maps.google.com/maps/api/js?sensor=false&callback=googleMapsApiLoaded");
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
    }
};
