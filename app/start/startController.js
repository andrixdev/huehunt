window.app.controller('StartController', ['$scope', '$location', 'nav', 'colorCookies', 'gameVars', 'hueser', '$firebaseArray', function($scope, $location, nav, colorCookies, gameVars, hueser, $firebaseArray) {

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

	// Form handling
	// If valid, set username variable, set all unset session variables
	// This puzzling part of the app still has to be sorted out

	/*
	$scope.goForm = function(username) {
	*/
		gameVars.setGameVars();
		hueser.setUsername("Guest" + Math.floor(Math.random()*100));
		//$location.path('/' + cH + '/' + cS + '/' + cL);
	/*
	};
	*/

	// Clear previous paths in nav service (prevents cookie overload)
	nav.clearPaths();

	// Save current path
	nav.addPath($location.path());

	// Store in $scope all the remaining necessary parameters to render the views
	$scope.cH = cH;
	$scope.cS = cS;
	$scope.cL = cL;
	$scope.style = ".targetcolor {"
		+ "background: hsl(" + tH + ", " + tS + "%, " + tL + "%);"
	+ "}";
}]);
