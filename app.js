const gridEl = document.getElementById("grid");
const statusEl = document.getElementById("status");

// Monophonic playback
let currentAudio = null;
let currentButton = null;

// Some browsers (especially iOS/Safari) are pickier; this flag is just for UI hints.
let audioUnlocked = false;

function setStatus(text) {
  statusEl.textContent = text;
}

function sanitizeLabel(label) {
  // Keep it simple; you can customize this later
  return label.replace(/[_-]+/g, " ").trim();
}

function stopCurrent({ markPlayed = true } = {}) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (currentButton) {
    currentButton.classList.remove("is-playing");
    if (markPlayed) currentButton.classList.add("is-played");
    currentButton = null;
  }
}

function playSound(src, buttonEl) {
  // Unlock UI state
  audioUnlocked = true;

  // Stop anything already playing
  stopCurrent({ markPlayed: true });

  // Start new audio
  const audio = new Audio(src);
  currentAudio = audio;
  currentButton = buttonEl;

  buttonEl.classList.remove("is-ready", "is-played");
  buttonEl.classList.add("is-playing");

  // Keep a consistent status line
  setStatus(`Playing: ${buttonEl.dataset.label || buttonEl.textContent}`);

  audio.addEventListener("ended", () => {
    // Only apply if this audio is still the current one
    if (currentAudio === audio) {
      currentAudio = null;
    }
    if (currentButton === buttonEl) {
      buttonEl.classList.remove("is-playing");
      buttonEl.classList.add("is-played");
      currentButton = null;
    }
    setStatus("Ready");
  });

  audio.addEventListener("error", () => {
    buttonEl.classList.remove("is-playing");
    buttonEl.classList.add("is-played");
    setStatus("Audio error (check file / server MIME types)");
  });

  audio.play().catch(() => {
    // Autoplay policies or other issues
    buttonEl.classList.remove("is-playing");
    buttonEl.classList.add("is-played");
    setStatus("Audio blocked: click once, then try again");
  });
}

function makePad({ filename, label }, index) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pad is-ready";
  btn.setAttribute("role", "gridcell");

  const niceLabel = sanitizeLabel(label || filename.replace(/\.[^.]+$/, ""));
  btn.dataset.label = niceLabel;

  // Display label + index
  btn.innerHTML = `
    <div class="pad__label">${niceLabel}</div>
    <div class="pad__meta">${String(index + 1).padStart(2, "0")}</div>
  `;

  const src = `./sounds/${encodeURIComponent(filename)}`;

  btn.addEventListener("click", () => {
    // If clicking the currently-playing pad, stop it (nice UX)
    if (currentButton === btn && currentAudio) {
      stopCurrent({ markPlayed: true });
      setStatus("Stopped");
      return;
    }
    playSound(src, btn);
  });

  return btn;
}

async function loadManifest() {
  setStatus("Loading sounds…");
  const res = await fetch("./sounds.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load sounds.json (${res.status})`);
  const manifest = await res.json();
  if (!Array.isArray(manifest)) throw new Error("sounds.json must be an array");
  return manifest;
}

async function init() {
  try {
    const manifest = await loadManifest();

    // Build grid
    gridEl.innerHTML = "";
    manifest.forEach((item, i) => {
      if (!item || !item.filename) return;
      gridEl.appendChild(makePad(item, i));
    });

    if (manifest.length === 0) {
      setStatus("No sounds found. Add files to /sounds and rebuild sounds.json");
    } else {
      setStatus("Ready");
    }

    // Optional: spacebar stops
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        stopCurrent({ markPlayed: true });
        setStatus("Stopped");
      }
    });
  } catch (err) {
    console.error(err);
    setStatus("Error loading sounds. Check sounds.json + server.");
  }
}

init();
