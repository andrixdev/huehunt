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
			var tH = $cookies.get('targetH');
			var tS = $cookies.get('targetS');
			var tL = $cookies.get('targetL');

			// Generate ininital HSL out of target HSL
			// Hue
			var beforeOrAfter = Math.floor(Math.random() * 2);
			var cH;

			if (beforeOrAfter == 1) {
				// Relative hue between -100 and -50
				cH = parseInt(tH) - 50 - Math.floor(50 * Math.random());
			} else {
				// Relative hue between 50 and 100
				cH = parseInt(tH) + 50 + Math.floor(50 * Math.random());
			}
			console.log(cH - tH);

			return {
				H: cH,
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

// Service for Underscore
window.app.factory('_', ['$window', function($window) {
  return $window._; // assumes underscore has already been loaded on the page
}]);

// Service for jQuery
window.app.factory('jQuery', ['$window', function($window) {
  return $window.jQuery; // assumes underscore has already been loaded on the page
}]);

// Service for forms using jQuery
window.app.factory('forms', ['jQuery', '$timeout', 'hueser', 'gameVars', function(jQuery, $timeout, hueser, gameVars) {
	return {
		handleStartForm: function() {
			$timeout(function() {
				jQuery('#playbutton a').off().on('click', function() {
					hueser.setUsername(jQuery('#playername input').val());
					gameVars.setGameVars();
				});
				jQuery('#playername input').off().on('keyup', function(event) {
					if (event.which == 13) {/* Enter key */
						jQuery('#playbutton a').trigger('click');
						// on('click', ...) has been triggered by force, but there's still a need to redirect
						var newHash = jQuery('#playbutton a').attr('href');
						// 100% async so no angular business here!
						location = location.pathname + newHash;
					}
				});
			}, 1000);/* Promisifying cheat */
		},
		handleGameForm: function() {
			$timeout(function() {
				jQuery('#hcontrol input, #scontrol input, #lcontrol input').off().on('change', function(event) {
					var h = jQuery('#hcontrol input').val();
					var s = jQuery('#scontrol input').val();
					var l = jQuery('#lcontrol input').val();
					console.log(h, s, l);
				});
				jQuery('#guess a').off().on('click', function() {
					var h = jQuery('#hcontrol input').val();
					var s = jQuery('#scontrol input').val();
					var l = jQuery('#lcontrol input').val();
					location = location.pathname + '#/' + h + '/' + s + '/' + l;
				});
				jQuery('#hcontrol input, #scontrol input, #lcontrol input').off().on('keyup', function(event) {
					if (event.which == 13) {/* Enter key */
						jQuery('#guess a').trigger('click');
					}
				});
			}, 1000);/* Promisifying cheat */
		}
	};
}]);

// Service for DOM listeners using jQuery (because ng-include basically breaks Angular)
window.app.factory('DOM', ['jQuery', '$timeout', function(jQuery, $timeout) {
	return {
		levelTabs: function() {
			$timeout(function() {
				jQuery('#tab1').off().on('click', function() {
					jQuery('#levelcontents > div').css('display', 'none');
					jQuery('#lvl1').css('display', 'inherit');
				});
				jQuery('#tab2').off().on('click', function() {
					jQuery('#levelcontents > div').css('display', 'none');
					jQuery('#lvl2').css('display', 'inherit');
				});
				jQuery('#tab3').off().on('click', function() {
					jQuery('#levelcontents > div').css('display', 'none');
					jQuery('#lvl3').css('display', 'inherit');
				});
				jQuery('#tabX').off().on('click', function() {
					jQuery('#levelcontents > div').css('display', 'none');
					jQuery('#lvlX').css('display', 'inherit');
				});
			}, 1000);/* Promisifying cheat */
		},
		/**
		 * @param (string|int) tabId
		 */
		showTab: function (tabId) {
			jQuery('#levelcontents > div').hide(200, function() {
				jQuery('#lvl' + tabId).show(200);
			});
		}
	}
}]);
