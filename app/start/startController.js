window.app.controller('StartController', ['$scope', '$location', 'nav', 'colorCookies', 'hueser', 'forms', 'DOM', function($scope, $location, nav, colorCookies, hueser, forms, DOM) {

	// Debug
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
	var maxLevel = hueser.getMaxLevel();
	if (!username) {
		// Initialize game parameters
		hueser.setMaxLevel(1);
		maxLevel = 1;
		hueser.setExperience(0);
	}

	// Set Target HSL session variables
	colorCookies.setTargetHSL();
	var targetHSL = colorCookies.getTargetHSL(),
		tH = targetHSL.H,
		tS = targetHSL.S,
		tL = targetHSL.L;

	// Pre-generate random start HSL values (move when designing no-first-color feature)
	var randomHSL = colorCookies.generateRandomHSL(),
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

	maxLevel = 3; // @todo Remove

	$scope.level1status = (maxLevel >= 1 ? 'unlocked' : 'locked');
	$scope.level2status = (maxLevel >= 2 ? 'unlocked' : 'locked');
	$scope.level3status = (maxLevel >= 3 ? 'unlocked' : 'locked');
	$scope.levelXstatus = (maxLevel >= 4 ? 'unlocked' : 'locked');
	$scope.style = ".targetcolor {"
		+ "background: hsl(" + tH + ", " + tS + "%, " + tL + "%);"
	+ "}";
}]);
