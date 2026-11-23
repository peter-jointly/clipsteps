/* ClipSteps player — CANONICAL engine (self-contained, no tenant data).
   SHARED CODE: the master is platform/clipsteps-player.js in the ClipSteps repo (peter-jointly/clipsteps).
   Every other copy is synced from it, one way — do NOT hand-edit or fork a copy.
   Version 2026-11-24 — first YouTube play comes from YouTube's own play button, so it counts as a view.
   Content (recipes, steps, videos) is supplied per page via window.GUIDE and stays in the private tenant.

   Mounts into <div id="clipsteps-guide"></div>. Page provides:
     window.GUIDE = {
       id, source:{type:"youtube",videoId}|{type:"file",src},
       steps:[{num,title,detail?,t,end?,q?,warn?,adapt?,photo?,photoCaption?}],   // t:null = text-only
       ingredients?:[{qty,unit,item}|string], equipment?:[string], makesServes?
     }
   Features: video (YouTube/self-hosted) · timestamped tickable steps · progress bar + counter ·
   tap = jump/pause/resume · double-tap L/R half = ∓5s · ⚡ quick-step · 🚩 flag + note ·
   kit/ingredients panels · landscape layout. Ticks/flags persist per tenant+guide. */

(function () {
  var G = window.GUIDE;
  var mount = document.getElementById("clipsteps-guide");
  if (!G || !mount) { if (mount) mount.textContent = "Guide not found."; return; }

  var KEY = "cs.guide." + (window.TENANT && TENANT.id ? TENANT.id + "." : "") + G.id;
  var state = (function () { try { return JSON.parse(localStorage.getItem(KEY)) || { done: {}, flag: {} }; } catch (e) { return { done: {}, flag: {} }; } })();
  var save = function () { localStorage.setItem(KEY, JSON.stringify(state)); };
  var esc = function (s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };
  var trim = function (n) { return (Math.round(n * 100) / 100).toString(); };
  var mmss = function (t) { var m = Math.floor(t / 60), s = String(Math.floor(t % 60)); return m + ":" + (s.length < 2 ? "0" + s : s); };

  var isYT = G.source && G.source.type === "youtube", player = null, ready = false;
  // Creator credit: YouTube counts a view only when playback starts from its own play button.
  // Until a YouTube video has played once (started), seeking cues it at that point and leaves
  // the start to YouTube's play button; after that, taps seek and play directly.
  var started = false;
  var api = {
    seek: function (t, play) {
      if (!ready) return;
      if (isYT) {
        if (!started) { player.cueVideoById({ videoId: G.source.videoId, startSeconds: t }); return; }
        player.seekTo(t, true); if (play) player.playVideo();
      } else { player.currentTime = t; if (play) player.play(); }
    },
    cur: function () { return isYT ? (ready ? player.getCurrentTime() : 0) : (player ? player.currentTime : 0); },
    toggle: function () { if (!ready) return; if (isYT) { if (!started) return; player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo(); } else { player.paused ? player.play() : player.pause(); } }
  };

  // ---- Shell ----
  mount.className = "cs";
  mount.innerHTML =
    '<div class="cs-videoshell"><div class="cs-video" id="cs-video"></div></div>' +
    '<div class="cs-steps" id="cs-steps"></div>';
  var stepsEl = mount.querySelector("#cs-steps");

  // ---- Progress ----
  var prog = document.createElement("div"); prog.className = "cs-progress";
  prog.innerHTML = '<div class="cs-barwrap"><span class="cs-bar" id="cs-bar"></span></div><span class="cs-plabel" id="cs-plabel"></span><button class="cs-reset" id="cs-reset">Reset</button>';
  stepsEl.appendChild(prog);
  prog.querySelector("#cs-reset").onclick = function () { if (confirm("Clear your ticks on this guide?")) { state = { done: {}, flag: {} }; save(); render(); } };

  // ---- Ingredients / equipment ----
  function panel(title, items, fmt) {
    if (!items || !items.length) return;
    var p = document.createElement("div"); p.className = "cs-panel";
    p.innerHTML = "<h4>" + title + "</h4><ul>" + items.map(fmt).join("") + "</ul>";
    stepsEl.appendChild(p);
  }
  panel("🛒 Ingredients" + (G.makesServes ? " — makes " + G.makesServes + " serves" : ""), G.ingredients,
    function (i) { return typeof i === "string" ? "<li>" + esc(i) + "</li>" : "<li><strong>" + esc(trim(i.qty)) + " " + esc(i.unit || "") + "</strong> " + esc(i.item) + "</li>"; });
  panel("🧰 Equipment & tools", G.equipment, function (e) { return "<li>" + esc(e) + "</li>"; });

  // ---- Steps ----
  G.steps.forEach(function (s, i) {
    var textonly = s.t == null;
    var card = document.createElement("div");
    card.className = "cs-step" + (textonly ? " cs-textonly" : "");
    card.dataset.i = i;
    card.innerHTML =
      '<button class="cs-tick" aria-label="Mark done">✓</button>' +
      '<div class="cs-body">' +
        '<div class="cs-head"><span class="cs-num">STEP ' + (s.num != null ? esc(String(s.num)) : (i + 1)) + '</span>' +
          (textonly ? "" : '<span class="cs-ts">▶ ' + mmss(s.t) + '</span>') +
          (s.q != null ? '<button class="cs-quick">⚡ straight to it</button>' : '') +
          '<button class="cs-flag" title="Doesn\'t match mine">🚩</button></div>' +
        '<div class="cs-title">' + esc(s.title || "") + '</div>' +
        (s.detail ? '<div class="cs-detail">' + esc(s.detail) + '</div>' : '') +
        (s.photo ? '<img class="cs-photo" src="' + esc(s.photo) + '" alt="">' + (s.photoCaption ? '<div class="cs-detail">' + esc(s.photoCaption) + '</div>' : '') : '') +
        (s.warn ? '<div class="cs-warn">⚠ ' + esc(s.warn) + '</div>' : '') +
        (s.adapt ? '<div class="cs-adapt">✅ ' + esc(s.adapt) + '</div>' : '') +
        '<div class="cs-flagnote">🚩 Flagged as “doesn’t match ours”. In the full app this sends feedback and the step gets rebuilt. Tap the flag again to undo.</div>' +
      '</div>';

    card.querySelector(".cs-tick").addEventListener("click", function (e) { e.stopPropagation(); toggleDone(i); });
    card.querySelector(".cs-flag").addEventListener("click", function (e) { e.stopPropagation(); state.flag[i] = !state.flag[i]; save(); card.classList.toggle("flagged"); });
    var qb = card.querySelector(".cs-quick");
    if (qb) qb.addEventListener("click", function (e) { e.stopPropagation(); api.seek(s.q, true); });

    var tapTimer = null;
    card.addEventListener("click", function (e) {
      if (e.target.closest(".cs-flag,.cs-quick,.cs-tick")) return;
      if (tapTimer) {                                   // double-tap
        clearTimeout(tapTimer); tapTimer = null;
        var rect = card.getBoundingClientRect();
        var back = (e.clientX - rect.left) < rect.width / 2;
        api.seek(Math.max(0, api.cur() + (back ? -5 : 5)), true);
        return;
      }
      tapTimer = setTimeout(function () {
        tapTimer = null;
        if (textonly) { toggleDone(i); return; }
        if (ready) {
          var now = api.cur(), within = now >= s.t && (s.end == null || now < s.end), st = isYT ? player.getPlayerState() : (player.paused ? 2 : 1);
          if (within && st === 1) player.pauseVideo ? player.pauseVideo() : player.pause();
          else if (within && st === 2) api.seek(now, true);
          else api.seek(s.t, true);
        }
      }, 260);
    });
    stepsEl.appendChild(card);
  });

  function toggleDone(i) { state.done[i] = !state.done[i]; save(); render(); }

  function render() {
    var done = 0;
    mount.querySelectorAll(".cs-step").forEach(function (c) {
      var i = c.dataset.i;
      c.classList.toggle("done", !!state.done[i]);
      c.classList.toggle("flagged", !!state.flag[i]);
      if (state.done[i]) done++;
    });
    var total = G.steps.length;
    mount.querySelector("#cs-bar").style.width = (total ? done / total * 100 : 0) + "%";
    mount.querySelector("#cs-plabel").textContent = (done === total && total) ? "All done 🎉" : done + " of " + total + " done";
  }

  // highlight the playing step
  setInterval(function () {
    if (!ready) return;
    var t = api.cur();
    mount.querySelectorAll(".cs-step").forEach(function (c) {
      var s = G.steps[c.dataset.i];
      c.classList.toggle("playing", s.t != null && t >= s.t && (s.end == null || t < s.end));
    });
  }, 500);

  // ---- Mount video ----
  var box = mount.querySelector("#cs-video");
  if (isYT) {
    box.innerHTML = '<div id="cs-ytframe"></div>';
    var tag = document.createElement("script"); tag.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = function () {
      player = new YT.Player("cs-ytframe", { videoId: G.source.videoId, playerVars: { playsinline: 1, rel: 0, modestbranding: 1 }, events: { onReady: function () { ready = true; }, onStateChange: function (e) { if (e.data === 1) started = true; } } });
    };
  } else if (G.source && G.source.type === "file") {
    box.innerHTML = '<video id="cs-vid" controls playsinline preload="metadata" src="' + esc(G.source.src) + '"></video>';
    player = box.querySelector("#cs-vid");
    player.addEventListener("loadedmetadata", function () { ready = true; });
  }

  render();
})();
