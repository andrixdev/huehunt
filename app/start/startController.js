window.app.controller('StartController', ['$scope', '$location', 'nav', 'colorCookies', 'hueser', 'forms', 'DOM', function($scope, $location, nav, colorCookies, hueser, forms, DOM) {

	// Debug @ todo.later Remove
	window.scopee = $scope;
	// Views
	$scope.templatePaths = {
		header: 'app/header/headerView.html',
		insight: 'app/start/startInsightView.html',
		clue: '',
		instructions: '',
		interactionarea: '',
		footer: 'app/footer/footerView.html'
	};

	// Form handling (custom service 'forms')
	forms.handleStartForm();

	// Listeners for tabs
	DOM.levelTabs();

	// Check user existence
	var username = hueser.getUsername();
	var playerStatus = 'known';
	if (!username) {
		// Initialize game parameters
		hueser.setMaxLevel(1);
		hueser.setExperience(0);
		hueser.setAvatarBaseHue();
		playerStatus = 'unknown';
	}

	// Get avatar base hue and max level
	var avatarBaseHue = hueser.getAvatarBaseHue();
	var maxLevel = hueser.getMaxLevel();

	// Set Target HSL session variables
	colorCookies.generateTargetHSL(1);
	var targetHSL = colorCookies.getTargetHSL(),
		tH = targetHSL.H,
		tS = targetHSL.S,
		tL = targetHSL.L;

	// Pre-generate random start HSL values (move when designing no-first-color feature)
	var randomHSL = colorCookies.generateCurrentHSL(),
		cH = randomHSL.H,// 'c' stands for 'current'
		cS = randomHSL.S,
		cL = randomHSL.L;

	// Clear previous paths in nav service (prevents cookie overload)
	nav.clearPaths();

	// Save current path
	nav.addPath($location.path());

	// Store in $scope all the remaining necessary parameters to render the views
	$scope.cH = cH;
	$scope.cS = cS;
	$scope.cL = cL;

	$scope.level1status = (maxLevel >= 1 ? 'unlocked' : 'locked');
	$scope.level2status = (maxLevel >= 2 ? 'unlocked' : 'locked');
	$scope.level3status = (maxLevel >= 3 ? 'unlocked' : 'locked');
	$scope.level4status = (maxLevel >= 4 ? 'unlocked' : 'locked');

	var playerXP = hueser.getExperience();
	var currentLevelXP = hueser.getCurrentLevelXP();
	var nextLevelXP = hueser.getNextLevelXP();
	var sinceLastLevelXP = playerXP - currentLevelXP;
	var currentLevelNeededXP = nextLevelXP - currentLevelXP;
	console.log(playerXP, currentLevelXP, nextLevelXP, sinceLastLevelXP, currentLevelNeededXP);

	$scope.playerStatus = playerStatus;
	$scope.playerName = username;
	$scope.playerLevel = maxLevel;
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
	+ "#insight {"
	+ "  background: hsl(" + cH + ", " + cS + "%, " + cL + "%);"
	+ "}"
	+ ".xpbar .xpliquid {"
	+ "  width: " + (100 * sinceLastLevelXP / currentLevelNeededXP) + "%"
	+ "}";

}]);
