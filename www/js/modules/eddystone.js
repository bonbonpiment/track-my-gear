/**
 * --------------------------------------------------------------------------------------------
 * Factory
 */
 
 angular.module('ngApp.EddystoneFactory', [])

/*
 * Eddystones
 */

.factory('eddystone', function(){
	return {
		loading: true,
		error: false,
		timer: null,
		beacons: {},
		display_beacons: []
	};
});

/**
 * --------------------------------------------------------------------------------------------
 * Service
 */

angular.module('ngApp.EddystoneServices', [])

.service('EddystoneService', function($rootScope, $interval, $timeout){

	/**
	 * Start scanning
	 */

	this.scanForBeacons = function($scope)
	{
		var self = this;

		document.addEventListener("deviceready", function() {
			// Start tracking beacons!
			$timeout(function() { self.startScan($scope); }, 500);

			// Timer that refreshes the display.
			$scope.eddystone.timer = $timeout(function() { self.updateBeaconList($scope); }, 500);
			//$scope.eddystone.timer = $interval(function() { self.updateBeaconList($scope); }, 500);
		}, false);
	}

	/**
	 * Scan available Eddystone beacons
	 */

	this.startScan = function($scope)
	{
		var self = this;
		$scope.eddystone.error = false;

		evothings.eddystone.startScan(
			function(beacon)
			{
				if (typeof beacon.url !== 'undefined')
				{
					$scope.eddystone.loading = false;

					// Calculate distance - experimental, is beacon specific
					var rssi = beacon.rssi; //self.mapBeaconRSSI(beacon.rssi);
					var tx = beacon.txPower;

					if (rssi == 0)
					{
						var distance = -1.0; // if we cannot determine distance, return -1.
					}

					var ratio = rssi * 1.0 / tx;
					if (ratio < 1.0)
					{
						var distance = Math.pow(ratio, 10);
					}
					else
					{
						var distance =  (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
					}

					// Update beacon data.
					beacon.timeStamp = Date.now();
					beacon.distance = Math.round(distance * 1000) / 1000;
					$scope.eddystone.beacons[beacon.address] = beacon;
				}
			},
			function(error)
			{
				console.log('Eddystone scan error: ' + error);

				$scope.eddystone.loading = false;
				$scope.eddystone.error = true;
			}
		);
	}

	/**
	 * Stop scanning for available Eddystone beacons
	 */

	this.stopScanningForBeacons = function($scope)
	{
		document.addEventListener("deviceready", function() {

			evothings.eddystone.stopScan();

		}, false);

		$timeout.cancel($scope.eddystone.timer);
	}

	// Map the RSSI value to a value between 1 and 100.
	this.mapBeaconRSSI = function(rssi)
	{
		if (rssi >= 0) return 1; // Unknown RSSI maps to 1.
		if (rssi < -100) return 100; // Max RSSI
		return 100 + rssi;
	}

	this.getSortedBeaconList = function(beacons)
	{
		var beaconList = [];
		for (var key in beacons)
		{
			beaconList.push(beacons[key]);
		}
		beaconList.sort(function(beacon1, beacon2)
		{
			return beacon1.distance - beacon2.distance;
		});
		return beaconList;
	}

	this.updateBeaconList = function($scope)
	{
		var self = this;

		this.removeOldBeacons($scope);
		this.displayBeacons($scope);

		$timeout(function() { self.updateBeaconList($scope); }, 500);
	}

	this.removeOldBeacons = function($scope)
	{
		var timeNow = Date.now();
		for (var key in $scope.eddystone.beacons)
		{
			// Only show beacons updated during the last 60 seconds.
			var beacon = $scope.eddystone.beacons[key];

			if (timeNow > beacon.timeStamp + (30 * 1000))
			{
				delete $scope.eddystone.beacons[key];
			}
		}
	}

	this.displayBeacons = function($scope)
	{
		$scope.eddystone.display_beacons.length = 0;

		var sortedList = this.getSortedBeaconList($scope.eddystone.beacons);

		for (var i = 0; i < sortedList.length; ++i)
		{
			var beacon = sortedList[i];

			$scope.eddystone.display_beacons.push(beacon);
		}
	}

	this.beaconNID = function(beacon)
	{
		return beacon.nid ?
			this.uint8ArrayToString(beacon.nid) : '';
	}

	this.beaconBID = function(beacon)
	{
		return beacon.bid ?
			this.uint8ArrayToString(beacon.bid) : '';
	}

	this.beaconTemperature = function(beacon)
	{
		return beacon.temperature && beacon.temperature != 0x8000 ?
			beacon.temperature : '';
	}

	this.uint8ArrayToString = function(uint8Array)
	{
		function format(x)
		{
			var hex = x.toString(16);
			return hex.length < 2 ? '0' + hex : hex;
		}
		var result = '';
		for (var i = 0; i < uint8Array.length; ++i)
		{
			result += format(uint8Array[i]) + ' ';
		}
		return result;
	}
});