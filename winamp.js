function Media (audioId) {
    this.audio = document.getElementById(audioId);

    // create audio context (if browser supports it)
    var AudioCtx = null, AudioModule = window.AudioContext || window.webkitAudioContext;
    var mediaApi, leftGain, rightGain, chanSplit, chanMerge;
	//var chan6, chan17, chan31, chan60, chan1k, chan3k, chan6k, chan12k, chan14k, chan16k;
	
    var isFirefox = navigator.userAgent.search("Firefox") !== -1;
    // createMediaElementSource does not seem to work due to CORS on Firefox
    // http://stackoverflow.com/a/19710142
    // 
    // so this is basically supported only on Chrome (and possibly Safari)

    if(AudioModule && !isFirefox) {
        AudioCtx = new AudioModule;

        // get API from <audio> tag
        mediaApi = AudioCtx.createMediaElementSource(this.audio);

        // basic audio stream flow
        //
        //              <audio>
		//					|
		//			   (equalizer)
        //                  |
        //  (split using createChannelSplitter)
        //                  |
        //                 / \
        //                /   \
        //        leftGain     rightGain
        //                \   /
        //                 \ /
        //                  |
        //  (merge using createChannelMerger)
        //                  |
        //              chanMerge    

        // create gains for left right
        leftGain = AudioCtx.createGain();
        rightGain = AudioCtx.createGain();

        // split source channels
        chanSplit = AudioCtx.createChannelSplitter(2);

		// brand spanking new EQ stuff
		//
		// biquad filters for channels. Processed in series: lowshelf -> peaking x8 -> highshelf
		chan6 = AudioCtx.createBiquadFilter();
		chan17 = AudioCtx.createBiquadFilter();
		chan31 = AudioCtx.createBiquadFilter();
		chan60 = AudioCtx.createBiquadFilter();
		chan1k = AudioCtx.createBiquadFilter();
		chan3k = AudioCtx.createBiquadFilter();
		chan6k = AudioCtx.createBiquadFilter();
		chan12k = AudioCtx.createBiquadFilter();
		chan14k = AudioCtx.createBiquadFilter();
		chan16k = AudioCtx.createBiquadFilter();
		
		mediaApi.connect(chan6);
		mediaApi.connect(chan17);
		mediaApi.connect(chan31);
		mediaApi.connect(chan60);
		mediaApi.connect(chan1k);
		mediaApi.connect(chan3k);
		mediaApi.connect(chan6k);
		mediaApi.connect(chan12k);
		mediaApi.connect(chan14k);
		mediaApi.connect(chan16k);
		
		chan6.type = 'peaking';
		chan6.frequency.value = 60;
		chan6.Q.value = 2;
		chan6.gain.value = 0;
		chan6.connect(chanSplit);
		
		chan17.type = 'peaking';
		chan17.frequency.value = 170;
		chan17.Q.value = 2;
		chan17.gain.value = 0;
		chan17.connect(chanSplit);
		
		chan31.type = 'peaking';
		chan31.frequency.value = 310;
		chan31.Q.value = 2;
		chan31.gain.value = 0;
		chan31.connect(chanSplit);
		
		chan60.type = 'peaking';
		chan60.frequency.value = 600;
		chan60.Q.value = 2;
		chan60.gain.value = 0;
		chan60.connect(chanSplit);
		
		chan1k.type = 'peaking';
		chan1k.frequency.value = 1000;
		chan1k.Q.value = 2;
		chan1k.gain.value = 0;
		chan1k.connect(chanSplit);
		
		chan3ktype = 'peaking';
		chan3k.frequency.value = 3000;
		chan3k.Q.value = 2;
		chan3k.gain.value = 0;
		chan3k.connect(chanSplit);
		
		chan6k.type = 'peaking';
		chan6k.frequency.value = 6000;
		chan6k.Q.value = 2;
		chan6k.gain.value = 0;
		chan6k.connect(chanSplit)
		
		chan12k.type = 'peaking';
		chan12k.frequency.value = 12000;
		chan12k.Q.value = 2;
		chan12k.gain.value = 0;
		chan12k.connect(chanSplit);
		
		chan14k.type = 'peaking';
		chan14k.frequency.value = 14000;
		chan14k.Q.value = 2;
		chan14k.gain.value = 0;
		chan14k.connect(chanSplit);
		
		chan16k.type = 'peaking';
		chan16k.frequency.value = 16000;
		chan16k.Q.value = 2;
		chan16k.gain.value = 0;
		chan16k.connect(chanSplit);
		
        // connect split channels to left / right gains
        chanSplit.connect(leftGain,0);
        chanSplit.connect(rightGain,1);

        // create channel merger, and merge left / right gains
        chanMerge = AudioCtx.createChannelMerger(2);
        leftGain.connect(chanMerge, 0, 0);
        rightGain.connect(chanMerge, 0, 1);

        // send merged channels to soundcard
        chanMerge.connect(AudioCtx.destination);
    }
	/* Properties */
    this.timeElapsed = function() {
        return this.audio.currentTime;
    }
    this.timeRemaining = function() {
        return this.audio.duration - this.audio.currentTime;
    }
    this.timeElapsedObject = function() {
        return this._timeObject(this.timeElapsed());
    }
    this.timeRemainingObject = function() {
        return this._timeObject(this.timeRemaining());
    }
    this.percentComplete = function() {
        return (this.audio.currentTime / this.audio.duration) * 100;
    }

    /* Actions */
    this.previous = function() {
        this.audio.currentTime = 0;
    };
    this.play = function() {
        this.audio.play();
    };
    this.pause = function() {
        this.audio.pause();
    };
    this.stop = function() {
        this.audio.pause();
        this.audio.currentTime = 0;
    };
    this.next = function() {
        this.audio.currentTime = this.audio.duration;
    };
    this.toggleRepeat = function() {
        this.audio.loop = !this.audio.loop;
    };
    this.toggleShuffle = function() {
        // Not implemented
    };

    /* Actions with arguments */
    this.seekToPercentComplete = function(percent) {
        this.audio.currentTime = this.audio.duration * (percent/100);
        this.audio.play();
    };
    this.setVolume = function(volume) {
        this.audio.volume = volume;
    };

    this.setBalance = function(balance) {
        // balance range -100 (left) to 100 (right)
        var changeVal = 0;

        if(balance === 0) {
            leftGain.gain.value = 1;
            rightGain.gain.value = 1;
        }
        else if(balance < 0) {
            // convert to positive
            changeVal = balance *= -1;
            changeVal = changeVal / 100;

            leftGain.gain.value = 1;
            rightGain.gain.value = 1 - changeVal;
        }
        else { // balance > 0
            changeVal = parseInt(balance,10);
            changeVal = changeVal / 100;
            
            leftGain.gain.value = 1 - changeVal;
            rightGain.gain.value = 1;
        }
    }

    this.loadFile = function(file) {
        this.audio.setAttribute('src', file);
    };

    /* Listeners */
    this.addEventListener = function(event, callback) {
        this.audio.addEventListener(event, callback);
    };

    /* Helpers */
    this._timeObject = function(seconds) {
        var minutes = seconds / 60;
        var seconds = seconds % 60;

        return [
            Math.floor(minutes / 10),
            Math.floor(minutes % 10),
            Math.floor(seconds / 10),
            Math.floor(seconds % 10)
        ];
    }
}

