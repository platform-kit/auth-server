/* global CLIENT_IDS, REDIRECT_URI, hello, angular */
var app = angular.module('app', ['ngNotify']);

app.controller('controller', ['$scope', '$filter', '$http', 'ngNotify', function($scope, $filter, $http, ngNotify) {

	var api = hello('authserver');

	// Fields
	$scope.fields = [
		{name: 'reference', required: true},
		{name: 'domain', required: true},
		{name: 'client_id', required: true},
		{name: 'client_secret', required: true},
		{name: 'grant_url', required: false}
	];

	// Apps
	// A list of the users currently registered apps
	$scope.apps = [];

	// Add
	$scope.addApp = function() {
		$scope.apps.push({
			client_id: '',
			client_secret: ''
		});
	};

	// Save All
	$scope.saveApps = function() {

		// Loop through all the apps
		$scope.apps.forEach(function(app) {
			$scope.postApp(app);
		});

	};

	// Post One
	$scope.postApp = function(app) {

		// Post JSON formatted content
		api.api('me/apps', 'post', JSON.parse(angular.toJson(app)))
		.then(function(resp) {

			ngNotify.set('Successfully updated records', 'success');

			// INSERT returns a GUID
			if (resp.id) {
				app.id = resp.id;
			}

			// Apply
			$scope.$apply();

		}, function(err) {
			ngNotify.set(err, 'error');

			// Apply
			$scope.$apply();
		});
	};

	//
	// Delete
	$scope.deleteApp = function(app) {

		// Remove from the $scope
		var index = $scope.apps.indexOf(app);
		$scope.apps.splice(index, 1);

		// Post this request off to the server
		api.api('me/apps', 'delete', {id: app.id})
		.then(function() {
			ngNotify.set('Successfully deleted record', 'success');
		}, function(err) {
			ngNotify.set(err.details, 'error');
		});
	};

	// Profiles
	$scope.profile = null;

	// Login
	// Trigger authentication
	$scope.login = function() {
		hello('authserver').login({force:true});
	};
	$scope.logout = function() {
		hello('authserver')
		.logout({force:true})
		.then(function(){
			$scope.profile = null;
			$scope.apps = [];
			$scope.$apply();
		});
	};

	// Get the user credentials
	hello.on('auth.login', function(auth) {

		var auth = hello(auth.network);

		// Get the user profile
		auth.api('me', {fields: 'id,name,picture'})
		.then(function(o) {

			// Update the Profile
			$scope.profile = o;
			$scope.$apply();
		});

		// Get the users Apps
		auth.api('me/apps')
		.then(function(resp) {

			// Loop through the rows and add to the list of the users apps.
			resp.data.forEach(function(app) {

				// Does it exist
				var b = $scope.apps.filter(function(_app) {
					return _app.id === app.id;
				}).length;

				// Do we need to insert it?
				if (!b) {
					$scope.apps.push(app);
				}
			});

			$scope.$apply();

		});
	});

	hello.init(CLIENT_IDS, {
		redirect_uri: REDIRECT_URI,
		oauth_proxy: '/proxy'
	});

}]);
