var nerdboxPlayer = new NerdboxPlayer({
    api: 'wss://api.nerdbox.fr/illuphisa',
    cover: 'https://api.nerdbox.fr/cover',
    stream: '//nerdbox.fr/streamproxy.php',
    updateInterval: 500
});

nerdboxPlayer.start();

/*
var url = 'http://nerdbox.fr/streamproxy.php';
var audioContext = new (window.AudioContext || window.webkitAudioContext)(); // définition du contexte audio
var audioSource = audioContext.createBufferSource();

function loadStream(quality) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = function () {
        audioContext.decodeAudioData(request.response, function (buffer) {
            playSound(buffer);
        }, console.error)
    };
    request.send();
}

function playSound(buffer) {
    audioSource.buffer = buffer;
    audioSource.start(0);
}

var javascriptNode, analyser, analyser2, sourceNode, splitter, audioNode;

function setupAudioNodes() {
    // setup a javascript node
    javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
    // connect to destination, else it isn't called
    javascriptNode.connect(audioContext.destination);


    // setup a analyzer
    analyser = audioContext.createAnalyser();
    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize = 1024;

    analyser2 = audioContext.createAnalyser();
    analyser2.smoothingTimeConstant = 0.0;
    analyser2.fftSize = 1024;

    // create a buffer source node
    //sourceNode = context.createBufferSource();
    sourceNode = audioContext.createMediaElementSource(audioNode);
    splitter = audioContext.createChannelSplitter();

    // connect the source to the analyser and the splitter
    sourceNode.connect(splitter);

    // connect one of the outputs from the splitter to
    // the analyser
    splitter.connect(analyser,0,0);
    splitter.connect(analyser2,1,0);

    // connect the splitter to the javascriptnode
    // we use the javascript node to draw at a
    // specific interval.
    analyser.connect(javascriptNode);

    // and connect to destination
    sourceNode.connect(audioContext.destination);

    //javascriptNode.onaudioprocess = onaudioprocess;
}

audioNode = new Audio();
audioNode.src = url;
setupAudioNodes();
loadStream();*/
