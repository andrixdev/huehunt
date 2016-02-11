window.app.controller('WinController', ['$scope', '$location', 'nav', 'colorCookies', 'gameVars', 'hueser', '$firebaseArray', '_', function($scope, $location, nav, colorCookies, gameVars, hueser, $firebaseArray, _) {

	// Views
	$scope.templatePaths = {
		header: "app/header/headerView.html",
		insight: "app/win/winInsightView.html",
		clue: "",
		instructions: "",
		interactionarea: '',
		footer: "app/footer/footerView.html"
	};

	// Get all user variables
	var username = hueser.getUsername();
	var vars = gameVars.getRoundGameVars(),
		avatarBaseHue = vars.avatarBaseHue,
		shots = vars.shots,
		startTime = vars.startTime,
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
			shots: shots,
			startTime: startTime,
			targetH: tH,
			targetS: tS,
			targetL: tL
		});
		gameVars.setSaved();
	}

	// Increase player experience
	hueser.setExperience(parseInt(experience) + 10);
	hueser.maybeLevelUp();

	// Load highscores
	$scope.highscores = {};
	roundsRef.on('value', function(data) {
		var rounds = data.val();
		var sortedRounds = _.sortBy(rounds, function(value) {
			return parseInt(value.shots);
		});
		$scope.highscores = sortedRounds.splice(0, 10);

		// Notify Angular (because we use native Firebase code and not specific Angular version, so the code is not wrapped in the digest cycle by default)
		$scope.$apply();
	});

	// Save current path
	nav.addPath($location.path());

	// Store in $scope all the necessary parameters to render the views
	$scope.shots = shots;
	$scope.roundHistory = roundHistory;
	$scope.tH = tH;
	$scope.tS = tS;
	$scope.tL = tL;
}]);
