angular.module('ngApp.config', [])

/*
 * ---------------------------------------------------
 * Track my Gear
 *
 * nowsquare.com
 * ---------------------------------------------------
 */

.constant('CONFIG', {

	/*
	 * SQLite db config
	 * 
	 * location
	 * 0 (default): Documents - visible to iTunes and backed up by iCloud
	 * 1: Library - backed up by iCloud, NOT visible to iTunes
	 * 2: Library/LocalDatabase - NOT visible to iTunes and NOT backed up by iCloud
	 */

	sqlite: {
		db_name: 'tmg.db',
		location: 1,
		androidDatabaseImplementation: 2,
		androidLockWorkaround: 1
	},

	/*
	 * These are the available languages. Language files can be found at /www/i18n/.
	 */

  languages: {
    'en': 'English',
    'es': 'Español',
    'nl': 'Nederlands'
  },

	/*
	 * These are the names of the icons found at /www/img/beacon-icons
	 * The first icon is the default selection.
	 */

  beacon_icons: ['diamond', 'key', 'car', 'scooter', 'wallet', 'briefcase', 'buggy', 'location', 'person', 'home', 'cat', 'dog']

});