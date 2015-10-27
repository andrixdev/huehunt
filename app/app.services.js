// Cookie service for target colors
window.app.factory('colorCookies', ['$cookies', function($cookies) {
	return {
		setTargetHSL: function() {
			$cookies.put('targetH', Math.floor(Math.random() * 360));
			$cookies.put('targetS', 20 + Math.floor(80 * Math.random()));
			$cookies.put('targetL', 20 + Math.floor(60 * Math.random()));
		},
		getTargetHSL: function() {
			return {
				H: $cookies.get('targetH'),
				S: $cookies.get('targetS'),
				L: $cookies.get('targetL')
			};
		},
		generateRandomHSL: function() {
			return {
				H: Math.floor(Math.random() * 360),
				S: 20 + Math.floor(80 * Math.random()),
				L: 20 + Math.floor(60 * Math.random())
			};
		}
	};
}]);

// Cookie service for user information
window.app.factory('hueser', ['$cookies', function($cookies) {
	return {
		/**
		 * @param String username The username
		 */
		setUsername: function(username) {
			$cookies.put('username', username);
		},
		getUsername: function() {
			return $cookies.get('username');
		}
	};
}]);

// Cookie service for game variables
window.app.factory('gameVars', ['$cookies', function($cookies) {
	return {
		setGameVars: function() {
			$cookies.put('avatarBaseHue', Math.floor(Math.random() * 360));
			$cookies.put('shots', 0);
			$cookies.put('startTime', new Date().getTime());
			$cookies.putObject('history', {
				content: []
			});
			$cookies.put('win', 'false');//Cookies are strings
			$cookies.put('saved', 'false');
		},
		getGameVars: function() {
			return {
				avatarBaseHue: $cookies.get('avatarBaseHue'),
				shots: $cookies.get('shots'),
				startTime: $cookies.get('startTime'),
				history: $cookies.getObject('history'),
				win: $cookies.get('win'),
				saved: $cookies.get('saved')
			};
		},
		// Specific setters
		addShot: function() {
			$cookies.put('shots', parseInt($cookies.get('shots')) + 1);
		},
		/**
		 * @param Object score Javascript object with scores data
		 */
		addHistory: function(score) {
			var hist = $cookies.getObject('history');
			hist.content.push(score);
			$cookies.putObject('history', hist);
		},
		setWin: function() {
			$cookies.put('win', 'true');
		},
		setSaved: function() {
			$cookies.put('saved', 'true');
		},
	};
}]);

// Service for navigation history, currently not fully exploited
window.app.factory('nav', ['$cookies', function($cookies) {
	return {
		/**
		 * @param String path A string containing the added path
		 */
		addPath: function(path) {
			var nav = $cookies.getObject('nav');
			if (!nav) {
				nav = {
					content: [path]
				};
			}
			else {
				nav.content.push(path);
			}
			$cookies.putObject('nav', nav);
		},
		getLastPath: function() {
			var nav = $cookies.getObject('nav');
			if (!nav) { 
				return '/';
			}
			else {
				return nav.content[nav.content.length - 1];
			}
		},
		clearPaths: function() {
			var nav = {
				content: []
			};
			$cookies.putObject('nav', nav);
		}
	};
}]);

// Service for underscore
window.app.factory('_', ['$window', function($window) {
  return $window._; // assumes underscore has already been loaded on the page
}]);
