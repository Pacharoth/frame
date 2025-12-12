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
const fontFamilySelect = document.getElementById("fontFamily");
const styleToggleButtons = Array.from(document.querySelectorAll(".chip[data-style]"));
const textSizeInput = document.getElementById("textSize");
const textSizeValue = document.getElementById("textSizeValue");
const textRotationInput = document.getElementById("textRotation");
const textRotationValue = document.getElementById("textRotationValue");
const textOverFrameToggle = document.getElementById("textOverFrame");
const frameSelectionView = document.getElementById("frameSelectionView");
const builderView = document.getElementById("builderView");
const frameCardGrid = document.getElementById("frameCardGrid");
const changeFrameBtn = document.getElementById("changeFrameBtn");
const selectedFrameLabel = document.getElementById("selectedFrameLabel");
const colorPalette = document.getElementById("colorPalette");
const dropZone = document.getElementById("dropZone");
const filterRow = document.getElementById("filterRow");
const accordions = Array.from(document.querySelectorAll(".accordion"));

const CANVAS_SIZE = 1080;
const PHOTO_MASK_RADIUS = 360; // Circular clip radius for the uploaded photo (centered on the canvas)
const DOWNLOAD_NAME = "wewillneverforget-hero.png";
const textDefaults = {
  size: 36,
  color: "#000000",
  rotation: 0,
  fontFamily: "'Battambang', 'Helvetica Neue', Arial, sans-serif",
  weight: 800,
  italic: false,
  underline: false,
  strike: false,
};

const frames = [
  {
    id: "frame1_l",
    name: "Frame 1 (L)",
    src: "assets/Frame1_with_letter.png",
  },
  {
    id: "frame1",
    name: "Frame 1",
    src: "assets/Frame1.png",
  },
  {
    id: "frame2_l",
    name: "Frame 2 (L)",
    src: "assets/Frame2_with_letter.png",
  },
    {
    id: "frame2",
    name: "Frame 2",
    src: "assets/Frame2.png",
  },
  {
    id: "frame3_l",
    name: "Frame 3 (L)",
    src: "assets/Frame3_with_letter.png",
  },
   {
    id: "frame3",
    name: "Frame 3",
    src: "assets/Frame3.png",
  },
  {
    id: "frame4_l",
    name: "Frame 4 (L)",
    src: "assets/Frame4_with_letter.png",
  },
  {
    id: "frame5_l",
    name: "Frame 5 (L)",
    src: "assets/Frame5_with_letter.png",
  },
    {
    id: "frame5_1",
    name: "Frame 5 (1)",
    src: "assets/Frame5_1.png"
  },
  {
    id: "frame5",
    name: "Frame 5",
    src: "assets/Frame5.png"
  },
];

function populateFrameChooser() {
  if (!frameChooser) return;
  frameChooser.innerHTML = "";
  frames.forEach((frame, index) => {
    const option = document.createElement("option");
    option.value = frame.src;
    option.textContent = frame.name;
    option.dataset.frameId = frame.id;
    if (index === 0) option.selected = true;
    frameChooser.appendChild(option);
  });
}

function renderFrameCards() {
  if (!frameCardGrid) return;
  frameCardGrid.innerHTML = "";
  frames.forEach((frame) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "frame-card";
    card.dataset.frameId = frame.id;
    card.innerHTML = `
      <div class="frame-thumb">
        <img src="${frame.src}" alt="${frame.name}">
      </div>
      <div class="frame-meta">
        <p class="frame-name">${frame.name}</p>
        <span class="frame-badge">Select</span>
      </div>
    `;
    card.addEventListener("click", () => {
      selectFrame(frame);
    });
    frameCardGrid.appendChild(card);
  });
}

function showFrameSelection() {
  if (frameSelectionView) frameSelectionView.classList.remove("view-hidden");
  if (builderView) builderView.classList.add("view-hidden");
}

function showBuilderView() {
  if (frameSelectionView) frameSelectionView.classList.add("view-hidden");
  if (builderView) builderView.classList.remove("view-hidden");
}

function highlightFrameCard(frameId) {
  if (!frameCardGrid) return;
  frameCardGrid.querySelectorAll(".frame-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.frameId === frameId);
  });
}

