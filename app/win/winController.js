window.app.controller('WinController', ['$scope', '$location', 'nav', 'colorCookies', 'gameVars', 'hueser', '$firebaseArray', '_', function($scope, $location, nav, colorCookies, gameVars, hueser, $firebaseArray, _) {

	// Get all user variables
	var username = hueser.getUsername();
	var roundLevel = gameVars.getSelectedLevel();
	var vars = gameVars.getRoundGameVars(),
		avatarBaseHue = vars.avatarBaseHue,
		performance = vars.performance,
		roundHistory = vars.roundHistory,
		win = vars.win,
		saved = vars.saved;
	var targetHSL = colorCookies.getTargetHSL(),
		tH = targetHSL.H,
		tS = targetHSL.S,
		tL = targetHSL.L;
	var experience = hueser.getExperience();

	// Redirect to /start if username not defined
	if (!username) {
		$location.path('/start');
	}

	// If cheat win (user types /win), redirect to /{currenthsl}
	if (win != 'true') {
		$location.path(nav.getLastPath());
	}

	// Reference to database
	var roundsRef = new Firebase("https://blistering-torch-4182.firebaseio.com/rounds");

	// Store current round in scores database
	if (saved == 'false') {
		$scope.rounds = $firebaseArray(roundsRef);
		$scope.rounds.$add({
			username: username,
			roundLevel: roundLevel,
			performance: performance,
			targetH: tH,
			targetS: tS,
			targetL: tL,
			dataVersion: 1,
			timestamp: new Date().getTime()
		});
		gameVars.setSaved();
	}

	// Increase player experience
	hueser.setExperience(parseInt(experience) + parseInt(performance));
	hueser.maybeLevelUp();

	// Load highscores
	$scope.highscores = {};
	roundsRef.on('value', function(data) {
		var rounds = data.val();
		// Remove scores that are not for this level
		var thisLevelRounds = _.filter(rounds, function(value) {
			return value.roundLevel == roundLevel;
		});
		// Sort them by ascending performance
		var sortedRounds = _.sortBy(thisLevelRounds, function(value) {
			return parseInt(value.performance);
		});
		// Put the best performances on top
		sortedRounds = sortedRounds.reverse();
		// Pick the very bests
		$scope.highscores = sortedRounds.splice(0, 10);

		// Notify Angular (because we use native Firebase code and not specific Angular version, so the code is not wrapped in the digest cycle by default)
		$scope.$apply();
	});

	// Save current path
	nav.addPath($location.path());

	// Store in $scope all the necessary parameters to render the views
	$scope.roundLevel = roundLevel;
	$scope.performance = performance;
	$scope.roundHistory = roundHistory;
	$scope.tH = tH;
	$scope.tS = tS;
	$scope.tL = tL;

	// Views
	$scope.templatePaths = {
		header: "app/header/headerView.html",
		insight: "app/win/winInsightView.html",
		clue: "",
		instructions: "",
		interactionarea: '',
		footer: "app/footer/footerView.html"
	};

}]);
