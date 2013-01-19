var gamename = 'smurfs.zip';
var game_file = null;
var js_data = null;
var bios_filenames = 'coleco.zip'.split(' ');
var bios_files = {};
var file_countdown = 1;
if (bios_filenames.length !== 0 && bios_filenames[0] !== '') {
  file_countdown += bios_filenames.length;
}
if (gamename !== '') {
  file_countdown++;
}

var newCanvas = document.createElement('canvas');
newCanvas.id = 'canvas';
newCanvas.width = 256;
newCanvas.height = 256;
var holder = document.getElementById('canvasholder');
holder.appendChild(newCanvas);

var fetch_file = function(url, cb, rt, raw) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = rt ? rt : "arraybuffer";
  xhr.onload = function(e) {
    var ints = raw ? xhr.response :  new Int8Array(xhr.response);
    cb(ints);
  };
  xhr.send();
};

var Module = {
  'arguments': ["coleco","-verbose","-rompath",".","-cart",gamename,"-window","-resolution","256x192","-nokeepaspect"],
  print: (function() {
    var element = document.getElementById('output');
    return function(text) {
      text = text.replace(/&/g, "&amp;");
      text = text.replace(/</g, "&lt;");
      text = text.replace(/>/g, "&gt;");
      text = text.replace('\n', '<br>', 'g');
      element.innerHTML += text + '<br>';
    };
  })(),
  canvas: document.getElementById('canvas'),
  noInitialRun: false,
  preInit: function() {
    // Load the downloaded binary files into the filesystem.
    for (var bios_fname in bios_files) {
      if (bios_files.hasOwnProperty(bios_fname)) {
        Module['FS_createDataFile']('/', bios_fname, bios_files[bios_fname], true, true);
      }
    }
    Module['FS_createDataFile']('/', gamename, game_file, true, true);
  }
};

var update_countdown = function() {
  file_countdown -= 1;
  
  if (file_countdown === 0) {
    var headID = document.getElementsByTagName("head")[0];
    var newScript = document.createElement('script');
    newScript.type = 'text/javascript';
    newScript.text = js_data;
    headID.appendChild(newScript);
  }
};

// Fetch the BIOS and the game we want to run.
for (var i=0; i < bios_filenames.length; i++) {
  var fname = bios_filenames[i];
  if (fname === "") {
    continue;
  }
  fetch_file(fname, function(data) { bios_files[fname] = data; update_countdown(); });
}

if (gamename !== "") {
  fetch_file(gamename, function(data) { game_file = data; update_countdown(); });
}

fetch_file('messcolecovision.js.gz', function(data) { js_data = data; update_countdown(); }, 'text', true);
