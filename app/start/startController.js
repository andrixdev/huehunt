window.app.controller('StartController', ['$scope', '$location', 'nav', 'colorCookies', 'hueser', 'forms', 'DOM', '$timeout', function($scope, $location, nav, colorCookies, hueser, forms, DOM, $timeout) {

	// Form handling (custom service 'forms')
	forms.handleStartForm();

	// Listeners for tabs
	DOM.levelTabs();

	// Check user existence
	var username = hueser.getUsername();
	var playerStatus = 'player-known';
	if (!username) {
		// Initialize game parameters
		hueser.setMaxLevel(1);
		hueser.setExperience(0);
		hueser.setAvatarBaseHue();
		playerStatus = 'player-unknown';
	}
	/*
	hueser.setExperience(9999);
	hueser.setMaxLevel(4);
	*/

	// Get avatar base hue and max level
	var avatarBaseHue = hueser.getAvatarBaseHue();
	var maxLevel = hueser.getMaxLevel();

	// Force activation of max possible level
	$timeout(function() {
		DOM.tabClickAction(maxLevel, true);
	}, 100);/* Promisifying cheat */

	var targetHSL = colorCookies.getTargetHSL(),
		tH = targetHSL.H,
		tS = targetHSL.S,
		tL = targetHSL.L;

	// Clear previous paths in nav service (prevents cookie overload)
	nav.clearPaths();

	// Save current path
	nav.addPath($location.path());

	$scope.level1status = (maxLevel >= 1 ? 'unlocked' : 'locked');
	$scope.level2status = (maxLevel >= 2 ? 'unlocked' : 'locked');
	$scope.level3status = (maxLevel >= 3 ? 'unlocked' : 'locked');
	$scope.level4status = (maxLevel >= 4 ? 'unlocked' : 'locked');

	var playerXP = hueser.getExperience();
	var currentLevelXP = hueser.getCurrentLevelXP();
	var nextLevelXP = hueser.getNextLevelXP();
	var sinceLastLevelXP = playerXP - currentLevelXP;
	var currentLevelNeededXP = nextLevelXP - currentLevelXP;

	$scope.playerStatus = playerStatus;
	$scope.playerName = username;
	$scope.playerXP = playerXP;
	$scope.playerLevel = (maxLevel == 4 ? 'X' : maxLevel);
	$scope.nextLevel = (maxLevel == 3 ? 'X' : maxLevel - (-1));
	$scope.sinceLastLevelXP = sinceLastLevelXP;
	$scope.currentLevelNeededXP = currentLevelNeededXP;

	$scope.style = ".targetcolor {"
	+ "background: hsl(" + tH + ", " + tS + "%, " + tL + "%);"
	+ "}"
	+ ".avatar .square:nth-of-type(1),"
	+ ".avatar .square:nth-of-type(4) {"
	+ "  background: hsl(" + avatarBaseHue + ", 100%, 60%);"
	+ "}"
	+ ".avatar .square:nth-of-type(2),"
	+ ".avatar .square:nth-of-type(3) {"
	+ "  background: hsl(" + (avatarBaseHue - 15) + ", 80%, 50%);"
	+ "}"
	+ ".xpbar .xpliquid {"
	+ "  width: " + (100 * sinceLastLevelXP / currentLevelNeededXP) + "%"
	+ "}";

	// Views
	$scope.templatePaths = {
		header: 'app/header/headerView.html',
		insight: 'app/start/startInsightView.html',
		interactionarea: '',
		footer: 'app/footer/footerView.html'
	};

}]);
