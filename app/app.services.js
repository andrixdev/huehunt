// Cookies last 1 year in HueHunt
var now = new Date();
window.app.cookieExpires = new Date(now.getFullYear()+1, now.getMonth(), now.getDate());

// Cookie service for target colors
window.app.factory('colorCookies', ['$cookies', function($cookies) {
	return {
		generateTargetHSL: function(level) {
			// Base target HSL within correct ranges
			var targetH = Math.floor(Math.random() * 360);
			var targetS = 20 + Math.floor(80 * Math.random());
			var targetL = 20 + Math.floor(60 * Math.random());

			// Level-based override
			if (level == 1) {
				targetS = 100;
				targetL = 50;
			} else if (level == 2) {
				targetL = 50;
			} else { }

			// Save in cookies
			$cookies.put('targetH', targetH, {expires: window.app.cookieExpires});
			$cookies.put('targetS', targetS, {expires: window.app.cookieExpires});
			$cookies.put('targetL', targetL, {expires: window.app.cookieExpires});
		},
		getTargetHSL: function() {
			return {
				H: $cookies.get('targetH'),
				S: $cookies.get('targetS'),
				L: $cookies.get('targetL')
			};
		},
		generateCurrentHSL: function() {/* @todo Remove this unused method? */
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

			return {
				H: (cH + 360) % 360,
				S: 20 + Math.floor(80 * Math.random()),
				L: 20 + Math.floor(60 * Math.random())
			};
		}
	};
}]);

// Cookie service for user information
window.app.factory('hueser', ['$cookies', function($cookies) {
	return {
		setUsername: function(username) {
			$cookies.put('username', username, {expires: window.app.cookieExpires});
		},
		getUsername: function() {
			return $cookies.get('username');
		},

		setAvatarBaseHue: function() {
			$cookies.put('avatarBaseHue', Math.floor(Math.random() * 360), {expires: window.app.cookieExpires});
		},
		getAvatarBaseHue: function() {
			return $cookies.get('avatarBaseHue');
		},
		setMaxLevel: function(maxLevel) {
			$cookies.put('maxLevel', maxLevel, {expires: window.app.cookieExpires});
		},
		getMaxLevel: function() {
			return $cookies.get('maxLevel');
		},
		diffThreshold: ["not used, just reminder", 0, 1200, 1500, 1800, 9999999],
		thresholds: [0, 1200, 2700, 4500, 24500],
		setExperience: function(experience) {
			$cookies.put('experience', experience, {expires: window.app.cookieExpires});
		},
		getExperience: function() {
			return $cookies.get('experience');
		},
		getNextLevelXP: function() {
			var nextLevel = parseInt(this.getMaxLevel()) + 1;
			return this.thresholds[nextLevel - 1];
		},
		getCurrentLevelXP: function() {
			var currentLevel = parseInt(this.getMaxLevel());
			return this.thresholds[currentLevel - 1];
		},
		maybeLevelUp: function() {
			var xp = $cookies.get('experience');
			var newLevel = 1;
			if (xp > this.thresholds[1]) {
				newLevel = 2;
			}
			if (xp > this.thresholds[2]) {
				newLevel = 3;
			}
			if (xp > this.thresholds[3]) {
				newLevel = 4;
			}
			this.setMaxLevel(newLevel);
		}
	};
}]);