function Winamp () {
    self = this;
    this.media = new Media('player');
    this.font = new Font();
    this.media.setVolume(.5);

    this.nodes = {
        'option': document.getElementById('option'),
        'close': document.getElementById('close'),
        'shade': document.getElementById('shade'),
        'position': document.getElementById('position'),
        'fileInput': document.getElementById('file-input'),
        'volumeMessage': document.getElementById('volume-message'),
        'balanceMessage': document.getElementById('balance-message'),
        'songTitle': document.getElementById('song-title'),
        'time': document.getElementById('time'),
        'previous': document.getElementById('previous'),
        'play': document.getElementById('play'),
        'pause': document.getElementById('pause'),
        'stop': document.getElementById('stop'),
        'next': document.getElementById('next'),
        'eject': document.getElementById('eject'),
        'repeat': document.getElementById('repeat'),
        'shuffle': document.getElementById('shuffle'),
        'volume': document.getElementById('volume'),
        'balance': document.getElementById('balance'),
        'playPause': document.getElementById('play-pause'),
        'winamp': document.getElementById('winamp'),
        'titleBar': document.getElementById('title-bar'),
		'eqShow': document.getElementById('eq-btn'),
		'plsShow': document.getElementById('pls-btn'),
		'chan6': document.getElementById('chan6'),
		'chan17': document.getElementById('chan17'),
		'chan31': document.getElementById('chan31'),
		'chan60': document.getElementById('chan60'),
		'chan1k': document.getElementById('chan1k'),
		'chan3k': document.getElementById('chan3k'),
		'chan6k': document.getElementById('chan6k'),
		'chan12k': document.getElementById('chan12k'),
		'chan14k': document.getElementById('chan14k'),
		'chan16k': document.getElementById('chan16k'),
    };

    // make window dragable
    this.nodes.titleBar.addEventListener('mousedown',function(e){
        if(e.target !== this) {
            // prevent going into drag mode when clicking any of the title bar's icons
            // by making sure the click was made directly on the titlebar
            return true;
        }

        // get starting window position
        var winampElm = self.nodes.winamp;

        // if the element was 'absolutely' positioned we could simply use offsetLeft / offsetTop
        // however the element is 'relatively' positioned so we're using style.left
        // parseInt is used to remove the 'px' postfix from the value

        var winStartLeft = parseInt(winampElm.style.left || 0,10), 
            winStartTop  = parseInt(winampElm.style.top || 0,10);
        
        // get starting mouse position
        var mouseStartLeft = e.clientX,
            mouseStartTop = e.clientY;

        // mouse move handler function while mouse is down
        function handleMove(e) {
            // get current mouse position
            var mouseLeft = e.clientX,
                mouseTop = e.clientY;

            // calculate difference offsets
            var diffLeft = mouseLeft-mouseStartLeft,
                diffTop = mouseTop-mouseStartTop;

            // move window to new position
            winampElm.style.left = (winStartLeft+diffLeft)+"px";
            winampElm.style.top = (winStartTop+diffTop)+"px";
        }

        // mouse button up
        function handleUp() {
            removeListeners();
        }

        function removeListeners() {
            window.removeEventListener('mousemove',handleMove);
            window.removeEventListener('mouseup',handleUp);
        }

        window.addEventListener('mousemove',handleMove);
        window.addEventListener('mouseup',handleUp);
    });

    // Hide/Show Equalizer/Playlist windows
	this.nodes.eqShow.onclick = function(e) {
		var e = document.getElementById('equalizer');
		if(e.style.display == 'block')
			e.style.display = 'none';
		else
			e.style.display = 'block';
	}
	
	this.nodes.plsShow.onclick = function(e) {
		var e = document.getElementById('playlist');
		if(e.style.display == 'block')
			e.style.display = 'none';
		else
			e.style.display = 'block';
	}
	
	this.nodes.option.onclick = function() {
        text = "Enter an Internet location to open here:\n";
        text += "For example: http://www.server.com/file.mp3"
        file = window.prompt(text, '');
        self.startFile(file, file);
        self.media.play();
        self.setStatus('play');
    }

    this.nodes.close.onclick = function() {
    }

    this.media.addEventListener('timeupdate', function() {
        self.nodes.position.value = self.media.percentComplete();
        self.updateTime();
    });

    this.media.addEventListener('ended', function() {
        self.setStatus('stop');
        self.media.previous();
    });

    this.nodes.shade.onclick = function() {
        self.nodes.winamp.classList.toggle('shade');
    }

    this.nodes.time.onclick = function() {
        this.classList.toggle('countdown');
        self.updateTime();
    }

    this.nodes.previous.onclick = function() {
        self.media.previous();
    }

    this.nodes.play.onclick = function() {
        self.media.play();
        self.setStatus('play');
    }
    this.nodes.pause.onclick = function() {
        self.media.pause();
        self.setStatus('pause');
    }
    this.nodes.stop.onclick = function() {
        self.media.stop();
        self.setStatus('stop');
    }
    this.nodes.next.onclick = function() {
        self.media.next();
    }

    this.nodes.eject.onclick = function() {
        self.nodes.fileInput.click();
    }

    this.nodes.fileInput.onchange = function(e){
        var file = e.target.files[0];
        self.startFileViaReference(file);
    }

    this.nodes.volume.onmousedown = function() {
        self.nodes.winamp.classList.add('setting-volume');
    }
    this.nodes.volume.onmouseup = function() {
        self.nodes.winamp.classList.remove('setting-volume');
    }

    this.nodes.volume.oninput = function() {
        setVolume( this.value / 100);
        string = 'Volume: ' + this.value + '%';
        self.font.setNodeToString(self.nodes.volumeMessage, string);
    }
	
	this.nodes.chan6.oninput = function() {
		var changeVal;
		var setChan6 = this.value;
		if(setChan6 === 0) {
            chan6.gain.value = 0;
			console.log(setChan6);
        }
        else if(setChan6 < 0) {
            // convert to positive
			console.log(setChan6);
            changeVal = setChan6 *= -1;
            changeVal = changeVal;

            chan6.gain.value = 0 - changeVal;
        }
        else { // setChan6 > 0
			console.log(setChan6);
            changeVal = setChan6;
            changeVal = changeVal;
            
            chan6.gain.value = 0 + changeVal;
		}
	}
	this.nodes.chan17.oninput = function() {
		var changeVal;
		var setChan17 = this.value;
		if(setChan17 === 0) {
            chan17.gain.value = 0;
			console.log(setChan17);
        }
        else if(setChan17 < 0) {
            // convert to positive
			console.log(setChan17);
            changeVal = setChan17 *= -1;
            changeVal = changeVal;

            chan17.gain.value = 0 - changeVal;
        }
        else { // setChan6 > 0
			console.log(setChan17);
            changeVal = setChan17;
            changeVal = changeVal;
            
            chan17.gain.value = 0 + changeVal;
		}
	}
	this.nodes.chan31.oninput = function() {
		var changeVal;
		var setChan31 = this.value;
		if(setChan31 === 0) {
            chan31.gain.value = 0;
			console.log(setChan31);
        }
        else if(setChan31 < 0) {
            // convert to positive
			console.log(setChan31);
            changeVal = setChan31 *= -1;
            changeVal = changeVal;

            chan31.gain.value = 0 - changeVal;
        }
        else { // setChan6 > 0
			console.log(setChan31);
            changeVal = setChan31;
            changeVal = changeVal;
            
            chan31.gain.value = 0 + changeVal;
		}
	}
	this.nodes.chan60.oninput = function() {
		var changeVal;
		var setChan60 = this.value;
		if(setChan60 === 0) {
            chan60.gain.value = 0;
			console.log(setChan60);
        }
        else if(setChan60 < 0) {
            // convert to positive
			console.log(setChan60);
            changeVal = setChan60 *= -1;
            changeVal = changeVal;

            chan60.gain.value = 0 - changeVal;
        }
        else { // setChan6 > 0
			console.log(setChan60);
            changeVal = setChan60;
            changeVal = changeVal;
            
            chan60.gain.value = 0 + changeVal;
		}
	}
	this.nodes.chan1k.oninput = function() {
		var changeVal;
		var setChan1k = this.value;
		if(setChan1k === 0) {
            chan1k.gain.value = 0;
			console.log(setChan1k);
        }
        else if(setChan1k < 0) {
            // convert to positive
			console.log(setChan1k);
            changeVal = setChan1k *= -1;
            changeVal = changeVal;

            chan1k.gain.value = 0 - changeVal;
        }
        else { // setChan6 > 0
			console.log(setChan1k);
            changeVal = setChan1k;
            changeVal = changeVal;
            
            chan1k.gain.value = 0 + changeVal;
		}
	}
	this.nodes.chan3k.oninput = function() {
		var changeVal;
		var setChan3k = this.value;
		if(setChan3k === 0) {
            chan3k.gain.value = 0;
			console.log(setChan3k);
        }
        else if(setChan3k < 0) {
            // convert to positive
			console.log(setChan3k);
            changeVal = setChan3k *= -1;
            changeVal = changeVal;

            chan3k.gain.value = 0 - changeVal;
        }
        else { // setChan6 > 0
			console.log(setChan3k);
            changeVal = setChan3k;
            changeVal = changeVal;
            
            chan3k.gain.value = 0 + changeVal;
		}
	}
	this.nodes.chan6k.oninput = function() {
		var changeVal;
		var setChan6k = this.value;
		if(setChan6k === 0) {
            chan6k.gain.value = 0;
			console.log(setChan6k);
        }
        else if(setChan6k < 0) {
            // convert to positive
			console.log(setChan6k);
            changeVal = setChan6k *= -1;
            changeVal = changeVal;

            chan6k.gain.value = 0 - changeVal;
        }
        else { // setChan6 > 0
			console.log(setChan6k);
            changeVal = setChan6k;
            changeVal = changeVal;
            
            chan6k.gain.value = 0 + changeVal;
		}
	}
	this.nodes.chan12k.oninput = function() {
		var changeVal;
		var setChan12k = this.value;
		if(setChan12k === 0) {
            chan12k.gain.value = 0;
			console.log(setChan12k);
        }
        else if(setChan12k < 0) {
            // convert to positive
			console.log(setChan12k);
            changeVal = setChan12k *= -1;
            changeVal = changeVal;

            chan12k.gain.value = 0 - changeVal;
        }
        else { // setChan6 > 0
			console.log(setChan12k);
            changeVal = setChan12k;
            changeVal = changeVal;
            
            chan12k.gain.value = 0 + changeVal;
		}
	}
	this.nodes.chan14k.oninput = function() {
		var changeVal;
		var setChan14k = this.value;
		if(setChan14k === 0) {
            chan14k.gain.value = 0;
			console.log(setChan14k);
        }
        else if(setChan14k < 0) {
            // convert to positive
			console.log(setChan14k);
            changeVal = setChan14k *= -1;
            changeVal = changeVal;

            chan14k.gain.value = 0 - changeVal;
        }
        else { // setChan6 > 0
			console.log(setChan14k);
            changeVal = setChan14k;
            changeVal = changeVal;
            
            chan14k.gain.value = 0 + changeVal;
		}
	}
	this.nodes.chan16k.oninput = function() {
		var changeVal;
		var setChan16k = this.value;
		if(setChan16k === 0) {
            chan16k.gain.value = 0;
			console.log(setChan16k);
        }
        else if(setChan16k < 0) {
            // convert to positive
			console.log(setChan16k);
            changeVal = setChan16k *= -1;
            changeVal = changeVal;

            chan16k.gain.value = 0 - changeVal;
        }
        else { // setChan6 > 0
			console.log(setChan16k);
            changeVal = setChan16k;
            changeVal = changeVal;
            
            chan16k.gain.value = 0 + changeVal;
		}
	}

	
    this.nodes.position.onmousedown = function() {
        self.media.pause();
    }

    this.nodes.position.onchange = function() {
        self.media.seekToPercentComplete(this.value);
    }

    this.nodes.balance.onmousedown = function() {
        self.nodes.winamp.classList.add('setting-balance');
    }
    this.nodes.balance.onmouseup = function() {
        self.nodes.winamp.classList.remove('setting-balance');
    }
    this.nodes.balance.oninput = function() {
        setBalance( Math.abs(this.value) / 100);
        var string = '';
        if(this.value == 0) {
            string = 'Balance: Center';
        } else if(this.value > 0) {
            string = 'Balance: ' + this.value + '% Right';
        } else {
            string = 'Balance: ' + Math.abs(this.value) + '% Left';
        }
        
        self.media.setBalance(this.value);
        self.font.setNodeToString(self.nodes.balanceMessage, string);
    }
    this.nodes.repeat.onclick = function() {
        toggleRepeat();
    }
    this.nodes.shuffle.onclick = function() {
        toggleShuffle();
    }

    this.setStatus = function(className) {
        self.nodes.playPause.removeAttribute("class");
        self.nodes.playPause.classList.add(className);
    }
    function setVolume(volume) {
        sprite = Math.round(volume * 28);
        offset = (sprite - 1) * 15;
        self.media.setVolume(volume);
        self.nodes.volume.style.backgroundPosition = '0 -' + offset + 'px';
    }

    function setBalance(balance) {
        sprite = Math.round(balance * 28);
        offset = (sprite - 1) * 15;
        self.nodes.balance.style.backgroundPosition = '-9px -' + offset + 'px';
    }
	
    function toggleRepeat() {
        self.media.toggleRepeat();
        self.nodes.repeat.classList.toggle('selected');
    }

    function toggleShuffle() {
        self.media.toggleShuffle();
        self.nodes.shuffle.classList.toggle('selected');
    }

    this.updateTime = function() {
        if(this.nodes.time.classList.contains('countdown')) {
            digits = this.media.timeRemainingObject();
        } else {
            digits = this.media.timeElapsedObject();
        }
        html = digitHtml(digits[0]);
        document.getElementById('minute-first-digit').innerHTML = '';
        document.getElementById('minute-first-digit').appendChild(html);
        this.font.displayCharacterInNode(digits[0], document.getElementById('shade-minute-first-digit'));
        html = digitHtml(digits[1]);
        document.getElementById('minute-second-digit').innerHTML = '';
        document.getElementById('minute-second-digit').appendChild(html);
        this.font.displayCharacterInNode(digits[1], document.getElementById('shade-minute-second-digit'));
        html = digitHtml(digits[2]);
        document.getElementById('second-first-digit').innerHTML = '';
        document.getElementById('second-first-digit').appendChild(html);
        this.font.displayCharacterInNode(digits[2], document.getElementById('shade-second-first-digit'));
        html = digitHtml(digits[3]);
        document.getElementById('second-second-digit').innerHTML = '';
        document.getElementById('second-second-digit').appendChild(html);
        this.font.displayCharacterInNode(digits[3], document.getElementById('shade-second-second-digit'));
    }


    this.dragenter = function(e) {
        e.stopPropagation();
        e.preventDefault();
    }
    this.dragover = function(e) {
        e.stopPropagation();
        e.preventDefault();
    }
    this.drop = function(e) {
        e.stopPropagation();
        e.preventDefault();
        var dt = e.dataTransfer;
        var file = dt.files[0];
        self.startFileViaReference(file);
    }

    this.nodes.winamp.addEventListener('dragenter', this.dragenter);
    this.nodes.winamp.addEventListener('dragover', this.dragover);
    this.nodes.winamp.addEventListener('drop', this.drop);

    this.startFileViaReference = function(fileReference) {
        var objectUrl = URL.createObjectURL(fileReference);
        self.startFile(objectUrl, fileReference.name);
    }

    this.startFile = function(file, fileName) {
        self.loadFile(file, fileName);
        self.media.play();
        self.setStatus('play');
    }

    this.loadFile = function(file, fileName) {
        this.media.loadFile(file);
        this.font.setNodeToString(document.getElementById('song-title'), fileName)
        this.font.setNodeToString(document.getElementById('kbps'), "128")
        this.font.setNodeToString(document.getElementById('khz'), "44")
        this.updateTime();
    }

    function digitHtml(digit) {
        horizontalOffset = digit * 9;
        div = document.createElement('div');
        div.classList.add('digit');
        div.style.backgroundPosition = '-' + horizontalOffset + 'px 0';
        div.innerHTML = digit;
        return div;
    }
}
Font = function() {

    this.setNodeToString = function(node, string) {
        stringElement = this.stringNode(string);
        node.innerHTML = '';
        node.appendChild(stringElement);
    }

    this.stringNode = function(string) {
        parentDiv = document.createElement('div');
        for (var i = 0, len = string.length; i < len; i++) {
            char = string[i].toLowerCase();
            parentDiv.appendChild(this.characterNode(char));
        }
        return parentDiv;
    }

    this.characterNode = function(char) {
        return this.displayCharacterInNode(char, document.createElement('div'));
    }

    this.displayCharacterInNode = function(character, node) {
        position = this.charPosition(character);
        row = position[0];
        column = position[1];
        verticalOffset = row * 6;
        horizontalOffset = column * 5;

        x = '-' + horizontalOffset + 'px';
        y = '-' + verticalOffset + 'px'
        node.style.backgroundPosition =  x + ' ' + y;
        node.classList.add('character');
        node.innerHTML = character;
        return node;
    }

    this.charPosition = function(char) {
        position = this.fontLookup[char];
        if(!position) {
            return this.fontLookup[' '];
        }

        return position;
    }

    /* XXX There are too many " " and "_" characters */
    this.fontLookup = {
        "a": [0,0], "b": [0,1], "c": [0,2], "d": [0,3], "e": [0,4], "f": [0,5],
        "g": [0,6], "h": [0,7], "i": [0,8], "j": [0,9], "k": [0,10],
        "l": [0,11], "m": [0,12], "n": [0,13], "o": [0,14], "p": [0,15],
        "q": [0,16], "r": [0,17], "s": [0,18], "t": [0,19], "u": [0,20],
        "v": [0,21], "w": [0,22], "x": [0,23], "y": [0,24], "z": [0,25],
        "\"": [0,26], "@": [0,27], " ": [0,29], "0": [1,0], "1": [1,1],
        "2": [1,2], "3": [1,3], "4": [1,4], "5": [1,5], "6": [1,6], "7": [1,7],
        "8": [1,8], "9": [1,9], " ": [1,10], "_": [1,11], ":": [1,12],
        "(": [1,13], ")": [1,14], "-": [1,15], "'": [1,16], "!": [1,17],
        "_": [1,18], "+": [1,19], "\\": [1,20], "/": [1,21], "[": [1,22],
        "]": [1,23], "^": [1,24], "&": [1,25], "%": [1,26], ".": [1,27],
        "=": [1,28], "$": [1,29], "#": [1,30], "Å": [2,0], "Ö": [2,1],
        "Ä": [2,2], "?": [2,3], "*": [2,4], " ": [2,5]
    };
}

keylog = [];
trigger = [78,85,76,27,76,27,83,79,70,84];
// Easter Egg
document.onkeyup = function(e){
    keylog.push(e.which);
    keylog = keylog.slice(-10);
    if(keylog.toString() == trigger.toString()) {
        document.getElementById('winamp').classList.toggle('llama');
    }
}

winamp = new Winamp();
winamp.loadFile('https://rfare.github.io/CleanGrave.mp3', "1. Laibach - See That My Grave Is Kept Clean  ***  ");
