angular.module('ngApp.filters', [])

.filter('escapeSingleQuote', function() {
	return function (text) {
		if (text) {
			return text.
				replace(/'/g, '&#39;');
		}
		return '';
	}
});