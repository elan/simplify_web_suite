//All supported sites are listed here
var scripts = {
	"vk.com" : "core/players/vk.js", 
	"deezer.com" : "core/players/deezer.js",
	"pandora.com" : "core/players/pandora.js"
};

//Checking if current site is listed
if (scripts[location.host.replace("www.", "")] != null)
{
	//Core API injection
	var core = document.createElement("script");
	core.src = chrome.extension.getURL("core/simplify.js");
	(document.head || document.documentElement).appendChild(core);

	//Particular script injection
	var script = document.createElement("script");
	script.src = chrome.extension.getURL(scripts[location.host.replace("www.", "")]);
	(document.head || document.documentElement).appendChild(script);
}