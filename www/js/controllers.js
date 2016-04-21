angular.module('ngApp.controllers', ['ngApp.config'])

/*
 * ---------------------------------------------------
 * Nav controller
 * ---------------------------------------------------
 */

.controller('NavCtrl', function($scope, $rootScope, $ionicSideMenuDelegate, $location) {
	$scope.showLeftMenu = function() {
		$ionicSideMenuDelegate.toggleLeft();
	};
	$scope.showRightMenu = function() {
		$ionicSideMenuDelegate.toggleRight();
	};

  $rootScope.location = $location;
})

/*
 * ---------------------------------------------------
 * Main App controller
 * ---------------------------------------------------
 */

.controller('AppCtrl', function(
	$scope,
	$rootScope,
	$window,
	$translate,
	$ionicLoading,
  $ionicPopup,
	$cordovaSQLite,
  $cordovaBeacon,
	DeviceService,
	DataService,
	BeaconService,
	EddystoneService,
	data,
	geo,
	eddystone,
	CONFIG
) {

	/*
	 * Globals
	 */

	$scope.data = data;
	$scope.geo = geo;
	$scope.eddystone = eddystone;

	/*
	 * ------------------------------------------------------------------------
	 * Open database and load beacons from database
	 */

  document.addEventListener("deviceready", function() {
    //cordova.plugins.locationManager.enableDebugNotifications();

    db = $cordovaSQLite.openDB({
      name: CONFIG.sqlite.db_name, 
      location: CONFIG.sqlite.location, 
      androidDatabaseImplementation: CONFIG.sqlite.androidDatabaseImplementation, 
      androidLockWorkaround: CONFIG.sqlite.androidLockWorkaround
    });

    // Check if Bluetooth is enabled (Andoird only, iOS seems to be buggy)
    if (ionic.Platform.isAndroid())
    {
      $cordovaBeacon.isBluetoothEnabled()
        .then(function(isEnabled) {
            console.log("isBluetoothEnabled: " + isEnabled);
            if (! isEnabled)
            {
              if (ionic.Platform.isIOS())
              {/*
                var alertPopup = $ionicPopup.alert({
                  template: 'Please turn on Bluetooth to track beacons.'
                });
                */
              }
              else
              {
                var alertPopup = $ionicPopup.alert({
                  title: '<i class="ion-bluetooth"></i> ' + $translate.instant('bluetooth'),
                  template: $translate.instant('turn_on_bluetooth')
                });
  
  /*              $cordovaBeacon.enableBluetooth();*/
              }
            }
        });
    }

    // Get language from database setting
		var promise = DataService.getSetting('app_language');

		promise.then(function(value) {
      if (value != null)
      {
        $translate.use(value);
        console.log('Set app_language: ' + value);
      }
		});

  }, false);

	DataService.loadBeacons($scope);

	/*
	 * ------------------------------------------------------------------------
	 * Load device information (uuid, geo)
	 */

	DeviceService.loadDevice($scope);

	/*
	 * ------------------------------------------------------------------------
	 * Start monitoring (region + proximity) beacons
	 */

	BeaconService.startMonitoring($scope);

	/*
	 * Generic function to prevent $apply already in progress error
	 */

	$scope.safeApply = function(fn) {
		var phase = this.$root.$$phase;
		if(phase == '$apply' || phase == '$digest') {
			if(fn && (typeof(fn) === 'function')) {
				fn();
			}
		} else {
			this.$apply(fn);
		}
	};
})

/*
 * ---------------------------------------------------
 * Home
 * ---------------------------------------------------
 */

.controller('HomeCtrl', function($scope, data, geo) {

	/*
	 * Globals
	 */

	$scope.data = data;
	$scope.geo = geo;
})

/*
 * ---------------------------------------------------
 * Favorites
 * ---------------------------------------------------
 */

.controller('BeaconsCtrl', function($scope, $state, $translate, data, geo, $ionicActionSheet, $ionicPopup, DataService, DeviceService, BeaconService) {

	/*
	 * Globals
	 */

	$scope.data = data;
	$scope.geo = geo;

	$scope.showActionSheet = function(name, id, url) {
		$ionicActionSheet.show({
			buttons: [
				{ text: '<i class="icon ion-edit dark hide-ios"></i> ' + $translate.instant('edit_beacon') }
			],
			destructiveText: '<i class="icon ion-android-delete royal hide-ios"></i> ' + $translate.instant('delete_beacon'),
			titleText: name,
			cancelText: $translate.instant('cancel'),
			cancel: function() {
			  return true;
			},
			buttonClicked: function(index) {

				// Edit beacon
				if (index == 0)
				{
          $state.go('nav.edit-beacon', {
            id: id
          });
				}

				return true;
			},
			destructiveButtonClicked: function() {

        var confirmPopup = $ionicPopup.confirm({
          title: $translate.instant('delete_beacon'),
          template: $translate.instant('confirm')
        });

        confirmPopup.then(function(res) {
          if(res) {
            console.log('Beacon deleted: ' + id);
					  DataService.deleteBeacon($scope, id);
          }
        });

        return true;
			}
		});
	};
})

/*
 * ---------------------------------------------------
 * Add / edit Beacon
 * ---------------------------------------------------
 */

