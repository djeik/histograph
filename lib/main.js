var tabs = require('sdk/tabs');
//var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var sidebar = require("sdk/ui/sidebar");
let { getFavicon } = require("sdk/places/favicon");

var visitsToTab = [];
var SBworker = null;


sidebar.Sidebar({
	id: 'my-sidebar',
	title: 'HIZTORY',
	url: "./sidebar.html",
	onShow: function () {
		console.log("showing!!");
	},
	onAttach: function (worker) {
		SBworker = worker;
		worker.port.on("ready", function() {
			for (var i=0; i<tabs.length; i++) {
				visitsToTab.push(tabs[i]);
				//console.log(visitsToTab.length-1);
				// get favicon first because that's asynchonous as well...
				getFavicon(tabs[i]).then(function (url) {
					console.log("favicon!! ["+url+"]");
					worker.port.emit("graph-add", {
						name: tabs[i].title, 
						which: (visitsToTab.length-1),
						favicon: url
					});
				});
			}
			worker.port.emit("graph-refresh");
		});
		
		worker.port.on("switch-tab", function (which) {
			var tab = visitsToTab[which];
			tab.activate();
			console.log("switching to tab "+which+": "+tab.title);
		});
	},
	onDetach: function (worker) {
		SBworker = null;
	}
});



// Add page tracker
pageMod.PageMod({
	include: "*",
	contentScriptFile: "./tracker.js",
	onAttach: function (worker) {
		// Add visit to table
		//myTabs.push(worker);
		worker.port.on("visit", function (link){
			if (SBworker == null) // sidebar closed
				console.log("Sidebar closed");
			else {
				visitsToTab.push(worker.tab);
				getFavicon(worker.tab).then(function (url) {
					console.log("favicon!! ["+url+"]");
					SBworker.port.emit("graph-add", {
						name: worker.tab.title,
						which: (visitsToTab.length-1),
						favicon: url,
						link: link
					});
					SBworker.port.emit("graph-refresh");
				});
			}
			console.log("visit "+(visitsToTab.length-1)+" in tab "+worker.tab.index+": "+link.referrer+" -> "+link.url);
		});
	}
});

// Listen for tab openings.
/*tabs.on('open', function (tab) {
	var worker = tab.attach({
		contentScriptFile: "./tracker.js",
		onAttach: function (worker) {
			worker.port.on("visit", function (document){
				console.log("tab "+tab.index+": "+document.referrer+" -> "+document.URL);
			});
		}
		//myOpenTabs.push(tab);
	});
});*/

// Listen for tab closings.
tabs.on('close', function (tab) {
	//for(var i = myTabs.length - 1; i >= 0; i--) {
	//	if(myTabs[i]
});



// Listen for tab content loads.
tabs.on('ready', function(tab) {
	//console.log('tab is loaded', tab.title, tab.url);
});
