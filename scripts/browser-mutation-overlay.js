(function () {
  "use strict";

  const collectorPort = "__CODEX_BROWSER_MUTATION_PORT__";
  const collectorToken = "__CODEX_BROWSER_MUTATION_TOKEN__";
  const rootId = "codex-browser-mutation-root";
  const outlineId = "codex-browser-mutation-outline";
  const guideLayerId = "codex-browser-mutation-guides";
  const launcherId = "codex-browser-mutation-launcher";
  const styleId = "codex-browser-mutation-style";
  const hoverStyleId = "codex-browser-mutation-hover-style";
  const previewStateKey = "__codexBrowserMutationStylePreview";
  const panelMinWidth = 340;
  const panelMinHeight = 176;
  const snapThreshold = 6;
  const snapCandidateRadius = 240;
  const guideLogic = globalThis.__codexBrowserMutationGuideLogic;
  if (!guideLogic) {
    throw new Error("Browser Mutation move guide logic was not loaded.");
  }
  const styleProps = [
    "display",
    "position",
    "zIndex",
    "flexDirection",
    "justifyContent",
    "alignItems",
    "gap",
    "padding",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "margin",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "width",
    "height",
    "backgroundColor",
    "color",
    "borderColor",
    "borderRadius",
    "borderStyle",
    "borderWidth",
    "outlineColor",
    "outlineStyle",
    "outlineWidth",
    "boxShadow",
    "textDecoration",
    "transform",
    "filter",
    "backdropFilter",
    "opacity",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "textTransform",
    "lineHeight",
    "letterSpacing",
    "textAlign"
  ];
  const editableStyleFields = ["backgroundColor", "color", "borderColor", "borderRadius", "borderStyle", "borderWidth", "outlineColor", "outlineStyle", "outlineWidth", "boxShadow", "textDecoration", "transform", "filter", "backdropFilter", "display", "position", "zIndex", "flexDirection", "justifyContent", "alignItems", "width", "height", "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "margin", "marginTop", "marginRight", "marginBottom", "marginLeft", "gap", "fontSize", "opacity", "fontFamily", "fontWeight", "fontStyle", "textTransform", "textAlign", "lineHeight", "letterSpacing"];
  const helperStyleFields = new Set(["backgroundAlpha", "glassBlur", "glassSaturation"]);
  const inheritedStyleFields = new Set(["color", "fontFamily", "fontSize", "fontWeight", "fontStyle", "textTransform", "textAlign", "lineHeight", "letterSpacing"]);
  const subtreeHoverEffectFields = new Set(["opacity"]);
  const icons = {
    move: `<svg viewBox="0 0 256 256" aria-hidden="true"><line x1="128" y1="160" x2="128" y2="232"/><line x1="128" y1="96" x2="128" y2="24"/><polyline points="96 56 128 24 160 56"/><polyline points="96 200 128 232 160 200"/><line x1="96" y1="128" x2="24" y2="128"/><line x1="160" y1="128" x2="232" y2="128"/><polyline points="200 96 232 128 200 160"/><polyline points="56 96 24 128 56 160"/></svg>`,
    parent: `<svg viewBox="0 0 256 256" aria-hidden="true"><polyline points="168 128 216 176 168 224"/><polyline points="72 32 72 176 216 176"/></svg>`,
    up: `<svg viewBox="0 0 256 256" aria-hidden="true"><line x1="128" y1="216" x2="128" y2="40"/><polyline points="56 112 128 40 200 112"/></svg>`,
    down: `<svg viewBox="0 0 256 256" aria-hidden="true"><line x1="128" y1="40" x2="128" y2="216"/><polyline points="56 144 128 216 200 144"/></svg>`,
    capture: `<svg viewBox="0 0 256 256" aria-hidden="true"><line x1="128" y1="232" x2="128" y2="200"/><circle cx="128" cy="128" r="88"/><line x1="128" y1="24" x2="128" y2="56"/><line x1="24" y1="128" x2="56" y2="128"/><line x1="232" y1="128" x2="200" y2="128"/><circle cx="128" cy="128" r="32"/></svg>`,
    text: `<svg viewBox="0 0 256 256" aria-hidden="true"><line x1="128" y1="56" x2="128" y2="200"/><polyline points="56 88 56 56 200 56 200 88"/><line x1="96" y1="200" x2="160" y2="200"/></svg>`,
    style: `<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M16,216H92a52,52,0,1,0-52-52C40,200,16,216,16,216Z"/><path d="M112.41,116.16C131.6,90.29,179.46,32,224,32c0,44.54-58.29,92.4-84.16,111.59"/><path d="M133,90.64a84.39,84.39,0,0,1,32.41,32.41"/></svg>`,
    send: `<svg viewBox="0 0 256 256" aria-hidden="true"><line x1="108" y1="148" x2="160" y2="96"/><path d="M223.69,42.18a8,8,0,0,0-9.87-9.87l-192,58.22a8,8,0,0,0-1.25,14.93L108,148l42.54,87.42a8,8,0,0,0,14.93-1.25Z"/></svg>`,
    json: `<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M80,40c-64,0,0,88-64,88,64,0,0,88,64,88"/><path d="M176,40c64,0,0,88,64,88-64,0,0,88-64,88"/></svg>`,
    export: `<svg viewBox="0 0 256 256" aria-hidden="true"><line x1="128" y1="144" x2="128" y2="32"/><polyline points="216 144 216 208 40 208 40 144"/><polyline points="168 104 128 144 88 104"/></svg>`,
    clear: `<svg viewBox="0 0 256 256" aria-hidden="true"><line x1="200" y1="56" x2="56" y2="200"/><line x1="56" y1="56" x2="200" y2="200"/></svg>`,
    delete: `<svg viewBox="0 0 256 256" aria-hidden="true"><line x1="216" y1="56" x2="40" y2="56"/><line x1="104" y1="104" x2="104" y2="168"/><line x1="152" y1="104" x2="152" y2="168"/><path d="M200,56V208a8,8,0,0,1-8,8H64a8,8,0,0,1-8-8V56"/><path d="M168,56V40a16,16,0,0,0-16-16H104A16,16,0,0,0,88,40V56"/></svg>`,
    undo: `<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M80,80H168a56,56,0,0,1,0,112H96"/><polyline points="112 48 80 80 112 112"/></svg>`,
    check: `<svg viewBox="0 0 256 256" aria-hidden="true"><polyline points="40 136 96 192 216 64"/></svg>`,
    min: `<svg viewBox="0 0 256 256" aria-hidden="true"><line x1="40" y1="128" x2="216" y2="128"/></svg>`,
    dock: `<svg viewBox="0 0 256 256" aria-hidden="true"><rect x="48" y="40" width="160" height="176" rx="18"/><circle cx="128" cy="128" r="34"/><polyline points="116 116 128 128 140 116"/><polyline points="116 140 128 128 140 140"/></svg>`,
    info: `<span class="cbm-info-icon" aria-hidden="true">i</span>`,
    textStyle: `<span class="cbm-text-style-icon" aria-hidden="true">B</span>`,
    icon: `<svg viewBox="0 0 256 256" aria-hidden="true"><rect x="40" y="40" width="176" height="176" rx="24"/><path d="M96,144l32-32 32,32"/><circle cx="96" cy="88" r="12"/></svg>`,
    import: `<svg viewBox="0 0 256 256" aria-hidden="true"><path d="M48,216H208"/><path d="M128,32V168"/><polyline points="80 80 128 32 176 80"/></svg>`
  };
  const builtInIcons = {
    arrowUpRight: `<svg viewBox="0 0 256 256"><line x1="64" y1="192" x2="192" y2="64"/><polyline points="88 64 192 64 192 168"/></svg>`,
    chevronRight: `<svg viewBox="0 0 256 256"><polyline points="96 48 176 128 96 208"/></svg>`,
    paperPlane: `<svg viewBox="0 0 256 256"><line x1="108" y1="148" x2="160" y2="96"/><path d="M223.69,42.18a8,8,0,0,0-9.87-9.87l-192,58.22a8,8,0,0,0-1.25,14.93L108,148l42.54,87.42a8,8,0,0,0,14.93-1.25Z"/></svg>`,
    spark: `<svg viewBox="0 0 256 256"><path d="M128,24l24,72,72,24-72,24-24,72-24-72-72-24,72-24Z"/></svg>`,
    plus: `<svg viewBox="0 0 256 256"><line x1="128" y1="40" x2="128" y2="216"/><line x1="40" y1="128" x2="216" y2="128"/></svg>`
  };
  const fontIconMap = {
    arrowUpRight: "arrow-up-right",
    chevronRight: "caret-right",
    paperPlane: "paper-plane-tilt",
    spark: "sparkle",
    plus: "plus"
  };
  const iconFontSelectors = [
    ".ph",
    ".material-icons",
    ".material-symbols-outlined",
    ".material-symbols-rounded",
    ".material-symbols-sharp",
    ".fa",
    ".fas",
    ".far",
    ".fal",
    ".fab",
    ".bi",
    ".ri",
    ".icon",
    ".iconify",
    "[data-icon]",
    "[class^='icon-']",
    "[class*=' icon-']"
  ].join(",");

  const existing = window.__codexBrowserMutation;
  if (existing && typeof existing.uninstall === "function") {
    existing.uninstall();
  }

  const state = {
    selected: null,
    mode: "interact",
    panelDrag: null,
    panelResize: null,
    drag: null,
    pendingMove: null,
    lastMoveGuide: null,
    resize: null,
    originals: new WeakMap(),
    records: [],
    undoStack: [],
    redoStack: [],
    notes: "",
    lastSentAt: null,
    lastSentFingerprint: null,
    centerSnapKey: false,
    panelOpen: true,
    panelCollapsed: false,
    panelExpandedSize: null,
    panelUserResized: false,
    styleState: "normal",
    activeColorField: null,
    colorHue: 0,
    colorDrag: null,
    launcherDrag: null,
    launcherMoved: false,
    savedColorHoverTimer: null,
    savedColorDeleteChip: null,
    hoverStyles: new Map(),
    stylePreviews: new Map()
  };

  function createStyle() {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      #${rootId}, #${rootId} *, #${launcherId}, #${launcherId} * { box-sizing: border-box; }
      #${rootId} {
        position: fixed;
        z-index: 2147483647;
        top: 10px;
        right: 10px;
        width: min(360px, calc(100vw - 20px));
        min-width: min(${panelMinWidth}px, calc(100vw - 20px));
        min-height: 176px;
        max-height: calc(100vh - 20px);
        color: #f4f4f5;
        background: rgba(31, 31, 31, 0.96);
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 12px;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.36);
        backdrop-filter: blur(18px);
        font: 500 10.5px/1.3 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        pointer-events: auto;
      }
      #${rootId} [data-role="body"] {
        min-height: 0;
        overflow: hidden;
        scrollbar-width: thin;
        scrollbar-color: rgba(244, 244, 245, 0.44) rgba(255, 255, 255, 0.05);
      }
      #${rootId} [data-role="body"]::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }
      #${rootId} [data-role="body"]::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 999px;
      }
      #${rootId} [data-role="body"]::-webkit-scrollbar-thumb {
        background: rgba(161, 161, 170, 0.52);
        border-radius: 999px;
      }
      #${rootId} [data-role="body"]::-webkit-scrollbar-thumb:hover,
      #${rootId} [data-role="body"]::-webkit-scrollbar-thumb:active {
        background: rgba(244, 244, 245, 0.92);
      }
      #${rootId} .cbm-panel-resize {
        position: absolute;
        z-index: 2;
        bottom: 0;
        width: 22px;
        height: 22px;
      }
      #${rootId} .cbm-panel-resize[data-resize-corner="br"] {
        right: 0;
        cursor: nwse-resize;
      }
      #${rootId} .cbm-panel-resize[data-resize-corner="bl"] {
        left: 0;
        cursor: nesw-resize;
      }
      #${rootId} button,
      #${rootId} input,
      #${rootId} select,
      #${rootId} textarea {
        font: inherit;
        letter-spacing: 0;
      }
      #${rootId} .cbm-head {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: 10px 12px;
        cursor: move;
        background: rgba(255, 255, 255, 0.02);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      #${rootId} .cbm-title {
        font-weight: 650;
        font-size: 12px;
        color: #fafafa;
      }
      #${rootId} .cbm-body {
        display: grid;
        grid-auto-rows: max-content;
        align-content: start;
        gap: 7px;
        padding: 9px;
      }
      #${rootId}[data-collapsed="true"] {
        min-height: 0;
      }
      #${rootId}[data-collapsed="true"] .cbm-body,
      #${rootId}[data-collapsed="true"] .cbm-panel-resize {
        display: none;
      }
      #${rootId} .cbm-row {
        display: grid;
        gap: 4px;
      }
      #${rootId} .cbm-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }
      #${rootId} .cbm-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      #${rootId} .cbm-head-help {
        position: static;
      }
      #${rootId} .cbm-info-icon {
        display: inline-grid;
        place-items: center;
        width: 16px;
        height: 16px;
        border: 1.5px solid currentColor;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 850;
        font-style: normal;
        line-height: 1;
      }
      #${rootId} .cbm-hotkeys-menu {
        position: absolute;
        left: 12px;
        right: 12px;
        top: 44px;
        z-index: 24;
        width: auto;
        max-height: min(360px, calc(100vh - 76px));
        overflow: auto;
        padding: 8px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 9px;
        background: #242424;
        box-shadow: 0 14px 34px rgba(0, 0, 0, 0.38);
        cursor: default;
      }
      #${rootId} .cbm-hotkeys-menu[hidden] {
        display: none;
      }
      #${rootId} .cbm-hotkeys-title {
        margin-bottom: 6px;
        color: #fafafa;
        font-size: 11px;
        font-weight: 750;
      }
      #${rootId} .cbm-hotkey-row {
        display: grid;
        grid-template-columns: max-content minmax(0, 1fr);
        gap: 10px;
        align-items: baseline;
        padding: 4px 2px;
        color: #d4d4d8;
      }
      #${rootId} .cbm-hotkey-row span {
        min-width: 0;
        overflow-wrap: anywhere;
      }
      #${rootId} .cbm-hotkey-row kbd {
        min-width: 78px;
        padding: 2px 5px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 5px;
        color: #f4f4f5;
        background: rgba(255, 255, 255, 0.06);
        font: 700 10px/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        text-align: center;
      }
      #${rootId} .cbm-tool-grid {
        display: grid;
        grid-template-columns: repeat(5, 28px) 1fr repeat(2, 28px);
        gap: 5px;
        align-items: center;
      }
      #${rootId} .cbm-tool-gap {
        width: 28px;
      }
      #${rootId} .cbm-control-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.07);
      }
      #${rootId} .cbm-inline {
        display: grid;
        grid-template-columns: 1fr 30px;
        gap: 5px;
        align-items: end;
      }
      #${rootId} .cbm-state-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 5px;
      }
      #${rootId} .cbm-mode-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
      }
      #${rootId} .cbm-mode-row button {
        min-height: 26px;
      }
      #${rootId} .cbm-state-row button {
        min-height: 24px;
        padding: 3px 6px;
      }
      #${rootId} .cbm-footer {
        display: grid;
        grid-template-columns: 120px repeat(3, 30px);
        gap: 6px;
      }
      #${rootId} .cbm-send-actions {
        grid-template-columns: 120px 30px 1fr repeat(2, 30px);
        align-items: center;
      }
      #${rootId} .cbm-action-menu {
        position: relative;
        width: 30px;
        height: 30px;
      }
      #${rootId} .cbm-action-menu > .cbm-icon {
        width: 30px;
        height: 30px;
      }
      #${rootId} .cbm-action-menu-list {
        position: absolute;
        right: 0;
        bottom: 36px;
        z-index: 20;
        display: grid;
        gap: 3px;
        width: 168px;
        padding: 5px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 9px;
        background: #242424;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
      }
      #${rootId} .cbm-action-menu-list[hidden] {
        display: none;
      }
      #${rootId} .cbm-action-menu-list button {
        min-height: 28px;
        justify-content: flex-start;
        padding: 4px 8px;
        text-align: left;
      }
      #${rootId} .cbm-notes {
        display: grid;
        gap: 4px;
      }
      #${rootId} .cbm-notes-head {
        display: grid;
        grid-template-columns: 1fr max-content;
        gap: 6px;
        align-items: center;
        color: #a1a1aa;
        font-weight: 650;
      }
      #${rootId} .cbm-notes-head button {
        min-height: 24px;
        padding: 3px 8px;
        white-space: nowrap;
      }
      #${rootId} .cbm-style-actions {
        grid-template-columns: max-content 1fr max-content;
        align-items: center;
      }
      #${rootId} .cbm-style-actions button {
        width: auto;
        min-width: 96px;
        white-space: nowrap;
      }
      #${rootId} .cbm-pop {
        display: block;
        min-height: 30px;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 9px;
        background: rgba(255, 255, 255, 0.02);
        overflow: hidden;
      }
      #${rootId} .cbm-pop[hidden] {
        display: none;
      }
      #${rootId} .cbm-pop-toggle {
        width: 100%;
        display: flex;
        flex: 0 0 28px;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 28px;
        min-height: 28px;
        padding: 0 8px;
        color: #d4d4d8;
        cursor: pointer;
        list-style: none;
      }
      #${rootId} .cbm-pop[data-open="false"] .cbm-pop-body {
        display: none;
      }
      #${rootId} .cbm-pop-body {
        display: grid;
        gap: 6px;
        padding: 7px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      #${rootId} .cbm-range-pair {
        display: grid;
        grid-template-columns: 52px 1fr;
        gap: 5px;
        align-items: center;
      }
      #${rootId} .cbm-typeface-field {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 30px;
        gap: 5px;
      }
      #${rootId} .cbm-typeface-menu {
        position: absolute;
        z-index: 3;
        top: calc(100% + 4px);
        right: 0;
        left: 0;
        display: none;
        max-height: 168px;
        overflow: auto;
        padding: 4px;
        background: #171717;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 8px;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.32);
      }
      #${rootId} .cbm-typeface-field[data-open="true"] .cbm-typeface-menu {
        display: grid;
        gap: 3px;
      }
      #${rootId} .cbm-typeface-option {
        justify-content: flex-start;
        width: 100%;
        min-height: 24px;
        padding: 4px 6px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      #${rootId} input.cbm-range {
        min-height: 18px;
        height: 18px;
        padding: 0;
        accent-color: #f4f4f5;
      }
      #${rootId} label {
        display: grid;
        gap: 3px;
        color: #a1a1aa;
      }
      #${rootId} input,
      #${rootId} select,
      #${rootId} textarea {
        width: 100%;
        min-width: 0;
        color: #f4f4f5;
        background: #171717;
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 7px;
        padding: 4px 6px;
        min-height: 26px;
        outline: none;
      }
      #${rootId} input:focus,
      #${rootId} select:focus,
      #${rootId} textarea:focus {
        border-color: rgba(255, 255, 255, 0.22);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.06);
      }
      #${rootId} .cbm-color-field {
        display: grid;
        grid-template-columns: 24px 1fr;
        gap: 5px;
        align-items: center;
        min-height: 26px;
        padding: 3px;
        background: #171717;
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 7px;
      }
      #${rootId} .cbm-color-field:focus-within {
        border-color: rgba(255, 255, 255, 0.22);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.06);
      }
      #${rootId} .cbm-color-field input {
        min-height: 18px;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }
      #${rootId} .cbm-color-swatch {
        width: 20px;
        height: 20px;
        min-height: 20px;
        padding: 0;
        border-radius: 5px;
        border: 1px solid rgba(255, 255, 255, 0.20);
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.22);
      }
      #${rootId} .cbm-color-popover {
        display: none;
        gap: 7px;
        padding: 8px;
        background: #141414;
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 9px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
      }
      #${rootId} .cbm-color-popover[data-open="true"] {
        display: grid;
      }
      #${rootId} .cbm-color-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 6px;
        color: #d4d4d8;
      }
      #${rootId} .cbm-color-rows {
        display: grid;
        gap: 5px;
      }
      #${rootId} .cbm-spectrum {
        position: relative;
        height: 118px;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background:
          linear-gradient(to top, #000, rgba(0, 0, 0, 0)),
          linear-gradient(to right, #fff, rgba(255, 255, 255, 0)),
          hsl(var(--cbm-hue, 0), 100%, 50%);
        cursor: crosshair;
        overflow: hidden;
        user-select: none;
        touch-action: none;
      }
      #${rootId} .cbm-spectrum-dot {
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 999px;
        border: 2px solid #fff;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.72);
        transform: translate(-5px, -5px);
        pointer-events: none;
      }
      #${rootId} .cbm-picker-bar {
        display: grid;
        grid-template-columns: 22px 1fr;
        gap: 8px;
        align-items: center;
      }
      #${rootId} .cbm-eyedrop {
        width: 22px;
        height: 22px;
        min-height: 22px;
        padding: 0;
      }
      #${rootId} .cbm-hue {
        width: 100%;
        min-height: 16px;
        height: 16px;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
        accent-color: #fff;
      }
      #${rootId} .cbm-rgb {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      #${rootId} .cbm-hex-row {
        display: grid;
        grid-template-columns: 42px 1fr;
        gap: 6px;
        align-items: center;
      }
      #${rootId} .cbm-hex-row span {
        color: #a1a1aa;
      }
      #${rootId} .cbm-rgb label {
        text-align: center;
      }
      #${rootId} .cbm-rgb input {
        text-align: center;
      }
      #${rootId} .cbm-color-row {
        display: grid;
        grid-template-columns: 42px 1fr;
        gap: 6px;
        align-items: center;
      }
      #${rootId} .cbm-color-row span {
        color: #a1a1aa;
      }
      #${rootId} .cbm-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        min-height: 18px;
      }
      #${rootId} .cbm-color-chip {
        position: relative;
        width: 22px;
        height: 16px;
        min-height: 16px;
        padding: 0;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        overflow: hidden;
      }
      #${rootId} .cbm-color-chip[data-delete-ready="true"] {
        border-color: rgba(248, 113, 113, 0.88);
      }
      #${rootId} .cbm-color-chip[data-delete-ready="true"]::after {
        content: "x";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 14px;
        height: 14px;
        display: grid;
        place-items: center;
        color: #fff;
        background: rgba(185, 28, 28, 0.88);
        border-radius: 3px;
        font-size: 11px;
        font-weight: 800;
        line-height: 1;
        transform: translate(-50%, -50%);
      }
      #${rootId} textarea {
        min-height: 34px;
        resize: vertical;
      }
      #${rootId} button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        min-height: 28px;
        color: #e7e7e7;
        background: #2a2a2a;
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 8px;
        padding: 4px 7px;
        cursor: pointer;
        line-height: 1;
        text-align: center;
      }
      #${rootId} .cbm-icon {
        width: 28px;
        height: 28px;
        min-height: 28px;
        padding: 0;
      }
      #${rootId} svg {
        display: block;
        width: 14px;
        height: 14px;
        fill: none;
        stroke: currentColor;
        stroke-width: 16;
        stroke-linecap: round;
        stroke-linejoin: round;
        flex: 0 0 auto;
      }
      #${rootId} .cbm-solid-icon,
      #${rootId} .cbm-solid-icon path {
        fill: currentColor;
        stroke: none;
        stroke-width: 0;
      }
      #${rootId} button span,
      #${rootId} summary span {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 14px;
        line-height: 14px;
      }
      #${rootId} .cbm-text-style-icon {
        display: inline-grid;
        place-items: center;
        width: 14px;
        height: 14px;
        color: currentColor;
        font-size: 11px;
        font-weight: 800;
        line-height: 1;
      }
      #${rootId} button:not(.cbm-icon) svg,
      #${rootId} summary svg {
        width: 13px;
        height: 13px;
      }
      #${rootId} .cbm-wide {
        width: 120px;
        justify-self: start;
        height: 28px;
      }
      #${rootId} .cbm-footer [data-primary="true"] {
        width: 120px;
        height: 28px;
      }
      #${rootId} button:hover {
        background: #333333;
        border-color: rgba(255, 255, 255, 0.16);
      }
      #${rootId} button[data-primary="true"] {
        color: #171717;
        background: #f4f4f5;
        border-color: #f4f4f5;
      }
      #${rootId} button[data-active="true"] {
        color: #d9f99d;
        background: #263018;
        border-color: rgba(217, 249, 157, 0.34);
      }
      #${rootId} .cbm-meta {
        overflow: hidden;
        color: #a1a1aa;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      #${rootId} .cbm-status {
        color: #a1a1aa;
        min-height: 18px;
      }
      #${outlineId} {
        position: fixed;
        z-index: 2147483646;
        pointer-events: none;
        border: 2px solid #f4f4f5;
        border-radius: 6px;
        background: rgba(244, 244, 245, 0.08);
        box-shadow: 0 0 0 1px rgba(23, 23, 23, 0.82);
      }
      #${outlineId} .cbm-handle {
        position: absolute;
        right: -6px;
        bottom: -6px;
        width: 12px;
        height: 12px;
        border-radius: 6px;
        border: 2px solid #171717;
        background: #f4f4f5;
        pointer-events: auto;
        cursor: nwse-resize;
      }
      #${guideLayerId} {
        position: fixed;
        inset: 0;
        z-index: 2147483645;
        pointer-events: none;
        overflow: hidden;
      }
      #${guideLayerId} .cbm-guide-line {
        position: absolute;
        background: #38bdf8;
        box-shadow: 0 0 0 1px rgba(23, 23, 23, 0.28);
      }
      #${guideLayerId} .cbm-guide-line[data-axis="x"] {
        width: 1px;
      }
      #${guideLayerId} .cbm-guide-line[data-axis="y"] {
        height: 1px;
      }
      #${guideLayerId} .cbm-spacing-line {
        position: absolute;
        background: rgba(217, 70, 239, 0.62);
      }
      #${guideLayerId} .cbm-spacing-line[data-axis="x"] {
        height: 1px;
      }
      #${guideLayerId} .cbm-spacing-line[data-axis="y"] {
        width: 1px;
      }
      #${guideLayerId} .cbm-guide-label {
        position: absolute;
        min-width: 18px;
        height: 16px;
        padding: 0 5px;
        border-radius: 8px;
        color: #ffffff;
        background: #c026d3;
        box-shadow: 0 1px 5px rgba(23, 23, 23, 0.24);
        font: 750 10px/16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-align: center;
        letter-spacing: 0;
        white-space: nowrap;
      }
      #${guideLayerId} .cbm-guide-label[data-kind="center"] {
        background: #0284c7;
      }
      #${launcherId} {
        position: fixed;
        z-index: 2147483647;
        top: 14px;
        right: 14px;
        display: none;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        color: #171717;
        background: #f4f4f5;
        border: 1px solid rgba(255, 255, 255, 0.26);
        border-radius: 999px;
        box-shadow: 0 16px 38px rgba(0, 0, 0, 0.36);
        font: 750 12px/1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
        cursor: move;
        user-select: none;
        pointer-events: auto;
      }
      #${launcherId}:hover {
        background: #ffffff;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function isOverlayElement(target) {
    return Boolean(target && target.closest && target.closest(`#${rootId}, #${outlineId}, #${guideLayerId}, #${launcherId}`));
  }

  function trimText(value, limit) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
  }

  function getElementText(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return element.value;
    }
    return trimText(element.textContent, 200);
  }

  function getCssPath(element) {
    const parts = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.documentElement) {
      let part = current.localName;
      if (current.id) {
        part += `#${CSS.escape(current.id)}`;
        parts.unshift(part);
        break;
      }
      const testId = current.getAttribute("data-testid") || current.getAttribute("data-test-id");
      if (testId) {
        part += `[data-testid="${CSS.escape(testId)}"]`;
        parts.unshift(part);
        break;
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((child) => child.localName === current.localName);
        if (siblings.length > 1) {
          part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
      }
      parts.unshift(part);
      current = parent;
    }
    return parts.join(" > ");
  }

  function getIdentity(element) {
    return {
      tag: element.localName,
      id: element.id || null,
      className: typeof element.className === "string" ? element.className || null : null,
      role: element.getAttribute("role"),
      testId: element.getAttribute("data-testid") || element.getAttribute("data-test-id"),
      ariaLabel: element.getAttribute("aria-label"),
      title: element.getAttribute("title"),
      text: getElementText(element),
      cssPath: getCssPath(element)
    };
  }

  function findReactFiber(element) {
    let current = element;
    while (current) {
      const key = Object.keys(current).find((name) => name.startsWith("__reactFiber$") || name.startsWith("__reactInternalInstance$"));
      if (key) {
        return current[key];
      }
      current = current.parentElement;
    }
    return null;
  }

  function getFiberName(fiber) {
    const type = fiber?.elementType || fiber?.type;
    if (!type) {
      return null;
    }
    return type.displayName || type.name || (typeof type === "string" ? type : null);
  }

  function getReactHint(element) {
    let fiber = findReactFiber(element);
    while (fiber) {
      const source = fiber._debugSource || fiber._debugOwner?._debugSource || null;
      const componentName = getFiberName(fiber) || getFiberName(fiber._debugOwner) || null;
      if (source || componentName) {
        return {
          componentName,
          ownerName: getFiberName(fiber._debugOwner),
          fileName: source?.fileName || null,
          lineNumber: source?.lineNumber || null,
          columnNumber: source?.columnNumber || null
        };
      }
      fiber = fiber.return;
    }
    return null;
  }

  function getIconHint(element) {
    const icon = getEditableIcon(element);
    if (!icon) {
      return null;
    }
    if (icon.kind === "font") {
      return getFontIconSnapshot(icon.element);
    }
    const svg = icon.element;
    return {
      kind: "svg",
      ariaLabel: svg.getAttribute("aria-label"),
      dataIcon: svg.getAttribute("data-icon"),
      className: svg.getAttribute("class"),
      viewBox: svg.getAttribute("viewBox"),
      width: svg.getAttribute("width"),
      height: svg.getAttribute("height"),
      stroke: svg.getAttribute("stroke"),
      fill: svg.getAttribute("fill")
    };
  }

  function getEditableIcon(element = state.selected) {
    const svg = getEditableSvg(element);
    if (svg) {
      return { kind: "svg", element: svg };
    }
    const fontIcon = getEditableFontIcon(element);
    return fontIcon ? { kind: "font", element: fontIcon } : null;
  }

  function getEditableSvg(element = state.selected) {
    if (!element) {
      return null;
    }
    if (element instanceof SVGSVGElement) {
      return element;
    }
    if (element instanceof SVGElement) {
      return element.ownerSVGElement || element.closest?.("svg") || null;
    }
    const closestSvg = element.closest?.("svg");
    if (closestSvg instanceof SVGSVGElement) {
      return closestSvg;
    }
    const svgs = Array.from(element.querySelectorAll?.("svg") || []);
    return svgs.length === 1 ? svgs[0] : null;
  }

  function getEditableFontIcon(element = state.selected) {
    if (!element || !(element instanceof Element)) {
      return null;
    }
    const closest = element.closest?.(iconFontSelectors);
    if (closest instanceof HTMLElement && isLikelyIconFont(closest)) {
      return closest;
    }
    const icons = Array.from(element.querySelectorAll?.(iconFontSelectors) || []).filter((icon) => icon instanceof HTMLElement && isLikelyIconFont(icon));
    if (icons.length === 1) {
      return icons[0];
    }
    return element instanceof HTMLElement && isLikelyIconFont(element) ? element : null;
  }

  function isLikelyIconFont(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    const className = String(element.className || "").toLowerCase();
    const fontFamily = getComputedStyle(element).fontFamily.toLowerCase();
    const knownFont =
      fontFamily.includes("phosphor") ||
      fontFamily.includes("font awesome") ||
      fontFamily.includes("bootstrap-icons") ||
      fontFamily.includes("remixicon") ||
      fontFamily.includes("material icons") ||
      fontFamily.includes("material symbols");
    const knownClass =
      /\b(ph|fa|fas|far|fal|fab|bi|ri|icon|iconify|material-icons|material-symbols-(outlined|rounded|sharp))\b/.test(className) ||
      /\b(icon|fa|bi|ri)-[a-z0-9-]+\b/.test(className) ||
      element.hasAttribute("data-icon");
    const text = (element.textContent || "").trim();
    return knownFont || knownClass || (["I", "SPAN"].includes(element.tagName) && text.length <= 3 && knownClass);
  }

  function getFontIconName(element) {
    const classes = Array.from(element.classList || []);
    const prefixed = classes.find((className) => /^(ph|fa|bi|ri|icon)-/.test(className));
    if (prefixed) {
      return prefixed.replace(/^(ph|fa|bi|ri|icon)-/, "");
    }
    return element.getAttribute("data-icon") || (element.textContent || "").trim() || null;
  }

  function getFontIconProvider(element) {
    const classes = Array.from(element.classList || []);
    if (classes.includes("ph") || classes.some((className) => className.startsWith("ph-"))) return "ph";
    if (classes.some((className) => ["fa", "fas", "far", "fal", "fab"].includes(className) || className.startsWith("fa-"))) return "fa";
    if (classes.some((className) => className === "bi" || className.startsWith("bi-"))) return "bi";
    if (classes.some((className) => className === "ri" || className.startsWith("ri-"))) return "ri";
    if (classes.some((className) => className === "icon" || className.startsWith("icon-"))) return "icon";
    if (element.classList.contains("material-icons") || Array.from(element.classList).some((className) => className.startsWith("material-symbols-"))) return "material";
    if (element.classList.contains("iconify") || element.hasAttribute("data-icon")) return "iconify";
    return "font";
  }

  function getFontIconSnapshot(element) {
    if (!element) {
      return null;
    }
    const styles = getComputedStyle(element);
    return {
      kind: "font",
      identity: getIdentity(element),
      provider: getFontIconProvider(element),
      iconName: getFontIconName(element),
      className: element.getAttribute("class"),
      weight: element.getAttribute("data-icon-weight"),
      styles: {
        color: styles.color,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily
      }
    };
  }

  function normalizeFontIconName(name) {
    if (!name) {
      return "";
    }
    return fontIconMap[name] || String(name).trim().replace(/^(ph|fa|bi|ri|icon)-/, "");
  }

  function getSvgSnapshot(svg) {
    if (!svg) {
      return null;
    }
    const styles = getComputedStyle(svg);
    return {
      identity: getIdentity(svg),
      outerHTML: svg.outerHTML,
      attrs: {
        viewBox: svg.getAttribute("viewBox"),
        width: svg.getAttribute("width"),
        height: svg.getAttribute("height"),
        stroke: svg.getAttribute("stroke"),
        fill: svg.getAttribute("fill"),
        color: svg.getAttribute("color")
      },
      styles: {
        width: styles.width,
        height: styles.height,
        color: styles.color,
        stroke: styles.stroke,
        fill: styles.fill,
        strokeWidth: styles.strokeWidth
      }
    };
  }

  function ensureHoverId(element) {
    if (!element.dataset.cbmHoverId) {
      element.dataset.cbmHoverId = cryptoRandomId();
    }
    return element.dataset.cbmHoverId;
  }

  function getParentInfo(element) {
    const parent = element.parentElement;
    if (!parent) {
      return null;
    }
    return {
      identity: getIdentity(parent),
      react: getReactHint(parent),
      childCount: parent.children.length
    };
  }

  function getSiblings(element) {
    const parent = element.parentElement;
    if (!parent) {
      return [];
    }
    return Array.from(parent.children).slice(0, 16).map((child, index) => ({
      index,
      selected: child === element,
      identity: getIdentity(child)
    }));
  }

  function getRect(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
      left: Math.round(rect.left),
      pageX: Math.round(rect.x + window.scrollX),
      pageY: Math.round(rect.y + window.scrollY)
    };
  }

  function getStyles(element) {
    const computed = getComputedStyle(element);
    return Object.fromEntries(styleProps.map((property) => [property, computed[property]]));
  }

  function getIndex(element) {
    return element.parentElement ? Array.from(element.parentElement.children).indexOf(element) : -1;
  }

  function snapshot(element) {
    return {
      capturedAt: new Date().toISOString(),
      page: {
        url: location.href,
        title: document.title,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        scroll: { x: window.scrollX, y: window.scrollY }
      },
      identity: getIdentity(element),
      react: getReactHint(element),
      parent: getParentInfo(element),
      index: getIndex(element),
      siblings: getSiblings(element),
      rect: getRect(element),
      styles: getStyles(element),
      text: getElementText(element),
      icon: getIconHint(element)
    };
  }

  function originalFor(element) {
    if (!state.originals.has(element)) {
      state.originals.set(element, snapshot(element));
    }
    return state.originals.get(element);
  }

  function selectedElement(options = {}) {
    if (!state.selected) {
      return null;
    }
    if (state.selected.isConnected) {
      return state.selected;
    }
    if (state.pendingMove?.element === state.selected) {
      state.pendingMove = null;
    }
    state.selected = null;
    state.mode = "interact";
    syncHoverPreview();
    syncModeButtons();
    if (!options.skipPanel) {
      updatePanel();
    }
    if (!options.silent) {
      updateStatus("Selected element is no longer on the page");
    }
    return null;
  }

  function record(action, element, extra) {
    if (!element || !element.isConnected) {
      updateStatus("Element is no longer on the page");
      return;
    }
    const entry = {
      id: cryptoRandomId(),
      action,
      notes: state.notes,
      before: originalFor(element),
      after: snapshot(element),
      extra: extra || null
    };
    state.records.push(entry);
    state.redoStack = [];
    const undo = state.undoStack[state.undoStack.length - 1];
    if (undo && !undo.recordId && action !== "selected" && action !== "capture") {
      undo.recordId = entry.id;
    }
    updateStatus(`${state.records.length} record${state.records.length === 1 ? "" : "s"} captured`);
  }

  function pendingMoveForSelected() {
    return state.pendingMove && state.selected && state.pendingMove.element === state.selected && state.selected.isConnected
      ? state.pendingMove
      : null;
  }

  function moveExtra(moved, moveGuide) {
    return {
      start: { x: moved.x, y: moved.y },
      styleLeft: state.selected.style.left,
      styleTop: state.selected.style.top,
      delta: moved.lastGuide?.delta || null,
      axisLock: moveGuide?.axisLock || null,
      centerOnly: moveGuide?.centerOnly === true,
      snappedTo: moved.lastGuide?.matches || [],
      spacing: moveGuide?.spacing || [],
      landingReferences: moveGuide?.landingReferences || [],
      snapScope: "nearby",
      candidateCount: moveGuide?.candidateCount ?? moved.activeCandidates?.length ?? 0,
      snapThreshold,
      snapCandidateRadius
    };
  }

  function stagePendingMove(moved, moveGuide) {
    const selected = selectedElement({ silent: true });
    if (!selected || !moved.lastGuide) {
      if (moved.undo) {
        restoreUndo(moved.undo);
      }
      return;
    }
    const previous = state.pendingMove?.element === selected ? state.pendingMove : null;
    state.pendingMove = {
      element: selected,
      undo: previous?.undo || moved.undo,
      extra: moveExtra(moved, moveGuide)
    };
    syncModeButtons();
    updateStatus("Move staged. Click the check to record final position.");
  }

  function commitPendingMove(options = {}) {
    const pending = pendingMoveForSelected();
    if (!pending) {
      return false;
    }
    state.pendingMove = null;
    if (pending.undo) {
      state.undoStack.push(pending.undo);
    }
    record("move", pending.element, pending.extra);
    syncModeButtons();
    if (!options.silent) {
      updateStatus("Move recorded.");
    }
    return true;
  }

  function cancelPendingMove(options = {}) {
    const pending = pendingMoveForSelected();
    if (!pending) {
      return false;
    }
    state.pendingMove = null;
    if (pending.undo) {
      restoreUndo(pending.undo);
    }
    updateOutline();
    syncModeButtons();
    if (!options.silent) {
      updateStatus("Move cancelled.");
    } else if (!options.skipPanel) {
      updatePanel();
    }
    return true;
  }

  function pendingNoteRecord() {
    const notes = state.notes.trim();
    if (!notes) {
      return null;
    }
    const selected = selectedElement({ silent: true });
    if (!selected) {
      return {
        id: cryptoRandomId(),
        action: "note",
        notes,
        before: null,
        after: null,
        extra: { noteOnly: true, scope: "session" }
      };
    }
    const selectedSnapshot = originalFor(selected);
    return {
      id: cryptoRandomId(),
      action: "note",
      notes,
      before: selectedSnapshot,
      after: selectedSnapshot,
      extra: { noteOnly: true, scope: "element" }
    };
  }

  function addNoteRecord() {
    const entry = pendingNoteRecord();
    if (!entry) {
      updateStatus("Add note text first");
      return null;
    }
    state.records.push(entry);
    state.redoStack = [];
    clearNotes({ silent: true });
    updateStatus(entry.extra?.scope === "element" ? "Added selected-element note" : "Added session note");
    return entry;
  }

  function recordsForSend(pendingNote = pendingNoteRecord()) {
    return pendingNote ? [...state.records, pendingNote] : state.records;
  }

  function sentStatus(recordCount, pendingNote) {
    if (recordCount === 0) {
      return "Nothing to send";
    }
    if (recordCount === 1 && state.records.length === 0 && pendingNote?.extra?.scope === "element") {
      return "Sent 1 note for selected element to model.";
    }
    if (recordCount === 1 && state.records.length === 0 && pendingNote?.extra?.scope === "session") {
      return "Sent 1 session note to model.";
    }
    return `Sent ${recordCount} record${recordCount === 1 ? "" : "s"} to model.`;
  }

  function renderHoverStyles() {
    let style = document.getElementById(hoverStyleId);
    if (!style) {
      style = document.createElement("style");
      style.id = hoverStyleId;
      document.documentElement.appendChild(style);
    }
    style.textContent = Array.from(state.hoverStyles.entries())
      .map(([id, styles]) => {
        const declarations = Object.entries(styles)
          .filter(([, value]) => value)
          .map(([property, value]) => `${camelToKebab(property)}: ${value} !important;`)
          .join(" ");
        return `[data-cbm-hover-id="${id}"]:hover, body[data-cbm-hover-preview-id="${id}"] [data-cbm-hover-id="${id}"] { ${declarations} }`;
      })
      .join("\n");
    syncHoverPreview();
  }

  function syncHoverPreview() {
    if (state.styleState !== "hover" || !state.selected) {
      document.body.removeAttribute("data-cbm-hover-preview-id");
      return;
    }
    const hoverId = state.selected.getAttribute("data-cbm-hover-id");
    if (hoverId && state.hoverStyles.has(hoverId)) {
      document.body.setAttribute("data-cbm-hover-preview-id", hoverId);
      return;
    }
    document.body.removeAttribute("data-cbm-hover-preview-id");
  }

  function camelToKebab(value) {
    return String(value).replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
  }

  function captureUndo(element) {
    if (!element) {
      return null;
    }
    return {
      element,
      parent: element.parentElement,
      previousSibling: element.previousSibling,
      nextSibling: element.nextSibling,
      index: getIndex(element),
      selected: state.selected,
      inlineStyle: element.getAttribute("style"),
      text: element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? null : element.textContent,
      html: element instanceof HTMLElement && element.children.length ? element.innerHTML : null,
      value: element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : null,
      hoverStyles: new Map(state.hoverStyles)
    };
  }

  function pushUndo(element) {
    const undo = captureUndo(element);
    if (undo) {
      state.undoStack.push(undo);
    }
  }

  function restoreUndo(undo) {
    const { element, parent, previousSibling, nextSibling, index, inlineStyle, text, html, value } = undo;
    if (undo.hoverStyles) {
      state.hoverStyles = new Map(undo.hoverStyles);
      renderHoverStyles();
    }
    if (parent) {
      let reference = nextSibling && nextSibling.parentNode === parent && nextSibling !== element ? nextSibling : null;
      if (!reference && previousSibling && previousSibling.parentNode === parent && previousSibling !== element) {
        reference = previousSibling.nextSibling === element ? element.nextSibling : previousSibling.nextSibling;
      }
      if (!reference && index >= 0) {
        reference = Array.from(parent.childNodes).filter((node) => node !== element)[index] || null;
      }
      if (element.parentElement !== parent || element.nextSibling !== reference) {
        parent.insertBefore(element, reference);
      }
    }
    if (inlineStyle === null) {
      element.removeAttribute("style");
    } else {
      element.setAttribute("style", inlineStyle);
    }
    if (html !== null) {
      element.innerHTML = html;
    } else if (value !== null && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      element.value = value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (text !== null) {
      element.textContent = text;
    }
    state.selected = element.isConnected ? element : undo.selected;
  }

  function undoLast() {
    if (cancelPendingMove()) {
      return;
    }
    const lastRecord = state.records[state.records.length - 1];
    if (lastRecord?.extra?.noteOnly) {
      const removed = state.records.pop();
      state.redoStack.push({ kind: "record", record: removed });
      setNotes(removed.notes || "");
      updateStatus("Removed last note");
      return;
    }
    const undo = state.undoStack.pop();
    if (!undo) {
      if (state.records.length > 0) {
        const removed = state.records.pop();
        state.redoStack.push({ kind: "record", record: removed });
        updateStatus("Removed last record");
        return;
      }
      updateStatus("Nothing to undo");
      return;
    }
    let recordEntry = null;
    if (undo.recordId) {
      const recordIndex = state.records.findIndex((record) => record.id === undo.recordId);
      if (recordIndex >= 0) {
        recordEntry = state.records.splice(recordIndex, 1)[0];
      }
    }
    if (!recordEntry) {
      recordEntry = state.records.pop() || null;
    }
    const redo = undo.element?.isConnected ? { kind: "restore", undo: captureUndo(undo.element), record: recordEntry } : { kind: "delete", element: undo.element, record: recordEntry };
    restoreUndo(undo);
    if (redo.undo || redo.element) {
      state.redoStack.push(redo);
    }
    updateStatus("Undid last change");
  }

  function redoLast() {
    const redo = state.redoStack.pop();
    if (!redo) {
      updateStatus("Nothing to redo");
      return;
    }
    if (redo.kind === "record" && redo.record) {
      state.records.push(redo.record);
      clearNotes({ silent: true });
      updateStatus("Redid last record");
      return;
    }
    if (redo.kind === "delete" && redo.element) {
      const undo = captureUndo(redo.element);
      if (undo) {
        undo.recordId = redo.record?.id;
        state.undoStack.push(undo);
      }
      redo.element.remove();
      if (state.selected === redo.element) {
        state.selected = null;
      }
    } else if (redo.undo?.element) {
      const undo = captureUndo(redo.undo.element);
      restoreUndo(redo.undo);
      if (undo) {
        undo.recordId = redo.record?.id;
        state.undoStack.push(undo);
      }
    }
    if (redo.record) {
      state.records.push(redo.record);
    }
    updateStatus("Redid last change");
  }

  function cryptoRandomId() {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }

  function updateOutline() {
    const outline = document.getElementById(outlineId);
    const selected = selectedElement({ silent: true, skipPanel: true });
    if (!outline || !selected || !state.panelOpen) {
      if (outline) {
        outline.style.display = "none";
      }
      return;
    }
    outline.style.display = "block";
    const rect = selected.getBoundingClientRect();
    outline.style.left = `${Math.round(rect.left)}px`;
    outline.style.top = `${Math.round(rect.top)}px`;
    outline.style.width = `${Math.round(rect.width)}px`;
    outline.style.height = `${Math.round(rect.height)}px`;
  }

  function updatePanel() {
    if (state.selected && !state.selected.isConnected) {
      state.selected = null;
      state.mode = "interact";
      syncHoverPreview();
      syncModeButtons();
    }
    const selectedMeta = document.querySelector(`#${rootId} [data-role="selected"]`);
    if (selectedMeta) {
      selectedMeta.textContent = state.selected ? `${state.selected.localName} ${trimText(getElementText(state.selected), 60)}` : "No element selected";
    }
    const count = document.querySelector(`#${rootId} [data-role="count"]`);
    if (count) {
      count.textContent = String(state.records.length);
    }
    updateOutline();
  }

  function updateStatus(message) {
    const status = document.querySelector(`#${rootId} [data-role="status"]`);
    if (status) {
      status.textContent = message;
      status.dataset.message = message;
    }
    updatePanel();
  }

  function confirmSentStatus(message) {
    updateStatus(message);
    requestAnimationFrame(() => {
      const status = document.querySelector(`#${rootId} [data-role="status"]`);
      if (status && status.dataset.message === message) {
        status.textContent = message;
      }
    });
  }

  function setControlValue(input, value) {
    if (!input) {
      return;
    }
    input.value = value || "";
    input.dataset.initial = input.value;
    input.dataset.dirty = "false";
    if (isColorField(input.dataset.style)) {
      updateColorSwatch(input.dataset.style, input.value);
    }
    if (input.dataset.style === "opacity") {
      const range = document.querySelector(`#${rootId} [data-opacity-range]`);
      if (range) range.value = normalizeStyleValue("opacity", input.value) || "1";
    }
  }

  function getStylePreview(element) {
    if (!element) {
      return null;
    }
    let preview = state.stylePreviews.get(element) || element[previewStateKey];
    if (!preview) {
      originalFor(element);
      preview = {
        normalBaseInlineStyle: element.getAttribute("style"),
        hoverBaseStyles: new Map(state.hoverStyles),
        normalChanged: {},
        hoverChanged: {}
      };
      Object.defineProperty(element, previewStateKey, {
        value: preview,
        writable: true,
        configurable: true
      });
    }
    state.stylePreviews.set(element, preview);
    return preview;
  }

  function clearElementStylePreview(element) {
    if (!element) {
      return;
    }
    state.stylePreviews.delete(element);
    try {
      delete element[previewStateKey];
    } catch {
      element[previewStateKey] = null;
    }
  }

  function hasPreviewChanges(preview) {
    return Boolean(preview && (Object.keys(preview.normalChanged).length || Object.keys(preview.hoverChanged).length));
  }

  function currentPreviewChanges(preview) {
    return preview ? (state.styleState === "hover" ? preview.hoverChanged : preview.normalChanged) : {};
  }

  function previewStyleField(field, value) {
    if (!state.selected || (!editableStyleFields.includes(field) && !helperStyleFields.has(field))) {
      return;
    }
    if (field === "backgroundAlpha") {
      const alpha = normalizeAlphaValue(value);
      if (alpha === "") {
        return;
      }
      const colorInput = document.querySelector(`#${rootId} [data-style="backgroundColor"]`);
      const color = normalizeHexColor(colorInput?.value) || cssColorToHex(getComputedStyle(state.selected).backgroundColor);
      const rgb = hexToRgb(color);
      const backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      if (colorInput) {
        colorInput.value = backgroundColor;
        colorInput.dataset.dirty = colorInput.value === colorInput.dataset.initial ? "false" : "true";
        updateColorSwatch("backgroundColor", backgroundColor);
      }
      previewStyleField("backgroundColor", backgroundColor);
      return;
    }
    if (field === "glassBlur" || field === "glassSaturation") {
      const blurInput = document.querySelector(`#${rootId} [data-style="glassBlur"]`);
      const saturationInput = document.querySelector(`#${rootId} [data-style="glassSaturation"]`);
      const backdrop = composeGlassBackdropFilter(blurInput?.value, saturationInput?.value);
      if (backdrop) {
        const backdropInput = document.querySelector(`#${rootId} [data-style="backdropFilter"]`);
        if (backdropInput) {
          backdropInput.value = backdrop;
          backdropInput.dataset.dirty = backdropInput.value === backdropInput.dataset.initial ? "false" : "true";
        }
        previewStyleField("backdropFilter", backdrop);
      }
      return;
    }
    const normalized = normalizeStyleValue(field, value);
    if (!normalized) {
      return;
    }
    const preview = getStylePreview(state.selected);
    if (state.styleState === "hover") {
      const hoverId = ensureHoverId(state.selected);
      preview.hoverChanged[field] = normalized;
      state.hoverStyles.set(hoverId, { ...(state.hoverStyles.get(hoverId) || {}), [field]: normalized });
      renderHoverStyles();
      syncHoverPreview();
    } else {
      preview.normalChanged[field] = normalized;
      state.selected.style[field] = normalized;
      if (field === "borderWidth" && normalized !== "0" && normalized !== "0px" && getComputedStyle(state.selected).borderStyle.includes("none")) {
        state.selected.style.borderStyle = "solid";
      }
      updateOutline();
    }
    updateStatus("Previewing unrecorded style changes");
  }

  function clearPreviewStyleField(field) {
    const preview = state.stylePreviews.get(state.selected);
    if (!state.selected || !preview || !editableStyleFields.includes(field)) {
      return;
    }
    if (state.styleState === "hover") {
      delete preview.hoverChanged[field];
      const hoverId = state.selected.getAttribute("data-cbm-hover-id");
      const baseHoverStyles = hoverId ? preview.hoverBaseStyles.get(hoverId) || {} : {};
      if (hoverId) {
        const nextStyles = { ...(state.hoverStyles.get(hoverId) || {}) };
        if (baseHoverStyles[field]) {
          nextStyles[field] = baseHoverStyles[field];
        } else {
          delete nextStyles[field];
        }
        if (Object.keys(nextStyles).length) {
          state.hoverStyles.set(hoverId, nextStyles);
        } else {
          state.hoverStyles.delete(hoverId);
        }
        renderHoverStyles();
      }
    } else {
      delete preview.normalChanged[field];
      if (preview.normalBaseInlineStyle === null) {
        state.selected.style.removeProperty(camelToKebab(field));
      } else {
        const probe = document.createElement("span");
        probe.setAttribute("style", preview.normalBaseInlineStyle);
        const baseValue = probe.style.getPropertyValue(camelToKebab(field));
        if (baseValue) {
          state.selected.style[field] = baseValue;
        } else {
          state.selected.style.removeProperty(camelToKebab(field));
        }
      }
    }
    if (!hasPreviewChanges(preview)) {
      clearElementStylePreview(state.selected);
      updateStatus("Preview matches hydrated value");
    }
  }

  function previewStyleInput(input) {
    if (!input?.dataset?.style || (!editableStyleFields.includes(input.dataset.style) && !helperStyleFields.has(input.dataset.style))) {
      return;
    }
    if (input.value === input.dataset.initial) {
      input.dataset.dirty = "false";
      if (editableStyleFields.includes(input.dataset.style)) {
        clearPreviewStyleField(input.dataset.style);
      }
      return;
    }
    const value = normalizeStyleValue(input.dataset.style, input.value.trim());
    if (!value) {
      return;
    }
    input.value = value;
    input.dataset.dirty = input.value === input.dataset.initial ? "false" : "true";
    if (isColorField(input.dataset.style)) {
      updateColorSwatch(input.dataset.style, value);
    }
    if (input.dataset.style === "opacity") {
      const range = document.querySelector(`#${rootId} [data-opacity-range]`);
      if (range) range.value = value;
    }
    previewStyleField(input.dataset.style, value);
  }

  function stylePreviewUndo(element, preview, mode) {
    const undo = captureUndo(element);
    if (!undo) {
      return null;
    }
    if (mode === "hover") {
      undo.hoverStyles = new Map(preview.hoverBaseStyles);
    } else {
      undo.inlineStyle = preview.normalBaseInlineStyle;
      undo.hoverStyles = new Map(state.hoverStyles);
    }
    return undo;
  }

  function resetSelectedStylePreview() {
    const element = state.selected;
    const preview = state.stylePreviews.get(element) || element?.[previewStateKey];
    if (!element || !preview) {
      updateStatus("No preview changes to reset");
      return;
    }
    if (preview.normalBaseInlineStyle === null) {
      element.removeAttribute("style");
    } else {
      element.setAttribute("style", preview.normalBaseInlineStyle);
    }
    state.hoverStyles = new Map(preview.hoverBaseStyles);
    clearElementStylePreview(element);
    renderHoverStyles();
    hydrateControls(element);
    updateStatus("Reset preview changes");
  }

  function isColorField(field) {
    return field === "backgroundColor" || field === "color" || field === "borderColor" || field === "outlineColor" || field === "iconColor";
  }

  function cssColorToHex(value) {
    const text = String(value || "").trim();
    const hex = normalizeHexColor(text);
    if (hex) {
      return hex;
    }
    const rgbMatch = text.match(/rgba?\(([^)]+)\)/i);
    if (rgbMatch) {
      const parts = parseColorParts(rgbMatch[1]);
      if (parts.length >= 3 && parts.slice(0, 3).every((part) => Number.isFinite(part))) {
        return rgbPartsToHex(parts);
      }
    }
    const srgbMatch = text.match(/color\(\s*srgb\s+([^)]+)\)/i);
    if (srgbMatch) {
      const parts = parseColorParts(srgbMatch[1]).map((part) => part <= 1 ? part * 255 : part);
      if (parts.length >= 3 && parts.slice(0, 3).every((part) => Number.isFinite(part))) {
        return rgbPartsToHex(parts);
      }
    }
    const oklabMatch = text.match(/oklab\(\s*([^)]+)\)/i);
    if (oklabMatch) {
      const parts = parseColorParts(oklabMatch[1]);
      if (parts.length >= 3 && parts.slice(0, 3).every((part) => Number.isFinite(part))) {
        return oklabToHex(parts[0], parts[1], parts[2]);
      }
    }
    return "#000000";
  }

  function parseColorParts(value) {
    return String(value || "")
      .replace(/\//g, " ")
      .split(/[,\s]+/)
      .filter(Boolean)
      .map((part) => part.endsWith("%") ? Number.parseFloat(part) / 100 : Number.parseFloat(part));
  }

  function rgbPartsToHex(parts) {
    return `#${parts.slice(0, 3).map((part) => Math.max(0, Math.min(255, Math.round(part))).toString(16).padStart(2, "0")).join("")}`;
  }

  function oklabToHex(lightness, a, b) {
    const l = lightness + 0.3963377774 * a + 0.2158037573 * b;
    const m = lightness - 0.1055613458 * a - 0.0638541728 * b;
    const s = lightness - 0.0894841775 * a - 1.2914855480 * b;
    const l3 = l * l * l;
    const m3 = m * m * m;
    const s3 = s * s * s;
    const red = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    const green = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    const blue = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
    return rgbPartsToHex([linearRgbToSrgb(red), linearRgbToSrgb(green), linearRgbToSrgb(blue)]);
  }

  function linearRgbToSrgb(value) {
    const clamped = Math.max(0, Math.min(1, value));
    return (clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255;
  }

  function normalizeHexColor(value) {
    const text = String(value || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(text)) {
      return text.toLowerCase();
    }
    if (/^#[0-9a-f]{3}$/i.test(text)) {
      return `#${text.slice(1).split("").map((part) => part + part).join("")}`.toLowerCase();
    }
    return "";
  }

  function hexToRgb(hex) {
    const value = normalizeHexColor(hex) || "#000000";
    return {
      r: Number.parseInt(value.slice(1, 3), 16),
      g: Number.parseInt(value.slice(3, 5), 16),
      b: Number.parseInt(value.slice(5, 7), 16)
    };
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((part) => Math.max(0, Math.min(255, Math.round(Number(part) || 0))).toString(16).padStart(2, "0")).join("")}`;
  }

  function rgbToHsv(r, g, b) {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;
    let h = 0;
    if (delta) {
      if (max === red) h = ((green - blue) / delta) % 6;
      else if (max === green) h = (blue - red) / delta + 2;
      else h = (red - green) / delta + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s: max ? delta / max : 0, v: max };
  }

  function hsvToHex(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }

  function colorStorageKey(type) {
    return `codex-browser-mutation:${type}-colors`;
  }

  function loadColors(type) {
    try {
      const parsed = JSON.parse(localStorage.getItem(colorStorageKey(type)) || "[]");
      const limit = type === "recent" ? 3 : 12;
      return Array.isArray(parsed) ? parsed.map(normalizeHexColor).filter(Boolean).slice(0, limit) : [];
    } catch {
      return [];
    }
  }

  function saveColors(type, colors) {
    const limit = type === "recent" ? 3 : 12;
    localStorage.setItem(colorStorageKey(type), JSON.stringify(colors.map(normalizeHexColor).filter(Boolean).slice(0, limit)));
  }

  function rememberRecentColor(color) {
    const value = normalizeHexColor(color);
    if (!value) {
      return;
    }
    const next = [value, ...loadColors("recent").filter((item) => item !== value)];
    saveColors("recent", next);
  }

  function saveCurrentColor() {
    const input = document.querySelector(`#${rootId} [data-style="${state.activeColorField}"]`);
    const value = normalizeHexColor(input?.value);
    if (!value) {
      updateStatus("Enter a valid hex color first");
      return;
    }
    const next = [value, ...loadColors("saved").filter((item) => item !== value)];
    saveColors("saved", next);
    renderColorPicker();
    updateStatus("Saved color");
  }

  function removeSavedColor(color) {
    const value = normalizeHexColor(color);
    if (!value) {
      return;
    }
    saveColors("saved", loadColors("saved").filter((item) => item !== value));
    renderColorPicker();
    updateStatus("Removed saved color");
  }

  function clearSavedColorDeleteHover() {
    if (state.savedColorHoverTimer) {
      clearTimeout(state.savedColorHoverTimer);
    }
    state.savedColorHoverTimer = null;
    if (state.savedColorDeleteChip) {
      state.savedColorDeleteChip.dataset.deleteReady = "false";
    }
    state.savedColorDeleteChip = null;
  }

  function armSavedColorDelete(chip) {
    if (!chip || chip.dataset.colorScope !== "saved") {
      return;
    }
    clearSavedColorDeleteHover();
    state.savedColorDeleteChip = chip;
    state.savedColorHoverTimer = setTimeout(() => {
      if (state.savedColorDeleteChip === chip && chip.isConnected) {
        chip.dataset.deleteReady = "true";
        chip.title = "Click to remove saved color";
      }
    }, 700);
  }

  function updateColorSwatch(field, color) {
    const swatch = document.querySelector(`#${rootId} [data-color-toggle="${field}"]`);
    const value = normalizeHexColor(color) || "#000000";
    if (swatch) {
      swatch.style.background = value;
      swatch.title = value;
    }
  }

  function setColorField(field, color, options = {}) {
    const value = normalizeHexColor(color);
    const input = document.querySelector(`#${rootId} [data-style="${field}"]`);
    if (!input || !value) {
      return;
    }
    input.value = value;
    input.dataset.dirty = input.value === input.dataset.initial ? "false" : "true";
    updateColorSwatch(field, value);
    previewStyleInput(input);
    if (options.remember !== false) {
      rememberRecentColor(value);
    }
    if (options.render !== false) {
      renderColorPicker();
    }
  }

  function activeColor() {
    const input = document.querySelector(`#${rootId} [data-style="${state.activeColorField}"]`);
    return normalizeHexColor(input?.value) || "#000000";
  }

  function syncColorPickerControls() {
    if (!state.activeColorField) {
      return;
    }
    const color = activeColor();
    const rgb = hexToRgb(color);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const hueValue = Number.isFinite(state.colorHue) ? state.colorHue : hsv.h;
    const root = document.getElementById(rootId);
    const spectrum = root?.querySelector("[data-color-spectrum]");
    if (spectrum) {
      spectrum.style.setProperty("--cbm-hue", String(Math.round(hueValue)));
      const dot = spectrum.querySelector(".cbm-spectrum-dot");
      if (dot) {
        dot.style.left = `${Math.round(hsv.s * 100)}%`;
        dot.style.top = `${Math.round((1 - hsv.v) * 100)}%`;
      }
    }
    const hue = root?.querySelector("[data-color-hue]");
    if (hue) hue.value = String(Math.round(hueValue));
    const hex = root?.querySelector("[data-color-hex]");
    if (hex) hex.value = color;
    const red = root?.querySelector('[data-color-rgb="r"]');
    const green = root?.querySelector('[data-color-rgb="g"]');
    const blue = root?.querySelector('[data-color-rgb="b"]');
    if (red) red.value = String(rgb.r);
    if (green) green.value = String(rgb.g);
    if (blue) blue.value = String(rgb.b);
  }

  function currentHue() {
    const hueInput = document.querySelector(`#${rootId} [data-color-hue]`);
    if (hueInput) {
      return Number(hueInput.value) || 0;
    }
    if (Number.isFinite(state.colorHue)) {
      return state.colorHue;
    }
    const rgb = hexToRgb(activeColor());
    return rgbToHsv(rgb.r, rgb.g, rgb.b).h;
  }

  function setActiveColorFromSpectrum(event, options = {}) {
    if (!state.activeColorField) {
      return;
    }
    const target = options.target || event.currentTarget;
    const rect = target.getBoundingClientRect();
    const s = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const v = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    setColorField(state.activeColorField, hsvToHex(currentHue(), s, v), { render: options.render !== false, remember: options.remember !== false });
    if (options.render === false) {
      syncColorPickerControls();
    }
  }

  function setActiveColorFromHue(value, options = {}) {
    if (!state.activeColorField) {
      return;
    }
    const rgb = hexToRgb(activeColor());
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    state.colorHue = Number(value) || 0;
    setColorField(state.activeColorField, hsvToHex(state.colorHue, hsv.s, hsv.v), { render: options.render !== false, remember: options.remember !== false });
    if (options.render === false) {
      syncColorPickerControls();
    }
  }

  function setActiveColorFromRgb() {
    if (!state.activeColorField) {
      return;
    }
    const root = document.getElementById(rootId);
    const r = root.querySelector('[data-color-rgb="r"]')?.value;
    const g = root.querySelector('[data-color-rgb="g"]')?.value;
    const b = root.querySelector('[data-color-rgb="b"]')?.value;
    setColorField(state.activeColorField, rgbToHex(r, g, b), { render: false, remember: false });
    syncColorPickerControls();
  }

  function beginColorDrag(event) {
    const spectrum = event.target?.closest?.("[data-color-spectrum]");
    if (!spectrum || !state.activeColorField) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    state.colorDrag = spectrum;
    spectrum.setPointerCapture?.(event.pointerId);
    setActiveColorFromSpectrum(event, { render: false, remember: false, target: spectrum });
  }

  function continueColorDrag(event) {
    if (!state.colorDrag) {
      return;
    }
    event.preventDefault();
    setActiveColorFromSpectrum(event, { render: false, remember: false, target: state.colorDrag });
  }

  function finishColorDrag() {
    if (!state.colorDrag) {
      return;
    }
    state.colorDrag = null;
    rememberRecentColor(activeColor());
    renderColorPicker();
  }

  function setActiveColorFromHex() {
    if (!state.activeColorField) {
      return;
    }
    const value = normalizeHexColor(document.querySelector(`#${rootId} [data-color-hex]`)?.value);
    if (value) {
      setColorField(state.activeColorField, value, { render: false, remember: false });
      syncColorPickerControls();
    }
  }

  async function pickWithEyeDropper() {
    if (!state.activeColorField || !window.EyeDropper) {
      updateStatus("Eyedropper is not available here");
      return;
    }
    try {
      const result = await new EyeDropper().open();
      setColorField(state.activeColorField, result.sRGBHex);
    } catch {
      updateStatus("Eyedropper cancelled");
    }
  }

  function colorChip(color, scope = "value") {
    const value = normalizeHexColor(color);
    const title = scope === "saved" ? `${value} - hover, then click × to remove` : value;
    return value ? `<button class="cbm-color-chip" type="button" data-color-value="${value}" data-color-scope="${scope}" style="background:${value}" title="${title}" aria-label="Use ${value}"></button>` : "";
  }

  function renderColorPicker() {
    const popover = document.querySelector(`#${rootId} [data-role="color-popover"]`);
    if (!popover) {
      return;
    }
    const field = state.activeColorField;
    if (!field) {
      popover.dataset.open = "false";
      popover.innerHTML = "";
      schedulePanelHeightFit();
      return;
    }
    const input = document.querySelector(`#${rootId} [data-style="${field}"]`);
    const current = normalizeHexColor(input?.value) || "#000000";
    const rgb = hexToRgb(current);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    state.colorHue = hsv.s === 0 && Number.isFinite(state.colorHue) ? state.colorHue : hsv.h;
    const recent = loadColors("recent");
    const saved = loadColors("saved");
    popover.dataset.open = "true";
    popover.style.setProperty("--cbm-hue", String(Math.round(state.colorHue)));
    popover.innerHTML = `
      <div class="cbm-color-head">
        <span>${field === "backgroundColor" ? "Background" : field === "borderColor" ? "Border" : field === "iconColor" ? "Icon" : "Text"} color</span>
        <button type="button" data-action="save-color" title="Save current color"><span>Save</span></button>
      </div>
      <div class="cbm-spectrum" data-color-spectrum style="--cbm-hue:${Math.round(state.colorHue)}">
        <span class="cbm-spectrum-dot" style="left:${Math.round(hsv.s * 100)}%;top:${Math.round((1 - hsv.v) * 100)}%"></span>
      </div>
      <div class="cbm-picker-bar">
        <button class="cbm-eyedrop" type="button" data-action="eyedropper" title="Pick from page" aria-label="Pick from page">${icons.style}</button>
        <input class="cbm-hue" type="range" min="0" max="359" value="${Math.round(state.colorHue)}" data-color-hue aria-label="Hue">
      </div>
      <div class="cbm-rgb">
        <label><input data-color-rgb="r" inputmode="numeric" value="${rgb.r}"><span>R</span></label>
        <label><input data-color-rgb="g" inputmode="numeric" value="${rgb.g}"><span>G</span></label>
        <label><input data-color-rgb="b" inputmode="numeric" value="${rgb.b}"><span>B</span></label>
      </div>
      <div class="cbm-hex-row"><span>Hex</span><input data-color-hex inputmode="text" spellcheck="false" value="${current}"></div>
      <div class="cbm-color-rows">
        <div class="cbm-color-row"><span>Now</span><div class="cbm-chip-row">${colorChip(current)}</div></div>
        <div class="cbm-color-row"><span>Recent</span><div class="cbm-chip-row">${recent.map((color) => colorChip(color, "recent")).join("") || "<span>None</span>"}</div></div>
        <div class="cbm-color-row"><span>Saved</span><div class="cbm-chip-row">${saved.map((color) => colorChip(color, "saved")).join("") || "<span>None</span>"}</div></div>
      </div>
    `;
    schedulePanelHeightFit();
  }

  function ensureFontOption(control, value) {
    if (!control || !value) {
      return;
    }
    const listId = control instanceof HTMLInputElement ? control.getAttribute("list") : "";
    const optionHost = listId ? document.getElementById(listId) : control;
    if (!optionHost || !("options" in optionHost)) {
      return;
    }
    const exists = Array.from(optionHost.options).some((option) => option.value === value);
    if (!exists) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = formatFontLabel(value);
      optionHost.appendChild(option);
    }
  }

  function ensureSelectOption(select, value, label = value) {
    if (!select || !value) {
      return;
    }
    const exists = Array.from(select.options).some((option) => option.value === value);
    if (!exists) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    }
  }

  function hydrateIconControls(element) {
    const section = document.querySelector(`#${rootId} [data-role="icon-controls"]`);
    const icon = getEditableIcon(element);
    if (section) {
      section.hidden = !icon;
      schedulePanelHeightFit();
    }
    if (!icon) {
      return;
    }
    const target = icon.element;
    const styles = getComputedStyle(target);
    const size = icon.kind === "svg" ? target.getAttribute("width") || styles.width : styles.fontSize;
    const strokeWidth = icon.kind === "svg" ? target.getAttribute("stroke-width") || styles.strokeWidth || "" : "";
    const color = cssColorToHex(styles.color || styles.stroke || target.getAttribute("stroke") || "#000000");
    const strokeInput = document.querySelector(`#${rootId} [data-icon-style="strokeWidth"]`);
    const iconSelect = document.querySelector(`#${rootId} [data-icon-swap]`);
    if (icon.kind === "font") {
      const iconName = getFontIconName(target);
      ensureSelectOption(iconSelect, iconName, iconName);
      setControlValue(iconSelect, iconName);
    }
    setControlValue(document.querySelector(`#${rootId} [data-icon-style="size"]`), size);
    setControlValue(strokeInput, strokeWidth);
    if (strokeInput) {
      strokeInput.disabled = icon.kind === "font";
      strokeInput.placeholder = icon.kind === "font" ? "n/a" : "2";
    }
    setControlValue(document.querySelector(`#${rootId} [data-style="iconColor"]`), color);
  }

  function hydrateControls(element) {
    const textInput = document.querySelector(`#${rootId} [data-role="text"]`);
    setControlValue(textInput, getElementText(element));

    const values = getHydratableStyleValues(element);
    for (const [field, value] of Object.entries(values)) {
      const input = document.querySelector(`#${rootId} [data-style="${field}"]`);
      if (field === "fontFamily") {
        ensureFontOption(input, value);
      }
      if (input instanceof HTMLSelectElement && value) {
        ensureFontOption(input, value);
      }
      setControlValue(input, value);
    }
    hydrateIconControls(element);
  }

  function getHydratableStyleValues(element) {
    const computed = getComputedStyle(element);
    const values = {};
    for (const field of editableStyleFields) {
      if (!inheritedStyleFields.has(field)) {
        values[field] = computed[field];
      }
    }
    const inheritedNormalState = getInheritedRuleState(element, "normal");
    const normalRuleState = getRuleState(element, "normal");
    const inlineStyles = getInlineStyleValues(element);
    const inlineVariables = getInlineCustomProperties(element);
    const variables = {};
    Object.assign(variables, getDocumentRuleVariables(), inheritedNormalState.variables, normalRuleState.variables, inlineVariables);
    Object.assign(values, inheritedNormalState.styles, normalRuleState.styles, inlineStyles);
    if (state.styleState === "hover") {
      const inheritedHoverState = getInheritedRuleState(element, "hover");
      for (const field of inheritedStyleFields) {
        if (inheritedHoverState.styles[field] && !normalRuleState.styles[field] && !inlineStyles[field]) {
          values[field] = inheritedHoverState.styles[field];
        }
      }
      Object.assign(variables, inheritedHoverState.variables);
      Object.assign(values, getAncestorHoverEffectStyles(element, normalRuleState.styles, inlineStyles));
      const hoverRuleState = getRuleState(element, "hover");
      Object.assign(variables, hoverRuleState.variables);
      Object.assign(values, hoverRuleState.styles);
      const hoverId = element.getAttribute("data-cbm-hover-id");
      if (hoverId && state.hoverStyles.has(hoverId)) {
        Object.assign(values, state.hoverStyles.get(hoverId));
      }
    }
    for (const field of ["backgroundColor", "color", "borderColor", "outlineColor"]) {
      values[field] = resolveColorValue(values[field], field, variables, element);
    }
    values.fontSize = computed.fontSize;
    values.fontFamily = computed.fontFamily;
    values.lineHeight = computed.lineHeight;
    values.backgroundAlpha = formatAlphaValue(extractCssAlpha(computed.backgroundColor));
    values.glassBlur = extractBackdropFunction(computed.backdropFilter, "blur") || "";
    values.glassSaturation = extractBackdropFunction(computed.backdropFilter, "saturate") || "";
    return values;
  }

  function resolveColorValue(value, field, variables = {}, element = document.documentElement) {
    const text = String(value || "").trim();
    if (!text) {
      return "#000000";
    }
    const resolvedText = resolveCssVariables(text, variables, element);
    const normalizedHex = normalizeHexColor(resolvedText);
    if (normalizedHex) {
      return normalizedHex;
    }
    if (/^rgba?\(/i.test(resolvedText)) {
      return cssColorToHex(resolvedText);
    }
    const probe = document.createElement("span");
    probe.style.all = "initial";
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    for (const [name, variableValue] of Object.entries(variables)) {
      probe.style.setProperty(name, variableValue);
    }
    probe.style.setProperty(camelToKebab(field), resolvedText);
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe)[field];
    probe.remove();
    return cssColorToHex(resolved);
  }

  function resolveCssVariables(value, variables, element) {
    let resolved = String(value || "").trim();
    for (let index = 0; index < 8 && resolved.includes("var("); index += 1) {
      const next = resolved.replace(/var\(\s*(--[-_a-zA-Z0-9]+)\s*(?:,\s*([^)]+))?\)/g, (_match, name, fallback = "") => {
        const variableValue = variables[name] || getComputedStyle(element).getPropertyValue(name).trim();
        return variableValue || fallback.trim();
      });
      if (next === resolved) {
        break;
      }
      resolved = next;
    }
    return resolved;
  }

  function getDocumentRuleVariables() {
    const variables = {};
    for (const sheet of Array.from(document.styleSheets)) {
      collectRuleStyles({}, document.documentElement, getCssRules(sheet), "normal", [""], variables);
    }
    return variables;
  }

  function getInheritedRuleStyles(element, mode) {
    return getInheritedRuleState(element, mode).styles;
  }

  function getInheritedRuleState(element, mode) {
    const stateForRules = { styles: {}, variables: {} };
    const chain = [];
    let current = element.parentElement;
    while (current && !isOverlayElement(current)) {
      chain.unshift(current);
      current = current.parentElement;
    }
    for (const ancestor of chain) {
      const ancestorState = mode === "hover" ? getRuleState(ancestor, "hover") : getRuleState(ancestor, "normal");
      for (const field of inheritedStyleFields) {
        if (ancestorState.styles[field]) {
          stateForRules.styles[field] = ancestorState.styles[field];
        }
      }
      Object.assign(stateForRules.variables, ancestorState.variables);
      const inlineStyles = getInlineStyleValues(ancestor);
      for (const field of inheritedStyleFields) {
        if (inlineStyles[field]) {
          stateForRules.styles[field] = inlineStyles[field];
        }
      }
      Object.assign(stateForRules.variables, getInlineCustomProperties(ancestor));
    }
    return stateForRules;
  }

  function getAncestorHoverEffectStyles(element, normalRuleStyles, inlineStyles) {
    const styles = {};
    let current = element.parentElement;
    while (current && !isOverlayElement(current)) {
      const ancestorStyles = getHoverRuleStyles(current);
      for (const field of subtreeHoverEffectFields) {
        if (ancestorStyles[field] && !normalRuleStyles[field] && !inlineStyles[field]) {
          styles[field] = ancestorStyles[field];
        }
      }
      current = current.parentElement;
    }
    return styles;
  }

  function getNormalRuleStyles(element) {
    return getRuleState(element, "normal").styles;
  }

  function getHoverRuleStyles(element) {
    return getRuleState(element, "hover").styles;
  }

  function getRuleState(element, mode) {
    const styles = {};
    const variables = {};
    for (const sheet of Array.from(document.styleSheets)) {
      collectRuleStyles(styles, element, getCssRules(sheet), mode, [""], variables);
    }
    return { styles, variables };
  }

  function getInlineStyleValues(element) {
    const styles = {};
    for (const field of editableStyleFields) {
      const value = element.style.getPropertyValue(camelToKebab(field));
      if (value) {
        styles[field] = value.trim();
      }
    }
    return styles;
  }

  function getInlineCustomProperties(element) {
    const variables = {};
    for (const property of Array.from(element.style || [])) {
      if (property.startsWith("--")) {
        variables[property] = element.style.getPropertyValue(property).trim();
      }
    }
    return variables;
  }

  function getCssRules(sheet) {
    try {
      return Array.from(sheet.cssRules || []);
    } catch {
      return [];
    }
  }

  function collectRuleStyles(styles, element, rules, mode, selectorContexts = [""], variables = null) {
    for (const rule of rules) {
      const selectors = rule.selectorText
        ? combineSelectorContexts(selectorContexts, splitSelectorList(rule.selectorText))
        : selectorContexts;
      if (rule.style?.length && selectors.length) {
        const isHoverRule = selectors.some((selector) => selector.includes(":hover"));
        if ((mode === "hover") === isHoverRule) {
          const matches = selectors.some((selector) => selectorMatchesForMode(element, selector, mode));
          if (matches) {
            if (variables) {
              collectCustomProperties(variables, rule.style);
            }
            for (const field of editableStyleFields) {
              const value = rule.style.getPropertyValue(camelToKebab(field));
              if (value) {
                styles[field] = value.trim();
              }
            }
          }
        }
      }
      if (rule.cssRules?.length) {
        collectRuleStyles(styles, element, Array.from(rule.cssRules), mode, selectors, variables);
      }
    }
  }

  function collectCustomProperties(variables, style) {
    for (const property of Array.from(style || [])) {
      if (property.startsWith("--")) {
        variables[property] = style.getPropertyValue(property).trim();
      }
    }
  }

  function combineSelectorContexts(contexts, selectors) {
    const combined = [];
    for (const context of contexts) {
      for (const selector of selectors) {
        const trimmed = selector.trim();
        if (!trimmed) {
          continue;
        }
        if (!context) {
          combined.push(trimmed);
        } else if (trimmed.includes("&")) {
          combined.push(trimmed.replace(/&/g, context));
        } else {
          combined.push(`${context} ${trimmed}`);
        }
      }
    }
    return combined;
  }

  function splitSelectorList(selectorText) {
    const selectors = [];
    let current = "";
    let depth = 0;
    for (const char of selectorText) {
      if (char === "(" || char === "[") {
        depth += 1;
      } else if ((char === ")" || char === "]") && depth > 0) {
        depth -= 1;
      }
      if (char === "," && depth === 0) {
        selectors.push(current);
        current = "";
        continue;
      }
      current += char;
    }
    if (current) {
      selectors.push(current);
    }
    return selectors;
  }

  function selectorMatchesForMode(element, selector, mode) {
    const trimmed = selector.trim();
    if (!trimmed || trimmed.includes(":not(:hover") || trimmed.includes(":has(:hover")) {
      return false;
    }
    const matchable = mode === "hover" ? trimmed.replace(/:hover\b/g, "").trim() || "*" : trimmed;
    try {
      return element.matches(matchable);
    } catch {
      return false;
    }
  }

  function selectableElementFor(target) {
    if (!(target instanceof Element)) {
      return null;
    }
    const interactiveOwner = target.closest("button, a, summary");
    return interactiveOwner || target;
  }

  function selectElement(element, options = {}) {
    element = selectableElementFor(element);
    if (!element || isOverlayElement(element)) {
      return;
    }
    if (state.pendingMove && state.pendingMove.element !== element) {
      cancelPendingMove({ silent: true });
    }
    state.selected = element;
    originalFor(element);
    hydrateControls(element);
    syncHoverPreview();
    if (options.record) {
      record("selected", element);
    } else {
      updateStatus("Selected. Alt+Click or capture to record.");
    }
    updatePanel();
  }

  function clearSelection(options = {}) {
    cancelPendingMove({ silent: true, skipPanel: true });
    state.selected = null;
    state.mode = "interact";
    syncHoverPreview();
    syncModeButtons();
    updatePanel();
    if (!options.silent) {
      updateStatus("Selection cleared");
    }
  }

  function applyText() {
    const selected = selectedElement();
    if (!selected) {
      return;
    }
    pushUndo(selected);
    const input = document.querySelector(`#${rootId} [data-role="text"]`);
    const value = input ? input.value : "";
    if (selected instanceof HTMLInputElement || selected instanceof HTMLTextAreaElement) {
      selected.value = value;
      selected.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      selected.textContent = value;
    }
    record("text", selected, { value });
  }

  function applyStyles() {
    const selected = selectedElement();
    if (!selected) {
      return;
    }
    document.querySelectorAll(`#${rootId} [data-style]`).forEach((input) => previewStyleInput(input));
    const preview = state.stylePreviews.get(selected);
    const changed = { ...currentPreviewChanges(preview) };
    if (!Object.keys(changed).length) {
      updateStatus("No preview changes to record");
      return;
    }
    const undo = stylePreviewUndo(selected, preview, state.styleState);
    if (undo) {
      state.undoStack.push(undo);
    }
    if (state.styleState === "hover") {
      const hoverId = ensureHoverId(selected);
      markAppliedFields(changed);
      record("state-style", selected, {
        state: "hover",
        selector: `[data-cbm-hover-id="${hoverId}"]:hover`,
        styles: changed
      });
      preview.hoverChanged = {};
      preview.hoverBaseStyles = new Map(state.hoverStyles);
      if (!hasPreviewChanges(preview)) {
        clearElementStylePreview(selected);
      }
      return;
    }
    for (const [field, value] of Object.entries(changed)) {
      if (isColorField(field)) {
        rememberRecentColor(value);
      }
    }
    markAppliedFields(changed);
    record("style", selected, changed);
    preview.normalChanged = {};
    preview.normalBaseInlineStyle = selected.getAttribute("style");
    if (!hasPreviewChanges(preview)) {
      clearElementStylePreview(selected);
    }
  }

  function markAppliedFields(changed) {
    for (const [field, value] of Object.entries(changed)) {
      const input = document.querySelector(`#${rootId} [data-style="${field}"]`);
      if (input) {
        input.value = value;
        input.dataset.initial = value;
        input.dataset.dirty = "false";
        if (isColorField(field)) {
          updateColorSwatch(field, value);
        }
        if (field === "opacity") {
          const range = document.querySelector(`#${rootId} [data-opacity-range]`);
          if (range) range.value = value;
        }
      }
    }
    markHelperFieldsApplied(changed);
  }

  function markHelperFieldsApplied(changed) {
    const helperFields = changed.backgroundColor ? ["backgroundAlpha"] : [];
    if (changed.backdropFilter) {
      helperFields.push("glassBlur", "glassSaturation");
    }
    for (const field of helperFields) {
      const input = document.querySelector(`#${rootId} [data-style="${field}"]`);
      if (input) {
        input.dataset.initial = input.value;
        input.dataset.dirty = "false";
      }
    }
  }

  function normalizeStyleValue(field, value) {
    if (isColorField(field)) {
      const normalized = normalizeHexColor(value);
      if (normalized) {
        return normalized;
      }
      return /^rgba?\(/i.test(String(value).trim()) ? String(value).trim() : "";
    }
    const lengthFields = new Set(["borderRadius", "borderWidth", "outlineWidth", "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "margin", "marginTop", "marginRight", "marginBottom", "marginLeft", "gap", "fontSize", "width", "height"]);
    if (lengthFields.has(field) && /^-?\d+(\.\d+)?$/.test(value)) {
      return `${value}px`;
    }
    if (field === "opacity") {
      const numeric = String(value).trim().endsWith("%") ? Number.parseFloat(value) / 100 : Number.parseFloat(value);
      return Number.isFinite(numeric) ? String(Math.max(0, Math.min(1, numeric))) : "";
    }
    if (field === "lineHeight" && /^-?\d+(\.\d+)?$/.test(value)) {
      return value;
    }
    if (field === "letterSpacing" && /^-?\d+(\.\d+)?$/.test(value)) {
      return `${value}px`;
    }
    if (field === "fontFamily" && value === "Current") {
      return "";
    }
    if (field === "zIndex" && /^-?\d+$/.test(value)) {
      return value;
    }
    return value;
  }

  function normalizeAlphaValue(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    const numeric = text.endsWith("%") ? Number.parseFloat(text) / 100 : Number.parseFloat(text);
    return Number.isFinite(numeric) ? String(Math.max(0, Math.min(1, numeric))) : "";
  }

  function formatAlphaValue(value) {
    return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : "1";
  }

  function extractCssAlpha(value) {
    const text = String(value || "").trim();
    const slash = text.match(/\/\s*([0-9.]+%?)\s*\)$/);
    if (slash) {
      return Number.parseFloat(slash[1]) / (slash[1].endsWith("%") ? 100 : 1);
    }
    const rgba = text.match(/rgba?\(([^)]+)\)/i);
    if (!rgba) {
      return 1;
    }
    const parts = rgba[1].replace(/\//g, " ").split(/[,\s]+/).filter(Boolean);
    if (parts.length < 4) {
      return 1;
    }
    const alpha = parts[3];
    return Number.parseFloat(alpha) / (alpha.endsWith("%") ? 100 : 1);
  }

  function extractBackdropFunction(value, name) {
    const match = String(value || "").match(new RegExp(`${name}\\(([^)]+)\\)`, "i"));
    return match ? `${name}(${match[1].trim()})` : "";
  }

  function composeGlassBackdropFilter(blurValue, saturationValue) {
    const blurText = String(blurValue || "").trim();
    const saturationText = String(saturationValue || "").trim();
    const parts = [];
    if (blurText && blurText !== "none") {
      parts.push(/^blur\(/i.test(blurText) ? blurText : `blur(${normalizeStyleValue("borderRadius", blurText) || blurText})`);
    }
    if (saturationText && saturationText !== "none") {
      const saturation = saturationText.endsWith("%") || /^saturate\(/i.test(saturationText) ? saturationText : `${saturationText}%`;
      parts.push(/^saturate\(/i.test(saturation) ? saturation : `saturate(${saturation})`);
    }
    return parts.join(" ") || "none";
  }

  function getFontOptions() {
    const fonts = new Set([
      "Current",
      "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
      "Inter, system-ui, sans-serif",
      "Arial, Helvetica, sans-serif",
      "Georgia, \"Times New Roman\", serif",
      "\"Times New Roman\", Times, serif",
      "\"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace",
      "Consolas, \"Liberation Mono\", monospace"
    ]);
    document.querySelectorAll("body *").forEach((element) => {
      if (isOverlayElement(element)) {
        return;
      }
      const text = getElementText(element);
      if (!text) {
        return;
      }
      const family = getComputedStyle(element).fontFamily;
      if (family) {
        fonts.add(family);
      }
    });
    return Array.from(fonts).slice(0, 18);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function formatFontLabel(value) {
    if (value === "Current") {
      return "Current";
    }
    return value
      .split(",")[0]
      .replaceAll('"', "")
      .trim();
  }

  function typefaceField(fontOptions) {
    const options = [
      ["system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif", "System"],
      ["Inter, system-ui, sans-serif", "Inter"],
      ["Arial, Helvetica, sans-serif", "Arial"],
      ["Georgia, \"Times New Roman\", serif", "Serif"],
      ["\"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace", "Mono"],
      ...getFontOptions().filter((font) => font !== "Current").map((font) => [font, formatFontLabel(font)])
    ];
    const seen = new Set();
    const menuOptions = options.filter(([value]) => {
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
    return `
      <label>Typeface
        <div class="cbm-typeface-field" data-role="typeface-field">
          <input data-style="fontFamily" list="cbm-font-family-options" placeholder="system-ui, sans-serif">
          <button class="cbm-icon" type="button" data-action="font-menu" title="Choose typeface" aria-label="Choose typeface">v</button>
          <div class="cbm-typeface-menu" data-role="font-menu">
            ${menuOptions.map(([value, label]) => `<button class="cbm-typeface-option" type="button" data-action="font-option" data-font-value="${escapeHtml(value)}" title="${escapeHtml(value)}">${escapeHtml(label)}</button>`).join("")}
          </div>
        </div>
        <datalist id="cbm-font-family-options">${fontOptions}</datalist>
      </label>
    `;
  }

  function colorField(label, field) {
    return `
      <label>${label}
        <div class="cbm-color-field">
          <button class="cbm-color-swatch" type="button" data-color-toggle="${field}" title="Open color picker" aria-label="Open ${label} color picker"></button>
          <input data-style="${field}" inputmode="text" spellcheck="false" placeholder="#000000">
        </div>
      </label>
    `;
  }

  function guideCandidateLabel(element, identity, classNames) {
    if (identity.id) {
      return `#${identity.id}`;
    }
    if (identity.ariaLabel) {
      return `[aria-label="${identity.ariaLabel}"]`;
    }
    if (identity.testId) {
      return `[data-testid="${identity.testId}"]`;
    }
    if (identity.title) {
      return `[title="${identity.title}"]`;
    }
    if (identity.text) {
      return identity.text.length > 48 ? `${identity.text.slice(0, 45)}...` : identity.text;
    }
    return classNames.length ? `.${classNames[0]}` : element.localName;
  }

  function rectSnapshotForGuides(element, role = "element") {
    const rect = element.getBoundingClientRect();
    const identity = getIdentity(element);
    const classNames = String(identity.className || "").split(/\s+/).filter(Boolean);
    const id = identity.cssPath || identity.id || classNames.join(".") || element.localName;
    return {
      id,
      label: guideCandidateLabel(element, identity, classNames),
      role,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      right: rect.right,
      bottom: rect.bottom,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      priority: guideCandidatePriority(element, role, rect)
    };
  }

  function guideCandidatePriority(element, role, rect = element.getBoundingClientRect()) {
    if (role === "surface") return 90;
    if (role === "parent" || role === "ancestor") return 80;
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || element.isContentEditable) {
      return 85;
    }
    if (element.matches("button, a, summary") || element.closest("button, a, summary")) {
      return 35;
    }
    if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "label"].includes(element.localName)) {
      return 70;
    }
    if (rect.width >= 180 && rect.height >= 44) {
      return 65;
    }
    return 45;
  }

  function isGuideCandidate(element, selected, role = "element") {
    if (!element || element === selected || element === document.documentElement || element === document.body) {
      return false;
    }
    if (isOverlayElement(element) || selected.contains(element)) {
      return false;
    }
    const interactiveOwner = element.closest("button, a, summary");
    if (interactiveOwner && interactiveOwner !== element) {
      return false;
    }
    if (element.contains(selected) && role !== "parent" && role !== "ancestor") {
      return false;
    }
    const styles = getComputedStyle(element);
    if (styles.display === "none" || styles.visibility === "hidden" || styles.opacity === "0") {
      return false;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) {
      return false;
    }
    if (rect.right < -80 || rect.bottom < -80 || rect.left > window.innerWidth + 80 || rect.top > window.innerHeight + 80) {
      return false;
    }
    const tag = element.localName;
    const isFormControl = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement;
    const isInteractive = Boolean(element.closest("button, a, summary")) || element.matches("button, a, summary");
    return guideLogic.isMeaningfulGuideCandidate({
      tag,
      namespace: element.namespaceURI === "http://www.w3.org/2000/svg" ? "svg" : "html",
      display: styles.display,
      text: getElementText(element),
      placeholder: isFormControl ? element.getAttribute("placeholder") : "",
      width: rect.width,
      height: rect.height,
      interactive: isInteractive,
      formControl: isFormControl,
      contentEditable: element.isContentEditable,
      iconRoot: tag === "svg" || tag === "img" || tag === "canvas",
      hasRole: element.hasAttribute("role"),
      hasAriaLabel: element.hasAttribute("aria-label"),
      hasTestId: element.hasAttribute("data-testid") || element.hasAttribute("data-test-id")
    });
  }

  function moveSurfaceFor(selected) {
    const selectedRect = selected.getBoundingClientRect();
    let current = selected.parentElement;
    while (current && current !== document.body && current !== document.documentElement) {
      const rect = current.getBoundingClientRect();
      const hasUsefulScale = rect.width >= selectedRect.width * 1.5 && rect.height >= selectedRect.height * 2.5;
      const childCount = current.children.length;
      if (hasUsefulScale && childCount >= 2) {
        return current;
      }
      current = current.parentElement;
    }
    return selected.parentElement || document.body;
  }

  function collectMoveGuideCandidates(selected) {
    const seen = new Set();
    const candidates = [];
    const add = (element, role = "element") => {
      if (!element || seen.has(element) || !isGuideCandidate(element, selected, role)) {
        return;
      }
      seen.add(element);
      candidates.push(rectSnapshotForGuides(element, role));
    };
    if (selected.parentElement) {
      add(selected.parentElement, "parent");
      Array.from(selected.parentElement.children).forEach((child) => add(child, "sibling"));
    }
    const surface = moveSurfaceFor(selected);
    add(surface, "surface");
    let current = selected.parentElement;
    while (current && current !== surface && current.parentElement) {
      add(current.parentElement, "ancestor");
      current = current.parentElement;
    }
    const all = Array.from(surface?.querySelectorAll("*") || []);
    for (const element of all) {
      if (candidates.length >= 160) {
        break;
      }
      add(element, "page");
    }
    return candidates;
  }

  function collectNearbyMoveCandidates(selected, movedRect) {
    const seen = new Set();
    const candidates = [];
    const add = (element, role = "nearby") => {
      if (!element || seen.has(element) || !isGuideCandidate(element, selected, role)) {
        return;
      }
      const candidate = rectSnapshotForGuides(element, role);
      if (guideLogic.filterMoveCandidates(movedRect, [candidate], { radius: snapCandidateRadius }).length) {
        seen.add(element);
        candidates.push(candidate);
      }
    };
    const all = Array.from(document.body?.querySelectorAll("*") || []);
    for (const element of all) {
      if (candidates.length >= 120) {
        break;
      }
      add(element);
    }
    return candidates;
  }

  function guideLayer() {
    return document.getElementById(guideLayerId);
  }

  function hideMoveGuides() {
    const layer = guideLayer();
    if (layer) {
      layer.replaceChildren();
      layer.style.display = "none";
    }
    state.lastMoveGuide = null;
  }

  function lineElement(className, axis, styles) {
    const element = document.createElement("div");
    element.className = className;
    element.dataset.axis = axis;
    Object.assign(element.style, styles);
    return element;
  }

  function labelElement(text, left, top, kind = "") {
    const element = document.createElement("div");
    element.className = "cbm-guide-label";
    element.textContent = text;
    if (kind) {
      element.dataset.kind = kind;
    }
    element.style.left = `${Math.round(left)}px`;
    element.style.top = `${Math.round(top)}px`;
    return element;
  }

  function renderGuideMatch(layer, match, selectedRect) {
    const guide = match.guide;
    if (!guide) {
      return;
    }
    if (match.axis === "x") {
      const from = Math.max(0, Math.min(selectedRect.top, selectedRect.bottom, guide.from, guide.to) - 28);
      const to = Math.min(window.innerHeight, Math.max(selectedRect.top, selectedRect.bottom, guide.from, guide.to) + 28);
      layer.appendChild(lineElement("cbm-guide-line", "x", {
        left: `${Math.round(guide.value)}px`,
        top: `${Math.round(from)}px`,
        height: `${Math.max(1, Math.round(to - from))}px`
      }));
      if (match.kind === "center") {
        layer.appendChild(labelElement("center", guide.value + 6, (from + to) / 2 - 8, "center"));
      }
      return;
    }
    const from = Math.max(0, Math.min(selectedRect.left, selectedRect.right, guide.from, guide.to) - 28);
    const to = Math.min(window.innerWidth, Math.max(selectedRect.left, selectedRect.right, guide.from, guide.to) + 28);
    layer.appendChild(lineElement("cbm-guide-line", "y", {
      left: `${Math.round(from)}px`,
      top: `${Math.round(guide.value)}px`,
      width: `${Math.max(1, Math.round(to - from))}px`
    }));
    if (match.kind === "center") {
      layer.appendChild(labelElement("center", (from + to) / 2 - 18, guide.value + 6, "center"));
    }
  }

  function candidateById(candidates, id) {
    return candidates.find((candidate) => candidate.id === id) || null;
  }

  function renderSpacing(layer, selectedRect, candidates) {
    const spacing = guideLogic.measureSpacing(selectedRect, candidates)
      .filter((item) => item.distance <= 360)
      .slice(0, 4);
    for (const item of spacing) {
      const target = candidateById(candidates, item.targetId);
      if (!target) {
        continue;
      }
      if (item.side === "left" || item.side === "right") {
        const isContainer = item.targetRole === "parent" || item.targetRole === "ancestor";
        const start = item.side === "left"
          ? (isContainer ? target.left : target.right)
          : selectedRect.right;
        const end = item.side === "left"
          ? selectedRect.left
          : (isContainer ? target.right : target.left);
        const y = isContainer
          ? Math.round(selectedRect.top + selectedRect.height / 2)
          : Math.round((Math.max(selectedRect.top, target.top) + Math.min(selectedRect.bottom, target.bottom)) / 2);
        layer.appendChild(lineElement("cbm-spacing-line", "x", {
          left: `${Math.round(start)}px`,
          top: `${y}px`,
          width: `${Math.max(1, Math.round(end - start))}px`
        }));
        layer.appendChild(labelElement(String(Math.round(item.distance)), (start + end) / 2 - 9, y - 24));
        continue;
      }
      const isContainer = item.targetRole === "parent" || item.targetRole === "ancestor";
      const start = item.side === "top"
        ? (isContainer ? target.top : target.bottom)
        : selectedRect.bottom;
      const end = item.side === "top"
        ? selectedRect.top
        : (isContainer ? target.bottom : target.top);
      const x = isContainer
        ? Math.round(selectedRect.left + selectedRect.width / 2)
        : Math.round((Math.max(selectedRect.left, target.left) + Math.min(selectedRect.right, target.right)) / 2);
      layer.appendChild(lineElement("cbm-spacing-line", "y", {
        left: `${x}px`,
        top: `${Math.round(start)}px`,
        height: `${Math.max(1, Math.round(end - start))}px`
      }));
      layer.appendChild(labelElement(String(Math.round(item.distance)), x + 8, (start + end) / 2 - 8));
    }
    return spacing.length;
  }

  function renderMoveGuides(result, candidates) {
    const layer = guideLayer();
    if (!layer) {
      return;
    }
    layer.replaceChildren();
    for (const match of result.matches) {
      renderGuideMatch(layer, match, result.rect);
    }
    const spacingCount = renderSpacing(layer, result.rect, candidates);
    layer.style.display = result.matches.length || spacingCount ? "block" : "none";
  }

  function moveSibling(direction) {
    if (!state.selected || !state.selected.parentElement) {
      return;
    }
    const parent = state.selected.parentElement;
    const beforeIndex = getIndex(state.selected);
    pushUndo(state.selected);
    if (direction < 0 && state.selected.previousElementSibling) {
      parent.insertBefore(state.selected, state.selected.previousElementSibling);
    }
    if (direction > 0 && state.selected.nextElementSibling) {
      parent.insertBefore(state.selected.nextElementSibling, state.selected);
    }
    record("reorder", state.selected, { beforeIndex, afterIndex: getIndex(state.selected) });
  }

  function moveOriginFor(element, styles) {
    if (styles.position === "fixed") {
      return { left: 0, top: 0 };
    }
    const parent = element.offsetParent instanceof HTMLElement ? element.offsetParent : null;
    if (!parent) {
      return { left: window.scrollX, top: window.scrollY };
    }
    const rect = parent.getBoundingClientRect();
    return {
      left: rect.left + parent.clientLeft - parent.scrollLeft,
      top: rect.top + parent.clientTop - parent.scrollTop
    };
  }

  function promoteSelectedForMove(element, styles) {
    const rect = element.getBoundingClientRect();
    const marginLeft = Number.parseFloat(styles.marginLeft || "0") || 0;
    const marginTop = Number.parseFloat(styles.marginTop || "0") || 0;
    const left = rect.left - marginLeft;
    const top = rect.top - marginTop;
    document.body.appendChild(element);
    element.style.position = "fixed";
    element.style.left = `${Math.round(left)}px`;
    element.style.top = `${Math.round(top)}px`;
    element.style.right = "auto";
    element.style.bottom = "auto";
    element.style.zIndex = "2147483644";
    return { left, top };
  }

  function prepareSelectedForMove(element, styles) {
    if (styles.position === "absolute" || styles.position === "fixed") {
      return promoteSelectedForMove(element, styles);
    }
    if (styles.position === "static") {
      element.style.position = "relative";
      if (styles.zIndex === "auto") {
        element.style.zIndex = "1000";
      }
      return { left: Number.parseFloat(element.style.left || "0") || 0, top: Number.parseFloat(element.style.top || "0") || 0 };
    }
    if (styles.zIndex === "auto") {
      element.style.zIndex = "1000";
    }
    return { left: Number.parseFloat(element.style.left || "0") || 0, top: Number.parseFloat(element.style.top || "0") || 0 };
  }

  function beginMove(event) {
    if (!state.selected || state.mode !== "move" || isOverlayElement(event.target)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const undo = captureUndo(state.selected);
    const styles = getComputedStyle(state.selected);
    const start = prepareSelectedForMove(state.selected, styles);
    const startRect = rectSnapshotForGuides(state.selected, "selected");
    const candidates = collectMoveGuideCandidates(state.selected);
    state.drag = {
      x: event.clientX,
      y: event.clientY,
      left: start.left,
      top: start.top,
      rect: startRect,
      candidates,
      activeCandidates: candidates,
      axisLock: null,
      lastGuide: null,
      undo
    };
    state.lastMoveGuide = null;
  }

  function continueMove(event) {
    if (!state.drag || !state.selected) {
      return;
    }
    const rawDx = event.clientX - state.drag.x;
    const rawDy = event.clientY - state.drag.y;
    const locked = guideLogic.applyAxisLock(rawDx, rawDy, {
      shiftKey: event.shiftKey,
      currentLock: state.drag.axisLock,
      threshold: 4
    });
    state.drag.axisLock = locked.axisLock;
    const dx = locked.dx;
    const dy = locked.dy;
    const movedRect = guideLogic.moveRect(state.drag.rect, dx, dy);
    const nearbyCandidates = collectNearbyMoveCandidates(state.selected, movedRect);
    const activeCandidates = guideLogic.mergeNearbyCandidates(movedRect, state.drag.candidates, nearbyCandidates, {
      radius: snapCandidateRadius
    });
    state.drag.activeCandidates = activeCandidates;
    const guideResult = event.altKey
      ? {
          rect: movedRect,
          delta: { x: dx, y: dy },
          matches: []
        }
      : guideLogic.snapRect(state.drag.rect, {
          dx,
          dy,
          candidates: activeCandidates,
          axes: state.drag.axisLock ? [state.drag.axisLock] : ["x", "y"],
          centerOnly: state.centerSnapKey,
          threshold: snapThreshold
        });
    state.drag.lastGuide = guideResult;
    state.lastMoveGuide = {
      delta: guideResult.delta,
      axisLock: state.drag.axisLock,
      centerOnly: state.centerSnapKey,
      matches: guideResult.matches,
      spacing: guideLogic.measureSpacing(guideResult.rect, activeCandidates).slice(0, 4),
      landingReferences: guideLogic.nearestMoveReferences(guideResult.rect, activeCandidates, { limit: 4 }),
      candidateCount: activeCandidates.length
    };
    state.selected.style.left = `${Math.round(state.drag.left + guideResult.delta.x)}px`;
    state.selected.style.top = `${Math.round(state.drag.top + guideResult.delta.y)}px`;
    updateOutline();
    renderMoveGuides(guideResult, activeCandidates);
  }

  function finishMove() {
    if (!state.drag || !state.selected) {
      return;
    }
    const moved = state.drag;
    const moveGuide = state.lastMoveGuide;
    state.drag = null;
    hideMoveGuides();
    stagePendingMove(moved, moveGuide);
    state.lastMoveGuide = null;
  }

  function beginResize(event) {
    if (!state.selected) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const rect = state.selected.getBoundingClientRect();
    state.resize = {
      x: event.clientX,
      y: event.clientY,
      width: rect.width,
      height: rect.height,
      undo: captureUndo(state.selected)
    };
  }

  function continueResize(event) {
    if (!state.resize || !state.selected) {
      return;
    }
    const width = Math.max(8, Math.round(state.resize.width + event.clientX - state.resize.x));
    const height = Math.max(8, Math.round(state.resize.height + event.clientY - state.resize.y));
    state.selected.style.width = `${width}px`;
    state.selected.style.height = `${height}px`;
    updateOutline();
  }

  function finishResize() {
    if (!state.resize || !state.selected) {
      return;
    }
    const resized = state.resize;
    state.resize = null;
    if (resized.undo) {
      state.undoStack.push(resized.undo);
    }
    record("resize", state.selected, {
      width: state.selected.style.width,
      height: state.selected.style.height
    });
  }

  function pickParent(target) {
    if (!state.selected || !target || target === state.selected || state.selected.contains(target)) {
      return;
    }
    const beforeParent = state.selected.parentElement ? getIdentity(state.selected.parentElement) : null;
    pushUndo(state.selected);
    target.appendChild(state.selected);
    state.mode = "interact";
    syncModeButtons();
    record("reparent", state.selected, { beforeParent, afterParent: getIdentity(target) });
  }

  function applyIconStyles() {
    const icon = getEditableIcon();
    if (!state.selected || !icon) {
      updateStatus("Select an icon first");
      return;
    }
    const target = icon.element;
    const fields = {};
    const sizeInput = document.querySelector(`#${rootId} [data-icon-style="size"]`);
    const strokeInput = document.querySelector(`#${rootId} [data-icon-style="strokeWidth"]`);
    const colorInput = document.querySelector(`#${rootId} [data-style="iconColor"]`);
    if (sizeInput && (sizeInput.dataset.dirty === "true" || sizeInput.value !== sizeInput.dataset.initial)) {
      fields.size = normalizeStyleValue("fontSize", sizeInput.value.trim());
    }
    if (icon.kind === "svg" && strokeInput && (strokeInput.dataset.dirty === "true" || strokeInput.value !== strokeInput.dataset.initial)) {
      fields.strokeWidth = normalizeStyleValue("borderWidth", strokeInput.value.trim());
    }
    if (colorInput && (colorInput.dataset.dirty === "true" || colorInput.value !== colorInput.dataset.initial)) {
      fields.color = normalizeHexColor(colorInput.value);
    }
    Object.keys(fields).forEach((key) => {
      if (!fields[key]) delete fields[key];
    });
    if (!Object.keys(fields).length) {
      updateStatus("No icon changes to apply");
      return;
    }
    const beforeIcon = icon.kind === "font" ? getFontIconSnapshot(target) : getSvgSnapshot(target);
    pushUndo(state.selected);
    if (fields.size) {
      if (icon.kind === "font") {
        target.style.fontSize = fields.size;
      } else {
        target.style.width = fields.size;
        target.style.height = fields.size;
      }
    }
    if (icon.kind === "svg" && fields.strokeWidth) {
      target.setAttribute("stroke-width", fields.strokeWidth.replace(/px$/, ""));
    }
    if (fields.color) {
      target.style.color = fields.color;
      if (icon.kind === "svg") {
        target.setAttribute("stroke", "currentColor");
        if (target.getAttribute("fill") && target.getAttribute("fill") !== "none") {
          target.setAttribute("fill", "currentColor");
        }
      }
      rememberRecentColor(fields.color);
    }
    hydrateIconControls(state.selected);
    record("icon-style", state.selected, {
      targetKind: icon.kind,
      beforeIcon,
      afterIcon: icon.kind === "font" ? getFontIconSnapshot(target) : getSvgSnapshot(target),
      fields
    });
  }

  function swapIcon() {
    const icon = getEditableIcon();
    const select = document.querySelector(`#${rootId} [data-icon-swap]`);
    const name = select?.value;
    const markup = name ? builtInIcons[name] : "";
    if (!state.selected || !icon || !name) {
      updateStatus("Select an icon first");
      return;
    }
    if (icon.kind === "font") {
      const target = icon.element;
      const fontIconName = normalizeFontIconName(name);
      if (!fontIconName) {
        updateStatus("Choose an icon first");
        return;
      }
      const beforeIcon = getFontIconSnapshot(target);
      const provider = beforeIcon?.provider || getFontIconProvider(target);
      pushUndo(state.selected);
      if (provider === "material") {
        target.textContent = fontIconName.replace(/-/g, "_");
      } else if (provider === "iconify") {
        const current = target.getAttribute("data-icon") || "";
        const namespace = current.includes(":") ? current.split(":")[0] : "ph";
        target.setAttribute("data-icon", `${namespace}:${fontIconName}`);
      } else {
        const prefix = ["ph", "fa", "bi", "ri", "icon"].includes(provider) ? provider : "icon";
        Array.from(target.classList).forEach((className) => {
          if (className.startsWith(`${prefix}-`) || (provider === "fa" && className.startsWith("fa-"))) {
            target.classList.remove(className);
          }
        });
        if (provider === "ph") target.classList.add("ph");
        if (provider === "bi") target.classList.add("bi");
        if (provider === "ri") target.classList.add("ri");
        if (provider === "icon") target.classList.add("icon");
        target.classList.add(`${prefix}-${fontIconName}`);
      }
      record("icon-swap", state.selected, {
        targetKind: "font",
        oldIcon: beforeIcon,
        newIcon: getFontIconSnapshot(target)
      });
      hydrateIconControls(state.selected);
      return;
    }
    if (!markup) {
      updateStatus("Choose an SVG icon first");
      return;
    }
    const svg = icon.element;
    const beforeIcon = getSvgSnapshot(svg);
    const parsed = sanitizeSvgMarkup(markup);
    if (!parsed) {
      updateStatus("Icon could not be parsed");
      return;
    }
    pushUndo(state.selected);
    svg.replaceWith(parsed);
    record("icon-swap", state.selected, { targetKind: "svg", oldIcon: beforeIcon, newIcon: { name, svg: parsed.outerHTML, viewBox: parsed.getAttribute("viewBox") } });
    hydrateIconControls(state.selected);
  }

  function openIconImport() {
    document.querySelector(`#${rootId} [data-role="icon-file"]`)?.click();
  }

  async function importSvgFile(event) {
    const file = event.target?.files?.[0];
    event.target.value = "";
    const svg = getEditableSvg();
    if (!state.selected || !svg || !file) {
      updateStatus("Select an SVG icon first");
      return;
    }
    const text = await file.text();
    const parsed = sanitizeSvgMarkup(text);
    if (!parsed) {
      updateStatus("Imported file is not a safe SVG");
      return;
    }
    const beforeIcon = getSvgSnapshot(svg);
    pushUndo(state.selected);
    svg.replaceWith(parsed);
    record("icon-import", state.selected, {
      oldIcon: beforeIcon,
      fileName: file.name,
      sanitizedSvg: parsed.outerHTML,
      viewBox: parsed.getAttribute("viewBox"),
      hash: await hashText(parsed.outerHTML)
    });
    hydrateIconControls(state.selected);
  }

  function sanitizeSvgMarkup(markup) {
    const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
    const svg = doc.documentElement;
    if (!svg || svg.localName.toLowerCase() !== "svg" || svg.querySelector("parsererror")) {
      return null;
    }
    svg.querySelectorAll("script, foreignObject").forEach((node) => node.remove());
    svg.querySelectorAll("*").forEach((node) => {
      Array.from(node.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        if (name.startsWith("on") || value.startsWith("javascript:") || ((name === "href" || name === "xlink:href") && /^(https?:)?\/\//.test(value))) {
          node.removeAttribute(attr.name);
        }
      });
    });
    svg.setAttribute("aria-hidden", "true");
    return document.importNode(svg, true);
  }

  async function hashText(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 16);
  }

  function sessionPayload(records = recordsForSend()) {
    return {
      page: {
        url: location.href,
        title: document.title,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        scroll: { x: window.scrollX, y: window.scrollY }
      },
      notes: records.length === 0 ? state.notes.trim() : "",
      records
    };
  }

  function payloadFingerprint(payload) {
    return JSON.stringify({
      notes: payload.notes,
      records: payload.records
    });
  }

  function setNotes(value) {
    state.notes = value;
    const input = document.querySelector(`#${rootId} [data-role="notes"]`);
    if (input && input.value !== value) {
      input.value = value;
    }
  }

  function clearNotes(options = {}) {
    setNotes("");
    if (!options.silent) {
      updateStatus("Cleared notes");
    }
  }

  async function sendSession() {
    commitPendingMove({ silent: true });
    const pendingNote = pendingNoteRecord();
    const records = recordsForSend(pendingNote);
    if (records.length === 0) {
      updateStatus("Nothing to send");
      return;
    }
    const payload = sessionPayload(records);
    const fingerprint = payloadFingerprint(payload);
    if (state.lastSentFingerprint === fingerprint) {
      updateStatus("Already sent. Add or clear records before sending again.");
      return;
    }
    const status = sentStatus(records.length, pendingNote);
    const response = await fetch(`http://127.0.0.1:${collectorPort}/__browser-mutation/mutation`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-codex-browser-mutation-token": collectorToken
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    if (pendingNote) {
      state.records.push(pendingNote);
      state.redoStack = [];
    }
    state.lastSentAt = new Date().toISOString();
    state.lastSentFingerprint = fingerprint;
    clearNotes({ silent: true });
    confirmSentStatus(status);
  }

  async function copySession() {
    const text = JSON.stringify(sessionPayload(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      updateStatus("Copied mutation JSON");
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (!copied) {
        downloadSessionJson();
        updateStatus("Clipboard denied. Downloaded JSON instead.");
        return;
      }
      updateStatus("Copied mutation JSON");
    }
  }

  function downloadSessionJson() {
    const blob = new Blob([JSON.stringify(sessionPayload(), null, 2)], {
      type: "application/json"
    });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `browser-mutations-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  function exportSession() {
    downloadSessionJson();
    updateStatus("Downloaded mutation JSON file");
  }

  function clearSession(options = {}) {
    state.records = [];
    state.undoStack = [];
    state.redoStack = [];
    state.originals = new WeakMap();
    state.stylePreviews = new Map();
    state.lastSentFingerprint = null;
    if (state.selected) {
      originalFor(state.selected);
    }
    if (!options.silent) {
      updateStatus("Cleared records");
    }
  }

  function clearAll() {
    clearSession({ silent: true });
    clearSelection({ silent: true });
    clearNotes({ silent: true });
    updateStatus("Cleared selection, notes, and records");
  }

  function markSentAndClear() {
    if (!state.lastSentAt) {
      updateStatus("Nothing sent yet");
      return;
    }
    clearSession({ silent: true });
    clearSelection({ silent: true });
    clearNotes({ silent: true });
    updateStatus("Marked sent and cleared");
  }

  function deleteSelected() {
    const selected = selectedElement();
    if (!selected || !selected.parentElement) {
      return;
    }
    const element = selected;
    const parent = getParentInfo(element);
    const index = getIndex(element);
    pushUndo(element);
    record("delete", element, { parent, index });
    element.remove();
    state.selected = null;
    updatePanel();
  }

  function setMode(mode) {
    const validModes = new Set(["interact", "select", "move", "parent"]);
    const nextMode = validModes.has(mode) ? mode : "interact";
    state.mode = state.mode === nextMode && nextMode !== "interact" ? "interact" : nextMode;
    syncModeButtons();
    updateStatus(modeStatus());
  }

  function modeStatus() {
    if (state.mode === "select") return "Select mode armed. Next page click selects an element.";
    if (state.mode === "move") return "Move mode. Drag the selected element. Hold Shift to lock axis, Alt to bypass snap.";
    if (state.mode === "parent") return "Reparent mode. Click the new parent.";
    return "Interact mode. Page clicks pass through; Alt+Click selects.";
  }

  function syncModeButtons() {
    const pendingMove = pendingMoveForSelected();
    document.querySelectorAll(`#${rootId} [data-mode]`).forEach((button) => {
      const isMove = button.dataset.mode === "move";
      if (isMove && pendingMove) {
        button.dataset.active = "true";
        button.setAttribute("data-pending-action", "commit-move");
        button.title = "Commit move";
        button.setAttribute("aria-label", "Commit move");
        button.innerHTML = icons.check;
        return;
      }
      if (isMove) {
        button.removeAttribute("data-pending-action");
        button.title = "Move selected element";
        button.setAttribute("aria-label", "Move selected element");
        button.innerHTML = icons.move;
      }
      button.dataset.active = button.dataset.mode === state.mode ? "true" : "false";
    });
  }

  function setStyleState(styleState) {
    state.styleState = styleState === "hover" ? "hover" : "normal";
    document.querySelectorAll(`#${rootId} [data-state-style]`).forEach((button) => {
      button.dataset.active = button.dataset.stateStyle === state.styleState ? "true" : "false";
    });
    if (state.selected) {
      hydrateControls(state.selected);
    }
    syncHoverPreview();
    updateStatus(state.styleState === "hover" ? "Editing hover state" : "Editing normal state");
  }

  function createPanel() {
    const root = document.createElement("section");
    root.id = rootId;
    const fontOptions = getFontOptions()
      .map((font) => `<option value="${escapeHtml(font)}">${escapeHtml(formatFontLabel(font))}</option>`)
      .join("");
    root.innerHTML = `
      <div class="cbm-head">
        <div>
          <div class="cbm-title">Mutation</div>
          <div class="cbm-meta"><span data-role="count">0</span> records</div>
        </div>
        <div class="cbm-actions">
          <button class="cbm-icon" type="button" data-action="toggle" title="Minimize" aria-label="Minimize">${icons.min}</button>
          <button class="cbm-icon" type="button" data-action="close" title="Dock panel to launcher (Ctrl+Alt+D)" aria-label="Dock panel to launcher">${icons.dock}</button>
          <div class="cbm-head-help">
            <button class="cbm-icon" type="button" data-action="hotkeys-menu" title="Show hotkeys" aria-label="Show hotkeys" aria-haspopup="menu" aria-expanded="false">${icons.info}</button>
            <div class="cbm-hotkeys-menu" data-role="hotkeys-menu" hidden>
              <div class="cbm-hotkeys-title">Hotkeys</div>
              <div class="cbm-hotkey-row"><kbd>Ctrl+Alt+I</kbd><span>Interact mode</span></div>
              <div class="cbm-hotkey-row"><kbd>Ctrl+Alt+S</kbd><span>Select element</span></div>
              <div class="cbm-hotkey-row"><kbd>Ctrl+Alt+D</kbd><span>Dock panel</span></div>
              <div class="cbm-hotkey-row"><kbd>Ctrl+Z</kbd><span>Undo</span></div>
              <div class="cbm-hotkey-row"><kbd>Ctrl+Y</kbd><span>Redo</span></div>
              <div class="cbm-hotkey-row"><kbd>Ctrl+Shift+Z</kbd><span>Redo</span></div>
              <div class="cbm-hotkey-row"><kbd>Escape</kbd><span>Clear selection</span></div>
              <div class="cbm-hotkey-row"><kbd>Ctrl+Enter</kbd><span>Add note from notes field</span></div>
              <div class="cbm-hotkey-row"><kbd>Alt+Click</kbd><span>Select element while interacting</span></div>
              <div class="cbm-hotkey-row"><kbd>Shift+Drag</kbd><span>Lock move axis</span></div>
              <div class="cbm-hotkey-row"><kbd>C+Drag</kbd><span>Center-only snap</span></div>
              <div class="cbm-hotkey-row"><kbd>Alt+Drag</kbd><span>Bypass move snapping</span></div>
            </div>
          </div>
        </div>
      </div>
      <div class="cbm-body" data-role="body">
        <div class="cbm-row">
          <div class="cbm-meta" data-role="selected">No element selected</div>
          <div class="cbm-mode-row" role="group" aria-label="Interaction mode">
            <button type="button" data-mode="interact" title="Ctrl+Alt+I">Interact</button>
            <button type="button" data-mode="select" title="Ctrl+Alt+S" aria-label="Select element">Select element</button>
          </div>
          <div class="cbm-tool-grid">
            <button class="cbm-icon" type="button" data-mode="move" title="Move selected element" aria-label="Move selected element">${icons.move}</button>
            <button class="cbm-icon" type="button" data-mode="parent" title="Reparent selected element" aria-label="Reparent selected element">${icons.parent}</button>
            <button class="cbm-icon" type="button" data-action="prev" title="Move before previous sibling" aria-label="Move before previous sibling">${icons.up}</button>
            <button class="cbm-icon" type="button" data-action="next" title="Move after next sibling" aria-label="Move after next sibling">${icons.down}</button>
            <button class="cbm-icon" type="button" data-action="capture" title="Capture selected element" aria-label="Capture selected element">${icons.capture}</button>
            <span class="cbm-tool-gap" aria-hidden="true"></span>
            <button class="cbm-icon" type="button" data-action="delete" title="Delete selected element" aria-label="Delete selected element">${icons.delete}</button>
            <button class="cbm-icon" type="button" data-action="undo" title="Undo last change" aria-label="Undo last change">${icons.undo}</button>
          </div>
        </div>
        <div class="cbm-control-divider" aria-hidden="true"></div>
        <div class="cbm-inline">
          <label>Text<input data-role="text" type="text" placeholder="Replacement"></label>
          <button class="cbm-icon" type="button" data-action="text" title="Apply text" aria-label="Apply text">${icons.text}</button>
        </div>
        <div class="cbm-state-row" role="group" aria-label="Style state">
          <button type="button" data-state-style="normal" data-active="true">Normal</button>
          <button type="button" data-state-style="hover">Hover</button>
        </div>
        <div class="cbm-grid">
          ${colorField("Bg", "backgroundColor")}
          ${colorField("Color", "color")}
          ${colorField("Border", "borderColor")}
          <label>B width<input data-style="borderWidth" placeholder="1px"></label>
          <label>Radius<input data-style="borderRadius" placeholder="8px"></label>
          <label>Padding<input data-style="padding" placeholder="8px 12px"></label>
          <label>Gap<input data-style="gap" placeholder="8px"></label>
          <label>Size<input data-style="fontSize" placeholder="14px"></label>
          <label>Opacity<div class="cbm-range-pair"><input data-style="opacity" placeholder="1"><input class="cbm-range" data-opacity-range type="range" min="0" max="1" step="0.01"></div></label>
          ${typefaceField(fontOptions)}
        </div>
        <div class="cbm-pop" data-pop="text-style" data-open="false">
          <button class="cbm-pop-toggle" type="button" data-pop-toggle="text-style" aria-expanded="false">${icons.textStyle}<span>Text style</span></button>
          <div class="cbm-pop-body">
            <div class="cbm-grid">
              <label>Weight<select data-style="fontWeight"><option value="">Current</option><option value="400">Regular</option><option value="500">Medium</option><option value="600">Semibold</option><option value="700">Bold</option></select></label>
              <label>Italic<select data-style="fontStyle"><option value="">Current</option><option value="normal">Normal</option><option value="italic">Italic</option></select></label>
              <label>Transform<select data-style="textTransform"><option value="">Current</option><option value="none">None</option><option value="uppercase">Uppercase</option><option value="lowercase">Lowercase</option><option value="capitalize">Capitalize</option></select></label>
              <label>Align<select data-style="textAlign"><option value="">Current</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option></select></label>
              <label>Line<input data-style="lineHeight" placeholder="normal"></label>
              <label>Letter<input data-style="letterSpacing" placeholder="0px"></label>
              <label>Decor<select data-style="textDecoration"><option value="">Current</option><option value="none">None</option><option value="underline">Underline</option><option value="line-through">Strike</option></select></label>
            </div>
          </div>
        </div>
        <div class="cbm-pop" data-pop="box" data-open="false">
          <button class="cbm-pop-toggle" type="button" data-pop-toggle="box" aria-expanded="false"><span>Box</span></button>
          <div class="cbm-pop-body">
            <div class="cbm-grid">
              <label>Width<input data-style="width" placeholder="auto"></label>
              <label>Height<input data-style="height" placeholder="auto"></label>
              <label>Margin<input data-style="margin" placeholder="0px"></label>
              <label>Pad top<input data-style="paddingTop" placeholder="0px"></label>
              <label>Pad right<input data-style="paddingRight" placeholder="0px"></label>
              <label>Pad bottom<input data-style="paddingBottom" placeholder="0px"></label>
              <label>Pad left<input data-style="paddingLeft" placeholder="0px"></label>
            </div>
          </div>
        </div>
        <div class="cbm-pop" data-pop="layout" data-open="false">
          <button class="cbm-pop-toggle" type="button" data-pop-toggle="layout" aria-expanded="false"><span>Layout</span></button>
          <div class="cbm-pop-body">
            <div class="cbm-grid">
              <label>Display<select data-style="display"><option value="">Current</option><option value="block">Block</option><option value="inline">Inline</option><option value="inline-block">Inline block</option><option value="flex">Flex</option><option value="grid">Grid</option><option value="none">None</option></select></label>
              <label>Position<select data-style="position"><option value="">Current</option><option value="static">Static</option><option value="relative">Relative</option><option value="absolute">Absolute</option><option value="fixed">Fixed</option><option value="sticky">Sticky</option></select></label>
              <label>Direction<select data-style="flexDirection"><option value="">Current</option><option value="row">Row</option><option value="column">Column</option><option value="row-reverse">Row reverse</option><option value="column-reverse">Column reverse</option></select></label>
              <label>Justify<select data-style="justifyContent"><option value="">Current</option><option value="flex-start">Start</option><option value="center">Center</option><option value="flex-end">End</option><option value="space-between">Between</option><option value="space-around">Around</option><option value="space-evenly">Evenly</option></select></label>
              <label>Items<select data-style="alignItems"><option value="">Current</option><option value="stretch">Stretch</option><option value="flex-start">Start</option><option value="center">Center</option><option value="flex-end">End</option><option value="baseline">Baseline</option></select></label>
            </div>
          </div>
        </div>
        <div class="cbm-pop" data-pop="effects" data-open="false">
          <button class="cbm-pop-toggle" type="button" data-pop-toggle="effects" aria-expanded="false"><span>Effects</span></button>
          <div class="cbm-pop-body">
            <div class="cbm-grid">
              <label>Shadow<input data-style="boxShadow" placeholder="none"></label>
              <label>Z<input data-style="zIndex" placeholder="auto"></label>
              <label>Bg alpha<input data-style="backgroundAlpha" placeholder="0.72"></label>
              <label>Glass blur<input data-style="glassBlur" placeholder="12px"></label>
              <label>Glass sat<input data-style="glassSaturation" placeholder="140%"></label>
              <label>CSS transform<input data-style="transform" placeholder="none"></label>
              <label>Filter<input data-style="filter" placeholder="none"></label>
              <label>Backdrop<input data-style="backdropFilter" placeholder="none"></label>
              <label>O width<input data-style="outlineWidth" placeholder="0px"></label>
              <label>O style<select data-style="outlineStyle"><option value="">Current</option><option value="none">None</option><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select></label>
              ${colorField("O color", "outlineColor")}
            </div>
          </div>
        </div>
        <div class="cbm-pop" data-role="icon-controls" data-pop="icon" data-open="false" hidden>
          <button class="cbm-pop-toggle" type="button" data-pop-toggle="icon" aria-expanded="false">${icons.icon}<span>Icon</span></button>
          <div class="cbm-pop-body">
            <div class="cbm-grid">
              <label>Icon<select data-icon-swap>${Object.keys(builtInIcons).map((key) => `<option value="${key}">${key}</option>`).join("")}</select></label>
              <label>I size<input data-icon-style="size" placeholder="16px"></label>
              <label>Stroke<input data-icon-style="strokeWidth" placeholder="2"></label>
              ${colorField("I color", "iconColor")}
            </div>
            <div class="cbm-footer">
              <button type="button" data-action="icon-swap">${icons.icon}<span>Swap</span></button>
              <button class="cbm-icon" type="button" data-action="icon-style" title="Apply icon style" aria-label="Apply icon style">${icons.style}</button>
              <button class="cbm-icon" type="button" data-action="icon-import" title="Import SVG file" aria-label="Import SVG file">${icons.import}</button>
              <input data-role="icon-file" type="file" accept=".svg,image/svg+xml" hidden>
            </div>
          </div>
        </div>
        <div class="cbm-color-popover" data-role="color-popover" data-open="false"></div>
        <div class="cbm-footer cbm-style-actions">
          <button class="cbm-wide" type="button" data-action="style" title="Record previewed styles">${icons.style}<span>Record change</span></button>
          <span aria-hidden="true"></span>
          <button type="button" data-action="reset-style">Reset preview</button>
        </div>
        <div class="cbm-notes">
          <div class="cbm-notes-head">
            <span>Notes</span>
            <button type="button" data-action="add-note" title="Record note for selected element, or session if no element is selected">Add note</button>
          </div>
          <textarea data-role="notes" placeholder="Optional intent notes for Codex"></textarea>
        </div>
        <div class="cbm-footer cbm-send-actions">
          <button type="button" data-primary="true" data-action="send">${icons.send}<span>Send</span></button>
          <div class="cbm-action-menu">
            <button class="cbm-icon" type="button" data-action="clear-menu" title="Clear actions" aria-label="Clear actions" aria-haspopup="menu" aria-expanded="false">${icons.clear}</button>
            <div class="cbm-action-menu-list" data-role="clear-menu" hidden>
              <button type="button" data-action="clear-selection">Clear selection</button>
              <button type="button" data-action="clear-notes">Clear notes</button>
              <button type="button" data-action="clear">Clear records</button>
              <button type="button" data-action="undo-record">Undo last record</button>
              <button type="button" data-action="mark-sent-clear">Mark sent and clear</button>
              <button type="button" data-action="clear-all">Clear all</button>
            </div>
          </div>
          <span aria-hidden="true"></span>
          <button class="cbm-icon" type="button" data-action="copy" title="Copy JSON" aria-label="Copy JSON">${icons.json}</button>
          <button class="cbm-icon" type="button" data-action="export" title="Download JSON file" aria-label="Download JSON file">${icons.export}</button>
        </div>
        <div class="cbm-status" data-role="status">Interact mode. Page clicks pass through; Alt+Click selects.</div>
      </div>
      <div class="cbm-panel-resize" data-role="panel-resize" data-resize-corner="br" title="Resize panel" aria-hidden="true"></div>
      <div class="cbm-panel-resize" data-role="panel-resize" data-resize-corner="bl" title="Resize panel from left" aria-hidden="true"></div>
    `;
    document.documentElement.appendChild(root);
    root.addEventListener("click", onPanelClick);
    root.addEventListener("pointerover", onPanelPointerOver);
    root.addEventListener("pointerout", onPanelPointerOut);
    root.querySelector(".cbm-head").addEventListener("pointerdown", beginPanelDrag);
    root.querySelectorAll("[data-role='panel-resize']").forEach((handle) => {
      handle.addEventListener("pointerdown", beginPanelResize);
    });
    root.querySelector("[data-role='notes']").addEventListener("input", (event) => {
      setNotes(event.target.value);
    });
    root.querySelector("[data-role='notes']").addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        addNoteRecord();
      }
    });
    root.querySelectorAll("[data-state-style]").forEach((button) => {
      button.addEventListener("click", () => setStyleState(button.dataset.stateStyle));
    });
    root.querySelectorAll("[data-color-toggle]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        state.activeColorField = state.activeColorField === button.dataset.colorToggle ? null : button.dataset.colorToggle;
        renderColorPicker();
      });
    });
    root.addEventListener("pointerdown", (event) => {
      beginColorDrag(event);
    });
    root.addEventListener("input", (event) => {
      if (event.target?.matches?.("[data-color-hue]")) {
        setActiveColorFromHue(event.target.value, { render: false, remember: false });
      }
      if (event.target?.matches?.("[data-color-rgb]")) {
        setActiveColorFromRgb();
      }
      if (event.target?.matches?.("[data-color-hex]")) {
        setActiveColorFromHex();
      }
    });
    root.addEventListener("change", (event) => {
      if (event.target?.matches?.("[data-color-hue],[data-color-rgb],[data-color-hex]")) {
        rememberRecentColor(activeColor());
        renderColorPicker();
      }
    });
    root.querySelector("[data-opacity-range]")?.addEventListener("input", (event) => {
      const input = root.querySelector('[data-style="opacity"]');
      if (!input) return;
      input.value = event.target.value;
      input.dataset.dirty = input.value === input.dataset.initial ? "false" : "true";
      previewStyleInput(input);
    });
    root.querySelectorAll("[data-style]").forEach((input) => {
      const normalizeInput = () => {
        const value = normalizeStyleValue(input.dataset.style, input.value.trim());
        if (value) {
          input.value = value;
          if (isColorField(input.dataset.style)) {
            updateColorSwatch(input.dataset.style, value);
          }
        }
      };
      const markDirty = () => {
        input.dataset.dirty = input.value === input.dataset.initial ? "false" : "true";
        if (input.dataset.style === "opacity") {
          const range = root.querySelector("[data-opacity-range]");
          if (range) range.value = normalizeStyleValue("opacity", input.value) || "1";
        }
        if (isColorField(input.dataset.style)) {
          updateColorSwatch(input.dataset.style, input.value);
          if (state.activeColorField === input.dataset.style) {
            renderColorPicker();
          }
        }
        previewStyleInput(input);
      };
      input.addEventListener("focus", () => {
        if (isColorField(input.dataset.style)) {
          state.activeColorField = input.dataset.style;
          renderColorPicker();
        }
      });
      input.addEventListener("input", markDirty);
      input.addEventListener("change", () => {
        normalizeInput();
        markDirty();
      });
      input.addEventListener("blur", () => {
        normalizeInput();
        markDirty();
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          normalizeInput();
          markDirty();
          input.blur();
        }
      });
    });
    root.querySelectorAll("[data-icon-style]").forEach((input) => {
      const normalizeInput = () => {
        const field = input.dataset.iconStyle === "size" ? "fontSize" : "borderWidth";
        const value = normalizeStyleValue(field, input.value.trim());
        if (value) input.value = value;
      };
      const markDirty = () => {
        input.dataset.dirty = input.value === input.dataset.initial ? "false" : "true";
      };
      input.addEventListener("input", markDirty);
      input.addEventListener("change", () => {
        normalizeInput();
        markDirty();
      });
      input.addEventListener("blur", () => {
        normalizeInput();
        markDirty();
      });
    });
    root.querySelector("[data-role='icon-file']")?.addEventListener("change", importSvgFile);
    syncModeButtons();
    schedulePanelHeightFit();
  }

  function createOutline() {
    const outline = document.createElement("div");
    outline.id = outlineId;
    const handle = document.createElement("div");
    handle.className = "cbm-handle";
    handle.addEventListener("pointerdown", beginResize);
    outline.appendChild(handle);
    document.documentElement.appendChild(outline);
  }

  function createGuideLayer() {
    const layer = document.createElement("div");
    layer.id = guideLayerId;
    layer.style.display = "none";
    document.documentElement.appendChild(layer);
  }

  function createLauncher() {
    const launcher = document.createElement("button");
    launcher.id = launcherId;
    launcher.type = "button";
    launcher.title = "Show Browser Mutation";
    launcher.textContent = "BM";
    launcher.addEventListener("click", showPanel);
    launcher.addEventListener("pointerdown", beginLauncherDrag);
    document.documentElement.appendChild(launcher);
  }

  function beginLauncherDrag(event) {
    const launcher = document.getElementById(launcherId);
    if (!launcher) {
      return;
    }
    const rect = launcher.getBoundingClientRect();
    state.launcherMoved = false;
    state.launcherDrag = {
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top
    };
    launcher.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function continueLauncherDrag(event) {
    if (!state.launcherDrag) {
      return;
    }
    const launcher = document.getElementById(launcherId);
    if (!launcher) {
      return;
    }
    const dx = event.clientX - state.launcherDrag.x;
    const dy = event.clientY - state.launcherDrag.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      state.launcherMoved = true;
    }
    const rect = launcher.getBoundingClientRect();
    const nextLeft = Math.min(window.innerWidth - rect.width - 8, Math.max(8, state.launcherDrag.left + dx));
    const nextTop = Math.min(window.innerHeight - rect.height - 8, Math.max(8, state.launcherDrag.top + dy));
    launcher.style.left = `${Math.round(nextLeft)}px`;
    launcher.style.top = `${Math.round(nextTop)}px`;
    launcher.style.right = "auto";
  }

  function finishLauncherDrag() {
    state.launcherDrag = null;
  }

  function hidePanel() {
    state.panelOpen = false;
    const root = document.getElementById(rootId);
    const outline = document.getElementById(outlineId);
    const launcher = document.getElementById(launcherId);
    if (root) root.style.display = "none";
    if (outline) outline.style.display = "none";
    setHotkeysMenuOpen(false);
    hideMoveGuides();
    if (launcher) launcher.style.display = "flex";
  }

  function showPanel(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (state.launcherMoved) {
      state.launcherMoved = false;
      return;
    }
    state.panelOpen = true;
    const root = document.getElementById(rootId);
    const launcher = document.getElementById(launcherId);
    if (root) root.style.display = "flex";
    if (launcher) launcher.style.display = "none";
    updatePanel();
    schedulePanelHeightFit();
  }

  function beginPanelDrag(event) {
    if (event.target?.closest?.("button,.cbm-panel-resize,.cbm-hotkeys-menu")) {
      return;
    }
    const root = document.getElementById(rootId);
    if (!root) {
      return;
    }
    const rect = root.getBoundingClientRect();
    state.panelDrag = {
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top
    };
    event.preventDefault();
    event.stopPropagation();
  }

  function continuePanelDrag(event) {
    if (!state.panelDrag) {
      return;
    }
    const root = document.getElementById(rootId);
    if (!root) {
      return;
    }
    const rect = root.getBoundingClientRect();
    const nextLeft = Math.min(window.innerWidth - rect.width - 8, Math.max(8, state.panelDrag.left + event.clientX - state.panelDrag.x));
    const nextTop = Math.min(window.innerHeight - 48, Math.max(8, state.panelDrag.top + event.clientY - state.panelDrag.y));
    root.style.left = `${Math.round(nextLeft)}px`;
    root.style.top = `${Math.round(nextTop)}px`;
    root.style.right = "auto";
  }

  function finishPanelDrag() {
    state.panelDrag = null;
  }

  function beginPanelResize(event) {
    const root = document.getElementById(rootId);
    if (!root) {
      return;
    }
    const rect = root.getBoundingClientRect();
    root.style.left = `${Math.round(rect.left)}px`;
    root.style.top = `${Math.round(rect.top)}px`;
    root.style.right = "auto";
    root.style.width = `${Math.round(rect.width)}px`;
    root.style.height = `${Math.round(rect.height)}px`;
    state.panelResize = {
      corner: event.currentTarget?.dataset.resizeCorner === "bl" ? "bl" : "br",
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
    event.preventDefault();
    event.stopPropagation();
  }

  function continuePanelResize(event) {
    if (!state.panelResize) {
      return;
    }
    const root = document.getElementById(rootId);
    if (!root) {
      return;
    }
    const minWidth = Math.min(panelMinWidth, window.innerWidth - 16);
    const minHeight = Math.min(panelMinHeight, window.innerHeight - 16);
    const maxHeight = Math.max(minHeight, getPanelMaxHeight(root));
    let width;
    if (state.panelResize.corner === "bl") {
      const right = state.panelResize.left + state.panelResize.width;
      const requestedLeft = state.panelResize.left + event.clientX - state.panelResize.x;
      const left = Math.min(right - minWidth, Math.max(8, Math.round(requestedLeft)));
      width = Math.min(window.innerWidth - left - 8, Math.max(minWidth, Math.round(right - left)));
      root.style.left = `${left}px`;
    } else {
      const maxWidth = Math.max(minWidth, window.innerWidth - state.panelResize.left - 8);
      width = Math.min(maxWidth, Math.max(minWidth, Math.round(state.panelResize.width + event.clientX - state.panelResize.x)));
    }
    const height = Math.min(maxHeight, Math.max(minHeight, Math.round(state.panelResize.height + event.clientY - state.panelResize.y)));
    root.style.width = `${width}px`;
    root.style.height = `${height}px`;
    setPanelScrollForHeight(root, height);
  }

  function finishPanelResize() {
    state.panelUserResized = true;
    state.panelResize = null;
    schedulePanelHeightFit();
  }

  function getPanelNaturalHeight(root) {
    const head = root.querySelector(".cbm-head");
    const body = root.querySelector("[data-role='body']");
    if (!head || !body || state.panelCollapsed) {
      return root.getBoundingClientRect().height;
    }
    const previousHeight = root.style.height;
    const previousBodyOverflow = body.style.overflow;
    root.style.height = "auto";
    body.style.overflow = "visible";
    const border = 2;
    const height = Math.ceil(head.offsetHeight + body.scrollHeight + border);
    root.style.height = previousHeight;
    body.style.overflow = previousBodyOverflow;
    return height;
  }

  function getPanelHeightLimit(root) {
    const rect = root.getBoundingClientRect();
    const viewportMax = Math.max(panelMinHeight, window.innerHeight - rect.top - 8);
    const contentMax = Math.max(panelMinHeight, getPanelNaturalHeight(root));
    return {
      contentMax,
      viewportMax,
      maxHeight: Math.min(viewportMax, contentMax)
    };
  }

  function getPanelMaxHeight(root) {
    return getPanelHeightLimit(root).maxHeight;
  }

  function fitPanelHeightToContent(options = {}) {
    const root = document.getElementById(rootId);
    if (!root || state.panelCollapsed || root.style.display === "none") {
      return;
    }
    const body = root.querySelector("[data-role='body']");
    const { contentMax, maxHeight } = getPanelHeightLimit(root);
    const currentHeight = root.getBoundingClientRect().height;
    const shouldFitContent = options.forceExpand || !state.panelUserResized;
    const targetHeight = shouldFitContent
      ? Math.min(contentMax, maxHeight)
      : Math.min(Math.max(panelMinHeight, currentHeight), maxHeight);
    const shouldScroll = contentMax > targetHeight + 1;
    root.style.maxHeight = `${maxHeight}px`;
    root.style.height = `${targetHeight}px`;
    setPanelScrollForHeight(root, targetHeight, contentMax);
  }

  function setPanelScrollForHeight(root, panelHeight, measuredContentHeight) {
    const body = root.querySelector("[data-role='body']");
    if (body) {
      const contentMax = measuredContentHeight || Math.max(panelMinHeight, getPanelNaturalHeight(root));
      const shouldScroll = contentMax > panelHeight + 1;
      body.style.overflowY = shouldScroll ? "auto" : "hidden";
      body.style.overflowX = "hidden";
    }
  }

  function schedulePanelHeightFit(options = {}) {
    requestAnimationFrame(() => fitPanelHeightToContent(options));
  }

  function togglePanelCollapsed() {
    const root = document.getElementById(rootId);
    if (!root) {
      return;
    }
    if (!state.panelCollapsed) {
      state.panelExpandedSize = {
        width: root.style.width || "",
        height: root.style.height || ""
      };
      root.dataset.collapsed = "true";
      root.style.height = "auto";
      state.panelCollapsed = true;
      return;
    }
    root.dataset.collapsed = "false";
    root.style.width = state.panelExpandedSize?.width || root.style.width;
    root.style.height = state.panelExpandedSize?.height || "";
    state.panelCollapsed = false;
    schedulePanelHeightFit({ forceExpand: true });
  }

  function setClearMenuOpen(open) {
    const menu = document.querySelector(`#${rootId} [data-role="clear-menu"]`);
    const toggle = document.querySelector(`#${rootId} [data-action="clear-menu"]`);
    if (!menu) {
      return;
    }
    menu.hidden = !open;
    menu.dataset.open = String(open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
    }
  }

  function toggleClearMenu() {
    const menu = document.querySelector(`#${rootId} [data-role="clear-menu"]`);
    setClearMenuOpen(!menu || menu.hidden);
  }

  function setHotkeysMenuOpen(open) {
    const menu = document.querySelector(`#${rootId} [data-role="hotkeys-menu"]`);
    const toggle = document.querySelector(`#${rootId} [data-action="hotkeys-menu"]`);
    if (!menu) {
      return;
    }
    menu.hidden = !open;
    menu.dataset.open = String(open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
    }
  }

  function toggleHotkeysMenu() {
    const menu = document.querySelector(`#${rootId} [data-role="hotkeys-menu"]`);
    setHotkeysMenuOpen(!menu || menu.hidden);
  }

  function onPanelClick(event) {
    const popToggle = event.target?.closest?.("[data-pop-toggle]");
    if (popToggle) {
      event.preventDefault();
      event.stopPropagation();
      togglePopover(popToggle.dataset.popToggle);
      return;
    }
    const control = event.target?.closest?.("[data-action],[data-mode]");
    const colorChip = event.target?.closest?.("[data-color-value]");
    const colorValue = colorChip?.dataset?.colorValue;
    if (colorValue && colorChip?.dataset?.colorScope === "saved" && colorChip.dataset.deleteReady === "true") {
      event.preventDefault();
      event.stopPropagation();
      clearSavedColorDeleteHover();
      removeSavedColor(colorValue);
      return;
    }
    if (colorValue && state.activeColorField) {
      event.preventDefault();
      setColorField(state.activeColorField, colorValue);
      return;
    }
    const action = control?.dataset?.action;
    const mode = control?.dataset?.mode;
    if (mode) {
      setClearMenuOpen(false);
      setHotkeysMenuOpen(false);
      if (mode === "move" && control.dataset.pendingAction === "commit-move") {
        commitPendingMove();
        return;
      }
      setMode(mode);
      return;
    }
    if (!action) {
      if (!event.target?.closest?.("[data-role='clear-menu']")) {
        setClearMenuOpen(false);
      }
      if (!event.target?.closest?.("[data-role='hotkeys-menu']")) {
        setHotkeysMenuOpen(false);
      }
      return;
    }
    event.preventDefault();
    if (action !== "clear-menu") {
      setClearMenuOpen(false);
    }
    if (action !== "hotkeys-menu") {
      setHotkeysMenuOpen(false);
    }
    if (action === "close") hidePanel();
    if (action === "hotkeys-menu") {
      toggleHotkeysMenu();
      return;
    }
    if (action === "clear-menu") {
      toggleClearMenu();
      return;
    }
    if (action === "font-menu") {
      const field = control.closest("[data-role='typeface-field']");
      if (field) {
        field.dataset.open = field.dataset.open === "true" ? "false" : "true";
      }
      return;
    }
    if (action === "font-option") {
      const input = document.querySelector(`#${rootId} [data-style="fontFamily"]`);
      const value = control.dataset.fontValue || "";
      if (input && value) {
        input.value = value;
        input.dataset.dirty = input.value === input.dataset.initial ? "false" : "true";
        previewStyleInput(input);
      }
      const field = control.closest("[data-role='typeface-field']");
      if (field) {
        field.dataset.open = "false";
      }
      return;
    }
    if (action === "toggle") {
      togglePanelCollapsed();
    }
    if (action === "text") applyText();
    if (action === "style") applyStyles();
    if (action === "reset-style") resetSelectedStylePreview();
    if (action === "prev") moveSibling(-1);
    if (action === "next") moveSibling(1);
    if (action === "capture") {
      const selected = selectedElement();
      if (selected) record("capture", selected);
    }
    if (action === "delete") deleteSelected();
    if (action === "undo") undoLast();
    if (action === "redo") redoLast();
    if (action === "icon-style") applyIconStyles();
    if (action === "icon-swap") swapIcon();
    if (action === "icon-import") openIconImport();
    if (action === "send") sendSession().catch((error) => updateStatus(error.message));
    if (action === "add-note") addNoteRecord();
    if (action === "copy") copySession().catch((error) => updateStatus(error.message));
    if (action === "export") exportSession();
    if (action === "clear") clearSession();
    if (action === "clear-selection") clearSelection();
    if (action === "clear-notes") clearNotes();
    if (action === "clear-all") clearAll();
    if (action === "undo-record") undoLast();
    if (action === "mark-sent-clear") markSentAndClear();
    if (action === "save-color") saveCurrentColor();
    if (action === "eyedropper") pickWithEyeDropper();
  }

  function togglePopover(name) {
    const popover = document.querySelector(`#${rootId} [data-pop="${CSS.escape(name)}"]`);
    if (!popover) {
      return;
    }
    const nextOpen = popover.dataset.open !== "true";
    popover.dataset.open = nextOpen ? "true" : "false";
    const toggle = popover.querySelector("[data-pop-toggle]");
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(nextOpen));
    }
    schedulePanelHeightFit();
  }

  function onPanelPointerOver(event) {
    const chip = event.target?.closest?.("[data-color-value][data-color-scope='saved']");
    if (chip) {
      armSavedColorDelete(chip);
    }
  }

  function onPanelPointerOut(event) {
    const chip = event.target?.closest?.("[data-color-value][data-color-scope='saved']");
    if (!chip) {
      return;
    }
    if (!event.relatedTarget || !chip.contains(event.relatedTarget)) {
      clearSavedColorDeleteHover();
    }
  }

  function onDocumentClick(event) {
    if (isOverlayElement(event.target)) {
      return;
    }
    if (!state.panelOpen) {
      return;
    }
    if (state.mode === "parent") {
      event.preventDefault();
      event.stopPropagation();
      pickParent(event.target);
      return;
    }
    const shouldSelect = state.mode === "select" || event.altKey;
    if (!shouldSelect) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    selectElement(event.target, { record: event.altKey });
    if (state.mode === "select") {
      setMode("interact");
    }
  }

  function onPointerDown(event) {
    if (!state.panelOpen) {
      return;
    }
    beginMove(event);
  }

  function onPointerMove(event) {
    continuePanelDrag(event);
    continuePanelResize(event);
    continueLauncherDrag(event);
    continueColorDrag(event);
    continueMove(event);
    continueResize(event);
  }

  function onPointerUp() {
    finishPanelDrag();
    finishPanelResize();
    finishLauncherDrag();
    finishColorDrag();
    finishMove();
    finishResize();
  }

  function onKeyDown(event) {
    const key = String(event.key || "").toLowerCase();
    const accelerator = event.ctrlKey || event.metaKey;
    if (state.panelOpen && key === "c" && !accelerator && !event.altKey && !isEditableTarget(event.target)) {
      state.centerSnapKey = true;
    }
    if (state.panelOpen && event.ctrlKey && event.altKey && !event.metaKey) {
      if (key === "i") {
        event.preventDefault();
        event.stopPropagation();
        setHotkeysMenuOpen(false);
        setMode("interact");
        return;
      }
      if (key === "s") {
        event.preventDefault();
        event.stopPropagation();
        setHotkeysMenuOpen(false);
        setMode("select");
        return;
      }
      if (key === "d") {
        event.preventDefault();
        event.stopPropagation();
        setHotkeysMenuOpen(false);
        hidePanel();
        return;
      }
    }
    if (state.panelOpen && accelerator && !event.altKey && !isEditableTarget(event.target)) {
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        undoLast();
        return;
      }
      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        event.stopPropagation();
        redoLast();
        return;
      }
    }
    if (event.key === "Escape") {
      const hotkeysMenu = document.querySelector(`#${rootId} [data-role="hotkeys-menu"]`);
      if (hotkeysMenu && !hotkeysMenu.hidden) {
        event.preventDefault();
        event.stopPropagation();
        setHotkeysMenuOpen(false);
        return;
      }
      if (cancelPendingMove()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      clearSelection();
    }
  }

  function onKeyUp(event) {
    if (String(event.key || "").toLowerCase() === "c") {
      state.centerSnapKey = false;
    }
  }

  function isEditableTarget(target) {
    return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true'], [contenteditable='']"));
  }

  function uninstall() {
    document.removeEventListener("click", onDocumentClick, true);
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerup", onPointerUp, true);
    document.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("keyup", onKeyUp, true);
    window.removeEventListener("scroll", updateOutline, true);
    window.removeEventListener("resize", updateOutline);
    document.getElementById(rootId)?.remove();
    document.getElementById(outlineId)?.remove();
    document.getElementById(guideLayerId)?.remove();
    document.getElementById(launcherId)?.remove();
    document.getElementById(styleId)?.remove();
    document.getElementById(hoverStyleId)?.remove();
    delete window.__codexBrowserMutation;
  }

  createStyle();
  createPanel();
  createOutline();
  createGuideLayer();
  createLauncher();

  document.addEventListener("click", onDocumentClick, true);
  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("pointermove", onPointerMove, true);
  document.addEventListener("pointerup", onPointerUp, true);
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("keyup", onKeyUp, true);
  window.addEventListener("scroll", updateOutline, true);
  window.addEventListener("resize", updateOutline);

  window.__codexBrowserMutation = {
    getState: () => ({
      selected: state.selected,
      mode: state.mode,
      records: state.records,
      notes: state.notes,
      lastSentAt: state.lastSentAt
    }),
    send: sendSession,
    uninstall
  };
})();
