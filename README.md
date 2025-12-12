# Frame Builder Maintenance Guide

Guidelines for updating and maintaining each part of this small, static web app.

## Project layout
- `index.html` – Markup, controls, data attributes used by the guided tour.
- `style.css` – Theme tokens, layout, and component styling.
- `app.js` – Canvas rendering, state management, photo/text controls, filters, download flow.
- `guide.js` – Driver.js onboarding tour configuration.
- `assets/` – Frame artwork (SVG/PNG). Current default: `cambodia-frame.svg`.

## Running locally
- No build step; open `index.html` in a browser or serve the folder with any static server.

## Canvas and state
- `CANVAS_SIZE` (default 1080) sets the square export size; keep frame assets matching this resolution for sharp output.
- `PHOTO_MASK_RADIUS` (default 360) clips the uploaded photo to a centered circle; adjust to match the inner opening of your frame art.
- `DOWNLOAD_NAME` controls the saved filename.
- State shape is in `state` near the top of `app.js`; extend it if you add new controls so rendering can stay centralized in `renderCanvas()`.

### Key functions (app.js)
- `renderCanvas()` – Single render pass: clears, draws photo (with filters), text, and frame; also toggles download button availability.
- `drawUserPhoto()` – Applies scale/rotation/offset and active filters to the uploaded photo before drawing.
- `drawText()/drawDecorations()` – Renders each text item and optional underline/strikethrough.
- `measureTextRect()` – Returns width/height used for hit-testing outlines and decoration placement.
- `loadFrame(src)` – Loads a frame image and marks `state.frameReady` when done.
- `handlePhoto(file)` – Validates, reads, and loads an uploaded image; resets transforms and updates status text.
- `resetPhotoTransform()` – Resets zoom, rotation, and offsets; also syncs UI slider labels.
- `buildFilterString(includeBlur)` – Builds the CSS filter string from the active preset plus optional blur.
- `hitTestText(point)` – Finds the topmost text under the pointer for drag selection.
- Pointer handlers on `canvas` (`pointerdown/move/up`) – Start and track drag for photo or selected text using canvas-space coordinates.
- UI sync helpers (`syncTextControls()`, `syncStyleButtons()`, `setActiveSwatch()`) – Keep form controls in sync with the currently active text item or defaults.

## Frames
- Add new frames by placing artwork in `assets/` and adding an entry to the `frames` array in `app.js` (`id`, `name`, `src`). The dropdown is auto-populated from this array; no manual HTML options needed.
- Keep assets square; if you change `CANVAS_SIZE`, adjust asset dimensions accordingly.
- Sample frames included for testing: `cambodia-frame.svg`, `sunrise-frame.svg`, `solidarity-ribbon-frame.svg`, `minimal-mono-frame.svg`.
- Frame picking flow: the landing view shows cards from the `frames` array (`#frameCardGrid`). Clicking a card calls `selectFrame()` to load it, highlights the card, updates the dropdown, and switches to the builder view. Use `#changeFrameBtn` to return to the card view.
- To change the default landing frame or order: edit the `frames` array; cards and the dropdown will reflect the order. The first entry is treated as the default selection when the user picks a card and enters the builder.
- To customize card rendering: adjust `renderFrameCards()` in `app.js` for markup or labels, and `.frame-card*` styles in `style.css` for spacing/visuals.

## Photo controls
- Sliders: `#photoZoom` (10–200%) and `#photoRotate` (-180–180). Update ranges in HTML and defaults in `resetPhotoTransform()` if you change behavior.
- Dragging logic uses `state.photoOffset` and pointer events in `app.js`; keep coordinates in canvas space (0–1080 by default).
- Blur and filters use `buildFilterString()`. Add CSS filter strings to `filterPresets` and a matching `.filter-chip` button in `index.html` to expose them.
- To change the initial message/flow, update `setStatus()` calls near photo loading and preview actions.

## Text controls
- Defaults live in `textDefaults`; adjust size, weight, and decoration defaults there.
- Colors are defined by `.color-swatch` buttons in `index.html`; add/remove swatches there and keep `textDefaults.color` aligned.
- Fonts: imports at the top of `style.css`; add a new `@import` and a `<option>` in `#fontFamily` to expose it.
- Sizing/rotation ranges come from `#textSize` and `#textRotation` inputs; update their min/max values alongside the display text in `syncTextControls()`.
- System color presets: `#systemColor` dropdown maps to `systemColors` in `app.js` (linux/windows/macos). Update the map to change preset hex values.
- Layer toggle: `#textOverFrame` lets you render text above the frame (checked) or sandwiched between the photo and frame (unchecked) to suit different artworks.
- Text bounding/drag math sits in `measureTextRect()`, `hitTestText()`, and pointer handlers; keep units consistent with `CANVAS_SIZE` if you change canvas size.

## Filters
- `filterPresets` in `app.js` holds the CSS filter strings. Add a new key there and a matching `.filter-chip` with `data-filter` in `index.html`.
- Filters affect the photo and frame; text is drawn without filters. Adjust `renderCanvas()` if you need different layering rules.

## Drag and drop
- Drop zone: `#dropZone` handlers (dragenter/over/leave/drop) set styling and forward the file to `handlePhoto()`.
- Canvas drag: pointer events on `canvas` manage dragging of the photo or active text using `state.drag`; keep coordinates normalized to `CANVAS_SIZE` if you change size.

## UI and styling
- Theme tokens are CSS variables in `:root` within `style.css`. Change colors or radii there to retheme quickly.
- Components (buttons, chips, accordions, file picker) are styled in dedicated blocks; tweak spacing and breakpoints in the media queries at the bottom.
- For new controls, follow existing utility classes (`btn`, `ghost`, `chip`, `tool-card`) for consistent sizing and states.

## Guided tour
- `guide.js` depends on the Driver.js CDN linked in `index.html`. Each step targets a `[data-tour="..."]` marker.
- Add or reorder steps by editing the `steps` array; ensure any new control has a unique `data-tour` attribute in the HTML.

## Download flow
- The download button is disabled until a photo loads. Logic lives in `renderCanvas()` and the `downloadBtn` click handler; update there if you change the enable/disable criteria.
- `canvas.toBlob()` creates the PNG; change to `toDataURL("image/jpeg", quality)` if you need JPEG output.

## Assets and cache-busting
- Keep image assets in `assets/` and reference them with relative paths.
- Simple cache-busting query params on `<link>`/`<script>` tags (`?id=...`) can be updated manually after asset or script changes.
