 Spiffy Bird: JSPF to Songbird Bridge
 Version: 0.6 6/25/2008 
 by Greg Borenstein

///////////////////////////////////////////////////////////////////////////////
 
 Spiffy Bird provides a bridge between the Songbird music player 
 webpage API and the JSON Shareable Playlist Format. It allows javascript 
 applications that work with JSPF to easily interoperate with Songbird.
 Further, with the help of jchris's xspf_parser:

 http://jchris.mfdz.com/static/jspf_parser/xspf_parser_runner.html

 Spiffy Bird makes it a snap to go from XSPF playlists available at public 
 URLs all the way into local Songbird playlists (check out the example 
 at the bottom of this document).

 JSPF is the javascript version of XSPF, the XML Sharable Playlist Format.
 See the JSPF draft spec here: http://wiki.xiph.org/index.php/JSPF_Draft
 and learn more about XSPF here: http://www.xspf.org/

 For an introduction to the Songbird Javascript API read this blog post:
 http://www.urbanhonking.com/ideasfordozens/2008/06/songbird-media-player-integrat.html
 
 Read the full Songbird JS API docs here: 
 http://developer.songbirdnest.com/webpage-api/docs/files/sbIRemotePlayer-idl.html

///////////////////////////////////////////////////////////////////////////////

 Spiffy Bird Public API Documentation:

 SpiffyBird.webPlaylist.show(jspf)
  displays the given playlist in the Web Playlist at the bottom of the main songbird window

 SpiffyBird.webPlaylist.get()
	return a JSPF representation of the current state of the Web Playlist

 SpiffyBird.localPlaylist.save(jspf)
	saves the given JSPF into	a local playlist within songbird

 SpiffyBird.localPlaylist.get(query)
  returns JSPF representations of all playlists that match the given query;
	queries consist of a hash with a playlist attribute and its expected value, e.g.:
	SpiffyBird.localPlaylist.get({name : "My Playlist"})

 SongbirdLibrary.allPlaylists()
	returns an array containing a mediaList representing each local playlist within Songbird

 SongbirdLibrary.find(query)
	returns an array of mediaLists representing each local playlist within 
	Songbird that matches the given query; queries consist of a hash 
	with a playlist attribute and its expected value, e.g.:
	SpiffyBird.localPlaylist.get({name : "My Playlist"})

 SpiffyBird.utils.JSPFfrom(mediaList)
 	returns a JSPF representation of the mediaList

 SpiffyBird.utils.JSPFinto(jspf, mediaList, library)
 	populates the mediaList from the given JSPF.
 	will use existing mediaItems on the given library if available,
	otherwise it will add them.

 XSPF usage example:

 get an XSPF document and render it into a local playlist using SpiffyBird, 
 jchris's XSPF to JSPF Parser, and jquery's $.ajax:

 $.ajax({
   url: "playlist.xspf",
   success: function(xspf_string){
     var xmlDOM = XSPF.XMLfromString(xspf_string);
     var jspf = XSPF.toJSPF(xmlDOM);
     SpiffyBird.localPlaylist.save(jspf);
     $("h1").html("Saved playlist: "+jspf["playlist"]["title"]);
   }
 });

 KNOWN ISSUES:
 - should serialize the rest of the playlist-level metadata into the mediaList properties
 - right now we fallback to grabb.it mp3 urls when creating mediaItems since we need something...
 - we fail to use siteLibrary scope options when allowed