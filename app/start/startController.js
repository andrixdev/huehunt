window.app.controller('StartController', ['$scope', '$location', 'nav', 'colorCookies', 'forms', 'DOM', function($scope, $location, nav, colorCookies, forms, DOM) {

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

	// Show level function
	$scope.showLevel = function(level) {
		$scope.activeLevel = level;
		console.log('showLevel called with ' + level);
	}

	// Listeners for tabs
	DOM.levelTabs();

	// Store in $scope all the remaining necessary parameters to render the views
	$scope.cH = cH;
	$scope.cS = cS;
	$scope.cL = cL;
	$scope.activeLevel = 1;
	$scope.style = ".targetcolor {"
		+ "background: hsl(" + tH + ", " + tS + "%, " + tL + "%);"
	+ "}";
}]);
