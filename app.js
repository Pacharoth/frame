const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");
const photoInput = document.getElementById("photoInput");
const frameChooser = document.getElementById("frameChooser");
const previewBtn = document.getElementById("previewBtn");
const downloadBtn = document.getElementById("downloadBtn");
const statusText = document.getElementById("statusText");
const photoZoom = document.getElementById("photoZoom");
const photoZoomValue = document.getElementById("photoZoomValue");
const photoRotate = document.getElementById("photoRotate");
const photoRotateValue = document.getElementById("photoRotateValue");
const blurToggle = document.getElementById("blurToggle");
const resetPhotoBtn = document.getElementById("resetPhotoBtn");
const textInput = document.getElementById("textInput");
const addTextBtn = document.getElementById("addTextBtn");
const doneTextBtn = document.getElementById("doneTextBtn");
const deleteTextBtn = document.getElementById("deleteTextBtn");
const textSizeInput = document.getElementById("textSize");
const textSizeValue = document.getElementById("textSizeValue");
const textRotationInput = document.getElementById("textRotation");
const textRotationValue = document.getElementById("textRotationValue");
const colorPalette = document.getElementById("colorPalette");

const CANVAS_SIZE = 1080;
const DOWNLOAD_NAME = "wewillneverforget-hero.png";
const textDefaults = {
  size: 36,
  color: "#000000",
  rotation: 0,
  fontFamily: "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  weight: 800,
};

const frames = [
  {
    id: "hero",
    name: "#WeWillNeverForgetOurHero",
    src: "assets/cambodia-frame.svg",
  },
];

const state = {
  userImage: null,
  frameImage: null,
  frameReady: false,
  photoScale: 1,
  photoRotation: 0,
  photoOffset: { x: 0, y: 0 },
  blurBackground: false,
  texts: [],
  activeTextId: null,
  drag: {
    active: false,
    target: null,
    start: { x: 0, y: 0 },
    origin: { x: 0, y: 0 },
  },
};

function setStatus(message) {
  statusText.textContent = message;
}

function drawPlaceholder() {
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  gradient.addColorStop(0, "#1b2948");
  gradient.addColorStop(1, "#0f1629");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let x = -40; x < CANVAS_SIZE + 40; x += 80) {
    ctx.fillRect(x, 0, 40, CANVAS_SIZE);
  }
}

function getBaseImageScale(img) {
  return Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
}

