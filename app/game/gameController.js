window.app.controller('GameController', ['$scope', '$location', 'nav', 'colorCookies', 'gameVars', 'hueser', 'forms', '_', 'DOM', '$timeout', function($scope, $location, nav, colorCookies, gameVars, hueser, forms, _, DOM, $timeout) {

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

	// Update shots counter
	gameVars.addShots(-1);
	shots--;
	var ithShot = gameVars.roundShots[selectedLevel - 1] - (shots + 1);

	// Add new HSL set to history and to navigation memory service
	if (ithShot != 0) {
		gameVars.addRoundHistory({
			H: cH,
			S: cS,
			L: cL
		});
	}

	// Distance to target
	var dist = gameVars.getColorDistance(cH, cS, cL, tH, tS, tL);

	// Inscrease performance
	var performance = 0;
	if (ithShot != 0) {
		var previousPerformance = gameVars.getPerformance();
		var extraPerformance = gameVars.howMuchExtraPerformanceForThisShot(999, ithShot, dist);
		gameVars.addPerformance(extraPerformance);
		performance = parseInt(previousPerformance) + parseInt(extraPerformance);
	}

	// Save current path
	nav.addPath($location.path());

	// If player is really close to target, terminate round with max XP for remaining shots
	var winDist = 2;
	if (dist <= winDist) {
		for (var j = shots - 1; j >= -1 ; j--) {
			// Get ithShot
			ithShotLoop = gameVars.roundShots[selectedLevel - 1] - (j + 1);
			// Increase performance
			var previousPerformance = gameVars.getPerformance();
			var extraPerformance = gameVars.howMuchExtraPerformanceForThisShot(999, ithShotLoop, 0);// Zero distance
			gameVars.addPerformance(extraPerformance);
			performance = parseInt(previousPerformance) + parseInt(extraPerformance);

			// Add the target color to history
			gameVars.addRoundHistory({
				H: cH,
				S: cS,
				L: cL
			});

			// Decrease shot count
			shots--;
		}
	}

	// If all shots are taken, set win variable to true and redirect to /win
	if (shots <= -1) {
		gameVars.setWin();
		$location.path('/win');
	}
	// If target not reached, display new game phase
	else {

	}

	// View things 1 - Replace view parametes by ??? if first shot (currently not accepted by browser as input type is number)
	if (ithShot == 0) {
		cH = '???';
		cS = '??';
		cL = '??';
	}

	// View things 2 - Fix saturation or lightness, or both if necessary
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

	// View things 3 - Handle interactionarea with 'forms' custom service
	forms.handleGameForm();

	// View thing 4 - Force focus on first input
	$timeout(function() {
		DOM.inputFocus();
	}, 100);/* Promisifying cheat */

	// View things 5 - Store in $scope all the remaining necessary parameters to render the views
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
	+ "}";

	// View things 6 - Add color background to #insight if not first shot
	if (ithShot != 0) {
		$scope.style += "#insight {"
		+ "  background: hsl(" + cH + ", " + cS + "%, " + cL + "%);"
		+ "}";
	}

	// View things 7 - Give number of last shots to header
	$scope.style += "#header #shotsLeft .shots::after {"
	+ "content: '" + (parseInt(shots) + 1) + "'"
	+ "}";

	// View things 8 - Animate shots
	for (var l = 0; l < shots + 1; l++) {
		var angle = 360 / (shots + 1) * l;
		$scope.style += "#header #shotsLeft p.shot:nth-of-type(" + (l + 1) + ") {"
		+ "  transform: rotate(" + angle + "deg);"
		+ "  -webkit-animation: rot-" + angle + " " + (1 + 1.5 * shots) + "s linear infinite;"
		+ "  animation: rot-" + angle + " " + (1 + 1.5 * shots) + "s linear infinite;"
		+ "}"
		+ "@-webkit-keyframes rot-" + angle + " { 100% { -webkit-transform: rotate(" + (360 + angle) + "deg); } }"
		+ "@keyframes rot-" + angle + " { 100% { transform: rotate(" + (360 + angle) + "deg); } }";
	}
	/*$timeout(function() {
		DOM.animateShotsinJS();
	}, 100);*/

	$scope.username = username;
	$scope.shotsLoop = _.range(1, shots + 2);
	$scope.shots = shots + 1;
	$scope.performance = performance;
	$scope.currentURL = $location.absUrl();
	$scope.cH = cH;
	$scope.cS = cS;
	$scope.cL = cL;

	// Views
	var insightView = 'app/game/gameInsightView.html';
	if (ithShot == 0) {
		insightView = 'app/game/gameFirstShotInsightView.html';
	}
	$scope.templatePaths = {
		header: 'app/game/gameHeaderView.html',
		insight: insightView,
		clue: 'app/game/gameClueView.html',
		// @todo Remove clue mechanism
		instructions: '',
		// @todo Remove instructions mechanism?
		interactionarea: 'app/game/gameInteractionareaView.html',
		footer: 'app/footer/footerView.html'
	};

}]);
