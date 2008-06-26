

// turn off console.log...comment this out in debug mode:
if (!console || !console.log){
	var console = {
		log : function() {return false} 
	}
}

var SpiffyBird = (function() {

	/* helper methods */

	function isPublicUrl(url){
		return (url && /^http/.test(url) && url) || null;
	};

	function JSPFtracksfromMediaList(list){

		var tracks = []

		list.enumerateAllItems({
			onEnumerationBegin: function(list) {},
			onEnumeratedItem: function(list, item) {
				var track = {}
				var apiKeys = {
					title:"http://songbirdnest.com/data/1.0#trackName",
					creator:"http://songbirdnest.com/data/1.0#artistName",
					album:"http://songbirdnest.com/data/1.0#albumName",
					trackNum:"http://songbirdnest.com/data/1.0#trackNumber",
					duration:"http://songbirdnest.com/data/1.0#duration",
					image:"http://songbirdnest.com/data/1.0#albumArtURL"
				}

				for (key in apiKeys) {
					var val = apiKeys[key];
					try {
						track[key] = item.getProperty(val);						
					} catch(e) {
						console.log("error with "+val);
					}
				}
				
				track.location = [];				
				var ourl = item.getProperty('http://songbirdnest.com/data/1.0#originURL')
				if (ourl && ourl != "__BLOCKED__"){
					track.location.push(item.getProperty('http://songbirdnest.com/data/1.0#originURL'));
				};

				track.identifier = item.guid;

				tracks.push(track);
			},
			onEnumerationEnd: function(list) {}
		});
		return tracks;	
	};


	function buildJSPFfromMediaList(mediaList){
		var jspf = {
			"playlist" : {
				"title" : mediaList.name,
				"track" : JSPFtracksfromMediaList(mediaList)
			}
		}	
		return jspf;
	};
	
	function populateMediaListFromJSPF(jspf, mediaList, library, urlResolver){
		mediaList.clear();
		mediaList.name = jspf.playlist.title;

		/* use mediaList.setProperty() to serialize playlist level metadata
		this will not be available to the user
		*/

		// addtional JSPF properties with no obvious equivalent:
    // 
		// annotation
		// info
		// link
		// meta
		// extention
    // 
		// maybe we will syndicate them into namespaced properties?
		
		for (var i = 0, l = jspf.playlist.track.length; i < l; i++) {
			var track = jspf.playlist.track[i];
			
			try {
				
				if (track.identifier){
					console.log("tid: "+track.identifier);
					var mediaItem = library.getItemByGuid(track.identifier);
				}
				if (!mediaItem){ // didn't find it in the library or didn't have an identifier to search for
					console.log("making new media item");
					// fall back to fake grabb.it mp3 with lack of actual mp3:
					console.log("Resolver result: "+urlResolver(track.title, track.creator));
					var mediaItem = library.createMediaItem(track.location[0] || urlResolver(track.title, track.creator));
				}
				
				mediaItem.setProperty( "http://songbirdnest.com/data/1.0#trackName", 	 ( track.title || null )	);
				mediaItem.setProperty( "http://songbirdnest.com/data/1.0#artistName",  ( track.creator || null ) );
				mediaItem.setProperty( "http://songbirdnest.com/data/1.0#albumArtURL", ( track.image || null )	);
				mediaItem.setProperty( "http://songbirdnest.com/data/1.0#albumName",   ( track.album || null	) );
				mediaItem.setProperty( "http://songbirdnest.com/data/1.0#trackNumber", ( track.trackNum || null ) );
				mediaItem.setProperty( "http://songbirdnest.com/data/1.0#duration", 	 ( track.duration || 0 ) );	

				mediaList.add(mediaItem);

			} catch(e) {
				console.log("Failed creation of mediaitem with url:"+track.location[0]+" " + e);
			}
		}
		
		return mediaList
	}
	
	function buildMediaListFromJSPF(jspf, library, userResolver){
		var mediaList = library.createSimpleMediaList(jspf.playlist["title"]);
		mediaList.clear(); // syncing

		return populateMediaListFromJSPF(jspf, mediaList, library, (userResolver||defaultResolver));
	};

	function defaultResolver(title, creator){
		return 'http://grabb.it/music/'+encodeURIComponent(creator)+'/'+encodeURIComponent(title)+'.mp3'
	};

	return {
		
		/* public methods */
		
		utils : {
			JSPFfrom : function(mediaList){
				return buildJSPFfromMediaList(mediaList);
			},
			JSPFinto : function(jspf, mediaList, library, userResolver){
				return populateMediaListFromJSPF(jspf, mediaList, library, (userResolver||defaultResolver)); 
			}
		},
		
		webPlaylist : {	
			show : function(jspf){
				var library = songbird.siteLibrary; // ignoring scope for now because of conflict with mainLibrary access
				songbird.webPlaylist.mediaList = buildMediaListFromJSPF(jspf, library);
			},
			get : function(){
				var library = songbird.siteLibrary
				return buildJSPFfromMediaList(songbird.webPlaylist.mediaList);
			}
		},
		localPlaylist : {	
			save : function(jspf, userResolver) {
				var library = songbird.mainLibrary;
								
				buildMediaListFromJSPF(jspf, library, (userResolver||defaultResolver)); // since we use the main library this actually installs the playlist
			},
			get : function(query) {
				var results = []
				
				var mediaListResults = SongbirdLibrary.find(query);
				for (var i = 0, l = mediaListResults.length; i < l; i++) {
					results.push(buildJSPFfromMediaList(mediaListResults[i]));
				}
				
				return results;
			}
		}
	}
})();

var SongbirdLibrary = (function(){
	return {
		allPlaylists : function(){
			var mediaLists = songbird.mainLibrary.getPlaylists();
			var results = [];
			while(mediaLists.hasMoreElements()) {
				var mediaList = mediaLists.getNext();
				results.push(mediaList);
			}
			return results;
		},

		find : function(query){
			var library = songbird.mainLibrary;
			var mediaLists = library.getPlaylists();

			var results = [];

			while(mediaLists.hasMoreElements()) {
				var this_list_matches = true;
				var mediaList = mediaLists.getNext();

				for (key in query) {
					var match = query[key];
					if (mediaList[key] != match) {
						this_list_matches = false;
					}
				}
				if (this_list_matches) {
					results.push(mediaList);
				}
			}
			return results;
		}
	};
})();	