/**
 * --------------------------------------------------------------------------------------------
 * Service
 */

angular.module('ngApp.BeaconServices', [])

/**
 * Beacon related functions
 */

.service('BeaconService', function($rootScope, $cordovaBeacon, $cordovaLocalNotification, $cordovaSQLite){

	this.states = {
		'ProximityUnknown' : 0,
		'CLRegionStateInside' : 1,
		'CLRegionStateOutside' : 2,
		'ProximityFar' : 3,
		'ProximityNear' : 4,
		'ProximityImmediate' : 5
	};

	/**
	 * Start monitoring beacons
	 */

	this.startMonitoring = function($scope)
	{
    var self = this;

		document.addEventListener("deviceready", function() {

			/**
			 * Monitor region enter (state.CLRegionStateInside) or leave (state.CLRegionStateOutside)
			 */

			$rootScope.$on("$cordovaBeacon:didDetermineStateForRegion", function (event, pluginResult) {
				if (typeof pluginResult.region.identifier !== 'undefined')
				{
					// Get beacon info
					var identifier = pluginResult.region.identifier;
					var uuid = pluginResult.region.uuid;
					var major = pluginResult.region.major;
					var minor = pluginResult.region.minor;
					var state = pluginResult.state;

          var beacon = self.getBeaconById($scope, identifier);

          // Set last seen time + location
          db.transaction(function(tx) {
            tx.executeSql("UPDATE beacons SET last_seen = ?, last_seen_lng = ?, last_seen_lat = ? WHERE id = ?;", [
                Date.now(), 
                $scope.geo.lng,
                $scope.geo.lat, 
                parseInt(identifier)
              ], function(tx, result) {

              console.log('Last seen updated: ' + $scope.geo.lng + ',' + $scope.geo.lat);
/*
              if ($scope.data.beacons_last_seen.length == 0)
              {
                self.loadLastSeenBeacons($scope);
              }
*/
            });
          });

          var notify = ((state == 'CLRegionStateInside' && parseInt(beacon.notify_in_range) == 1) || state == 'CLRegionStateOutside' && parseInt(beacon.notify_out_range) == 1) ? true : false;

              console.log('Possible notification: ' + state);
          if (notify && (typeof notification[identifier + '-' + state] === 'undefined' || notification[identifier + '-' + state] == false))
          {
            switch (state)
            {
              case 'CLRegionStateInside': 
                var notification_text = 'The beacon [' + beacon.name + '] is in range!';
                var state_other = 'CLRegionStateOutside';
                break;
              case 'CLRegionStateOutside': 
                var notification_text = 'The beacon [' + beacon.name + '] is out of range!';
                var state_other = 'CLRegionStateInside';
                break;
            }

            notification[identifier + '-' + state_other] = false;
            notification[identifier + '-' + state] = true;

            // Send notification
            if (ionic.Platform.isIOS()) notification_text = notification_text.replace(/%/g, '%%');

            $cordovaLocalNotification.schedule(
            {
              id: identifier,
              text: notification_text,
              at: 0,
              /*icon: 'img/beacon-icons/' + beacon.icon + '.png'*/ // https://forum.ionicframework.com/t/ngcordova-local-notification-plugin/10534/2
            }).then(function(result) {});
          }
        }

			});

			/**
			 * Proximity ranging of beacons
			 */

			$rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function (event, pluginResult) {

        if (pluginResult.beacons.length > 0)
				{
					// Get beacon info
					var identifier = pluginResult.region.identifier;
					var uuid = pluginResult.beacons[0].uuid;
					var major = pluginResult.beacons[0].major;
					var minor = pluginResult.beacons[0].minor;
					var proximity = pluginResult.beacons[0].proximity;
					var accuracy = pluginResult.beacons[0].accuracy;
					var rssi = pluginResult.beacons[0].rssi;
					var tx = pluginResult.beacons[0].tx;
          var now = Date.now();

					if (proximity == 0) return; // Unknown proximity

          if ($scope.data.beacons_last_seen.length > 0)
          {
            for (var i=0; i < $scope.data.beacons_last_seen.length; i++)
            {
              $scope.safeApply(function() {
                $scope.data.beacons_last_seen[i].last_seen = now;
                $scope.data.beacons_last_seen[i].last_seen_lng = $scope.geo.lng;
                $scope.data.beacons_last_seen[i].last_seen_lat = $scope.geo.lat;
              });
            };
          }

          // Set last seen time + location
          db.transaction(function(tx) {
            tx.executeSql("UPDATE beacons SET last_seen = ?, last_seen_lng = ?, last_seen_lat = ? WHERE id = ?;", [
                now, 
                $scope.geo.lng,
                $scope.geo.lat, 
                parseInt(identifier)
              ], function(tx, result) {

              //console.log('Last seen updated: ' + $scope.geo.lng + ',' + $scope.geo.lat);
  
            });
          });
        }

			});

		}, false);
	}

	/**
	 * Start monitoring beacon
	 */

	this.startMonitoringBeacon = function(beacon)
	{
		document.addEventListener("deviceready", function() {

      var beaconRegion = $cordovaBeacon.createBeaconRegion(String(beacon.id), beacon.uuid, beacon.major, beacon.minor, true);

      $cordovaBeacon.requestAlwaysAuthorization();
			$cordovaBeacon.startMonitoringForRegion(beaconRegion);
			$cordovaBeacon.startRangingBeaconsInRegion(beaconRegion);

		}, false);
	}

	/**
	 * Stop monitoring beacon
	 */

	this.stopMonitoringBeacon = function(beacon)
	{
		document.addEventListener("deviceready", function() {

      var beaconRegion = $cordovaBeacon.createBeaconRegion(String(beacon.id), beacon.uuid, beacon.major, beacon.minor, true);

      $cordovaBeacon.stopMonitoringForRegion(beaconRegion);
      $cordovaBeacon.stopRangingBeaconsInRegion(beaconRegion);

		}, false);
	}

	/**
	 * Last seen beacons
	 */

	this.loadLastSeenBeacons = function($scope)
	{
		var self = this;

		document.addEventListener("deviceready", function() {

      db.transaction(function(tx) {
        tx.executeSql("SELECT id, name, icon, uuid, major, minor, notify_in_range, notify_out_range, last_seen, last_seen_lng, last_seen_lat, created FROM beacons WHERE last_seen <> '' ORDER BY last_seen ASC;", [], function(tx, result) {

          $scope.data.beacons_last_seen.length = 0;

          if (result.rows.length > 0)
          {
            for (var i=0; i < result.rows.length; i++)
            {
              var icon = (result.rows.item(i).icon != null) ? result.rows.item(i).icon : CONFIG.beacon_icons[0];

              var beacon = {
                'id': result.rows.item(i).id,
                'name': result.rows.item(i).name,
                'icon': icon,
                'uuid': result.rows.item(i).uuid,
                'major': result.rows.item(i).major,
                'minor': result.rows.item(i).minor,
                'notify_in_range': result.rows.item(i).notify_in_range,
                'notify_out_range': result.rows.item(i).notify_out_range,
                'last_seen': result.rows.item(i).last_seen,
                'last_seen_lng': result.rows.item(i).last_seen_lng,
                'last_seen_lat': result.rows.item(i).last_seen_lat,
                'created': result.rows.item(i).created
              };

              $scope.data.beacons_last_seen.push(beacon);

              console.log('SQLite beacons_last_seen loaded ↓');
              console.log(beacon);
            };
          }

          $scope.data.last_seen_loading = false;

        });
      });

		}, false);
	}

	/**
	 * Get beacon by id
	 */

	this.getBeaconById = function($scope, id)
	{
    var beacons = $scope.data.beacons;

			if (beacons.length > 0)
			{
				for (beacons_index = 0; beacons_index < beacons.length; ++beacons_index)
				{
          if (beacons[beacons_index].id == id)
          {
            return beacons[beacons_index];
          }
        }
      }
	}
});