.controller('BeaconCtrl', function($scope, $state, $translate, $stateParams, $ionicPopup, $cordovaBarcodeScanner, $ionicLoading, data, geo, DataService, DeviceService, BeaconService, CONFIG) {

	/*
	 * Globals
	 */

	$scope.data = data;
	$scope.geo = geo;

  $scope.beacon_icons = CONFIG.beacon_icons;

  if ($state.current.name == 'nav.add-beacon')
  {
    $scope.beacon = {
      'icon' : CONFIG.beacon_icons[0],
      'notify_out_range' : true
    };
  }
  else if ($state.current.name == 'nav.edit-beacon')
  {
    $scope.beacon = BeaconService.getBeaconById($scope, $stateParams.id);
    $scope.beacon.notify_in_range = ($scope.beacon.notify_in_range == 1) ? true : false;
    $scope.beacon.notify_out_range = ($scope.beacon.notify_out_range == 1) ? true : false; 
  }

	$scope.setIcon = function(icon) 
	{
    $scope.beacon.icon = icon;
  };

	$scope.addBeacon = function() 
	{
    if ($scope.validateBeaconForm())
    {
      DataService.addBeacon($scope);
    }
  };

	$scope.updateBeacon = function() 
	{
    if ($scope.validateBeaconForm())
    {
      DataService.updateBeacon($scope, $stateParams.id);
    }
  };

	/*
	 * Validate beacon form
	 */

  $scope.validateBeaconForm = function()
  {
    if (
      $scope.beacon.name == null || $scope.beacon.name == '' ||
      $scope.beacon.uuid == null || $scope.beacon.uuid == '' ||
      $scope.beacon.major == null || $scope.beacon.major == '' || isNaN($scope.beacon.major) ||
      $scope.beacon.minor == null || $scope.beacon.minor == '' || isNaN($scope.beacon.minor)
    ) {
      var alertPopup = $ionicPopup.alert({
       title: $translate.instant('form_fields_missing'),
       template: '<ul><li>&bull; ' + $translate.instant('name') + '</li><li>&bull; ' + $translate.instant('beacon_uuid') + '</li><li>&bull; ' + $translate.instant('major') + ' (' + $translate.instant('number') + ')</li><li>&bull; ' + $translate.instant('minor') + ' (' + $translate.instant('number') + ')</li></ul>'
      });

      return false;
    }
    else
    {
      var uuidPattern = new RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      var isUuid = uuidPattern.test($scope.beacon.uuid);

      if (! isUuid)
      {
        var alertPopup = $ionicPopup.alert({
         title: $translate.instant('beacon_uuid'),
         template: $translate.instant('invalid_uuid')
        });

        return false;
      }
      else
      {
        return true;
      }
    }
  }

	document.addEventListener("deviceready", function() {

		/*
	 	 * --------------------------------------------------------------------
		 * QR scanner
		 */

		$scope.scanQr = function() {

			$ionicLoading.show();

			$cordovaBarcodeScanner
				.scan()
				.then(function(barcodeData) {
					// Success! Barcode data is here
					if (typeof barcodeData.text === 'undefined' || barcodeData.text == '') {

						// Nothing found, do nothing, only hide loader
						$ionicLoading.hide();

					} else {
						// Update uuid input
            var barcodeText = barcodeData.text;

            // If a comma (,) is found, split the string and fill major / minor too
            if (barcodeText.indexOf(',') == -1)
            {
  						$scope.beacon.uuid = barcodeText;
            }
            else
            {
              var values = barcodeText.split(',');
  						$scope.beacon.uuid = values[0];
  						$scope.beacon.major = parseInt(values[1]);
  						$scope.beacon.minor = parseInt(values[2]);
            }

						$ionicLoading.hide();
					}
				}, function(error) {

					// An error occurred
					alert(error.text);
				});
		};

	}, false);
})

/*
 * ---------------------------------------------------
 * Eddystone
 * ---------------------------------------------------
 */

.controller('EddystoneCtrl', function($scope, $cordovaInAppBrowser, EddystoneService, eddystone) {

	/*
	 * Globals
	 */

	$scope.eddystone = eddystone;

	/*
	 * Open link
	 */

	$scope.openEddystone = function(url)
	{
    $cordovaInAppBrowser.open(url, '_system', {
      location: 'yes',
      clearcache: 'no',
      toolbar: 'yes'
    });
	};

	/*
	 * ------------------------------------------------------------------------
	 * Scan for Eddystone beacons & stop scanning when user leaves
	 */

	EddystoneService.scanForBeacons($scope);

	$scope.$on('$locationChangeStart', function() {
		EddystoneService.stopScanningForBeacons($scope);
	});
})

/*
 * ---------------------------------------------------
 * Places
 * ---------------------------------------------------
 */

.controller('PlacesCtrl', function($scope, $cordovaInAppBrowser, BeaconService, data) {

	/*
	 * Globals
	 */

	$scope.data = data;

  BeaconService.loadLastSeenBeacons($scope);

	/*
	 * Open location on map
	 */

	$scope.openMap = function(lng, lat)
	{
    if (ionic.Platform.isIOS())
    {
      $cordovaInAppBrowser.open('maps://?ll=' + lat + ',' + lng, '_system', {
        location: 'yes',
        clearcache: 'no',
        toolbar: 'yes'
      });
    }
    else
    {
      $cordovaInAppBrowser.open('geo://?ll=' + lat + ',' + lng, '_system', {
        location: 'yes',
        clearcache: 'no',
        toolbar: 'yes'
      });
    }
	};
})

/*
 * ---------------------------------------------------
 * Settings controller
 * ---------------------------------------------------
 */

.controller('SettingsCtrl', function($scope, $translate, DataService, CONFIG) {

	/*
	 * Globals
	 */

	$scope.language = $translate.use();
	$scope.languages = CONFIG.languages;

	$scope.changeLanguage = function(language)
	{
    console.log('Language change ' + language);
		$translate.use(language);
    DataService.setSetting('app_language', language);
  };
})

/*
 * ---------------------------------------------------
 * Help controller
 * ---------------------------------------------------
 */

.controller('HelpCtrl', function($scope) {

});