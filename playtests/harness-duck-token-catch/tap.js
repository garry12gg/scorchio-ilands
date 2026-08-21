// Audio tap injection — installed via Page.addScriptToEvaluateOnNewDocument (runs before page scripts).
// Wraps AudioContext so the game's master->destination connect ALSO feeds a MediaStreamDestination;
// MediaRecorder captures the real WebAudio mix (sandbox has no audio device).
(function () {
  if (window.__duckTapInstalled) return;
  window.__duckTapInstalled = true;
  try {
    var OrigAC = window.AudioContext || window.webkitAudioContext;
    var tapDest = null, tapRec = null, tapChunks = [], tapStarted = false;
    var origConnect = AudioNode.prototype.connect;

    AudioNode.prototype.connect = function () {
      var tgt = arguments[0];
      var r = origConnect.apply(this, arguments);
      try {
        if (tapDest && this.context && tgt === this.context.destination) {
          origConnect.call(this, tapDest);
        }
      } catch (e) {}
      return r;
    };

    function makeCtx() {
      var ctx = new OrigAC();
      try {
        if (!tapDest) {
          tapDest = ctx.createMediaStreamDestination();
          tapRec = new MediaRecorder(tapDest.stream, { mimeType: 'audio/webm;codecs=opus' });
          tapRec.ondataavailable = function (e) { if (e.data && e.data.size) tapChunks.push(e.data); };
          tapRec.start(200);
          tapStarted = true;
        }
      } catch (e) { tapDest = null; }
      return ctx;
    }

    var WrappedAC = function () { return makeCtx(); };
    WrappedAC.prototype = OrigAC.prototype;
    window.AudioContext = WrappedAC;
    if (window.webkitAudioContext) window.webkitAudioContext = WrappedAC;

    window.__duckTap = {
      started: function () { return tapStarted; },
      stop: function () {
        return new Promise(function (res) {
          if (!tapRec) return res(null);
          tapRec.onstop = function () {
            var b = new Blob(tapChunks, { type: 'audio/webm' });
            tapChunks = [];
            res(b);
          };
          try { tapRec.stop(); } catch (e) { res(null); }
        });
      }
    };
  } catch (e) { /* never break the game */ }
})();
