(function () {
    var music = angular.module("music", []);

    music.controller('MusicController', ['$scope', '$http', function($scope, $http){
    	////////////////////////////////////////////////////////////////////////////////////////
    	// The music explorer part 
    	////////////////////////////////////////////////////////////////////////////////////////
    	var server = "http://localhost:8000/";
    	var allArtists;
    	
    	// artists
    	$http.get(server+"artist").then(function (response) {
    		allArtists = response.data.artists.map(function (artist) {
    			var obj = {};
    			obj.id = artist.id;
    			obj.name = artist.name;
    			obj.pinyinName = artist.pinyinName;
    			obj.selected = false;
    			return obj;
    		});

    		$scope.artists = allArtists;
    	});
    	

    	$scope.$watch("artistFilerText", function (text) {
    		if ( typeof(text) === "undefined" || text === "") { 
    			$scope.artists = allArtists; 
    		} else {
    			$scope.artists = allArtists.filter(function (artist) {
    				return artist.pinyinName.indexOf(text.toLowerCase()) > -1 || artist.name.indexOf(text.toLowerCase()) > -1;
    			});
    		}
    	});

    	// $scope.artistSelect = function (artist, $event) {
    	// 	if ($event.ctrlKey) {
    	// 		if (artist.selected) {
    	// 			artist.selected = false;
    	// 		} else{
    	// 			artist.selected = true;
    	// 		};
    	// 	} else if($event.shiftKey){
    	// 		var start=0;
    	// 		var end=0;
    	// 		var startFound=false;
    	// 		artist.selected = true;
    	// 		$scope.artists.forEach(function (artist, index) {
    	// 			if (artist.selected) {
    	// 				if(!startFound) {
    	// 					startFound = true;
    	// 					start = index;
    	// 				}
    	// 				end = index;
    	// 			}
    	// 		});
    	// 		$scope.artists.forEach(function (artist, index) {
    	// 			if (index >= start && index <= end) {
    	// 				artist.selected = true;
    	// 			} else{
    	// 				artist.selected = false;
    	// 			}
    	// 		});

    	// 	} else {
    	// 		$scope.artists.forEach(function (artist) {
    	// 			artist.selected = false;
    	// 		});
    	// 		artist.selected = true;
    	// 	}

    	// 	updateAlbumList();
    	// };

    	var select = function(name) {
    		return function(obj, $event) {
    			if ($event.ctrlKey) {
    				if (obj.selected) {
    					obj.selected = false;
    				} else{
    					obj.selected = true;
    				};
    			} else if($event.shiftKey){
    				var start=0;
    				var end=0;
    				var startFound=false;
    				obj.selected = true;
    				$scope[name+"s"].forEach(function (obj, index) {
    					if (obj.selected) {
    						if(!startFound) {
    							startFound = true;
    							start = index;
    						}
    						end = index;
    					}
    				});
    				$scope[name+"s"].forEach(function (obj, index) {
    					if (index >= start && index <= end) {
    						obj.selected = true;
    					} else{
    						obj.selected = false;
    					}
    				});

    			} else {
    				$scope[name+"s"].forEach(function (obj) {
    					obj.selected = false;
    				});
    				obj.selected = true;
    			}

    			if(name === "artist") {
    				updateAlbumList();
    			} else if(name === "album"){
    				updateSongList();
    			}
    			
    		}
    	};

    	$scope.artistSelect = select("artist");
    	
    	

    	
    	

    	// albums
    	var allAlbums;
    	var updateAlbumList = function () {
    		// all albums of selected artist(s)
    		allAlbums = [];

    		$scope.artists.forEach(function(artist, index){
    			if (artist.selected) {
    				$http.get(server+"artist/"+artist.id).then(function (response) {
    					response.data.albums.forEach(function(album, index){
    						allAlbums.push({
    							id: album.id,
	    						name: album.name,
	    						pinyinName: album.pinyinName,
	    						selected: false
	    					});
    					});
    					$scope.albums = allAlbums;
    				});
    			}
    		});
    	};
    	
    	$scope.$watch("albumFilerText", function (text) {
    		if ( typeof(text) === "undefined" || text === "") { 
    			$scope.albums = allAlbums; 
    		} else {
    			$scope.albums = allAlbums.filter(function (album) {
    				return album.pinyinName.indexOf(text.toLowerCase()) > -1 || album.name.indexOf(text.toLowerCase()) > -1;
    			});
    		}
    	});

    	$scope.albumSelect = select("album");


    	// songs
    	var allSongs;
    	var updateSongList = function () {
    		// all songs of selected album(s)
    		allSongs = [];
    		$scope.albums.forEach(function(album, index){
    			if (album.selected) {
    				$http.get(server+"album/"+album.id).then(function (response) {
    					response.data.songs.forEach(function(song, index){
    						allSongs.push({
    							id: song.id,
	    						name: song.name,
	    						artistName: song.artistName,
	    						albumName: song.albumName,
	    						pinyinName: song.pinyinName,
	    						url: song.url,
	    						selected: false
	    					});
    					});
    					$scope.songs = allSongs;
    				});
    			};
    		});
    	};
    	
    	$scope.$watch("songFilerText", function (text) {
    		if ( typeof(text) === "undefined" || text === "") { 
    			$scope.songs = allSongs; 
    		} else {
    			$scope.songs = allSongs.filter(function (song) {
    				return song.pinyinName.indexOf(text.toLowerCase()) > -1 || song.name.indexOf(text.toLowerCase()) > -1;
    			});
    		}
    	});

    	$scope.songSelect = select("song");


    	////////////////////////////////////////////////////////////////////////////////////////
    	// The audio player part
    	////////////////////////////////////////////////////////////////////////////////////////
    	var audio = new Audio();
		
		$scope.playlistSongs = [];
		$scope.isPlaying = false;
		$scope.currentPlaying = -1;

		// We don't wanna share the playlist songs with the songs in the explorer, it would create troubles
		var copySelectedSongs = function(){
			var songs = [];
			$scope.songs.forEach(function(song, index){
				if(song.selected){
					songs.push({
						id: song.id,
	    				name: song.name,
	    				artistName: song.artistName,
	    				albumName: song.albumName,
	    				pinyinName: song.pinyinName,
	    				url: song.url,
	    				selected: false
					});
				}
			});
			return songs;
		};

		$scope.playPlaylist = function(index=0){
			if ($scope.playlistSongs.length > 0) {
				var song = $scope.playlistSongs[index];
				audio.src = song.url;
				audio.play();
				$scope.isPlaying = true;
				$scope.currentPlaying = index;
			};
		};

		$scope.playNext = function(){
			if ( $scope.currentPlaying < $scope.playlistSongs.length - 1 ) {
				$scope.currentPlaying += 1;
				$scope.playPlaylist($scope.currentPlaying);
			}
		};

		$scope.playPrevious = function(){
			if ( $scope.currentPlaying > 0 ) {
				$scope.currentPlaying -= 1;
				$scope.playPlaylist($scope.currentPlaying);
			}
		};

		var whenended = function(){
			$scope.isPlaying = false;
			$scope.playNext();
			$scope.$digest();
		};

		audio.addEventListener('ended', whenended);

		$scope.dblplay = function(song){
			$scope.playlistSongs = [song];
			$scope.playPlaylist();
		};

		$scope.playOrPause = function () {
			if ($scope.isPlaying) {
				audio.pause();
				$scope.isPlaying = false;
			} else if(audio.paused && audio.currentSrc.length > 0){
				audio.play();
				$scope.isPlaying = true;
			} else{
				if ( $scope.playlistSongs.length === 0 ) {
					$scope.playlistSongs = copySelectedSongs();
				}
				$scope.playPlaylist();
			};
		};

		$scope.stop = function () {
			audio.src = "";
			$scope.isPlaying = false;
		};

		$scope.addToPlaylist = function(){
			var songs = copySelectedSongs();
			$scope.playlistSongs = $scope.playlistSongs.concat(songs);
		};

		$scope.removeFromPlaylist = function() {
			$scope.playlistSongs = $scope.playlistSongs.filter(function(song){
				return !song.selected;
			});
		};

		$scope.playlistSongSelect = select("playlistSong");

    }]);
}())
