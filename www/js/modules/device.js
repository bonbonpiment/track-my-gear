/**
 * --------------------------------------------------------------------------------------------
 * Factory
 */
angular.module('ngApp.DeviceFactory', [])

/*
 * Persist device geo location throughout app's life
 */

.factory('geo', function() {
    return {
        lat: null,
        lng: null,
        alt: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        timestamp: null
    };
});

/**
 * --------------------------------------------------------------------------------------------
 * Service
 */

angular.module('ngApp.DeviceServices', [])

/**
 * General device information
 */

.service('DeviceService', function($cordovaDevice, $cordovaGeolocation) {

    /**
     * Set device information
     */

    this.loadDevice = function($scope)
	{

        document.addEventListener("deviceready", function() {

            /*
             * Get Geo Location
             */

            $cordovaGeolocation
                .getCurrentPosition({
                    timeout: 1000 * 10,
                    maximumAge: 1000 * 10,
                    enableHighAccuracy: true
                })
                .then(function(position) {
                    $scope.geo = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        alt: position.coords.altitude,
                        accuracy: position.coords.accuracy,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.coords.timestamp
                    }
                }, function(err) {
                    // error
                    console.log(err);
                });
        }, false);
    }
});