-- SQL Schema

-- CREATE TABLE apps (
-- 	reference VARCHAR,
-- 	domain VARCHAR,
-- 	client_id VARCHAR(2000) NOT NULL PRIMARY KEY,
-- 	client_secret VARCHAR(2000) NOT NULL,SLEE
-- 	admin_id VARCHAR(2000) NOT NULL,
-- 	guid VARCHAR UNIQUE DEFAULT MD5(CAST(RANDOM() AS VARCHAR))
-- );


CREATE TABLE client_apps(
	client_id VARCHAR NOT NULL PRIMARY KEY DEFAULT MD5(CAST(RANDOM() AS VARCHAR)),
	client_secret VARCHAR NOT NULL DEFAULT MD5(CAST(RANDOM() AS VARCHAR)),
	redirect_uri VARCHAR NOT NULL,
	name VARCHAR,
	user_id INTEGER NOT NULL
)

INSERT INTO client_apps (client_id, client_secret, redirect_uri, name, user_id) VALUES ('9fa6205934cd495b4a3a50795cf77990', '7e1e19ecfbabc795438b93dd7843fcff', 'auth-server.herokuapp.com, local.knarly.com', 'Auth-Server Login', 0) RETURNING *

CREATE TABLE users (
	id SERIAL NOT NULL PRIMARY KEY,
	created TIMESTAMP DEFAULT NOW(),

	-- Basic
	name VARCHAR,
	picture VARCHAR,
	email VARCHAR,

	-- Facebook
	facebook_id VARCHAR UNIQUE,
	facebook_profile VARCHAR,

	-- Github
	github_id VARCHAR UNIQUE,
	github_profile VARCHAR,

	-- Google
	google_id VARCHAR UNIQUE,
	google_profile VARCHAR,

	-- Twitter
	twitter_id VARCHAR UNIQUE,
	twitter_profile VARCHAR,

	-- Windows
	windows_id VARCHAR UNIQUE,
	windows_profile VARCHAR,

	-- Yahoo
	yahoo_id VARCHAR UNIQUE,
	yahoo_profile VARCHAR,

	-- Approved Apps
	approved_apps VARCHAR DEFAULT ''
);


-- ALTER TABLE apps

ALTER TABLE apps ALTER COLUMN admin_id DROP NOT NULL;
ALTER TABLE apps ADD COLUMN user_id INTEGER;
ALTER TABLE apps ADD COLUMN id SERIAL;
ALTER TABLE apps ADD COLUMN last_accessed TIMESTAMP;
ALTER TABLE apps ADD COLUMN count_accessed INTEGER DEFAULT 0;










-- ALTER TABLE apps
-- ADD COLUMN facebook_id VARCHAR,
-- ADD COLUMN google_id VARCHAR,
-- ADD COLUMN windows_id VARCHAR,
-- ADD COLUMN yahoo_id VARCHAR
-- ;

-- ALTER TABLE apps ADD COLUMN created TIMESTAMP DEFAULT NOW();
-- ALTER TABLE users ADD COLUMN created TIMESTAMP DEFAULT NOW();

-- UPDATE apps SET
-- 	facebook_id = REGEXP_REPLACE(substring(admin_id from '[^@\s,]+\@facebook'), '\@(google|facebook|windows|yahoo)', ''),
-- 	google_id = REGEXP_REPLACE(substring(admin_id from '[^@\s,]+\@google'), '\@(google|facebook|windows|yahoo)', ''),
-- 	windows_id = REGEXP_REPLACE(substring(admin_id from '[^@\s,]+\@windows'), '\@(google|facebook|windows|yahoo)', ''),
-- 	yahoo_id = REGEXP_REPLACE(substring(admin_id from '[^@\s,]+\@yahoo'), '\@(google|facebook|windows|yahoo)', '');

-- SELECT facebook_id, google_id, windows_id, yahoo_id FROM apps;

-- SELECT admin_id FROM apps GROUP BY facebook_id, google_id, windows_id, yahoo_id;
