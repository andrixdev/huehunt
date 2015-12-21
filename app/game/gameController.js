window.app.controller('GameController', ['$scope', '$location', 'nav', 'colorCookies', 'gameVars', 'hueser', 'forms', '_', function($scope, $location, nav, colorCookies, gameVars, hueser, forms, _) {

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
	var vars = gameVars.getGameVars(),
		avatarBaseHue = vars.avatarBaseHue,
		shots = vars.shots,
		win = vars.win;
	var targetHSL = colorCookies.getTargetHSL(),
		tH = targetHSL.H,
		tS = targetHSL.S,
		tL = targetHSL.L;

	// Redirect to /start if username not defined (uncomment when form works)
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
	gameVars.addHistory({
		H: cH,
		S: cS,
		L: cL
	});

	// Increment shots counter
	shots++;
	gameVars.addShot();

	// Target distance
	var dH = tH - cH,// 'd' stands for 'delta'
		dS = tS - cS,
		dL = tL - cL;

	// If target reached, set win variable to true and redirect to /win
	if (Math.abs(dH) < 6 && Math.abs(dS) < 3 && Math.abs(dL) < 3) {
		gameVars.setWin();
		$location.path('/win');
	}
	// If target not reached, display new game phase
	else {
		// @todo Remove clue mechanism
		// If the player is far from reaching H
		if (Math.abs(dH) >= Math.abs(dS) && Math.abs(dH) >= Math.abs(dL)) {
			$scope.clue = {
				which: 'H',
				isToo: (dH > 0 ? 'LOW' : 'HIGH')
			}
		}
		// If the player is far from reaching S
		else if (Math.abs(dS) >= Math.abs(dH) && Math.abs(dS) >= Math.abs(dL)) {
			$scope.clue = {
				which: 'S',
				isToo: (dS > 0 ? 'LOW' : 'HIGH')
			}
		}
		// If the player is far from reaching L
		else if (Math.abs(dL) >= Math.abs(dH) && Math.abs(dL) >= Math.abs(dS)) {
			$scope.clue = {
				which: 'L',
				isToo: (dL > 0 ? 'LOW' : 'HIGH')
			}
		}
	}

	// Handle interactionarea with 'forms' custom service
	forms.handleGameForm();

	// Save current path
	nav.addPath($location.path());

	// Store in $scope all the remaining necessary parameters to render the views
	$scope.style = ".targetcolor {"
	+ "  background: hsl(" + tH + ", " + tS + "%, " + tL + "%);"
	+ "}"
	+ "#avatar .square:nth-of-type(1),"
	+ "#avatar .square:nth-of-type(4) {"
	+ "  background: hsl(" + avatarBaseHue + ", 100%, 60%);"
	+ "}"
	+ "#avatar .square:nth-of-type(2),"
	+ "#avatar .square:nth-of-type(3) {"
	+ "  background: hsl(" + (avatarBaseHue - 15) + ", 80%, 50%);"
	+ "}"
	+ "#insight {"
	+ "  background: hsl(" + cH + ", " + cS + "%, " + cL + "%);"
	+ "}";

	$scope.username = username;
	$scope.shotsLoop = _.range(1, shots);
	$scope.shots = shots;
	$scope.currentURL = $location.absUrl();
	$scope.cH = cH;
	$scope.cS = cS;
	$scope.cL = cL;
}]);
