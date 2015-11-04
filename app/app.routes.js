window.app.config(['$routeProvider', function($routeProvider) {
	$routeProvider
		.when('/start', {
			templateUrl: 'app/base/baseView.html',
			controller: 'StartController'
		})
		.when('/:H/:S/:L', {
			templateUrl: 'app/base/baseView.html',
			controller: 'GameController'
		})
		.when('/win', {
			templateUrl: 'app/base/baseView.html',
			controller: 'WinController'
		})
		.otherwise({
			redirectTo: '/start',
			templateUrl: 'app/base/baseView.html',
			controller: 'StartController'
		});
}]);