function drawUserPhoto() {
  if (!state.userImage) return;
  const base = getBaseImageScale(state.userImage);
  const scale = base * state.photoScale;

  ctx.save();
  ctx.translate(CANVAS_SIZE / 2 + state.photoOffset.x, CANVAS_SIZE / 2 + state.photoOffset.y);
  ctx.rotate((state.photoRotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.filter = state.blurBackground ? "blur(6px)" : "none";
  ctx.drawImage(state.userImage, -state.userImage.width / 2, -state.userImage.height / 2);
  ctx.restore();
  ctx.filter = "none";
}

function setFontForItem(item) {
  ctx.font = `${textDefaults.weight} ${item.size}px ${textDefaults.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
}

function measureTextRect(item) {
  setFontForItem(item);
  const metrics = ctx.measureText(item.text || "");
  const width = metrics.width || item.size * 0.8;
  const height = item.size * 1.2;
  return { width, height };
}

function drawText(item) {
  if (!item) return;
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate((item.rotation * Math.PI) / 180);
  setFontForItem(item);
  ctx.fillStyle = item.color;
  ctx.fillText(item.text, 0, 0);
  ctx.restore();
}

function drawTextOutline(item) {
  const { width, height } = measureTextRect(item);
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate((item.rotation * Math.PI) / 180);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(-width / 2 - 8, -height / 2 - 8, width + 16, height + 16);
  ctx.restore();
  ctx.setLineDash([]);
}

function renderCanvas() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  if (state.userImage) {
    drawUserPhoto();
  } else {
    drawPlaceholder();
  }

  state.texts.forEach((text) => drawText(text));
  const activeText = getActiveText();
  if (activeText) {
    drawTextOutline(activeText);
  }

  if (state.frameReady && state.frameImage) {
    ctx.drawImage(state.frameImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  downloadBtn.disabled = !state.userImage;
}

function loadFrame(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      state.frameImage = img;
      state.frameReady = true;
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
}

function resetPhotoTransform() {
  state.photoScale = 1;
  state.photoRotation = 0;
  state.photoOffset = { x: 0, y: 0 };
  photoZoom.value = 100;
  photoRotate.value = 0;
  photoZoomValue.textContent = "100%";
  photoRotateValue.textContent = "0°";
}

function handlePhoto(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      state.userImage = img;
      resetPhotoTransform();
      setStatus("Photo loaded. Preview refreshed—download when ready.");
      renderCanvas();
    };
    img.onerror = () => setStatus("Could not read that image, try another file.");
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function getPointerPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = ((evt.clientX - rect.left) / rect.width) * CANVAS_SIZE;
  const y = ((evt.clientY - rect.top) / rect.height) * CANVAS_SIZE;
  return { x, y };
}

function hitTestText(point) {
  for (let i = state.texts.length - 1; i >= 0; i--) {
    const text = state.texts[i];
    const { width, height } = measureTextRect(text);
    const angle = (text.rotation * Math.PI) / 180;
    const dx = point.x - text.x;
    const dy = point.y - text.y;
    const rx = dx * Math.cos(-angle) - dy * Math.sin(-angle);
    const ry = dx * Math.sin(-angle) + dy * Math.cos(-angle);
    const pad = 10;
    if (rx >= -width / 2 - pad && rx <= width / 2 + pad && ry >= -height / 2 - pad && ry <= height / 2 + pad) {
      return text;
    }
  }
  return null;
}

function setActiveText(text) {
  state.activeTextId = text ? text.id : null;
  syncTextControls();
}

function getActiveText() {
  if (!state.activeTextId) return null;
  return state.texts.find((t) => t.id === state.activeTextId) || null;
}

function syncTextControls() {
  const active = getActiveText();
  if (active) {
    textInput.value = active.text;
    textSizeInput.value = active.size;
    textRotationInput.value = active.rotation;
    textSizeValue.textContent = `${active.size}px`;
    textRotationValue.textContent = `${active.rotation}°`;
    setActiveSwatch(active.color);
  } else {
    textSizeValue.textContent = `${textSizeInput.value}px`;
    textRotationValue.textContent = `${textRotationInput.value}°`;
  }
}

function addText() {
  const content = textInput.value.trim() || "Enter your text";
  const newText = {
    id: `text-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: content,
    x: CANVAS_SIZE / 2,
    y: CANVAS_SIZE / 2,
    color: getActiveSwatchColor(),
    size: parseInt(textSizeInput.value, 10) || textDefaults.size,
    rotation: parseInt(textRotationInput.value, 10) || textDefaults.rotation,
  };
  state.texts.push(newText);
  setActiveText(newText);
  setStatus("Text added. Drag to position; adjust size or rotation as needed.");
  renderCanvas();
}

function updateActiveTextFromInput() {
  const active = getActiveText();
  if (!active) return;
  active.text = textInput.value || "";
  renderCanvas();
}

function updateActiveTextSize() {
  const size = parseInt(textSizeInput.value, 10);
  textSizeValue.textContent = `${size}px`;
  const active = getActiveText();
  if (active) {
    active.size = size;
    renderCanvas();
  }
}

function updateActiveTextRotation() {
  const rotation = parseInt(textRotationInput.value, 10);
  textRotationValue.textContent = `${rotation}°`;
  const active = getActiveText();
  if (active) {
    active.rotation = rotation;
    renderCanvas();
  }
}

function setActiveSwatch(color) {
  const swatches = Array.from(colorPalette.querySelectorAll(".color-swatch"));
  swatches.forEach((swatch) => {
    swatch.classList.toggle("active", swatch.dataset.color === color);
  });
  textDefaults.color = color;
}

function getActiveSwatchColor() {
  const swatch = colorPalette.querySelector(".color-swatch.active");
  return swatch ? swatch.dataset.color : textDefaults.color;
}

function deleteActiveText() {
  if (!state.activeTextId) return;
  state.texts = state.texts.filter((t) => t.id !== state.activeTextId);
  setActiveText(null);
  renderCanvas();
}

photoInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  handlePhoto(file);
});

