(function () {
  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function initPlayer(root) {
    var audioSrc = root.getAttribute("data-audio-src");
    var transcriptSrc = root.getAttribute("data-transcript-src");
    if (!audioSrc) return;

    var audio = new Audio(audioSrc);
    var playBtn = root.querySelector(".audio-playpause");
    var track = root.querySelector(".audio-progress-track");
    var fill = root.querySelector(".audio-progress-fill");
    var handle = root.querySelector(".audio-progress-handle");
    var currentEl = root.querySelector(".audio-time-current");
    var durationEl = root.querySelector(".audio-time-duration");
    var transcriptEl = root.querySelector(".transcript-text");

    var words = [];
    var wordEls = [];
    var activeIndex = -1;

    function setProgress(fraction) {
      fraction = Math.max(0, Math.min(1, fraction));
      var pct = (fraction * 100) + "%";
      fill.style.width = pct;
      handle.style.left = pct;
      track.setAttribute("aria-valuenow", Math.round(fraction * 100));
    }

    function seekToFraction(fraction) {
      if (!isFinite(audio.duration)) return;
      audio.currentTime = fraction * audio.duration;
    }

    track.addEventListener("click", function (e) {
      var rect = track.getBoundingClientRect();
      var fraction = (e.clientX - rect.left) / rect.width;
      seekToFraction(fraction);
    });

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
      if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
    });

    playBtn.addEventListener("click", function () {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", function () {
      root.classList.add("is-playing");
    });

    audio.addEventListener("pause", function () {
      root.classList.remove("is-playing");
    });

    audio.addEventListener("ended", function () {
      root.classList.remove("is-playing");
      setProgress(0);
    });

    audio.addEventListener("loadedmetadata", function () {
      durationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", function () {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration);
      }
      currentEl.textContent = formatTime(audio.currentTime);
      updateActiveWord(audio.currentTime);
    });

    function setActive(index) {
      if (index === activeIndex) return;
      if (activeIndex >= 0 && wordEls[activeIndex]) {
        wordEls[activeIndex].classList.remove("is-active");
      }
      if (index >= 0 && wordEls[index]) {
        wordEls[index].classList.add("is-active");
        wordEls[index].scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      }
      activeIndex = index;
    }

    function updateActiveWord(time) {
      if (!words.length) return;

      // Fast paths: playback almost always stays on the same word or
      // advances to the next one, so avoid a full scan on every tick.
      if (activeIndex >= 0 && time >= words[activeIndex].start && time < words[activeIndex].end) {
        return;
      }
      if (activeIndex + 1 < words.length) {
        var next = words[activeIndex + 1];
        if (time >= next.start && time < next.end) {
          setActive(activeIndex + 1);
          return;
        }
      }

      var found = -1;
      for (var i = 0; i < words.length; i++) {
        if (time >= words[i].start && time < words[i].end) {
          found = i;
          break;
        }
      }
      setActive(found);
    }

    if (transcriptSrc) {
      fetch(transcriptSrc)
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          words = data;
          transcriptEl.innerHTML = "";
          words.forEach(function (w, i) {
            var span = document.createElement("span");
            span.className = "transcript-word";
            span.textContent = w.word;
            span.setAttribute("data-index", i);
            span.addEventListener("click", function () {
              audio.currentTime = w.start;
              audio.play();
            });
            transcriptEl.appendChild(span);
            transcriptEl.appendChild(document.createTextNode(" "));
            wordEls.push(span);
          });
        })
        .catch(function () {
          transcriptEl.textContent = "Transcript unavailable.";
        });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var players = document.querySelectorAll(".audio-transcript");
    players.forEach(initPlayer);
  });
})();
