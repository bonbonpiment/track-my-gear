/**
 * --------------------------------------------------------------------------------------------
 * Factory
 */
 
 angular.module('ngApp.DataFactory', [])

/*
 * Favorites
 */

.factory('data', function() {
	return {
		beacons: [],
		beacons_last_seen: [],
		loading: true,
		last_seen_loading: true
	};
});

/**
 * --------------------------------------------------------------------------------------------
 * Service
 */

angular.module('ngApp.DataServices', [])

/**
 * Data services
 */

.service('DataService', function($cordovaSQLite, $q, $state, $timeout, $ionicLoading, $ionicPopup, BeaconService, CONFIG) {

	/**
	 * Load beacons
	 */

	this.loadBeacons = function($scope, resetDatabase)
	{
		if (typeof resetDatabase === 'undefined') resetDatabase = false;

		var self = this;

		document.addEventListener("deviceready", function() {

			db.transaction(function(tx) {

				/**
				 * Create table if not exists
				 */

				if (resetDatabase)
        {
          tx.executeSql('DROP TABLE IF EXISTS settings');
          tx.executeSql('DROP TABLE IF EXISTS beacons');
        }

				tx.executeSql('CREATE TABLE IF NOT EXISTS beacons (id integer primary key, name text, icon text, uuid text, major integer, minor integer, notify_in_range integer, notify_out_range integer, last_seen integer, last_seen_lng text, last_seen_lat text, created integer)');

				db.transaction(function(tx) {
					tx.executeSql("SELECT id, name, icon, uuid, major, minor, notify_in_range, notify_out_range, last_seen, last_seen_lng, last_seen_lat, created FROM beacons ORDER BY name ASC;", [], function(tx, result) {

						$scope.data.beacons.length = 0;

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

								$scope.data.beacons.push(beacon);

                BeaconService.startMonitoringBeacon(beacon);

								console.log('SQLite beacons loaded ↓');
								console.log(beacon);
							};
						}

						$scope.safeApply(function () {
							$scope.data.loading = false;
						});
					});
				});
			});

		}, false);
	}

	/**
	 * Add beacon
	 */

	this.addBeacon = function($scope)
	{
    $ionicLoading.show();
		var self = this;

    if ($scope.beacon.name != '')
    {
      document.addEventListener("deviceready", function() {

        db.transaction(function(tx) {
          tx.executeSql("INSERT INTO beacons (name, icon, uuid, major, minor, notify_in_range, notify_out_range, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?);", [
              $scope.beacon.name, 
              $scope.beacon.icon, 
              $scope.beacon.uuid, 
              $scope.beacon.major, 
              $scope.beacon.minor, 
              $scope.beacon.notify_in_range ? 1 : 0, 
              $scope.beacon.notify_out_range ? 1 : 0, 
              Date.now()
            ], function(tx, result) {

            $scope.beacon.id = result.insertId;

            // Start monitoring beacon
            BeaconService.startMonitoringBeacon($scope.beacon);

            // Reload beacons
            self.loadBeacons($scope);

            $timeout(function() {
              // Open beacons view
              $state.go('nav.beacons');

              // Hide loading
              $ionicLoading.hide();
            }, 200);
          });
        });

		  }, false);
    }
	}

	/**
	 * Update beacon
	 */

	this.updateBeacon = function($scope, id)
	{
    $ionicLoading.show();
		var self = this;

    if (id > 0)
    {
      document.addEventListener("deviceready", function() {

        // Stop monitoring beacon
        BeaconService.stopMonitoringBeacon($scope.beacon);

        db.transaction(function(tx) {
          tx.executeSql("UPDATE beacons SET name = ?, icon = ?, uuid = ?, major = ?, minor = ?, notify_in_range = ?, notify_out_range = ? WHERE id = ?;", [
              $scope.beacon.name, 
              $scope.beacon.icon, 
              $scope.beacon.uuid, 
              $scope.beacon.major, 
              $scope.beacon.minor, 
              $scope.beacon.notify_in_range ? 1 : 0, 
              $scope.beacon.notify_out_range ? 1 : 0,
              id
            ], function(tx, result) {

            // Start monitoring beacon
            BeaconService.startMonitoringBeacon($scope.beacon);

            // Reload beacons
            self.loadBeacons($scope);

            $timeout(function() {
              // Open beacons view
              $state.go('nav.beacons');

              // Hide loading
              $ionicLoading.hide();
            }, 200);
          });
        });

		  }, false);
    }
	}

	/**
	 * Get beacon
	 */

	this.getBeacon = function(id)
	{
		var self = this;

		document.addEventListener("deviceready", function() {
      db.transaction(function(tx) {
				tx.executeSql("SELECT id, name, icon, uuid, major, minor, notify_in_range, notify_out_range, last_seen, last_seen_lng, last_seen_lat FROM beacons WHERE id = ?;", [id], function(tx, result) {
					if (result.rows.length == 1)
					{
            var beacon = result.rows.item(0);
            return beacon;
          }
				});
			});
		}, false);
	}

	/**
	 * Delete beacon
	 */

	this.deleteBeacon = function($scope, id)
	{
		var self = this;

		document.addEventListener("deviceready", function() {
      db.transaction(function(tx) {
				tx.executeSql("SELECT id, name, uuid, major, minor FROM beacons WHERE id = ?;", [id], function(tx, result) {
					if (result.rows.length == 1)
					{
            var beacon = result.rows.item(0);

            db.transaction(function(tx) {
              tx.executeSql("DELETE FROM beacons WHERE id = ?;", [id], function(tx, result) {
      
                // Stop monitoring beacon
                BeaconService.stopMonitoringBeacon(beacon);
      
                // Reload beacons
                self.loadBeacons($scope);

       				});
            });
          }
				});
			});
		}, false);
	}

	/**
	 * Get setting
	 */

	this.getSetting = function(name)
	{
		var self = this;

    // Create a promise for the db transaction
    var deferred = $q.defer();

		document.addEventListener("deviceready", function() {

      /**
       * Create settings table if not exists
       */

  		db.transaction(function(tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS settings (id integer primary key, name text, value text)');
 
        db.transaction(function(tx) {
          tx.executeSql("SELECT value FROM settings WHERE name = ?;", [name], function(tx, result) {
            var value = (result.rows.length == 0) ? null : result.rows.item(0).value;
            console.log('get setting ' + name + ': ' + value);
            deferred.resolve(value);
          });
        });
			});

		}, false);

  	return deferred.promise;
	}

	/**
	 * Set setting
	 */

	this.setSetting = function(name, value)
	{
		var self = this;

		document.addEventListener("deviceready", function() {

      /**
       * Create settings table if not exists
       */
  
  		db.transaction(function(tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS settings (id integer primary key, name text, value text)');
  
        db.transaction(function(tx) {
          tx.executeSql("SELECT id FROM settings WHERE name = ?;", [name], function(tx, result) {
            if (result.rows.length == 0) 
            {
              db.transaction(function(tx) {
                tx.executeSql("INSERT INTO settings (name, value) VALUES (?, ?);", [name, value], function(tx, result) {
                  console.log('Setting ' + name + ' inserted with ' + value);
                });
              });
            }
            else
            {
              db.transaction(function(tx) {
                tx.executeSql("UPDATE settings SET value = ? WHERE name = ?;", [value, name], function(tx, result) {
                  console.log('Setting ' + name + ' updated to ' + value);
                });
              });
            }
          });
        });
			});

		}, false);
	}
});