// Cookie service for game variables
window.app.factory('gameVars', ['$cookies', function($cookies) {
	return {
		roundShots: [6,6,6,3],
		selectedLevel: 1,
		winMessageSuccess1: "Success!",
		winMessageSuccess2: "You found the right set of HSL values.",
		winMessageFail1: "It's over!",
		winMessageFail2: "The color target was:",
		success: false,
		setRoundGameVars: function() {
			$cookies.put('shots', this.roundShots[this.selectedLevel - 1], {expires: window.app.cookieExpires});
			$cookies.put('performance', 0, {expires: window.app.cookieExpires});
			$cookies.put('startTime', new Date().getTime(), {expires: window.app.cookieExpires});
			$cookies.putObject('roundHistory', {
				content: []
			}, {expires: window.app.cookieExpires});
			$cookies.put('win', 'false', {expires: window.app.cookieExpires});//Cookies are strings
			$cookies.put('saved', 'false', {expires: window.app.cookieExpires});
		},
		getRoundGameVars: function() {
			return {
				shots: $cookies.get('shots'),
				performance: $cookies.get('performance'),
				startTime: $cookies.get('startTime'),
				roundHistory: $cookies.getObject('roundHistory'),
				win: $cookies.get('win'),
				saved: $cookies.get('saved')
			};
		},
		/**
		 * @param Number howmany Number of shots to add
		 */
		addShots: function(howmany) {
			$cookies.put('shots', parseInt($cookies.get('shots')) + howmany, {expires: window.app.cookieExpires});
		},
		getShots: function() {
			return $cookies.get('shots');
		},
		/**
		 * @param Number howmuch Buy how much to increase performance
		 */
		addPerformance: function(howmuch) {
			$cookies.put('performance', parseInt($cookies.get('performance')) + parseInt(howmuch), {expires: window.app.cookieExpires});
		},
		getPerformance: function() {
			return $cookies.get('performance');
		},
		/**
		 * @param int level Selected level
		 */
		setSelectedLevel: function(level) {
			this.selectedLevel = level;
		},
		getSelectedLevel: function() {
			return this.selectedLevel;
		},
		/**
		 * @param Object score Javascript object with scores data
		 */
		addRoundHistory: function(score) {
			var hist = $cookies.getObject('roundHistory');
			hist.content.push(score);
			$cookies.putObject('roundHistory', hist, {expires: window.app.cookieExpires});
		},
		setWin: function() {
			$cookies.put('win', 'true', {expires: window.app.cookieExpires});
		},
		getWinMessages: function() {
			return {
				message1: (this.getSuccess() ? this.winMessageSuccess1 : this.winMessageFail1),
				message2: (this.getSuccess() ? this.winMessageSuccess2 : this.winMessageFail2)
			};
		},
		getSuccess: function() {
			return this.success;
		},
		setSuccess: function(isSuccess) {
			this.success = isSuccess;
		},
		setSaved: function() {
			$cookies.put('saved', 'true', {expires: window.app.cookieExpires});
		},
		getColorDistance: function(h1, s1, l1, h2, s2, l2) {
			var D = 0;
			var dH = Math.min(Math.abs(h2 - h1), Math.abs(h2 - h1 + 360), Math.abs(h2 - h1 - 360));// "Circular" distance
				dS = s2 - s1,
				dL = l2 - l1;
			return Math.sqrt(dH*dH / (1*1) + dS*dS + dL*dL);
		},
		howMuchExtraPerformanceForThisShot: function(level, ithShot, distance) {
			var D = distance;
			var extraPerformance = (D < 25 ? 100-2*D : (D < 75 ? 75-1*D : 0));
			extraPerformance /= Math.pow(2, ithShot - 1);
			var multiplicator = 1;
			extraPerformance = Math.floor(Math.max(0, extraPerformance) * multiplicator);
			return extraPerformance;
		}
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
			$cookies.putObject('nav', nav, {expires: window.app.cookieExpires});
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
			$cookies.putObject('nav', nav, {expires: window.app.cookieExpires});
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
					// On-submit actions lay here
					if (jQuery('#insight.start').hasClass('player-unknown')) {
						hueser.setUsername(jQuery('#newplayername input').val());
						gameVars.setRoundGameVars();
					} else {
						gameVars.setRoundGameVars();
					}
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
				});
				jQuery('#guess a').off().on('click', function() {
					var h = jQuery('#hcontrol input').val();
					var s = jQuery('#scontrol input').val();
					var l = jQuery('#lcontrol input').val();
					var regexInt = /^[-+]?\d+$/;
					if (regexInt.test(h) && regexInt.test(s) && regexInt.test(l)) {
						location = location.pathname + '#/' + h + '/' + s + '/' + l;
					}
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
window.app.factory('DOM', ['jQuery', 'hueser', 'colorCookies', 'gameVars', '$timeout', function(jQuery, hueser, colorCookies, gameVars, $timeout) {
	return {
		levelTabs: function() {
			var self = this;
			$timeout(function() {
				jQuery('#tab1').off().on('click', function() {
					self.tabClickAction(1, false);
				});
				jQuery('#tab2').off().on('click', function() {
					self.tabClickAction(2, false);
				});
				jQuery('#tab3').off().on('click', function() {
					self.tabClickAction(3, false);
				});
				jQuery('#tab4').off().on('click', function() {
					self.tabClickAction(4, false);
				});
			}, 1000);/* Promisifying cheat */
		},
		/**
		 * @param int level
		 * @param bool force Set to true if re-clicking on the already active tab regenerates target color
		 */
		tabClickAction: function(level, force) {
			var thisTab = jQuery('#tab' + level);
			var thisLevel = jQuery('#lvl' + level);
			if ((thisTab.hasClass('unlocked') && !thisTab.hasClass('active')) || force) {
				// Hide other levels and deactivate tab
				jQuery('#levelcontents > div').css('display', 'none');
				jQuery('#leveltabs > div').removeClass('active');
				// Show level and activate tab
				thisLevel.css('display', 'inherit');
				thisTab.addClass('active');
				// Edit selectedLevel in hueser service and generate new target colors
				gameVars.setSelectedLevel(level);
				colorCookies.generateTargetHSL(level);
				var newTargetHSL = colorCookies.getTargetHSL();
				this.updateTargetColorSquare(newTargetHSL.H, newTargetHSL.S, newTargetHSL.L);
			}
		},
		/**
		 * @param int level
		 */
		showTab: function(level) {
			jQuery('#levelcontents > div').hide(200, function() {
				jQuery('#lvl' + level).show(200);
			});
		},
		/**
		 * @param int level
		 */
		inputFocus: function() {
			jQuery('#hcontrol input').focus();
		},
		/**
		 * @param Number sat Saturation to stick to
		 */
		blockSaturationInput: function(sat) {
			$timeout(function() {
				jQuery('#scontrol').addClass('fixed-value');
				jQuery('#scontrol input').hide();
				jQuery('#scontrol p.fixed-hidden-value').html(sat).show();
			}, 100);/* Promisifying cheat */
		},
		/**
		 * @param Number lig Lightness to stick to
		 */
		blockLightnessInput: function(lig) {
			$timeout(function() {
				jQuery('#lcontrol').addClass('fixed-value');
				jQuery('#lcontrol input').hide();
				jQuery('#lcontrol p.fixed-hidden-value').html(lig).show();
			}, 100);/* Promisifying cheat */
		},
		updateTargetColorSquare: function(h, s, l) {
			jQuery('.targetcolor').css('background', 'hsl(' + h + ', ' + s + '%, ' + l + '%)');
		},
		animateShotsInJS: function() {
			var shotsHeight = jQuery('#header #shotsLeft .shots').height();
			var shotsWidth = jQuery('#header #shotsLeft .shots').width();
			var xC = shotsWidth / 2;
			var yC = shotsHeight / 2;
			var allShots = jQuery('#header #shotsLeft .shot');
			var shotRad = allShots.height() / 2;
			var rotRad = shotsHeight/2 - shotRad;
			var nbShots = allShots.length;
			allShots.css('position', 'absolute');
			var t = 0;
			setInterval(function() {
			    t++;
			    for (var s = 1; s <= nbShots; s++) {
			        var thisShot = jQuery('#header #shotsLeft .shot:nth-of-type(' + s + ')');
			        thisShot.css('left', xC + rotRad * Math.cos(2*Math.PI / nbShots * s + t/(10*nbShots)) - shotRad + 'px');
			        thisShot.css('top', yC - rotRad * Math.sin(2*Math.PI / nbShots * s + t/(10*nbShots)) - shotRad + 'px');
			    }
			}, 50);
		}
	}
}]);