frameChooser.addEventListener("change", async (event) => {
  const src = event.target.value;
  try {
    state.frameReady = false;
    setStatus("Loading frame…");
    await loadFrame(src);
    setStatus("Frame ready. Upload a photo to get started.");
    renderCanvas();
  } catch (error) {
    console.error(error);
    setStatus("Could not load the frame asset.");
  }
});

photoZoom.addEventListener("input", (event) => {
  const value = parseInt(event.target.value, 10) / 100;
  state.photoScale = value;
  photoZoomValue.textContent = `${Math.round(value * 100)}%`;
  renderCanvas();
});

photoRotate.addEventListener("input", (event) => {
  const value = parseInt(event.target.value, 10);
  state.photoRotation = value;
  photoRotateValue.textContent = `${value}°`;
  renderCanvas();
});

blurToggle.addEventListener("change", (event) => {
  state.blurBackground = event.target.checked;
  renderCanvas();
});

resetPhotoBtn.addEventListener("click", () => {
  resetPhotoTransform();
  renderCanvas();
});

addTextBtn.addEventListener("click", addText);
doneTextBtn.addEventListener("click", () => {
  setActiveText(null);
  setStatus("Text locked. Click again to edit or move.");
  renderCanvas();
});
deleteTextBtn.addEventListener("click", deleteActiveText);
textInput.addEventListener("input", updateActiveTextFromInput);
textSizeInput.addEventListener("input", updateActiveTextSize);
textRotationInput.addEventListener("input", updateActiveTextRotation);

colorPalette.addEventListener("click", (event) => {
  const target = event.target.closest(".color-swatch");
  if (!target) return;
  const color = target.dataset.color;
  setActiveSwatch(color);
  const active = getActiveText();
  if (active) {
    active.color = color;
    renderCanvas();
  }
});

previewBtn.addEventListener("click", () => {
  if (!state.userImage) {
    setStatus("Upload a photo first.");
    return;
  }
  setStatus("Preview updated.");
  renderCanvas();
});

downloadBtn.addEventListener("click", () => {
  if (!state.userImage) return;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement("a");
    link.download = DOWNLOAD_NAME;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  });
});

canvas.addEventListener("pointerdown", (event) => {
  const pos = getPointerPos(event);
  const hitText = hitTestText(pos);
  if (hitText) {
    setActiveText(hitText);
    state.drag = {
      active: true,
      target: hitText.id,
      start: pos,
      origin: { x: hitText.x, y: hitText.y },
    };
    return;
  }
  if (state.userImage) {
    setActiveText(null);
    state.drag = {
      active: true,
      target: "photo",
      start: pos,
      origin: { x: state.photoOffset.x, y: state.photoOffset.y },
    };
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (!state.drag.active) return;
  const pos = getPointerPos(event);
  const dx = pos.x - state.drag.start.x;
  const dy = pos.y - state.drag.start.y;

  if (state.drag.target === "photo") {
    state.photoOffset.x = state.drag.origin.x + dx;
    state.photoOffset.y = state.drag.origin.y + dy;
  } else {
    const text = state.texts.find((t) => t.id === state.drag.target);
    if (text) {
      text.x = state.drag.origin.x + dx;
      text.y = state.drag.origin.y + dy;
    }
  }
  renderCanvas();
});

["pointerup", "pointerleave", "pointercancel"].forEach((evtName) => {
  canvas.addEventListener(evtName, () => {
    state.drag.active = false;
    state.drag.target = null;
  });
});

setActiveSwatch(getActiveSwatchColor());
syncTextControls();

// Initial load
loadFrame(frames[0].src)
  .then(() => {
    setStatus("Frame ready. Upload a photo to get started.");
    renderCanvas();
  })
  .catch(() => setStatus("Could not load the frame asset."));
