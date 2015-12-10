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

	// Set Target HSL session variables
	colorCookies.setTargetHSL();
	var targetHSL = colorCookies.getTargetHSL(),
		tH = targetHSL.H,
		tS = targetHSL.S,
		tL = targetHSL.L;

	// Pre-generate random start HSL values
	var randomHSL = colorCookies.generateRandomHSL(),
		cH = randomHSL.H,// 'c' stands for 'current'
		cS = randomHSL.S,
		cL = randomHSL.L;

	// Form handling (custom service 'forms')
	forms.handleStartForm();

	// Clear previous paths in nav service (prevents cookie overload)
	nav.clearPaths();

	// Save current path
	nav.addPath($location.path());

	// Check maximum playable level
	var maxLevel = hueser.getMaxLevel();
	if (!maxLevel) {
		maxLevel = 1;
	}

	// Listeners for tabs
	DOM.levelTabs();

	// Store in $scope all the remaining necessary parameters to render the views
	$scope.cH = cH;
	$scope.cS = cS;
	$scope.cL = cL;
	maxLevel = 2; // @todo Remove
	// @todo Add little lock logo
	// @todo Design & add hue, lightness and saturation tips
	$scope.level1status = (maxLevel >= 1 ? 'unlocked' : 'locked');
	$scope.level2status = (maxLevel >= 2 ? 'unlocked' : 'locked');
	$scope.level3status = (maxLevel >= 3 ? 'unlocked' : 'locked');
	$scope.levelXstatus = (maxLevel >= 4 ? 'unlocked' : 'locked');
	$scope.style = ".targetcolor {"
		+ "background: hsl(" + tH + ", " + tS + "%, " + tL + "%);"
	+ "}";
}]);
