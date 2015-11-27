/* global CLIENT_IDS, REDIRECT_URI, hello, HTTP_SERVER, angular */
var app = angular.module('app', ['ngNotify']);

app.controller('controller', ['$scope', '$filter', '$http', 'ngNotify', function($scope, $filter, $http, ngNotify) {

	var server = typeof(HTTP_SERVER) ? HTTP_SERVER : '';

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
	$scope.addApp = function() {
		$scope.apps.push({
			client_id: '',
			client_secret: '',
			admin_id: getAdmins().join(' ')
		});

		$scope.$apply();
	};

	$scope.saveApps = function() {

		// Loop through all the apps
		$scope.apps.forEach(function(app) {
			$scope.postApp(app);
		});

	};

	//
	// Post individual app
	$scope.postApp = function(app) {

		// Get the current users signed attributes
		var admins = getAdmins();

		// Ensure that all the current profiles are defined in the admin_id section.
		var a = app.admin_id.split(/[\s\,]+/);

		// User credentials
		admins.forEach(function (credentials) {
			if (a.indexOf(credentials) === -1) {
				a.push(credentials);
			}
		});
		app.admin_id = a.join(' ');

		// Post this request off to the server
		$http({
			url: server + '/rest',
			method: 'POST',
			data: app
		}).success(function(response) {

			// Update the guid to the app in memory
			if (response.name === 'error' && response.detail) {
				ngNotify.set(response.detail, 'error');
				return;
			}
			else {
				ngNotify.set('Successfully updated records', 'success');
			}

			// INSERT returns a GUID
			// UPDATE does not
			if (response.guid) {
				app.guid = response.guid;
			}

			// update view
			$scope.$apply();
		});
	};

	//
	// Delete
	$scope.deleteApp = function(app) {

		if (!app.guid) {
			removeItem();
			return;
		}

		// Post this request off to the server
		$http({
			url: server + '/rest',
			method: 'GET',
			params: {guid: app.guid, action: 'delete'}
		}).success(function() {
			removeItem();
		});

		function removeItem() {
			// Loop through all the apps
			for (var i = 0; i < $scope.apps.length; i++) {
				if ($scope.apps[i] === app) {
					$scope.apps.splice(i, 1);
				}
			}

			// update view
			$scope.$apply();
		}
	};


	// Profiles
	$scope.profiles = [];
	$scope.defaultProfile = null;

	for (var x in CLIENT_IDS) {
		$scope.profiles.push(new Profile(x));
	}


	// Get the user credentials
	hello.on('auth.login', function(auth) {

		hello(auth.network)
		.api('me')
		.then(function(o) {

			// Update the Profile
			$scope.profiles.forEach(function(profile) {

				if (profile.network === auth.network) {

					// Asign the first one to be the default profile
					if (!$scope.defaultProfile) {
						$scope.defaultProfile = profile;
					}

					// Add Access Token to the profile
					o.access_token = auth.authResponse.access_token;

					// Update the profile
					profile.update(o);

					// User the profile.id to make a REST request to the server for more the data
					$http({
						url: server + '/rest',
						method: 'GET',
						params: {
							'access_token': profile.access_token,
							'admin_id': profile.id
						}
					}).success(function(response) {
						// Loop through the rows and add to the list of the users apps.
						for (var i = 0; i < response.rows.length; i++) {
							var b = true;
							// Does it exist
							for (var j = 0; j < $scope.apps.length; j++) {
								if ($scope.apps[j].guid === response.rows[i].guid) {
									b = false;
								}
							}
							if (b) {
								$scope.apps.push(response.rows[i]);
							}
						}

						// update view
						$scope.$apply();
					});

					// update view
					$scope.$apply();
				}
			});
		});
	});

	hello.init(CLIENT_IDS, {
		redirect_uri: REDIRECT_URI,
		oauth_proxy: '/proxy'
	});


	function getAdmins() {

		var ids = [];

		// Get a snapshot of the current profiles
		for (var i = 0; i < $scope.profiles.length; i++) {
			var id = $scope.profiles[i].id;
			if (id) {
				ids.push(id);
			}
		}

		return ids;
	}

	//
	// Profile Controls user access
	// A user may have multiple profiles
	function Profile(network) {
		this.network = network;
		this.name = null;
		this.thumbnail = null;
		this.id = null;
		this.access_token = null;

		this.signin = function() {
			hello.login(network, {display: 'popup'});
		};

		this.update = function(o) {
			if (o.name) {
				this.name = o.name;
			}
			if (o.thumbnail) {
				this.thumbnail = o.thumbnail;
			}
			if (o.id) {
				this.id = o.id + '@' + this.network;
			}
			if (o.access_token) {
				this.access_token = o.access_token;
			}
		};
	}

}]);
