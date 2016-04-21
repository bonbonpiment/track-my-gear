var app_status = 'loading';
var db;
var notification = Array();

var ngApp = angular.module('ngApp', [
	'ionic',
	'ngCordova',
  'pascalprecht.translate',
	'ngCordovaBeacon',
	'angularMoment',
	'ngApp.controllers',
	'ngApp.directives',
	'ngApp.filters',
	'ngApp.DataFactory',
	'ngApp.DataServices',
	'ngApp.DeviceFactory',
	'ngApp.DeviceServices',
	'ngApp.EddystoneServices',
	'ngApp.EddystoneFactory',
	'ngApp.BeaconServices'
])

.run(function($ionicPlatform, $cordovaStatusbar, $window, $translate) {

	$ionicPlatform.ready(function() {

    if (ionic.Platform.isIOS())
    {
      // Ask permission for notifications (required for iOS)
      $window.plugin.notification.local.registerPermission();

      // Ask permission for background location (required for iOS)
      $window.cordova.plugins.locationManager.requestAlwaysAuthorization();
    }

    if(typeof navigator.globalization !== "undefined") {
      navigator.globalization.getPreferredLanguage(function(language) {
       $translate.use((language.value).split("-")[0]).then(function(data) {
          console.log("getPreferredLanguage SUCCESS -> " + data);
         }, function(error) {
          console.log("getPreferredLanguage ERROR -> " + error);
        });
      }, null);
    }

		// If we have the keyboard plugin, let use it
    /*
		if (window.cordova && window.cordova.plugins.Keyboard) {
			// Lets hide the accessory bar fo the keyboard (ios)
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			// Also, lets disable the native overflow scroll
			cordova.plugins.Keyboard.disableScroll(true);
		}
*/
		document.addEventListener("pause", function() { app_status = 'pause'; }, false);
		document.addEventListener("resume", function() { app_status = 'resume'; }, false);
		document.addEventListener("deviceready", function() { app_status = 'ready'; }, false);

	});
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $translateProvider) {

  $translateProvider.useSanitizeValueStrategy(null);

  $translateProvider.useStaticFilesLoader({
    prefix: 'i18n/',
    suffix: '.json'
  });

  $translateProvider.preferredLanguage('en');
  $translateProvider.fallbackLanguage('en');

	$ionicConfigProvider.backButton.previousTitleText(false).text('');

	$ionicConfigProvider.views.transition('none');
/*
	if (! ionic.Platform.isIOS()) {
		$ionicConfigProvider.scrolling.jsScrolling(true);
	}
*/
	$stateProvider
		.state('nav', {
			url: '/nav',
			abstract: true,
			templateUrl: 'nav.html',
			controller: 'NavCtrl'
		})
		.state('nav.home', {
			url: '/home',
			cache: true,
			views: {
				'mainView': {
					templateUrl: 'home.html',
					controller: 'HomeCtrl'
				}
			}
		})
		.state('nav.beacons', {
			url: '/beacons',
			cache: false,
			views: {
				'mainView': {
					templateUrl: 'templates/beacons.html',
					controller: 'BeaconsCtrl'
				}
			}
		})
		.state('nav.add-beacon', {
			url: '/add-beacon',
			cache: false,
			views: {
				'mainView': {
					templateUrl: 'templates/beacon-add.html',
					controller: 'BeaconCtrl'
				}
			}
		})
		.state('nav.edit-beacon', {
			url: '/edit-beacon',
      params: {
        id: 0
      },
			cache: false,
			views: {
				'mainView': {
					templateUrl: 'templates/beacon-edit.html',
					controller: 'BeaconCtrl'
				}
			}
		})
		.state('nav.eddystone', {
			url: '/eddystone',
			cache: false,
			views: {
				'mainView': {
					templateUrl: 'templates/eddystone.html',
					controller: 'EddystoneCtrl'
				}
			}
		})
		.state('nav.places', {
			url: '/places',
			cache: false,
			views: {
				'mainView': {
					templateUrl: 'templates/places.html',
					controller: 'PlacesCtrl'
				}
			}
		})
		.state('nav.settings', {
			url: '/settings',
			cache: true,
			views: {
				'mainView': {
					templateUrl: 'templates/settings.html',
					controller: 'SettingsCtrl'
				}
			}
		})
		.state('nav.help', {
			url: '/help',
			cache: true,
			views: {
				'mainView': {
					templateUrl: 'templates/help.html',
					controller: 'HelpCtrl'
				}
			}
		});

	$urlRouterProvider.otherwise('/nav/home');

});