const gridEl = document.getElementById("grid");
const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggleLabels");

let showNames = false;

// Monophonic playback
let currentAudio = null;
let currentButton = null;

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
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
  stopCurrent({ markPlayed: true });

  const audio = new Audio(src);
  currentAudio = audio;
  currentButton = buttonEl;

  buttonEl.classList.remove("is-ready", "is-played");
  buttonEl.classList.add("is-playing");

  const nowLabel = showNames
    ? (buttonEl.dataset.name || buttonEl.dataset.number || "")
    : (buttonEl.dataset.number || buttonEl.dataset.name || "");

  setStatus(`Playing: ${nowLabel}`.trim());

  audio.addEventListener("ended", () => {
    if (currentAudio === audio) currentAudio = null;
    if (currentButton === buttonEl) {
      buttonEl.classList.remove("is-playing");
      buttonEl.classList.add("is-played");
      currentButton = null;
    }
    setStatus("Ready");
  });

  audio.play().catch(() => {
    buttonEl.classList.remove("is-playing");
    buttonEl.classList.add("is-played");
    setStatus("Audio blocked: click once, then try again");
  });
}

function renderPadLabel(btn) {
  const number = btn.dataset.number || "";
  const name = btn.dataset.name || "";
  const text = showNames ? (name || number) : (number || name);

  const labelEl = btn.querySelector(".pad__label");
  if (labelEl) labelEl.textContent = text;
}

function makePad(item) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pad is-ready";

  const number = (item.number ?? "").toString();
  const name = (item.name ?? "").toString();

  btn.dataset.number = number;
  btn.dataset.name = name;

  // IMPORTANT: only one visible label element
  btn.innerHTML = `<div class="pad__label"></div>`;
  renderPadLabel(btn);

  const src = `./sounds/${encodeURIComponent(item.filename)}`;

  btn.addEventListener("click", () => {
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

function applyToggleUI() {
  if (toggleBtn) {
    toggleBtn.setAttribute("aria-pressed", String(showNames));
    toggleBtn.textContent = showNames ? "Show numbers" : "Show names";
  }
  gridEl.querySelectorAll(".pad").forEach(renderPadLabel);
}

async function init() {
  try {
    const manifest = await loadManifest();

    gridEl.innerHTML = "";
    manifest.forEach((item) => {
      if (!item || !item.filename) return;
      gridEl.appendChild(makePad(item));
    });

    setStatus(manifest.length ? "Ready" : "No sounds found");

    if (!toggleBtn) {
      console.warn('Toggle button not found. Add <button id="toggleLabels">…</button> to index.html');
      return;
    }

    toggleBtn.addEventListener("click", () => {
      showNames = !showNames;
      applyToggleUI();
    });

    // Optional keyboard shortcut: L
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "l") {
        showNames = !showNames;
        applyToggleUI();
      }
    });

    applyToggleUI();
  } catch (err) {
    console.error(err);
    setStatus("Error loading sounds. Check sounds.json + server.");
  }
}

init();