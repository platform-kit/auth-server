# // auth-server

//auth-server provides a "shim" service for web apps or browser extensions wanting to take advantage of OAuth2 and OAuth1 server side authentication in their static apps.


## Developers

The [HelloJS](http://adodson.com/hello.js) client side library supports this service by default. You dont need to read the docs here just register [your app ids](https://auth-server.herokuapp.com/#my-apps).
However if your writing your own client side code then the [documentation](#documentation) below should help you get started.




## Documentation

### Authentication OAuth 2.0

The OAuth2 flow starts when your application sends a client out to a providers site to grant permissions. The response is an authorization code "[AUTH_CODE]" which is returned to your site, this needs to be exchanged for an Access Token. Your page then needs to send this code to the //auth-server with your client_id in exhchange for an access token, e.g.


	https://auth-server.herokuapp.com/proxy
	?redirect_uri=[REDIRECT_PATH]
	&code=[AUTH_CODE]
	&client_id=[APP_KEY]
	&state=[STATE]
	&grant_url=[PROVIDERS_OAUTH2_GRANT_URL]


The client will be redirected back to the location of [REDIRECT_PATH], with the contents of the server response as well as whatever was defined in the [STATE] in the hash. e.g...


	[REDIRECT_PATH]#state=[STATE]&access_token=ABCD1233234&expires=123123123



### Authentication OAuth 1.0

OAuth 1.0 has a number of steps so forgive the verbosity here. An app is required to make an initial request to the //auth-server, which in-turn initiates the authentication flow.


	https://auth-server.herokuapp.com/proxy
	?redirect_uri=[REDIRECT_PATH]
	&client_id=[APP_KEY]
	&request_url=[OAUTH_REQUEST_TOKEN_URL]
	&auth_url=[OAUTH_AUTHORIZATION_URL]
	&token_url=[OAUTH_TOKEN_URL]
	&state=[STATE]


//auth-server signs the client request and redirects the user to the providers login page defined by [OAUTH_AUTHRIZATION_URL].

Once the user has signed in they are redirected back to a page on the developers app defined by [REDIRECT_PATH]. 

The provider should have included an oauth_callback parameter which was defined by //auth-server, this includes part of the path where the token can be returned for an access token. The total path response shall look something like this.


	[REDIRECT_PATH]
	?state=[STATE]
	&proxy_url=https://auth-server.herokuapp.com/proxy
	&client_id=[APP_KEY]
	&token_url=[OAUTH_TOKEN_URL]
	&oauth_token=abc12465


The page you defined locally as the [REDIRECT_PATH], must then construct a call to //auth-server to exchange the unauthorized oauth_token for an access token. This would look like this...


	https://auth-server.herokuapp.com/proxy
	?oauth_token=abc12465
	&redirect_uri=[REDIRECT_PATH]
	&client_id=[APP_KEY]
	&state=[STATE]
	&token_url=[OAUTH_TOKEN_URL]


Finally the //auth-server returns the access_token to your redirect path and its the responsibility of your script to store this in the client in order to make subsequent API calls.

	[REDIRECT_PATH]#state=[STATE]&access_token=ABCD1233234&expires=123123123


This access token still needs to be signed via //auth-server every time an API request is made - read on...


### OAuth 1.0 signing API Requests

The OAuth 1.0 API requires that each request is uniquely signed with the application secret. This restriction was removed in OAuth 2.0.
To sign a request to [API_PATH], use the [access_token] returned in OAuth 1.0 above and send to the auth-server 


	https://auth-server.herokuapp.com/proxy?access_code=[ACCESS_CODE]&path=[API_PATH]

The response redirects the requests to the [API_PATH] and signs it for you. e.g.

	[API_PATH]?oauth_token=asdf&oauth_consumer_key=asdf&...&oauth_signature=1234


Yes its a nightmare which fortunatly OAuth2 has addressed