function syncFrameSelectionUI(frame) {
  state.activeFrameId = frame.id;
  if (frameChooser) frameChooser.value = frame.src;
  if (selectedFrameLabel) selectedFrameLabel.textContent = frame.name;
  highlightFrameCard(frame.id);
}

const filterPresets = {
  original: "none",
  calusa: "contrast(1.05) saturate(1.25) hue-rotate(-8deg)",
  cannes: "brightness(1.05) saturate(1.15) contrast(1.05)",
  melawai: "contrast(1.1) saturate(1.1) hue-rotate(12deg)",
  mono: "grayscale(1) contrast(1.05)",
};

const state = {
  userImage: null,
  frameImage: null,
  frameReady: false,
  photoScale: 1,
  photoRotation: 0,
  photoOffset: { x: 0, y: 0 },
  blurBackground: false,
  textOverFrame: true,
  filter: "original",
  texts: [],
  activeTextId: null,
  activeFrameId: null,
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
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function getBaseImageScale(img) {
  return Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
}

function drawUserPhoto() {
  if (!state.userImage) return;
  const base = getBaseImageScale(state.userImage);
  const scale = base * state.photoScale;

  const filterString = buildFilterString(true);

  ctx.save();
  ctx.beginPath();
  ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, PHOTO_MASK_RADIUS, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(CANVAS_SIZE / 2 + state.photoOffset.x, CANVAS_SIZE / 2 + state.photoOffset.y);
  ctx.rotate((state.photoRotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.filter = filterString;
  ctx.drawImage(state.userImage, -state.userImage.width / 2, -state.userImage.height / 2);
  ctx.restore();
  ctx.filter = "none";
}

function setFontForItem(item) {
  const weight = item.weight || textDefaults.weight;
  const italic = item.italic ? "italic " : "";
  const fontFamily = item.fontFamily || textDefaults.fontFamily;
  ctx.font = `${italic}${weight} ${item.size}px ${fontFamily}`;
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
  drawDecorations(item);
  ctx.restore();
}

function drawDecorations(item) {
  if (!item.underline && !item.strike) return;
  const { width, height } = measureTextRect(item);
  const lineWidth = Math.max(2, item.size * 0.06);
  ctx.save();
  setFontForItem(item);
  ctx.strokeStyle = item.color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  if (item.underline) {
    const y = height / 2 + lineWidth;
    ctx.beginPath();
    ctx.moveTo(-width / 2, y);
    ctx.lineTo(width / 2, y);
    ctx.stroke();
  }
  if (item.strike) {
    ctx.beginPath();
    ctx.moveTo(-width / 2, 0);
    ctx.lineTo(width / 2, 0);
    ctx.stroke();
  }
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

function drawTextsLayer() {
  state.texts.forEach((text) => drawText(text));
  const activeText = getActiveText();
  if (activeText) {
    drawTextOutline(activeText);
  }
}

function renderCanvas() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  if (state.userImage) {
    drawUserPhoto();
  } else {
    drawPlaceholder();
  }

  if (!state.textOverFrame) {
    drawTextsLayer(); // text between photo and frame
  }

  if (state.frameReady && state.frameImage) {
    ctx.save();
    ctx.filter = buildFilterString(false);
    ctx.drawImage(state.frameImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.restore();
  }

  if (state.textOverFrame) {
    drawTextsLayer(); // text above frame
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

async function selectFrame(frame) {
  if (!frame) return;
  try {
    state.frameReady = false;
    setStatus("Loading frame…");
    await loadFrame(frame.src);
    syncFrameSelectionUI(frame);
    showBuilderView();
    setStatus("Frame ready. Upload a photo to get started.");
    renderCanvas();
  } catch (error) {
    console.error(error);
    setStatus("Could not load the frame asset.");
  }
}

function getFrameBySrc(src) {
  return frames.find((frame) => frame.src === src) || null;
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
  if (!file.type.startsWith("image/")) {
    setStatus("Please drop an image file.");
    return;
  }
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
  const hasActive = Boolean(active);
  if (active) {
    textInput.value = active.text;
    textSizeInput.value = active.size;
    textRotationInput.value = active.rotation;
    textSizeValue.textContent = `${active.size}px`;
    textRotationValue.textContent = `${active.rotation}°`;
    setActiveSwatch(active.color);
    fontFamilySelect.value = active.fontFamily;
    syncStyleButtons(active);
  } else {
    textSizeValue.textContent = `${textSizeInput.value}px`;
    textRotationValue.textContent = `${textRotationInput.value}°`;
    fontFamilySelect.value = textDefaults.fontFamily;
    syncStyleButtons(textDefaults);
  }
  doneTextBtn.disabled = !hasActive;
  deleteTextBtn.disabled = !hasActive;
  textSizeInput.disabled = !hasActive;
  textRotationInput.disabled = !hasActive;
}

function syncStyleButtons(item) {
  styleToggleButtons.forEach((btn) => {
    const key = btn.dataset.style;
    if (key === "bold") {
      const weight = item.weight || textDefaults.weight;
      btn.classList.toggle("active", weight >= 700);
    } else {
      btn.classList.toggle("active", Boolean(item[key]));
    }
  });
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
    fontFamily: textDefaults.fontFamily,
    weight: textDefaults.weight,
    italic: textDefaults.italic,
    underline: textDefaults.underline,
    strike: textDefaults.strike,
  };
  state.texts.push(newText);
  setActiveText(newText);
  setStatus("Text added. Drag to position; adjust size or rotation, then hit Done.");
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
  setStatus("Text removed.");
}

function buildFilterString(includeBlur) {
  const preset = filterPresets[state.filter] || filterPresets.original;
  const pieces = [];
  if (includeBlur && state.blurBackground) {
    pieces.push("blur(6px)");
  }
  if (preset && preset !== "none") {
    pieces.push(preset);
  }
  return pieces.join(" ").trim() || "none";
}

photoInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  handlePhoto(file);
});

["dragenter", "dragover"].forEach((evt) => {
  dropZone.addEventListener(evt, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((evt) => {
  dropZone.addEventListener(evt, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.remove("dragover");
  });
});

dropZone.addEventListener("drop", (event) => {
  const [file] = event.dataTransfer.files;
  handlePhoto(file);
});

frameChooser.addEventListener("change", async (event) => {
  const src = event.target.value;
  const frame = getFrameBySrc(src);
  if (frame) {
    selectFrame(frame);
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

if (textOverFrameToggle) {
  textOverFrameToggle.addEventListener("change", (event) => {
    state.textOverFrame = event.target.checked;
    renderCanvas();
  });
}

if (changeFrameBtn) {
  changeFrameBtn.addEventListener("click", () => {
    showFrameSelection();
    setStatus("Pick a frame to continue.");
  });
}

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
textInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addText();
  }
});
textSizeInput.addEventListener("input", updateActiveTextSize);
textRotationInput.addEventListener("input", updateActiveTextRotation);

fontFamilySelect.addEventListener("change", (event) => {
  const value = event.target.value;
  textDefaults.fontFamily = value;
  const active = getActiveText();
  if (active) {
    active.fontFamily = value;
    renderCanvas();
  }
});

styleToggleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.style;
    const next = !btn.classList.contains("active");
    btn.classList.toggle("active", next);
    if (key === "bold") {
      const weight = next ? 800 : 500;
      textDefaults.weight = weight;
      const active = getActiveText();
      if (active) active.weight = weight;
    } else {
      textDefaults[key] = next;
      const active = getActiveText();
      if (active) active[key] = next;
    }
    renderCanvas();
  });
});

accordions.forEach((accordion) => {
  accordion.addEventListener("toggle", () => {
    if (!accordion.open) return;
    accordions.forEach((other) => {
      if (other !== accordion) other.removeAttribute("open");
    });
  });
});

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

filterRow.addEventListener("click", (event) => {
  const chip = event.target.closest(".filter-chip");
  if (!chip) return;
  const { filter } = chip.dataset;
  state.filter = filter;
  Array.from(filterRow.querySelectorAll(".filter-chip")).forEach((node) => {
    node.classList.toggle("active", node.dataset.filter === filter);
  });
  renderCanvas();
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
state.textOverFrame = textOverFrameToggle ? textOverFrameToggle.checked : true;
populateFrameChooser();
renderFrameCards();
showFrameSelection();
setStatus("Select a frame to get started.");
renderCanvas();
