var Module = null;

function JSMESS(canvas, module, output, game, callback) {
  var js_data;
  var moduledata;
  var requests = [];
  var drawloadingtimer;
  var file_countdown;
  var spinnerrot = 0;

  this.setcallback = function(_callback) {
    callback = _callback;
    return this;
  }

  this.setmodule = function(_module) {
    module = _module;
    return this;
  }

  this.setgame = function(_game) {
    game = _game;
    return this;
  }

  var draw_loading_status = function() {
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    var spinnerpos;
    var img = new Image();
    var spinner = new Image();
    spinner.onload = function() {
      context.save();
      context.translate((canvas.width / 2), spinnerpos);
      context.rotate(spinnerrot);
      context.drawImage(spinner, -(64/2), -(64/2), 64, 64);
      context.restore();
      spinnerrot += .5;
    };
    img.onload = function(){
      context.drawImage(img, canvas.width / 2 - (img.width / 2), canvas.height / 3 - (img.height / 2));
      spinnerpos = (canvas.height / 2 + img.height / 2) + 16
      spinner.src = 'spinner.png';
    };
    img.src = 'splash.png';
  };

  var progress_fetch_file = function(e) {
    if (e.lengthComputable) {
      e.target.progress = e.loaded / e.total;
      e.target.loaded = e.loaded;
      e.target.total = e.total;
      e.target.lengthComputable = e.lengthComputable;
    }
  };

  var fetch_file = function(title, url, cb, rt, raw, unmanaged) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = rt ? rt : 'arraybuffer';
    xhr.onload = function(e) {
      if (!unmanaged) {
        xhr.progress = 1.0;
      }
      var ints = raw ? xhr.response :  new Int8Array(xhr.response);
      cb(ints);
    };
    if (!unmanaged) {
      xhr.onprogress = progress_fetch_file;
      xhr.title = title;
      xhr.progress = 0;
      xhr.total = 0;
      xhr.loaded = 0;
      xhr.lengthComputable = false;
      requests.push(xhr);
    }
    xhr.send();
  };

  var update_countdown = function() {
    file_countdown -= 1
    if (file_countdown <= 0) {
      window.clearInterval(drawloadingtimer);
      var headID = document.getElementsByTagName('head')[0];
      var newScript = document.createElement('script');
      newScript.type = 'text/javascript';
      newScript.text = js_data;
      headID.appendChild(newScript);
    }
  };

  var init_module = function() {
    var modulecfg = JSON.parse(moduledata);

    var game_file = null;
    var bios_filenames = modulecfg['bios_filenames'];
    var bios_files = {};

    var nr = modulecfg['native_resolution'];

    var arguments = [
      modulecfg['driver'],
      '-verbose',
      '-rompath','.',
      '-window',
      '-resolution', nr[0]+'x' + nr[1],
      '-nokeepaspect'
    ];
    if (game) {
      arguments.push('-' + modulecfg['peripherals'][0], game.replace(/\//g,'_'))
    }
    if (modulecfg['extra_args']) {
      arguments = arguments.concat(modulecfg['extra_args'])
    }

    Module = {
      arguments: arguments,
      print: (function() {
        return function(text) {
          if (!output) {
            return;
          }
          text = text.replace(/&/g, '&amp;');
          text = text.replace(/</g, '&lt;');
          text = text.replace(/>/g, '&gt;');
          text = text.replace('\n', '<br>', 'g');
          output.innerHTML += text + '<br>';
          output.scrollTop = output.scrollHeight;
        };
      })(),
      canvas: canvas,
      noInitialRun: false,
      preInit: function() {
        // Load the downloaded binary files into the filesystem.
        for (var bios_fname in bios_files) {
          if (bios_files.hasOwnProperty(bios_fname)) {
            Module['FS_createDataFile']('/', bios_fname, bios_files[bios_fname], true, true);
          }
        }
        if (game) {
            Module['FS_createDataFile']('/', game.replace(/\//g,'_'), game_file, true, true);
        }
        if (callback) {
          modulecfg.canvas = canvas;
          window.setTimeout(function() {callback(modulecfg)}, 0);
        }
      }
    };

    file_countdown = bios_filenames.length + game ? 1 : 0 + 1

    // Fetch the BIOS and the game we want to run.
    for (var i=0; i < bios_filenames.length; i++) {
      var fname = bios_filenames[i];
      if (!fname) {
        continue;
      }
      fetch_file('Bios', fname, function(data) { bios_files[fname] = data; update_countdown(); });
    }

    if (game) {
      fetch_file('Game', game, function(data) { game_file = data; update_countdown(); });
    }

    fetch_file('Javascript', modulecfg['js_filename'], function(data) { js_data = data; update_countdown(); }, 'text', true);
    drawloadingtimer = window.setInterval(draw_loading_status, 1000/60);
  };

  var keyevent = function(e) {
    if (e.which == 32) {
      e.preventDefault();
      window.removeEventListener('keypress', keyevent);
      fetch_file('ModuleInfo', module + '.json', function(data) { moduledata = data; drawsplash(); init_module(); }, 'text', true, true);
    }
  }

  var drawsplash = function() {
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    var img = new Image();
    img.onload = function(){
      context.drawImage(img, canvas.width / 2 - (img.width / 2), canvas.height / 3 - (img.height / 2));
      context.font = '18px sans-serif';
      context.fillStyle = 'Black';
      context.textAlign = 'center';
      context.fillText('press space', canvas.width / 2, (canvas.height / 2) + (img.height / 2));
      context.textAlign = 'start';
    };
    img.src = 'splash.png';
  }

  window.addEventListener('keypress', keyevent);
  drawsplash();
}