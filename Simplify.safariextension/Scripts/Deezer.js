//Only injecting this script into the top window (no frames)

if (window.top == window)
{
	//Setting up current player and listeners on page load
	window.addEventListener("load", function()
	{
		//Creating Simplify object 
		var simplify = new Simplify();

		//Subscribing to unload event to clear our player
		window.addEventListener("unload", function()
		{
			simplify.closeCurrentPlayer();
		}); 	
	});
}