(function () {
    var music = angular.module("music", []);


    music.controller('MusicController', ['$scope', '$http', function($scope, $http){
    	////////////////////////////////////////////////////////////////////////////////////////
    	// The music explorer part 
    	////////////////////////////////////////////////////////////////////////////////////////
    	var allArtists;
    	
    	// artists
    	$http.get("/artist/").then(function (response) {
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
    				$http.get("/artist/"+artist.id+"/").then(function (response) {
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
    				$http.get("/album/"+album.id+"/").then(function (response) {
    					response.data.songs.forEach(function(song, index){
    						allSongs.push({
    							id: song.id,
	    						name: song.name,
	    						artistName: song.artistName,
	    						albumName: song.albumName,
	    						pinyinName: song.pinyinName,
	    						url: song.url,
	    						selected: true
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
        var lrc = new Lyricer();
        audio.src = "";
        audio.songUrl = ""; // audio.src will be encoded, this attribute keeps the original url
		
		$scope.playlistSongs = [];
		$scope.isPlaying = false;
		$scope.currentPlaying = -1;
        $scope.playPercentage = 0;
        $scope.duration = "00:00";
        $scope.playtime = "00:00";

		// We don't wanna share the playlist songs with the songs in the explorer, it would create troubles
		var copySelectedSongs = function(){
			var songs = [];
            if ( typeof $scope.songs !== "undefined" ) {
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
            }
			
			return songs;
		};

        var sec2min = function(time){
            var minutes = Math.floor(time / 60);
            var seconds = time - minutes * 60;
            var padding = function(string, pad, length) {
                return (new Array(length+1).join(pad)+string).slice(-length);
            };
            return padding(minutes, '0', 2) + ':' + padding(seconds, '0', 2);
        };

        var isAudioSrcValid = function(){
            var pattern = /(mp3|m4a)$/i;
            return pattern.test(audio.src);
        };

        var refreshCurrentPlayingIndex = function(){
            if (!isAudioSrcValid()) {
                $scope.currentPlaying = -1;
            } else if ($scope.playlistSongs.length > 0) {
                $scope.playlistSongs.forEach(function(song, index){
                    if (audio.songUrl === song.url) {
                        $scope.currentPlaying = index;
                    }
                });
            }
        };

        $scope.setLyrics = function(song, reload){
            reload = typeof reload !== 'undefined' ? reload : false;
            url = reload ? '/reloadlyrics/' : '/lyrics/';
            lrc.setLrc("[00:00] loading ...");
            $http.get(url + song.id + '/').then(function(response){
                var content = response.data.content;
                if ( content.length == 0 ) {
                    content = "[00:00] No lyrics found";
                }
                lrc.setLrc(content);
            });
        };

        // I could do it in the angular way, but the raw angular expression shows in the title beore it gets parsed,
        // I'll access the dom directly before I find the angular solution.
        var updateHtmlTitle = function(name){
            if (name === '') {
                title = 'MusicPlayer';
            } else {
                title = 'MusicPlayer - ' + name;
            }
            angular.element('title').html(title);
        };

		$scope.playPlaylist = function(index){
			if ($scope.playlistSongs.length > 0) {
                index = typeof(index) !== "undefined" ? index : 0; 
				var song = $scope.playlistSongs[index];
                audio.src = song.url;
				audio.songUrl = song.url;
				audio.play();
                $scope.setLyrics(song);
				$scope.isPlaying = true;
				$scope.currentPlaying = index;
                updateHtmlTitle(song.name);
			};
		};

		$scope.playNext = function(){
			if ( $scope.currentPlaying < $scope.playlistSongs.length - 1 ) {
				$scope.currentPlaying += 1;
				$scope.playPlaylist($scope.currentPlaying);
			} else {
                $scope.currentPlaying = -1;
                audio.src = "";
                updateHtmlTitle(song.name);
            }
		};

		$scope.playPrevious = function(){
			if ( $scope.currentPlaying > 0 ) {
				$scope.currentPlaying -= 1;
				$scope.playPlaylist($scope.currentPlaying);
			} else {
                $scope.currentPlaying = $scope.playlistSongs.length;
                audio.src = "";
                updateHtmlTitle(song.name);
            }
		};

        var getRandomInt = function(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        };

        $scope.playNextRandomly = function(){
            $scope.playPlaylist(getRandomInt(0, $scope.playlistSongs.length));
        };

        $scope.playSomeRandomSongs = function() {
            var number = 15;
            $http.get('/randomsongs/' + 15 + '/').then(function(response){
                $scope.playlistSongs = [];
                response.data.songs.forEach(function(song, index){
                    $scope.playlistSongs.push({
                        id: song.id,
                        name: song.name,
                        artistName: song.artistName,
                        albumName: song.albumName,
                        pinyinName: song.pinyinName,
                        url: song.url,
                        selected: false
                    });
                });
                $scope.playPlaylist(0);
            });
        };

		var whenended = function(){
			$scope.isPlaying = false;
            var playOrder = angular.element("input[name='playorder']").val();
            if (playOrder === "play-in-order") {
                $scope.playNext();
            } else if(playOrder === "repeat-playlist"){
                if ($scope.currentPlaying === $scope.playlistSongs.length - 1) {
                    $scope.playPlaylist(0);
                } else{
                    $scope.playNext();
                }
            } else if(playOrder === "repeat-track"){
                $scope.playPlaylist($scope.currentPlaying);
            } else if(playOrder === "random"){
                $scope.playNextRandomly();
            } else{
                $scope.playNext();
            }
			
			$scope.$digest();
		};

        var whenTimeupdate = function(){
            $scope.playtime = sec2min(Math.floor(audio.currentTime));
            $scope.duration = sec2min(Math.floor(audio.duration));
            $scope.playPercentage = audio.currentTime * 100 / audio.duration;
            lrc.move(audio.currentTime);
            $scope.$apply();
        };

        audio.addEventListener('ended', whenended);
		audio.addEventListener('timeupdate', whenTimeupdate);    

        $scope.seek = function($event){
            var width = $event.offsetX;
            var total = $event.target.offsetWidth;
            if (isAudioSrcValid()) {
                audio.currentTime = Math.floor( audio.duration * width / total );
            }
        };

		$scope.dblplay = function(song){
			$scope.playlistSongs = copySelectedSongs();
			$scope.playPlaylist();
		};

		$scope.playOrPause = function () {
			if ($scope.isPlaying) {
				audio.pause();
				$scope.isPlaying = false;
			} else if(audio.paused && isAudioSrcValid()){
				audio.play();
				$scope.isPlaying = true;
			} else{
                var songs = copySelectedSongs();
                var index = 0;
                if (songs.length > 0){
                    $scope.playlistSongs = songs;
                }
				for (var i = 0; i < $scope.playlistSongs.length; i++) {
                    if ($scope.playlistSongs[i].selected) {
                        index = i;
                        break;
                    }
                };
				$scope.playPlaylist(index);
			};
		};

		$scope.stop = function () {
            audio.currentTime = 0;
			audio.src = "";
            updateHtmlTitle('');
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
            refreshCurrentPlayingIndex();
		};

		$scope.playlistSongSelect = select("playlistSong");

    }]);

}())
