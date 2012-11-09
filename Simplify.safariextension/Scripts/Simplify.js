//Simplify Web client helper implementation.
//Created by Semibold Mammoth in 2012.

//Simplify constructor takes no arguments
var Simplify = function(player_name)
{
	/* Internal websockets routines */

	//Storing our webscoket reference
	var connection = null, connection_polling_timer = null, callbacks = {}, offline_cache = {};

	//Internal message name key
	var internal_message_key = "__simplify_message_name__";

	//This methods looks for running instance of Simplify server and connects to it in case
	var internal_connect = function()
	{
		connection = new WebSocket("ws://localhost:25984/");

		//Stopping polling when connected
		connection.onopen = function()
		{
			clearInterval(connection_polling_timer);
			internal_flush_offline_cache();
		}

		//Polling again on error
		connection.onerror = function()
		{
			clearInterval(connection_polling_timer);
			connection_polling_timer = setInterval(internal_connect, 6000);
		}

		//Receiving messages
		connection.onmessage = function(message)
		{
			internal_deliver_message(message.data);
		}
	}	

	//Sending message to the server with JSON
	var internal_send = function(name, data)
	{
		//Only sending data if connection has been opened earlier
		//Caching everything important if we are not connected
		if (connection == null || connection.readyState != WebSocket.OPEN) 
		{
			offline_cache[name.toString()] = data;
			return;
		}

		//Should we send only message title or message title with some body?
		if (data == null)
		{
			data = {internal_message_key : name};
		}
		else
		{
			data[internal_message_key] = name;
		}

		//Sending everything as a JSON string
 		connection.send(JSON.stringify(data));
	}

	//Sending offline cache when connected for the first time
	internal_flush_offline_cache = function()
	{
		//Firstly we should set current player
		//This have to be sent before any other commands
		if (offline_cache[Simplify.MESSAGE_PLAYER_START.toString()] != null)
		{
			internal_send(Simplify.MESSAGE_PLAYER_START, offline_cache[Simplify.MESSAGE_PLAYER_START.toString()]);
			delete offline_cache[Simplify.MESSAGE_PLAYER_START.toString()];
		}

		//Sending stored data
		for (var key in offline_cache)
		{
			if (obj.hasOwnProperty(key))
			{
				internal_send(parseInt(key), obj[key]);
				delete obj[key];
			}
		}

		//Clearing cache
		offline_cache = {};
	}

	//Delivering message to its recipients
	internal_deliver_message = function(raw_message)
	{
		try
		{
			//Parsing JSON message
			var message = JSON.parse(raw_message);

			//Extracting message title
			var message_title = message[internal_message_key];

			//It should always be presented
			if (message_title == null) return;

			//Removing it from the message body
			delete message[internal_message_key];

			//Extracting our callbacks
			var callbacks_list = callbacks[message_title];

			//They should be presented in order to process
			if (typeof callbacks_list == "undefined") return;

			//Despatching our message to every callback
			for (var i = 0; i < callbacks_list.length; i++)
			{
				callbacks_list[i](message);
			}
		}
		catch(error)
		{

		}
	}

	//Binding callback to some event
	var internal_bind_event = function(name, callback)
	{
		callbacks[name] = callbacks[name] || [];
		callbacks[name].push(callback);
	}


	/* Initial setup */

	//Connection polling 
	//This will check if Simplify is running 
	//If it founds Simplify, it connects to it and shuts down polling
	connection_polling_timer = setInterval(internal_connect, 6000), internal_connect();

	/* Public enumerations */

	//Playback state enumeration
	Simplify.PLAYBACK_STATE_PLAYING = 0;
	Simplify.PLAYBACK_STATE_PAUSED  = 1;
	Simplify.PLAYBACK_STATE_STOPPED = 3;

	//Outgoing events enumeration
	Simplify.MESSAGE_PLAYER_START			  	= 1;
	Simplify.MESSAGE_PLAYED_END				  	= 2;
	Simplify.MESSAGE_CHANGE_PLAYBACK_STATE 	= 3;
	Simplify.MESSAGE_CHANGE_TRACK      		= 4;
	Simplify.MESSAGE_CHANGE_ARTWORK 			= 5;
	Simplify.MESSAGE_CHANGE_TRACK_POSITION	= 6;
	Simplify.MESSAGE_CHANGE_VOLUME				= 7;

	//Incoming events enumeration
	Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK = 100;
	Simplify.MESSAGE_DID_SELECT_NEXT_TRACK 		= 101;
	Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE	= 102;
	Simplify.MESSAGE_DID_CHANGE_VOLUME			= 103;
	Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION	= 104;

	/* External API: server properties */

	//Notifies about the current player title
	this.setCurrentPlayer = function(name)
	{
		internal_send(Simplify.MESSAGE_PLAYER_START, {"name" : name, "uri" : location.href});
	}

	//Current player was closed 
	//Use this method to tell Simplify that current player was stopped (for example, when tab with player closed)
	this.closeCurrentPlayer = function()
	{
		internal_send(Simplify.MESSAGE_PLAYED_END);
	}

	//Notifies Simplify about changed playback state
	//You must use one of the states defined above or their numeric equivalents
	this.setNewPlaybackState = function(state)
	{
		internal_send(Simplify.MESSAGE_CHANGE_PLAYBACK_STATE, {"state" : state});
	}

	//Playback was paused
	this.setPlaybackPaused = function()
	{
		this.setNewPlaybackState(Simplify.PLAYBACK_STATE_PAUSED);
	}

	//Playback was resumed, now playing
	this.setPlaybackPlaying = function()
	{
		this.setNewPlaybackState(Simplify.PLAYBACK_STATE_PLAYING);
	}

	//Playback was stopped, nothing to do, only burn in hell
	this.setPlaybackStopped = function()
	{
		this.setNewPlaybackState(Simplify.PLAYBACK_STATE_STOPPED);
	}

	//Changes track to the specified one with specified attributes
	//You should provide 'author', 'album', 'title', 'length' and 'uri' of track
	//All attributes except uri are mandatory
	//The track length must be provided in seconds
	this.setCurrentTrack = function(track)
	{
		internal_send(Simplify.MESSAGE_CHANGE_TRACK, track);
	}

	//Sets artwork link 
	//The link should be in a proper URL format
	//You can supply nil and Simplify will try to find artwork on its own 
	this.setCurrentArtwork = function(uri)
	{
		if (uri == null) uri = "urn:lastfm";
		internal_send(Simplify.MESSAGE_CHANGE_ARTWORK, {"uri" : uri});
	}

	//Sets current track position
	//The 'position' value must be provided in seconds
	this.setTrackPosition = function(position)
	{
		internal_send(Simplify.MESSAGE_CHANGE_TRACK_POSITION, {"amount" : position});
	}

	//Sets current volume
	//The 'amount' value must be an integer between 0 and 100
	this.setVolume = function(amount)
	{
		internal_send(Simplify.MESSAGE_CHANGE_VOLUME, {"amount" : amount})
	}

	/* External API: client events that can be received from Simplify */
	/*
		List of available events without supplied arguments:
		
		MESSAGE_DID_SELECT_PREVIOUS_TRACK 	- track changed to previous one
		MESSAGE_DID_SELECT_NEXT_TRACK			- track changed to next one
		MESSAGE_DID_CHANGE_PLAYBACK_STATE 	- playback state changed (use 'state' key to get new state)

		List of available events with arguments:

		MESSAGE_DID_CHANGE_VOLUME				- volume changed (use 'amount' key to retrieve new volume)
		MESSAGE_DID_CHANGE_TRACK_POSITION	- position changed (use 'amount' key to retrieve new position)

	*/

	//Subscribing to various events that can be received
	//If you want to do everything by yourself, use this chainable method
	//If you do not want, we provide a set of handful methods
	this.bind = function(name, callback)
	{
		internal_bind_event(name, callback);
		return this;
	}

}
