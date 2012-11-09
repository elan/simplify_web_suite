//Only injecting this script into the top window (no frames)

if (window.top == window)
{
	//Setting up current player and listeners on page load
	window.addEventListener("load", function()
	{
		//Creating Simplify object 
		var simplify = new Simplify();

		//Extracting information about track from Vkontakte player
		var get_current_track = function()
		{
			if (typeof audioPlayer == "undefined") return null;
			return {"author" : audioPlayer.lastSong["5"], 
					  "title"  : audioPlayer.lastSong["6"],
					  "album"  : "",
					  "length" : parseInt(audioPlayer.lastSong["3"]),
					  "uri"	  : "",
					  "id"	  : audioPlayer.lastSong["0"]};
		}

		//Setting up Simplify player description 
		//This should be always done before any other actions
		simplify.setCurrentPlayer("Vkontakte Music Player");
		
		//Setting initial volume and track position
		if (typeof audioPlayer == "undefined" && audioPlayer.player != null)
		{
			simplify.setVolume(audioPlayer.player.getVolume()*100);
			simplify.setTrackPosition(parseInt(audioPlayer.player.music.currentTime));
		}

		//Hooking track switch inside Vkontakte
		var oldOperate = audioPlayer.operate;
		window.operateFirstCall = true, window.operateFirstCallChecker = null, window.lastTrackID = null;
		audioPlayer.operate = function()
		{
			var result = oldOperate.apply(this, arguments);
			
			//Function to notify Simplify about changed track
			var notify_simplify = function()
			{
				//Extracting current track from audio player
				var current_track = get_current_track();

				//If it exists and doesn't equal to the previous one, updating Simplify
				if (current_track != null && current_track["id"] != window.lastTrackID)
				{
					//Sending various notifications
					//No artwork can be extracted from Vkontakte, Simplify will find it by itself
					simplify.setVolume(audioPlayer.player.getVolume()*100);
					simplify.setCurrentTrack(current_track);
					simplify.setCurrentArtwork(null);

					//Storing last track identifier
					window.lastTrackID = current_track["id"];
				}
			}

			//Not a first call? Simply notifying
			if (window.operateFirstCall == false)
			{
				notify_simplify();
			}
			else
			{
				//First time player creation.
				operateFirstCallChecker = setInterval(function() 
				{  
					if(audioPlayer.lastSong != null)
					{
						clearInterval(operateFirstCallChecker);
						notify_simplify();
					}
				}, 500);

				window.operateFirstCall = false;
			}

			return result;
		}

		//Handling basic events from Simplify server
		simplify.bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function()
		{

			if (typeof audioPlayer == "undefined") return;
			audioPlayer.prevTrack();

		}).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function()
		{

			if (typeof audioPlayer == "undefined") return;
			audioPlayer.nextTrack();
		
		}).bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data)
		{

			if (data["state"] == null || typeof audioPlayer == "undefined") return;	
			if (data["state"] == Simplify.PLAYBACK_STATE_PLAYING) audioPlayer.playTrack();
			if (data["state"] == Simplify.PLAYBACK_STATE_PAUSED) audioPlayer.pauseTrack();
		
		}).bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data)
		{

			if (data["amount"] == null || typeof audioPlayer == "undefined" || typeof audioPlayer.player == "undefined") return;
			audioPlayer.player.setVolume(data["amount"]/100);
			setStyle(audioPlayer.controls.ac.volume, {"width" : (data["amount"]) + "%"});

		}).bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data)
		{

			if (data["amount"] == null || typeof audioPlayer == "undefined" || typeof audioPlayer.player == "undefined") return;
			audioPlayer.player.music.currentTime = parseFloat(data["amount"]);

		});

		//Subscribing to unload event to clear our player
		window.addEventListener("unload", function()
		{
			simplify.closeCurrentPlayer();
		}); 
	});

}