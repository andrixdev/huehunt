window.app.controller('GameController', ['$scope', '$location', 'nav', 'colorCookies', 'gameVars', 'hueser', 'forms', '_', 'DOM', function($scope, $location, nav, colorCookies, gameVars, hueser, forms, _, DOM) {

	// Views
	$scope.templatePaths = {
		header: 'app/game/gameHeaderView.html',
		insight: 'app/game/gameInsightView.html',
		clue: 'app/game/gameClueView.html',
		// @todo Remove clue mechanism
		instructions: '',
		// @todo Remove instructions mechanism?
		interactionarea: 'app/game/gameInteractionareaView.html',
		footer: 'app/footer/footerView.html'
	};

	// Get all user variables
	var username = hueser.getUsername();
	var selectedLevel = gameVars.getSelectedLevel();
	var avatarBaseHue = hueser.getAvatarBaseHue();

	var vars = gameVars.getRoundGameVars(),
		shots = vars.shots,
		win = vars.win;
	var targetHSL = colorCookies.getTargetHSL(),
		tH = targetHSL.H,
		tS = targetHSL.S,
		tL = targetHSL.L;

	// Redirect to /start if username not defined
	if (!username) {
		$location.path('/start');
	}

	// Redirect to /win if already won
	if (win == 'true') {
		$location.path('/win');
	}

	// Update/set session variables H, S and L based on url
	var current = $location.path().split('/');
	var cH = current[1],// 'c' stands for 'current'
		cS = current[2],
		cL = current[3];

	// Add new HSL set to history and to navigation memory service
	gameVars.addRoundHistory({
		H: cH,
		S: cS,
		L: cL
	});

	// Update shots counter
	gameVars.addShots(-1);
	shots--;

	console.log('shots is ' + shots);

	// Distance to target
	var dist = gameVars.getColorDistance(cH, cS, cL, tH, tS, tL);

	// Inscrease performance
	var ithShot = 6 - (shots + 1);
	var performance = 0;
	if (ithShot != 0) {
		var previousPerformance = gameVars.getPerformance();
		var extraPerformance = gameVars.howMuchExtraPerformanceForThisShot(999, ithShot, dist);
		gameVars.addPerformance(extraPerformance);
		performance = parseInt(previousPerformance) + parseInt(extraPerformance);
		console.log('gameController.js vars: ', performance);
	}

	// Fix saturation or lightness, or both if necessary
	if (selectedLevel == 1) {
		DOM.blockSaturationInput(100);
		tS = 100;
		cS = 100;
		DOM.blockLightnessInput(50);
		tL = 50;
		cL = 50;
	} else if (selectedLevel == 2) {
		DOM.blockLightnessInput(50);
		tL = 50;
		cL = 50;
	}

	// If all shots are taken, set win variable to true and redirect to /win
	if (shots <= -1) {
		gameVars.setWin();
		$location.path('/win');
	}
	// If target not reached, display new game phase
	else {

	}

	// Handle interactionarea with 'forms' custom service
	forms.handleGameForm();

	// Save current path
	nav.addPath($location.path());

	// Store in $scope all the remaining necessary parameters to render the views
	$scope.style = ".targetcolor {"
	+ "  background: hsl(" + tH + ", " + tS + "%, " + tL + "%);"
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
	+ "}";

	$scope.username = username;
	$scope.shotsLoop = _.range(1, shots + 2);
	$scope.shots = shots + 1;
	$scope.performance = performance;
	$scope.currentURL = $location.absUrl();
	$scope.cH = cH;
	$scope.cS = cS;
	$scope.cL = cL;
}]);
