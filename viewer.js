const DEFAULT_MONTHS = makeDefaultMonthLabels(3);
const DEFAULT_TIERS = [
  { id: "human", label: "Human Rights", color: "#ff4b59" },
  { id: "must", label: "Must Pull", color: "#47a9ff" },
  { id: "ideal", label: "Ideally Pull", color: "#67ef87" },
  { id: "luxury", label: "Luxury Pull", color: "#ffcc4d" },
  { id: "skip", label: "Skip", color: "#8d96a6" }
];
const DEFAULT_META_STATUSES = [
  { id: "s1", label: "Human Rights", description: "", color: "#ff4b59" },
  { id: "s2", label: "Era-Defining", description: "", color: "#47a9ff" },
  { id: "s3", label: "Strong", description: "", color: "#67ef87" },
  { id: "s4", label: "Rotational", description: "", color: "#ffcc4d" },
  { id: "s5", label: "Situational", description: "", color: "#c18cff" }
];
const OLD_GENERIC_MONTHS = ["This Month", "Next Month", "2 Months Later", "3 Months Later", "4 Months Later"];
const OLD_STATUS_MAP = { top: "s1", strong: "s3", niche: "s5", fading: "s4", custom: "s5" };
const LEGACY_TIER_COLORS = { must: ["#ffa12a"], ideal: ["#47a9ff"], luxury: ["#a66bff"], skip: ["#9aa0ab", "#c18cff", "#a66bff", "#8b5cf6", "#9333ea", "#7c3aed", "#6d28d9"] };
const LEGACY_TIER_LABELS = { must: ["Era-Defining"], ideal: ["Strong"], luxury: ["Rotational"] };
const LEGACY_STATUS_COLORS = { s2: "#37e6ff" };
const TAG_OPTIONS = ["PVP", "PVE", "Must P5", "Buff", "Core", "Tech", "Def", "Sub", "CB"];
const MAX_TAGS = 10;
const TAGS_PER_COLUMN = 5;
const MIN_ZOOM = 0.2;
const MOBILE_MIN_ZOOM = 0.02;
const TEXT_SCALE_MIN_ZOOM = 0.2;
const MAX_ZOOM = 1.6;
const ZOOM_BUTTON_STEP = 0.05;
const TIER_LABEL_ABBREVIATIONS = { human: "HR", must: "MP", ideal: "IP", luxury: "LP", skip: "S" };
const CARD_DETAILS_MIN_VISUAL_SIZE = 56;
const CARD_TAGS_MIN_BOTTOM_GAP = 2;
const CARD_NAME_MIN_VISUAL_SIZE = 72;
const CARD_NAME_MIN_TAG_GAP = 8;
const MUST_P5_TAG = "Must P5";
const BUFF_TAG = "Buff";
const TAG_ORDER = new Map(TAG_OPTIONS.map((tag, i) => [tag.toLowerCase(), i]));

const CELL_W = 200;
const LEFT_W = 260;
const MONTH_H = 58;
const WEEK_H = 48;
const HEADER_H = MONTH_H + WEEK_H;
const BLANK_TIER_H = 250;
const ICON_W = 176;
const ICON_TOP = 28;
const ICON_STACK_GAP = 14;
const BETWEEN_PAIR_GAP = 8;
const WIDE_CELL_W = ICON_W * 2 + BETWEEN_PAIR_GAP + 24;
const BAR_TOP = 222;
const BAR_GAP = 23;
const BAR_H = 18;
const META_LINK_H = BAR_H;
const META_LINK_OVERLAP = 3;
const META_BAR_EDGE_INSET = 6;
const META_LABEL_MIN_RENDERED_HEIGHT = 9;
const BAR_BOTTOM_PAD = 34;

const DEFAULT_STATE = {
  updated: "",
  months: [...DEFAULT_MONTHS],
  monthWeeks: DEFAULT_MONTHS.map(() => 4),
  tiers: structuredClone(DEFAULT_TIERS),
  metaStatuses: structuredClone(DEFAULT_META_STATUSES),
  tagDescriptions: {},
  units: []
};

let state = structuredClone(DEFAULT_STATE);
let catalogIndex = new Map();
let catalogIconIndex = new Map();
let catalogKindNameIndex = new Map();
let unitByIdIndex = new Map();
let pairedMsByPilotId = new Map();
let pairedPilotByMsId = new Map();
let profileTimelineCache = [];
let profileTimelineIndexById = new Map();
let metaOwnerElementIndex = new Map();
const profileImageWarmCache = new Map();
let mobileCardNameMetricsById = new Map();
let profileImageWarmupGeneration = 0;
let zoomScale = 1;
let activeUnitId = null;
const activeMetaStatusFilters = new Set();
const activeMetaUnitFilters = new Set();
let customUnitFilterEditing = false;
let customUnitFilterDraft = new Set();
let metaOwnerHoverId = null;
let metaOwnerFocusId = null;
let metaOwnerTouchSelectionId = null;
let metaOwnerProfileId = null;
let metaOwnerHighlightedId = null;
let metaFocusDimmerEl = null;
let tooltipEl = null;
let tooltipPinned = false;
let tooltipAnchorEl = null;
let unitProfileOverlay = null;
let profileReturnFocus = null;
let unitNoteReaderOverlay = null;
let unitNoteReaderReturnFocus = null;
let unitNoteReaderReturnFocusByKeyboard = false;
let unitProfileOverflowObserver = null;
let unitProfileLayoutObserver = null;
let appTooltipEl = null;
let appTooltipPinned = false;
let appTooltipAnchorEl = null;
let panDrag = null;
let suppressRoadmapClick = false;
const touchPoints = new Map();
let touchPanGesture = null;
let pinchGesture = null;
let touchGestureFrame = 0;
let pendingTouchPanFrame = null;
let pendingTouchPinchFrame = null;
let touchSelectionTapCandidate = null;
let mobileCameraX = 0;
let mobileCameraY = 0;
let suppressTouchClickUntil = 0;
let pendingDirectTouchClickSuppression = null;
let lastInputModality = "pointer";
let profileReturnFocusByKeyboard = false;
let useWebKitNativeGestureInput = false;
let webKitPinchGesture = null;
let webKitNativeTouchHadPinch = false;
let webKitPinchBurstSettleTimer = 0;
let webKitPinchBurstSettleFrame = 0;
let webKitPinchBurstContinuation = false;
let mobileStageGeometryScale = 1;
let mobileStageShrinkPending = false;
let touchZoomSemanticTimer = 0;
let touchZoomSemanticFrame = 0;
let touchZoomSemanticDirty = false;
let touchZoomSemanticGeneration = 0;
let mobileZoomStyleFrame = 0;
let mobileZoomStyleTimer = 0;
let mobileZoomStyleGeneration = 0;
let mobileZoomStyleJob = null;
let mobileViewportSemanticFrame = 0;
let mobileTextBoostTargetsCache = [];
let mobileMetaLabelEntriesCache = [];
let mobileTierLabelEntriesCache = [];
let mobileGridVerticalCache = [];
let mobileGridHorizontalCache = [];
let unitProfileBindingGeneration = 0;
let unitProfileBindingFrame = 0;
const unitProfileBindingTimers = new Set();
let initialFitTimer = 0;
let viewportResizeFrame = 0;
let safeAreaProbeEl = null;
const TOUCH_ZOOM_SEMANTIC_SETTLE_MS = 420;

function createLayoutGeometryCache() {
  return {
    slotLayouts: new Map(),
    visibleLaneCounts: new Map(),
    maxIconStackHeights: new Map(),
    dynamicBarTops: new Map(),
    betweenSafeHeights: new Map(),
    tierHeights: new Map(),
    tierYs: new Map(),
    iconXs: new Map(),
    iconYs: new Map(),
    iconRects: new Map(),
    slotGroups: new Map(),
    segmentHorizontalRects: new Map(),
    segmentBarRects: new Map(),
    laneOwners: new Map(),
    cardRectsByLeft: null,
    betweenSafeComputed: false,
    wideWeeks: null,
    weekBoundaryXs: null,
    baseChartHeight: null
  };
}
let layoutGeometryCache = createLayoutGeometryCache();
let roadmapImageReuseCache = new Map();
function invalidateLayoutGeometryCache() {
  layoutGeometryCache = createLayoutGeometryCache();
}
function captureRoadmapImagesForRender() {
  const next = new Map();
  els.roadmap?.querySelectorAll(".unit-card[data-id] > img").forEach(img => {
    const unitId = img.parentElement?.dataset?.id;
    if (unitId) next.set(unitId, img);
  });
  roadmapImageReuseCache = next;
}
function reusableRoadmapImage(unit) {
  if (!unit?.icon) return null;
  const img = roadmapImageReuseCache.get(unit.id);
  roadmapImageReuseCache.delete(unit.id);
  if (!img || img.getAttribute("src") !== unit.icon) return null;
  img.alt = unit.name;
  img.crossOrigin = "anonymous";
  return img;
}

function ensureProfileImageWarmEntry(url, priority = "auto") {
  const src = String(url || "").trim();
  if (!src) return null;
  const existing = profileImageWarmCache.get(src);
  if (existing) {
    if (priority === "high") {
      try { existing.img.fetchPriority = "high"; } catch {}
    }
    return existing;
  }

  const img = new Image();
  img.decoding = "async";
  img.loading = "eager";
  img.crossOrigin = "anonymous";
  try { img.fetchPriority = priority; } catch {}
  const entry = { img, ready: false, failed: false, decodePromise: null };
  profileImageWarmCache.set(src, entry);
  img.src = src;
  return entry;
}

async function decodeProfileWarmEntry(entry) {
  if (!entry || entry.ready || entry.failed) return;
  if (entry.decodePromise) return entry.decodePromise;
  entry.decodePromise = (async () => {
    try {
      if (typeof entry.img.decode === "function") await entry.img.decode();
      else if (!entry.img.complete) await new Promise((resolve, reject) => {
        entry.img.addEventListener("load", resolve, { once: true });
        entry.img.addEventListener("error", reject, { once: true });
      });
      entry.ready = entry.img.naturalWidth > 0;
      entry.failed = !entry.ready;
    } catch {
      entry.failed = true;
    }
  })();
  return entry.decodePromise;
}

function startProfileImageWarmup() {
  const generation = ++profileImageWarmupGeneration;

  // Roadmap card images already populate the browser image cache. On coarse-pointer
  // devices, decoding every profile image again in a separate warmup queue competes
  // with touch/profile work for no immediate user benefit. Mobile warms only the
  // current profile and its immediate neighbours; desktop keeps the broad warm cache.
  if (isMobileTouchViewport()) return;

  const urls = [...new Set((state.units || []).map(unit => String(unit.icon || "").trim()).filter(Boolean))];
  if (!urls.length) return;
  const entries = urls.map(url => ensureProfileImageWarmEntry(url)).filter(Boolean);
  const startDecodeWorkers = () => {
    if (generation !== profileImageWarmupGeneration) return;
    let cursor = 0;
    const worker = async () => {
      while (generation === profileImageWarmupGeneration && cursor < entries.length) {
        const entry = entries[cursor++];
        await decodeProfileWarmEntry(entry);
      }
    };
    const concurrency = Math.min(4, entries.length);
    for (let i = 0; i < concurrency; i++) worker();
  };

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(startDecodeWorkers, { timeout: 900 });
  } else {
    setTimeout(startDecodeWorkers, 120);
  }
}

function warmProfilePairImages(unit, priority = "high") {
  if (!unit) return;
  const ms = isMs(unit) ? unit : pairedMsForPilot(unit);
  const pilot = isPilot(unit) ? unit : pairedPilotForMs(unit);
  for (const candidate of [ms, pilot]) {
    const entry = ensureProfileImageWarmEntry(candidate?.icon, priority);
    if (entry) decodeProfileWarmEntry(entry);
  }
}

const VIEWER_LOCAL_STATE_KEY = "uceViewerLocalStateV1";
const LEGACY_PULL_CALCULATOR_STORAGE_KEY = "ucePullCalculatorV1";
const PULL_COST_DIAMONDS = 300;
const PITY_PULL_INTERVAL = 200;
const PICKUP_RATE = 0.015;
const DEFAULT_PULL_CALCULATOR = Object.freeze({
  diamonds: 0,
  msCopies: 1,
  pilotCopies: 1,
  msTickets: 10,
  pilotTickets: 10,
  msUsePity: true,
  pilotUsePity: true,
  breakdown: "ms"
});
let pullCalculator = { ...DEFAULT_PULL_CALCULATOR };
let viewerLocalStateCache = { version: 1, filtersByRoadmap: {} };

const els = {
  roadmap: document.getElementById("roadmap"),
  chartStage: document.getElementById("chartStage"),
  chartScroll: document.getElementById("chartScroll"),
  legend: document.getElementById("statusLegend"),
  legendPanel: document.querySelector(".legend-panel"),
  customUnitFilterButton: document.getElementById("btnCustomUnitFilter"),
  customUnitFilterStatus: document.getElementById("customUnitFilterStatus"),
  customUnitFilterSaveButton: document.getElementById("btnSaveCustomUnitFilter"),
  customUnitFilterClearButton: document.getElementById("btnClearCustomUnitFilter"),
  customUnitFilterCancelButton: document.getElementById("btnCancelCustomUnitFilter"),
  customUnitFilterHint: document.getElementById("customUnitFilterHint"),
  summary: document.getElementById("summary"),
  message: document.getElementById("message"),
  zoomLabel: document.getElementById("zoomLabel"),
  drawer: document.getElementById("unitDrawer"),
  drawerContent: document.getElementById("drawerContent"),
  tooltip: document.getElementById("tooltip"),
  pullCalculator: document.getElementById("pullCalculator"),
  pullCalcDiamonds: document.getElementById("pullCalcDiamonds"),
  pullCalcMsTarget: document.getElementById("pullCalcMsTarget"),
  pullCalcPilotTarget: document.getElementById("pullCalcPilotTarget"),
  pullCalcMsTickets: document.getElementById("pullCalcMsTickets"),
  pullCalcPilotTickets: document.getElementById("pullCalcPilotTickets"),
  pullCalcMsPity: document.getElementById("pullCalcMsPity"),
  pullCalcPilotPity: document.getElementById("pullCalcPilotPity"),
  pullCalcResult: document.getElementById("pullCalcResult"),
  pullCalcProbabilityList: document.getElementById("pullCalcProbabilityList"),
  pullCalcMsBreakdown: document.getElementById("btnPullCalcMsBreakdown"),
  pullCalcPilotBreakdown: document.getElementById("btnPullCalcPilotBreakdown")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  tooltipEl = els.tooltip;
  loadViewerLocalState();
  bindControls();

  // Catalog data is useful for optional Altema backfill, but it is not required to
  // draw the roadmap. Fetch it in parallel so a large static catalog never blocks
  // the first usable Viewer frame.
  const catalogPromise = loadOptionalCatalog();
  await loadRoadmap();
  normalizeState();
  restoreViewerFilterState();
  startProfileImageWarmup();
  renderAll();
  initialFitTimer = setTimeout(() => {
    initialFitTimer = 0;
    fitToWidth();
  }, 40);
  scheduleUnitTooltipWarmup();
  catalogPromise.then(backfillCatalogSourceUrls).catch(() => {});
}

function bindControls() {
  document.addEventListener("keydown", () => {
    lastInputModality = "keyboard";
    cancelInitialFitToWidth();
  }, { capture: true });
  document.addEventListener("pointerdown", event => {
    // A new physical press is a new user intent. Any compatibility click still
    // pending from a direct-touch profile action belongs to the previous press and
    // must not suppress this new interaction.
    pendingDirectTouchClickSuppression = null;
    lastInputModality = event.pointerType || "pointer";
    cancelInitialFitToWidth();
    // Any fresh finger-down outranks deferred semantic polish. Cancelling here,
    // in capture phase, prevents a return-to-map worker from consuming more
    // frames before a profile/control/chart handler gets a chance to run.
    if (event.pointerType === "touch" && isMobileTouchViewport()) cancelDeferredTouchZoomPresentation();
  }, { capture: true });
  document.addEventListener("click", event => {
    const pending = pendingDirectTouchClickSuppression;
    if (!pending) return;
    if (performance.now() > pending.until) {
      pendingDirectTouchClickSuppression = null;
      return;
    }
    const dx = Number(event.clientX) - pending.x;
    const dy = Number(event.clientY) - pending.y;
    if (Math.hypot(dx, dy) > 18) return;
    // Safari may synthesize the activation click after pointerup and may retarget
    // it if the touched modal was removed. Swallow exactly that one same-contact
    // click in capture phase before it can activate whatever is now underneath.
    pendingDirectTouchClickSuppression = null;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, { capture: true });
  document.getElementById("btnCloseDrawer").addEventListener("click", closeDrawer);
  bindDirectTouchActionButton(document.getElementById("btnOpenPullCalculator"), openPullCalculator);
  bindDirectTouchActionButton(document.getElementById("btnClosePullCalculator"), closePullCalculator);
  document.getElementById("btnResetPullCalculator")?.addEventListener("click", resetPullCalculator);
  els.customUnitFilterButton?.addEventListener("click", enterCustomUnitFilterMode);
  els.customUnitFilterSaveButton?.addEventListener("click", saveCustomUnitFilter);
  els.customUnitFilterClearButton?.addEventListener("click", clearCustomUnitFilterDraft);
  els.customUnitFilterCancelButton?.addEventListener("click", cancelCustomUnitFilterMode);
  els.chartScroll?.addEventListener("selectstart", event => event.preventDefault());
  els.chartScroll?.addEventListener("dragstart", event => {
    if (event.target.closest?.(".unit-card img")) event.preventDefault();
  });
  els.pullCalcDiamonds?.addEventListener("input", () => {
    pullCalculator.diamonds = Math.max(0, Math.floor(Number(els.pullCalcDiamonds.value) || 0));
    savePullCalculator();
    renderPullCalculator();
  });
  els.pullCalcMsTarget?.addEventListener("change", () => {
    pullCalculator.msCopies = clampPullTarget(els.pullCalcMsTarget.value);
    savePullCalculator();
    renderPullCalculator();
  });
  els.pullCalcPilotTarget?.addEventListener("change", () => {
    pullCalculator.pilotCopies = clampPullTarget(els.pullCalcPilotTarget.value);
    savePullCalculator();
    renderPullCalculator();
  });
  els.pullCalcMsTickets?.addEventListener("input", () => {
    pullCalculator.msTickets = clampPullTickets(els.pullCalcMsTickets.value);
    savePullCalculator();
    renderPullCalculator();
  });
  els.pullCalcPilotTickets?.addEventListener("input", () => {
    pullCalculator.pilotTickets = clampPullTickets(els.pullCalcPilotTickets.value);
    savePullCalculator();
    renderPullCalculator();
  });
  els.pullCalcMsPity?.addEventListener("change", () => {
    pullCalculator.msUsePity = Boolean(els.pullCalcMsPity.checked);
    savePullCalculator();
    renderPullCalculator();
  });
  els.pullCalcPilotPity?.addEventListener("change", () => {
    pullCalculator.pilotUsePity = Boolean(els.pullCalcPilotPity.checked);
    savePullCalculator();
    renderPullCalculator();
  });
  els.pullCalcMsBreakdown?.addEventListener("click", () => setPullCalculatorBreakdown("ms"));
  els.pullCalcPilotBreakdown?.addEventListener("click", () => setPullCalculatorBreakdown("pilot"));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (customUnitFilterEditing) { cancelCustomUnitFilterMode(); return; }
    if (unitNoteReaderOverlay) { closeUnitNoteReader(); return; }
    if (unitProfileOverlay) { closeUnitProfile(); return; }
    closeDrawer();
    closePullCalculator();
    hideTooltip(true);
  });
  document.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (event.pointerType === "touch" || isMobileTouchViewport()) cancelDeferredTouchZoomPresentation();
    if (!event.target.closest?.(".legend-item, .legend-info")) hideAppTooltip(true);
    if (event.target.closest?.(".unit-card, .meta-bar, .unit-drawer, .unit-tooltip-card, .viewer-controls, .topbar, .legend-panel, button, a, input, select, textarea")) return;
    hideTooltip(true);
  });
  els.chartScroll.addEventListener("pointerdown", cancelInitialFitToWidth, { capture: true });
  els.roadmap.addEventListener("pointerdown", beginPan);
  els.roadmap.addEventListener("click", event => {
    if (!metaOwnerTouchSelectionId || customUnitFilterEditing || unitProfileOverlay) return;
    if (suppressRoadmapClick || performance.now() < suppressTouchClickUntil) return;
    if (event.target.closest?.(".unit-card, .meta-bar")) return;
    setMetaOwnerTouchSelection(null);
  });
  els.chartScroll.addEventListener("wheel", handleWheelZoom, { passive: false });

  // The smooth pre-11754ed iPhone path lets WebKit own one-finger momentum scrolling
  // and consumes WebKit's native GestureEvent scale only for pinch. Keep the newer
  // Pointer Events state machine as the fallback everywhere else. This does NOT
  // re-enable the failed persistent transform-camera architecture.
  useWebKitNativeGestureInput = isMobileTouchViewport()
    && ("ongesturestart" in window || typeof window.GestureEvent === "function");
  els.chartScroll.classList.toggle("webkit-native-gesture-input", useWebKitNativeGestureInput);
  if (useWebKitNativeGestureInput) {
    els.chartScroll.addEventListener("gesturestart", beginWebKitPinchGesture, { passive: false });
    els.chartScroll.addEventListener("gesturechange", moveWebKitPinchGesture, { passive: false });
    els.chartScroll.addEventListener("gestureend", endWebKitPinchGesture, { passive: false });
    els.chartScroll.addEventListener("touchstart", markWebKitTouchActive, { passive: true });
    els.chartScroll.addEventListener("touchend", endWebKitTouchActive, { passive: true });
    els.chartScroll.addEventListener("touchcancel", cancelWebKitTouchActive, { passive: true });
    if ("onscrollend" in els.chartScroll) {
      els.chartScroll.addEventListener("scrollend", () => {
        // Safari 26.2+ gives us a definitive native-scroll completion signal.
        // Resume interrupted zoom semantics only after momentum actually stops;
        // unchanged-zoom pans need just the visible/prefetch reconciliation.
        if (touchZoomSemanticDirty) maybeScheduleDeferredTouchZoomPresentation();
        else scheduleMobileViewportSemanticCatchup();
      });
    }
  }

  els.chartScroll.addEventListener("pointerdown", beginTouchGesture);
  els.roadmap.addEventListener("lostpointercapture", handleLostPanPointerCapture);
  window.addEventListener("pointermove", movePan);
  window.addEventListener("pointerup", endPan);
  window.addEventListener("pointercancel", endPan);
  window.addEventListener("pointermove", moveTouchGesture, { passive: false });
  window.addEventListener("pointerup", endTouchGesture);
  window.addEventListener("pointercancel", endTouchGesture);
  window.addEventListener("blur", () => recoverInterruptedPointerInteractions({ schedulePresentation: false }));
  window.addEventListener("focus", maybeScheduleDeferredTouchZoomPresentation);
  window.addEventListener("pagehide", () => recoverInterruptedPointerInteractions({ schedulePresentation: false }));
  window.addEventListener("pageshow", maybeScheduleDeferredTouchZoomPresentation);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) recoverInterruptedPointerInteractions({ schedulePresentation: false });
    else maybeScheduleDeferredTouchZoomPresentation();
  });
  window.addEventListener("resize", handleViewerViewportResize);
  window.visualViewport?.addEventListener("resize", handleViewerVisualViewportResize);
}

function cancelInitialFitToWidth() {
  if (!initialFitTimer) return;
  clearTimeout(initialFitTimer);
  initialFitTimer = 0;
}

function scheduleViewerViewportRefresh() {
  if (viewportResizeFrame) cancelAnimationFrame(viewportResizeFrame);
  viewportResizeFrame = requestAnimationFrame(() => {
    viewportResizeFrame = 0;
    const previousZoom = zoomScale;
    zoomScale = clamp(zoomScale, minimumZoom(), MAX_ZOOM);
    applyZoomGeometry();

    // Roadmap semantic presentation depends on roadmap zoom, not on Safari's
    // independently changing visual viewport. Browser chrome can emit resize
    // traffic while the page is otherwise idle; replaying every card/meta/grid
    // semantic pass at an unchanged scale creates seconds of pointless rAF work.
    // Only reconcile semantics when the resize actually forced the zoom value to
    // change (for example if a future breakpoint changes the allowed minimum).
    if (Math.abs(previousZoom - zoomScale) < 0.0001) {
      if (isMobileTouchViewport()) scheduleMobileViewportSemanticCatchup();
      return;
    }
    if (isMobileTouchViewport()) {
      touchZoomSemanticDirty = true;
      maybeScheduleDeferredTouchZoomPresentation();
    } else {
      applyZoomSemanticVariables();
      updateAdaptiveRoadmapPresentation();
      touchZoomSemanticDirty = false;
    }
  });
}
function handleViewerViewportResize() {
  cancelInitialFitToWidth();
  if (touchInteractionIsActive() || panDrag) recoverInterruptedPointerInteractions();
  hideTooltip(true);
  hideAppTooltip(true);
  scheduleViewerViewportRefresh();
}
function handleViewerVisualViewportResize() {
  hideTooltip(true);
  hideAppTooltip(true);
  // Safari can change the visual viewport as browser chrome expands/collapses.
  // That is not a reason to abort an otherwise healthy chart gesture; the layout
  // viewport resize path above owns true orientation/layout interruption recovery.
  if (touchInteractionIsActive() || panDrag) return;
  scheduleViewerViewportRefresh();
}

async function loadRoadmap() {
  const privateResult = await readPrivateHashRoadmap();
  if (privateResult.present) {
    if (privateResult.roadmap) {
      state = privateResult.roadmap;
      setMessage("");
    } else {
      state = structuredClone(DEFAULT_STATE);
      setMessage(privateResult.error || "Could not decrypt this private roadmap.");
    }
    return;
  }

  const fromHash = readHashRoadmap();
  if (fromHash) {
    state = fromHash;
    setMessage("");
    return;
  }

  try {
    const response = await fetch("data/roadmap.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    state = Array.isArray(json) ? { ...structuredClone(DEFAULT_STATE), units: json } : { ...structuredClone(DEFAULT_STATE), ...json };
    setMessage("");
  } catch (error) {
    state = structuredClone(DEFAULT_STATE);
    setMessage("No published roadmap data found. Open a private season link, use a legacy #roadmap=… share link, or publish data/roadmap.json.");
  }
}

async function loadOptionalCatalog() {
  try {
    const response = await fetch("data/catalog.json");
    if (!response.ok) return;
    const json = await response.json();
    const items = Array.isArray(json) ? json : json.items || [];
    catalogIndex = new Map(items.map(item => [sanitizeText(item.name).toLowerCase(), item]));
    buildCatalogSourceIndices(items);
  } catch {
    catalogIndex = new Map();
    catalogIconIndex = new Map();
    catalogKindNameIndex = new Map();
  }
}

function backfillCatalogSourceUrls() {
  if (!catalogIndex.size && !catalogIconIndex.size && !catalogKindNameIndex.size) return;
  for (const unit of state.units || []) {
    if (normalizeAltemaSourceUrl(unit.sourceUrl, unit.kind)) continue;
    const resolved = catalogAltemaUrlForUnit(unit);
    if (resolved) unit.sourceUrl = resolved;
  }
}

function normalizeAltemaSourceUrl(value, kind = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, "https://altema.jp/");
    if (url.protocol !== "https:" || !/^(?:www\.)?altema\.jp$/i.test(url.hostname)) return "";
    const match = url.pathname.match(/^\/gundamuce\/(ms|chara)\/(\d+)\/?$/i);
    if (!match) return "";
    const expected = String(kind || "").toLowerCase() === "pilot" ? "chara" : String(kind || "").toLowerCase() === "ms" ? "ms" : "";
    if (expected && match[1].toLowerCase() !== expected) return "";
    return `https://altema.jp/gundamuce/${match[1].toLowerCase()}/${match[2]}`;
  } catch {
    return "";
  }
}

function catalogKindNameKey(kind, name) {
  return `${String(kind || "").trim().toLowerCase()}:${sanitizeText(name).toLowerCase()}`;
}

function buildCatalogSourceIndices(items = []) {
  catalogIconIndex = new Map();
  catalogKindNameIndex = new Map();
  for (const item of items || []) {
    const kind = String(item?.kind || item?.type || "").trim().toLowerCase();
    const sourceUrl = normalizeAltemaSourceUrl(item?.sourceUrl, kind);
    if (!sourceUrl) continue;
    for (const icon of [item?.icon, item?.remoteIcon]) {
      const key = String(icon || "").trim();
      if (key && !catalogIconIndex.has(key)) catalogIconIndex.set(key, sourceUrl);
    }
    const nameKey = catalogKindNameKey(kind, item?.name);
    if (!nameKey.endsWith(":")) {
      const existing = catalogKindNameIndex.get(nameKey);
      if (!existing) catalogKindNameIndex.set(nameKey, sourceUrl);
      else if (existing !== sourceUrl) catalogKindNameIndex.set(nameKey, null);
    }
  }
}

function catalogAltemaUrlForUnit(unit) {
  if (!unit) return "";
  const kind = String(unit.kind || unit.type || "").trim().toLowerCase();
  const direct = normalizeAltemaSourceUrl(unit.sourceUrl ?? unit.altemaUrl, kind);
  if (direct) return direct;
  const icon = String(unit.icon || "").trim();
  const byIcon = icon ? catalogIconIndex.get(icon) : "";
  if (byIcon) return normalizeAltemaSourceUrl(byIcon, kind);
  const byName = catalogKindNameIndex.get(catalogKindNameKey(kind, unit.name));
  return byName ? normalizeAltemaSourceUrl(byName, kind) : "";
}

function validPrivateShareId(value) {
  return /^[A-Za-z0-9_-]{8,32}$/.test(String(value || ""));
}
async function decompressPrivateRoadmap(bytes, compression) {
  if (compression === "none") return bytes;
  if (compression !== "gzip") throw new Error(`Unsupported compression: ${compression}`);
  if (typeof DecompressionStream !== "function") throw new Error("This browser does not support gzip decompression required by this private roadmap.");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function readPrivateHashRoadmap() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const shareId = params.get("private");
  if (!shareId) return { present: false, roadmap: null, error: "" };
  try {
    if (!validPrivateShareId(shareId)) throw new Error("Private share ID is invalid.");
    if (!globalThis.crypto?.subtle) throw new Error("Private roadmap decryption requires a secure browser context (HTTPS or localhost).");
    const keyBytes = base64urlToBytes(params.get("key") || "");
    if (keyBytes.length !== 32) throw new Error("Private share key is missing or invalid.");
    const response = await fetch(`data/private/${encodeURIComponent(shareId)}.uce.enc`, { cache: "no-cache" });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Encrypted roadmap ${shareId}.uce.enc was not found in data/private/.`);
      throw new Error(`Could not load encrypted roadmap (HTTP ${response.status}).`);
    }
    const envelope = JSON.parse(await response.text());
    if (envelope?.format !== "gundam-uce-roadmap-private" || Number(envelope?.version) !== 1) throw new Error("Encrypted roadmap format is not supported.");
    if (envelope.shareId !== shareId) throw new Error("Encrypted roadmap share ID does not match this link.");
    if (envelope.cipher !== "AES-GCM-256") throw new Error("Encrypted roadmap cipher is not supported.");
    const iv = base64urlToBytes(envelope.iv);
    if (iv.length !== 12) throw new Error("Encrypted roadmap IV is invalid.");
    const ciphertext = base64urlToBytes(envelope.data);
    const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
    const additionalData = new TextEncoder().encode(`gundam-uce-roadmap-private:v1:${shareId}`);
    const decrypted = new Uint8Array(await crypto.subtle.decrypt({
      name: "AES-GCM",
      iv,
      additionalData,
      tagLength: 128
    }, key, ciphertext));
    const plainBytes = await decompressPrivateRoadmap(decrypted, envelope.compression || "none");
    const json = JSON.parse(new TextDecoder().decode(plainBytes));
    const roadmap = Array.isArray(json) ? { ...structuredClone(DEFAULT_STATE), units: json } : { ...structuredClone(DEFAULT_STATE), ...json };
    return { present: true, roadmap, error: "" };
  } catch (error) {
    return { present: true, roadmap: null, error: `Could not open private roadmap: ${error.message}` };
  }
}

function readHashRoadmap() {
  const match = location.hash.match(/roadmap=([^&]+)/);
  if (!match) return null;
  try {
    const json = JSON.parse(base64urlDecode(match[1]));
    return Array.isArray(json) ? { ...structuredClone(DEFAULT_STATE), units: json } : { ...structuredClone(DEFAULT_STATE), ...json };
  } catch (error) {
    setMessage(`Could not read roadmap from link: ${error.message}`);
    return null;
  }
}

function normalizeState() {
  invalidateLayoutGeometryCache();
  const unitsBefore = Array.isArray(state.units) ? state.units : [];
  const maxWeek = maxUsedWeek(unitsBefore);

  if (!Array.isArray(state.months) || !state.months.length || isGenericMonthLabels(state.months)) {
    state.months = makeDefaultMonthLabels(Math.max(3, Math.ceil(maxWeek / 4)));
  }
  state.months = state.months.map((m, i) => sanitizeText(m) || suggestedMonthLabel(i)).slice(0, 12);
  if (!state.months.length) state.months = [...DEFAULT_MONTHS];

  const rawMonthWeeks = Array.isArray(state.monthWeeks) ? state.monthWeeks : [];
  state.monthWeeks = state.months.map((_, i) => normalizeMonthWeekCount(rawMonthWeeks[i]));
  while (state.months.length < 12 && weekCount() < maxWeek) {
    state.months.push(suggestedMonthLabel(state.months.length));
    state.monthWeeks.push(4);
  }

  const oldTierLabels = new Map((state.tiers || []).map(t => [t.id, t.label]));
  const oldTierColors = new Map((state.tiers || []).map(t => [t.id, t.color]));
  state.tiers = DEFAULT_TIERS.map(fallback => {
    const oldColorRaw = String(oldTierColors.get(fallback.id) || "").trim();
    const oldColor = oldColorRaw.toLowerCase();
    const legacyColors = LEGACY_TIER_COLORS[fallback.id] || [];
    const wasLegacyDefault = legacyColors.some(c => c.toLowerCase() === oldColor);
    const oldLabel = sanitizeText(oldTierLabels.get(fallback.id));
    const wasLegacyLabel = (LEGACY_TIER_LABELS[fallback.id] || []).some(l => l.toLowerCase() === oldLabel.toLowerCase());
    const forceSkipGrey = fallback.id === "skip" && (!oldColorRaw || wasLegacyDefault || LEGACY_TIER_COLORS.skip.includes(oldColor));
    return {
      id: fallback.id,
      label: oldLabel && !wasLegacyLabel ? oldLabel : fallback.label,
      color: validHex(oldColorRaw) && !wasLegacyDefault && !forceSkipGrey ? oldColorRaw : fallback.color
    };
  });

  if (!Array.isArray(state.metaStatuses) || !state.metaStatuses.length) state.metaStatuses = structuredClone(DEFAULT_META_STATUSES);
  state.metaStatuses = state.metaStatuses.slice(0, 8).map((s, i) => {
    const id = sanitizeText(s.id) || `s${i + 1}`;
    const fallback = DEFAULT_META_STATUSES[i] || { label: `Status ${i + 1}`, description: "", color: "#8aa0ff" };
    const color = validHex(s.color) && String(s.color).toLowerCase() !== (LEGACY_STATUS_COLORS[id] || "").toLowerCase()
      ? s.color
      : fallback.color;
    return { id, label: sanitizeText(s.label) || fallback.label, description: String(s.description ?? fallback.description ?? "").trim(), color };
  });

  state.tagDescriptions = normalizeTagDescriptions(state.tagDescriptions);

  const tierIdsSet = new Set(state.tiers.map(t => t.id));
  const statusIds = new Set(state.metaStatuses.map(s => s.id));
  const fallbackStatus = defaultMetaStatusId();

  state.units = unitsBefore.map((u, i) => {
    const tier = tierIdsSet.has(u.tier) ? u.tier : "must";
    const week = normalizeWeek(u.week || u.releaseWeek || 1);
    const oldStatus = OLD_STATUS_MAP[u.metaStatus] || u.metaStatus || fallbackStatus;
    const hasExplicitSegments = Array.isArray(u.segments);
    let segments = hasExplicitSegments ? u.segments : [];

    if (!hasExplicitSegments) {
      const start = normalizeWeek(u.metaStart || week);
      const end = normalizeWeek(u.metaEnd || start);
      segments = [{ id: `${u.id || i}-seg-0`, start: Math.min(start, end), end: Math.max(start, end), statusId: oldStatus }];
    }

    segments = segments.map((seg, segIndex) => {
      const start = normalizeWeek(seg.start || seg.metaStart || week);
      const end = normalizeWeek(seg.end || seg.metaEnd || start);
      const mappedStatus = OLD_STATUS_MAP[seg.statusId] || OLD_STATUS_MAP[seg.metaStatus] || seg.statusId || oldStatus;
      return {
        id: seg.id || `${u.id || i}-seg-${segIndex}`,
        start: Math.min(start, end),
        end: Math.max(start, end),
        statusId: statusIds.has(mappedStatus) ? mappedStatus : fallbackStatus
      };
    }).sort((a, b) => a.start - b.start || a.end - b.end);

    const rawTags = Array.isArray(u.tags) ? u.tags : (Array.isArray(u.badges) ? u.badges : []);
    const kind = sanitizeText(u.kind || u.type) || "custom";
    const rawNotesPvp = String(u.notesPvp ?? u.pvpNotes ?? u.note ?? "").trim();
    const rawNotesPve = String(u.notesPve ?? u.pveNotes ?? "").trim();
    const pilotNotes = String(kind).toLowerCase() === "pilot"
      ? [rawNotesPvp, rawNotesPve].filter(Boolean).join("\n\n")
      : rawNotesPvp;
    return {
      id: u.id || `unit-${i}`,
      name: sanitizeText(u.name) || "Unnamed Unit",
      kind,
      tier,
      week,
      lane: normalizeLane(u.lane || 1),
      rowOffset: normalizeRowOffset(u.rowOffset ?? u.tierOffset ?? 0),
      stackOrder: Number(u.stackOrder) || 0,
      icon: resolveIcon(u),
      sourceUrl: catalogAltemaUrlForUnit(u),
      tags: cleanTags(rawTags),
      minPotential: String(kind).toLowerCase() === "ms" ? normalizePotentialLevel(u.minPotential ?? u.minimumPotential ?? u.minP) : null,
      idealPotential: String(kind).toLowerCase() === "ms" ? normalizePotentialLevel(u.idealPotential ?? u.recommendedPotential ?? u.idealP) : null,
      notesPvp: pilotNotes,
      notesPve: String(kind).toLowerCase() === "pilot" ? "" : rawNotesPve,
      segments
    };
  });

  state.units.forEach(unit => {
    unit.week = normalizeWeek(unit.week);
    unit.rowOffset = normalizeRowOffset(unit.rowOffset);
    unit.stackOrder = Number(unit.stackOrder) || 0;
    unit.segments.forEach(seg => {
      seg.start = normalizeWeek(seg.start);
      seg.end = normalizeWeek(seg.end);
      if (seg.end < seg.start) [seg.start, seg.end] = [seg.end, seg.start];
    });
    unit.segments.sort((a, b) => a.start - b.start || a.end - b.end);
  });

  state.tiers.forEach(tier => reflowLanes(tier.id));
  // Viewer data is immutable after load, so build all relationship/navigation
  // indices once here. syncPilotLanes can then use the cached pairing map rather
  // than rescanning every unit for every pilot.
  rebuildStaticRuntimeIndices();
  syncPilotLanes();
}

function resolveIcon(unit) {
  const direct = String(unit.icon || "").trim();
  if (direct) return direct;
  const found = catalogIndex.get(sanitizeText(unit.name).toLowerCase());
  return found?.icon || found?.remoteIcon || "";
}

function renderAll() {
  metaOwnerHoverId = null;
  metaOwnerFocusId = null;
  metaOwnerTouchSelectionId = null;
  metaOwnerProfileId = null;
  metaOwnerHighlightedId = null;
  metaFocusDimmerEl = null;
  renderSummary();
  renderLegend();
  renderChart();
  applyZoom();
  if (!els.pullCalculator?.classList.contains("hidden")) renderPullCalculator();
  updateCustomUnitFilterControls();
}

function renderSummary() {
  const count = state.units.length;
  const months = state.months.length;
  const weeks = weekCount();
  const updated = state.updated ? ` · Updated ${formatDate(state.updated)}` : "";
  els.summary.textContent = `${count} unit${count === 1 ? "" : "s"} · ${months} month${months === 1 ? "" : "s"} · ${weeks} week${weeks === 1 ? "" : "s"}${updated}`;
}

function renderLegend() {
  els.legend.innerHTML = "";
  getStatuses().forEach(status => {
    const control = document.createElement("span");
    control.className = "legend-status-control";

    const item = document.createElement("span");
    item.className = "legend-item";
    item.dataset.statusId = status.id;
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-pressed", activeMetaStatusFilters.has(status.id) ? "true" : "false");
    item.innerHTML = `<i class="legend-swatch" style="--legend-color:${escapeAttr(status.color)}"></i><span class="legend-label">${escapeHtml(status.label)}</span>`;
    const description = String(status.description || "").trim();
    const tooltipHtml = () => `<h3 class="app-tooltip-status-name" style="--tooltip-status-color:${escapeAttr(status.color)}">${escapeHtml(status.label)}</h3>${description ? `<div class="app-tooltip-description">${multilineHtml(description)}</div>` : ""}<div class="app-tooltip-filter-hint">${isMobileTouchViewport() ? "Tap the status name to filter it on or off." : "Click to filter this status on or off."}</div>`;
    item.setAttribute("aria-label", `${status.label}. ${activeMetaStatusFilters.has(status.id) ? "Active" : "Inactive"} PVP meta filter.${description ? ` ${description}` : ""}`);
    // Desktop keeps hover/focus context on the status itself. A mobile tap on the
    // status has one job only: filter. Context lives behind the explicit info target.
    bindAppTooltip(item, tooltipHtml, { pinOnCoarseClick: false });
    item.addEventListener("click", event => {
      event.stopPropagation();
      hideAppTooltip(true);
      toggleMetaStatusFilter(status.id);
    });
    item.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      hideAppTooltip(true);
      toggleMetaStatusFilter(status.id);
    });
    control.appendChild(item);

    if (description) {
      const info = document.createElement("button");
      info.type = "button";
      info.className = "legend-info";
      info.setAttribute("aria-label", `About ${status.label} meta status`);
      info.setAttribute("aria-expanded", "false");
      info.innerHTML = `<span aria-hidden="true">i</span>`;
      info.addEventListener("click", event => {
        event.stopPropagation();
        if (appTooltipPinned && appTooltipAnchorEl === info) {
          hideAppTooltip(true);
          return;
        }
        showAppTooltip(event, tooltipHtml, true, info);
      });
      control.appendChild(info);
    }
    els.legend.appendChild(control);
  });
}

function renderChart() {
  mobileCardNameMetricsById.clear();
  captureRoadmapImagesForRender();
  const width = baseChartWidth();
  const height = baseChartHeight();
  els.roadmap.innerHTML = "";
  els.roadmap.style.width = `${width}px`;
  els.roadmap.style.height = `${height}px`;
  els.roadmap.style.setProperty("--weeks", String(weekCount()));

  addDiv("month-head corner", { left: "0px", width: `${LEFT_W}px` });

  state.months.forEach((month, i) => {
    const el = addDiv("month-head", {
      left: `${weekX(monthStartWeek(i))}px`,
      width: `${monthPixelWidth(i)}px`
    });
    el.textContent = month;
  });

  for (let w = 1; w <= weekCount(); w++) {
    const el = addDiv("week-head", { left: `${weekX(w)}px`, width: `${weekWidth(w)}px` });
    el.textContent = `W${weekToMonthWeek(w).weekInMonth}`;
  }

  getTiers().forEach(tier => {
    const label = addDiv("tier-label", {
      top: `${tierY(tier.id)}px`,
      height: `${tierHeight(tier.id)}px`,
      color: tier.color
    });
    label.dataset.fullLabel = tier.label;
    label.dataset.tierId = tier.id;
    const labelText = document.createElement("span");
    labelText.className = "tier-label-text";
    labelText.textContent = tier.label;
    label.appendChild(labelText);
    bindAppTooltip(label, () => label.dataset.abbreviated === "true"
      ? `<strong>${escapeHtml(tier.label)}</strong>`
      : "");

    const rail = addDiv("tier-accent-rail", {
      left: `${LEFT_W}px`,
      top: `${tierY(tier.id)}px`,
      width: `${Math.max(0, width - LEFT_W)}px`
    });
    rail.style.setProperty("--tier-color", tier.color);
  });

  const monthBoundaries = new Set([0]);
  getMonthWeeks().reduce((sum, weeks) => {
    const next = sum + weeks;
    monthBoundaries.add(next);
    return next;
  }, 0);
  if (isMobileTouchViewport()) {
    addMobileVectorGrid(width, height, monthBoundaries);
  } else {
    for (let w = 0; w <= weekCount(); w++) {
      const line = addDiv(`grid-line v${monthBoundaries.has(w) ? " month" : ""}`, {
        left: `${weekBoundaryX(w)}px`
      });
      line.style.height = monthBoundaries.has(w) ? "100%" : `${height - HEADER_H}px`;
    }

    getTiers().forEach(tier => addDiv("grid-line h", { top: `${tierY(tier.id)}px` }));
    addDiv("grid-line h", { top: `${height}px` });
  }

  getTiers().forEach(tier => {
    for (let lane = 1; lane <= visibleLaneCount(tier.id); lane++) {
      const track = addDiv("lane-track", {
        top: `${laneY(tier.id, lane)}px`,
        width: `${Math.max(4, width - LEFT_W - 20)}px`
      });
      const owner = layoutGeometryCache.laneOwners.get(`${tier.id}|${lane}`);
      if (owner) track.dataset.unitId = owner.id;
      track.setAttribute("aria-hidden", "true");
    }
  });

  metaFocusDimmerEl = addDiv("meta-focus-dimmer");
  metaFocusDimmerEl.setAttribute("aria-hidden", "true");

  state.units
    .filter(hasVisibleMetaSegments)
    .sort((a, b) => laneY(a) - laneY(b) || normalizeWeek(a.week) - normalizeWeek(b.week) || a.name.localeCompare(b.name))
    .forEach(unit => {
      renderMetaOwnerTether(unit);
      renderMetaSegmentLinks(unit);
      const segments = sortedVisibleSegments(unit);
      segments.forEach((segment, index) => renderSegment(unit, segment, index, segments.length));
    });

  state.units
    .slice()
    .sort((a, b) => unitZIndex(a, sameSlotOffset(a)) - unitZIndex(b, sameSlotOffset(b)) || a.name.localeCompare(b.name))
    .forEach(renderUnit);
  rebuildMetaOwnerElementIndex();
  roadmapImageReuseCache.clear();
  // Filtering is semantic state, not zoom presentation. Apply it when markup is
  // rebuilt instead of rescanning the whole roadmap at every zoom commit.
  applyMetaFilters();
}

function renderUnit(unit) {
  const slot = sameSlotOffset(unit);
  const size = slot.size || ICON_W;
  const card = document.createElement("article");
  card.className = `unit-card${activeUnitId === unit.id ? " active" : ""}${hasMustP5(unit) ? " must-p5" : ""}${hasBuff(unit) ? " buff" : ""}${normalizeRowOffset(unit.rowOffset) ? " between-row" : ""}`;
  card.dataset.id = unit.id;
  const metaOwner = metaOwnerForUnit(unit);
  if (metaOwner?.id && hasVisibleMetaSegments(metaOwner)) card.dataset.metaOwnerId = metaOwner.id;
  card.style.left = `${iconX(unit)}px`;
  card.style.top = `${iconY(unit)}px`;
  card.style.width = `${size}px`;
  card.style.height = `${size}px`;
  card.style.zIndex = String(unitZIndex(unit, slot));
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", unit.name);

  if (unit.icon) {
    const img = reusableRoadmapImage(unit) || document.createElement("img");
    if (!img.getAttribute("src")) img.src = unit.icon;
    img.alt = unit.name;
    img.draggable = false;
    img.decoding = "async";
    img.width = Math.round(size);
    img.height = Math.round(size);
    img.crossOrigin = "anonymous";
    img.onerror = () => tryIconFallback(img, unit);
    card.appendChild(img);
  } else {
    card.appendChild(placeholder(unit.name));
  }

  const displayTags = unit.tags.slice(0, MAX_TAGS);
  const tags = document.createElement("div");
  tags.className = `tags${displayTags.length > TAGS_PER_COLUMN ? " two-col" : ""}`;
  const appendTag = (container, tag) => {
    const span = document.createElement("span");
    span.className = `tag ${tagClass(tag)}`;
    span.textContent = tag;
    container.appendChild(span);
  };
  if (displayTags.length > TAGS_PER_COLUMN) {
    [displayTags.slice(TAGS_PER_COLUMN), displayTags.slice(0, TAGS_PER_COLUMN)].forEach(colTags => {
      const column = document.createElement("div");
      column.className = "tag-column";
      colTags.forEach(tag => appendTag(column, tag));
      tags.appendChild(column);
    });
  } else {
    displayTags.forEach(tag => appendTag(tags, tag));
  }
  card.appendChild(tags);

  const plate = document.createElement("div");
  plate.className = "nameplate";
  plate.textContent = unit.name;
  card.appendChild(plate);

  card.addEventListener("pointerdown", () => {
    // The roadmap artwork is already resident in the browser image cache on mobile.
    // Starting a second explicit decode at the exact moment the user opens a profile
    // only creates competing work; desktop retains its existing proactive warmup.
    if (!isMobileTouchViewport()) warmProfilePairImages(unit);
  }, { passive: true });
  const activateCard = event => {
    const directTouch = event?.type === "pointerup" && event.pointerType === "touch";
    if (suppressRoadmapClick || (!directTouch && performance.now() < suppressTouchClickUntil)) return;
    if (customUnitFilterEditing) {
      toggleCustomUnitFilterDraft(unit);
      return;
    }
    bringUnitToFront(unit.id);
    const rememberTouchOwner = isMobileTouchViewport() && (event?.pointerType === "touch" || lastInputModality === "touch");
    const touchOwnerId = rememberTouchOwner ? (metaOwner?.id || null) : null;
    // Open the modal before recording touch ownership. setMetaOwnerTouchSelection()
    // deliberately avoids repainting the large roadmap while a mobile profile is
    // present, so this ordering preserves return-to-map context without creating
    // the full-roadmap dimmer immediately underneath the profile.
    openUnitProfile(unit.id);
    if (rememberTouchOwner) setMetaOwnerTouchSelection(touchOwnerId);
  };
  bindDirectTouchRoadmapActivation(card, activateCard);
  card.addEventListener("click", event => {
    event.stopPropagation();
    activateCard(event);
  });
  card.addEventListener("pointerenter", event => {
    if (event.pointerType === "touch") return;
    bringUnitToFront(unit.id);
    if (customUnitFilterEditing) return;
    setMetaOwnerHover(metaOwnerForUnit(unit)?.id || null);
    showTooltip(event, unit, null, { anchor: card });
  });
  card.addEventListener("pointerleave", event => {
    if (event.pointerType === "touch") return;
    if (!customUnitFilterEditing) setMetaOwnerHover(null);
    hideTooltip(false);
  });
  card.addEventListener("focus", () => {
    if (customUnitFilterEditing) return;
    if (isMobileTouchViewport() && lastInputModality !== "keyboard") {
      setMetaOwnerFocus(null);
      return;
    }
    setMetaOwnerFocus(metaOwnerForUnit(unit)?.id || null);
  });
  card.addEventListener("blur", () => {
    if (!customUnitFilterEditing) setMetaOwnerFocus(null);
  });
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (customUnitFilterEditing) toggleCustomUnitFilterDraft(unit);
      else openUnitProfile(unit.id);
    }
  });
  els.roadmap.appendChild(card);
}

function renderSegment(unit, segment, index = 0, total = 1) {
  if (!hasVisibleMetaSegments(unit)) return;
  const segments = sortedVisibleSegments(unit);
  const rect = segmentBarRect(unit, segment);
  const bar = document.createElement("div");
  const joinsPrevious = index > 0 && metaSegmentsTouch(segments[index - 1], segment);
  const joinsNext = index < total - 1 && metaSegmentsTouch(segment, segments[index + 1]);
  bar.className = `meta-bar${activeUnitId === unit.id ? " active" : ""}${joinsPrevious ? " segment-inner-left" : " segment-first"}${joinsNext ? " segment-inner-right" : " segment-last"}`;
  bar.dataset.unitId = unit.id;
  bar.dataset.segmentId = segment.id;
  bar.dataset.statusId = segment.statusId;
  bar.style.left = `${rect.x}px`;
  bar.style.top = `${rect.y}px`;
  bar.style.width = `${rect.w}px`;
  const color = segmentColor(segment);
  const textPresentation = metaBarTextPresentation(color);
  bar.style.setProperty("--bar", color);
  bar.style.setProperty("--bar-text", textPresentation.color);
  bar.dataset.textTone = textPresentation.tone;
  bar.setAttribute("tabindex", "0");
  bar.setAttribute("aria-label", `${unit.name} - ${metaStatus(segment.statusId).label}. Click or press Enter to open Full Profile.`);

  const label = document.createElement("span");
  label.className = "bar-label";
  label.dataset.fullLabel = `${unit.name} - ${metaStatus(segment.statusId).label}`;
  label.dataset.unitLabel = unit.name;
  label.textContent = label.dataset.fullLabel;
  label.__uceMetaLabelMetrics = immutableMetaLabelMetrics(bar, label);
  bar.appendChild(label);

  const activateMetaBar = event => {
    const directTouch = event?.type === "pointerup" && event.pointerType === "touch";
    if (suppressRoadmapClick || (!directTouch && performance.now() < suppressTouchClickUntil)) return;
    if (customUnitFilterEditing) {
      toggleCustomUnitFilterDraft(unit);
      return;
    }
    const rememberTouchOwner = isMobileTouchViewport() && (event?.pointerType === "touch" || lastInputModality === "touch");
    // As with roadmap cards, defer the visual ownership reconciliation until the
    // profile closes. The logical selection is still updated while the modal is up.
    openUnitProfile(unit.id, segment.id);
    if (rememberTouchOwner) setMetaOwnerTouchSelection(unit.id);
  };
  bindDirectTouchRoadmapActivation(bar, activateMetaBar);
  bar.addEventListener("click", event => {
    event.stopPropagation();
    activateMetaBar(event);
  });
  bar.addEventListener("pointerenter", event => {
    if (event.pointerType === "touch" || customUnitFilterEditing) return;
    setMetaOwnerHover(unit.id);
    showTooltip(event, unit, segment, { anchor: bar });
  });
  bar.addEventListener("pointerleave", event => {
    if (event.pointerType === "touch") return;
    if (!customUnitFilterEditing) setMetaOwnerHover(null);
    hideTooltip(false);
  });
  bar.addEventListener("focus", () => {
    if (customUnitFilterEditing) return;
    if (isMobileTouchViewport() && lastInputModality !== "keyboard") {
      setMetaOwnerFocus(null);
      return;
    }
    setMetaOwnerFocus(unit.id);
  });
  bar.addEventListener("blur", () => {
    if (!customUnitFilterEditing) setMetaOwnerFocus(null);
  });
  bar.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (customUnitFilterEditing) toggleCustomUnitFilterDraft(unit);
    else openUnitProfile(unit.id, segment.id);
  });
  els.roadmap.appendChild(bar);
}

function tryIconFallback(img, unit) {
  const found = catalogIndex.get(sanitizeText(unit.name).toLowerCase());
  const next = found?.remoteIcon && img.src !== found.remoteIcon ? found.remoteIcon : "";
  if (next) img.src = next;
  else img.replaceWith(placeholder(unit.name));
}

function openDrawer(unitId, segmentId = null) {
  const unit = unitByIdIndex.get(unitId) || state.units.find(u => u.id === unitId);
  if (!unit) return;
  activeUnitId = unit.id;
  closePullCalculator();
  els.drawerContent.innerHTML = unitDetailHtml(unit, segmentId);
  els.drawer.classList.remove("hidden");
  renderChart();
}

function closeDrawer() {
  const needsChartRefresh = activeUnitId !== null;
  const wasOpen = !els.drawer.classList.contains("hidden");
  activeUnitId = null;
  els.drawer.classList.add("hidden");
  if (needsChartRefresh || wasOpen) renderChart();
}

function unitDetailHtml(unit, activeSegmentId = null) {
  const pairedMs = isPilot(unit) ? pairedMsForPilot(unit) : null;
  const metaUnit = metaOwnerForUnit(unit);
  const title = pairedMs ? `${unit.name} (${pairedMs.name})` : unit.name;
  const tagHtml = unit.tags.map(tag => `<span class="tag ${tagClass(tag)}">${escapeHtml(tag)}</span>`).join("");
  const imgHtml = unit.icon
    ? `<img src="${escapeAttr(unit.icon)}" alt="${escapeAttr(unit.name)}" onerror="this.replaceWith(window.__ucePlaceholder('${escapeAttr(unit.name)}'))">`
    : placeholderHtml(unit.name);
  const rowLabel = unitRowLabel(unit);
  const metaHtml = metaUnit ? segmentListHtml(metaUnit, activeSegmentId) : `<div class="segment-chip"><i class="segment-dot"></i><span>No same-week MS meta segments</span></div>`;

  return `
    <section class="drawer-hero">
      ${imgHtml}
      <div>
        <h2>${escapeHtml(title)}</h2>
        <div class="drawer-tags">${tagHtml}</div>
      </div>
    </section>
    <section class="drawer-section">
      <div class="meta-row"><span class="k">Row</span><span style="color:${escapeAttr(tierById(unit.tier).color)}">${escapeHtml(rowLabel)}</span></div>
      <div class="meta-row"><span class="k">Release</span><span>${escapeHtml(formatWeek(unit.week))}</span></div>
      <div class="meta-row"><span class="k">Type</span><span>${escapeHtml(unit.kind || "custom")}</span></div>
    </section>
    ${investmentDetailHtml(unit)}
    <section class="drawer-section">
      <h3>Meta timeline${metaUnit && metaUnit.id !== unit.id ? ` · ${escapeHtml(metaUnit.name)}` : ""}</h3>
      <div class="segment-list">${metaHtml}</div>
    </section>
    ${isPilot(unit)
      ? (unit.notesPvp ? `<section class="drawer-section"><h3>Notes</h3><div class="note">${multilineHtml(unit.notesPvp)}</div></section>` : "")
      : `${unit.notesPvp ? `<section class="drawer-section"><h3>PVP Notes</h3><div class="note">${multilineHtml(unit.notesPvp)}</div></section>` : ""}${unit.notesPve ? `<section class="drawer-section"><h3>PVE Notes</h3><div class="note">${multilineHtml(unit.notesPve)}</div></section>` : ""}`}
  `;
}

function clampPullTarget(value) {
  return Math.max(0, Math.min(6, Math.round(Number(value) || 0)));
}

function clampPullTickets(value) {
  return Math.max(0, Math.min(1000000, Math.floor(Number(value) || 0)));
}

function normalizeStoredPullCalculator(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    diamonds: Math.max(0, Math.floor(Number(source.diamonds) || 0)),
    msCopies: clampPullTarget(source.msCopies ?? DEFAULT_PULL_CALCULATOR.msCopies),
    pilotCopies: clampPullTarget(source.pilotCopies ?? DEFAULT_PULL_CALCULATOR.pilotCopies),
    msTickets: clampPullTickets(source.msTickets ?? DEFAULT_PULL_CALCULATOR.msTickets),
    pilotTickets: clampPullTickets(source.pilotTickets ?? DEFAULT_PULL_CALCULATOR.pilotTickets),
    msUsePity: source.msUsePity !== false,
    pilotUsePity: source.pilotUsePity !== false,
    breakdown: source.breakdown === "pilot" ? "pilot" : "ms"
  };
}

function loadViewerLocalState() {
  let stored = null;
  try {
    const raw = JSON.parse(localStorage.getItem(VIEWER_LOCAL_STATE_KEY) || "null");
    if (raw && typeof raw === "object") stored = raw;
  } catch {}

  let pullSource = stored?.pullCalculator;
  if (!pullSource) {
    try {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_PULL_CALCULATOR_STORAGE_KEY) || "null");
      if (legacy && typeof legacy === "object") pullSource = legacy;
    } catch {}
  }

  pullCalculator = normalizeStoredPullCalculator(pullSource);
  viewerLocalStateCache = {
    version: 1,
    filtersByRoadmap: stored?.filtersByRoadmap && typeof stored.filtersByRoadmap === "object"
      ? { ...stored.filtersByRoadmap }
      : {}
  };
}

function viewerLocalStateHash(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function viewerRoadmapScopeKey() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const privateId = params.get("private");
  if (/^[A-Za-z0-9_-]{8,32}$/.test(String(privateId || ""))) return `private-${privateId}`;
  const legacyRoadmap = params.get("roadmap");
  if (legacyRoadmap) return `legacy-${viewerLocalStateHash(legacyRoadmap)}`;
  return `published-${viewerLocalStateHash(location.pathname || "/")}`;
}

function restoreViewerFilterState() {
  activeMetaStatusFilters.clear();
  activeMetaUnitFilters.clear();
  const saved = viewerLocalStateCache.filtersByRoadmap?.[viewerRoadmapScopeKey()];
  if (!saved || typeof saved !== "object") return;

  const validStatuses = new Set(getStatuses().map(status => status.id));
  const validUnits = new Set((state.units || [])
    .filter(unit => isMs(unit) && hasVisibleMetaSegments(unit))
    .map(unit => unit.id));
  for (const statusId of Array.isArray(saved.statusIds) ? saved.statusIds : []) {
    if (validStatuses.has(statusId)) activeMetaStatusFilters.add(statusId);
  }
  for (const unitId of Array.isArray(saved.unitIds) ? saved.unitIds : []) {
    if (validUnits.has(unitId)) activeMetaUnitFilters.add(unitId);
  }
}

function saveViewerLocalState() {
  try {
    const filtersByRoadmap = { ...(viewerLocalStateCache.filtersByRoadmap || {}) };
    const scope = viewerRoadmapScopeKey();
    filtersByRoadmap[scope] = {
      statusIds: [...activeMetaStatusFilters],
      unitIds: [...activeMetaUnitFilters],
      savedAt: Date.now()
    };

    // Keep a small history so separate published/private seasons remember their own
    // filters without letting stale roadmap entries grow localStorage forever.
    const retainedFilters = Object.fromEntries(
      Object.entries(filtersByRoadmap)
        .sort((a, b) => Number(b[1]?.savedAt || 0) - Number(a[1]?.savedAt || 0))
        .slice(0, 12)
    );
    const payload = {
      version: 1,
      pullCalculator: { ...pullCalculator },
      filtersByRoadmap: retainedFilters
    };
    localStorage.setItem(VIEWER_LOCAL_STATE_KEY, JSON.stringify(payload));
    viewerLocalStateCache = payload;
  } catch {}
}

function savePullCalculator() {
  saveViewerLocalState();
}

function openPullCalculator() {
  closeDrawer();
  renderPullCalculator();
  els.pullCalculator?.classList.remove("hidden");
  document.getElementById("btnOpenPullCalculator")?.setAttribute("aria-expanded", "true");
}

function closePullCalculator() {
  els.pullCalculator?.classList.add("hidden");
  document.getElementById("btnOpenPullCalculator")?.setAttribute("aria-expanded", "false");
  maybeScheduleDeferredTouchZoomPresentation();
}

function resetPullCalculator() {
  pullCalculator = { ...DEFAULT_PULL_CALCULATOR };
  savePullCalculator();
  renderPullCalculator();
}

function setPullCalculatorBreakdown(kind) {
  pullCalculator.breakdown = kind === "pilot" ? "pilot" : "ms";
  savePullCalculator();
  renderPullCalculator();
}

function binomialAtLeast(pulls, copies, rate = PICKUP_RATE) {
  const n = Math.max(0, Math.floor(Number(pulls) || 0));
  const k = Math.max(0, Math.floor(Number(copies) || 0));
  if (k <= 0) return 1;
  if (n < k || rate <= 0) return 0;
  if (rate >= 1) return 1;

  const miss = 1 - rate;
  let probability = Math.pow(miss, n);
  let cumulativeBelowTarget = probability;
  for (let successes = 1; successes < k; successes++) {
    probability *= ((n - successes + 1) / successes) * (rate / miss);
    cumulativeBelowTarget += probability;
  }
  return Math.max(0, Math.min(1, 1 - cumulativeBelowTarget));
}

function pityPickupCopies(pulls, usePity) {
  if (!usePity) return 0;
  return Math.max(0, Math.floor(Math.max(0, Number(pulls) || 0) / PITY_PULL_INTERVAL));
}

function pickupGoalProbability(pulls, copies, usePity) {
  const targetCopies = clampPullTarget(copies);
  if (!targetCopies) return 1;
  const pityCopies = pityPickupCopies(pulls, usePity);
  const randomCopiesNeeded = Math.max(0, targetCopies - pityCopies);
  return binomialAtLeast(pulls, randomCopiesNeeded);
}

function bannerGoalProbabilityWithDiamonds(diamondPulls, tickets, copies, usePity) {
  const sharedPulls = Math.max(0, Math.floor(Number(diamondPulls) || 0));
  const bannerTickets = clampPullTickets(tickets);
  return pickupGoalProbability(bannerTickets + sharedPulls, copies, usePity);
}

function adaptiveJointPullProbability(diamondPulls, msCopies, pilotCopies, options = {}) {
  const sharedDiamondPulls = Math.max(0, Math.floor(Number(diamondPulls) || 0));
  const msGoal = clampPullTarget(msCopies);
  const pilotGoal = clampPullTarget(pilotCopies);
  const msTickets = msGoal ? clampPullTickets(options.msTickets) : 0;
  const pilotTickets = pilotGoal ? clampPullTickets(options.pilotTickets) : 0;
  const msUsePity = options.msUsePity !== false;
  const pilotUsePity = options.pilotUsePity !== false;

  if (!msGoal && !pilotGoal) return 1;
  if (!msGoal) return bannerGoalProbabilityWithDiamonds(sharedDiamondPulls, pilotTickets, pilotGoal, pilotUsePity);
  if (!pilotGoal) return bannerGoalProbabilityWithDiamonds(sharedDiamondPulls, msTickets, msGoal, msUsePity);

  // Treat each banner as its own independent sequence of pickup pulls. Tickets are
  // banner-specific pulls used before shared Diamonds. Once a banner reaches its
  // requested target, a rational player stops spending Diamonds there and uses the
  // remaining Diamonds on the unfinished banner. Because the featured rate is the
  // same on both banners and pity depends only on that banner's pull count, the
  // order/interleaving does not change the number of pulls each banner needs.
  //
  // Let A and B be the additional Diamond pulls required to finish MS and Pilot
  // after their tickets. The exact adaptive success chance is P(A + B <= budget).
  // Sum the MS completion-time PMF against the Pilot completion-time CDF.
  let probability = 0;
  let previousMsCdf = 0;
  for (let msDiamondPulls = 0; msDiamondPulls <= sharedDiamondPulls; msDiamondPulls++) {
    const msCdf = bannerGoalProbabilityWithDiamonds(msDiamondPulls, msTickets, msGoal, msUsePity);
    const msCompletionProbability = Math.max(0, msCdf - previousMsCdf);
    if (msCompletionProbability > 0) {
      const pilotDiamondPulls = sharedDiamondPulls - msDiamondPulls;
      const pilotCdf = bannerGoalProbabilityWithDiamonds(pilotDiamondPulls, pilotTickets, pilotGoal, pilotUsePity);
      probability += msCompletionProbability * pilotCdf;
    }
    previousMsCdf = msCdf;
    if (msCdf >= 1) break;
  }

  return Math.max(0, Math.min(1, probability));
}

function formatProbability(probability) {
  const pct = Math.max(0, Math.min(1, Number(probability) || 0)) * 100;
  if (pct > 0 && pct < 0.001) return "<0.001%";
  if (pct < 1) return `${pct.toFixed(3)}%`;
  if (pct < 99.999) return `${pct.toFixed(2)}%`;
  if (pct < 100) return ">99.999%";
  return "100%";
}

function pullTargetLabel(copies) {
  const count = clampPullTarget(copies);
  return count ? `P${count - 1}` : "None";
}

function pullGoalLabel(msCopies, pilotCopies) {
  const pieces = [];
  if (msCopies) pieces.push(`MS ${pullTargetLabel(msCopies)}`);
  if (pilotCopies) pieces.push(`Pilot ${pullTargetLabel(pilotCopies)}`);
  return pieces.length ? pieces.join(" + ") : "No target selected";
}

function pullResourceStat(label, pulls, detail) {
  return `<div class="pull-calc-stat"><span>${escapeHtml(label)}</span><strong>${Number(pulls).toLocaleString("en-US")}</strong><small>${escapeHtml(detail)}</small></div>`;
}

function renderPullProbabilityBreakdown(kind, diamondPulls) {
  if (!els.pullCalcProbabilityList) return;
  const isPilotBreakdown = kind === "pilot";
  const target = isPilotBreakdown ? pullCalculator.pilotCopies : pullCalculator.msCopies;
  const otherTarget = isPilotBreakdown ? pullCalculator.msCopies : pullCalculator.pilotCopies;
  const otherLabel = isPilotBreakdown ? "MS" : "Pilot";
  const rows = [];
  for (let copies = 1; copies <= 6; copies++) {
    const probability = isPilotBreakdown
      ? adaptiveJointPullProbability(diamondPulls, pullCalculator.msCopies, copies, {
          msTickets: pullCalculator.msTickets,
          pilotTickets: pullCalculator.pilotTickets,
          msUsePity: pullCalculator.msUsePity,
          pilotUsePity: pullCalculator.pilotUsePity
        })
      : adaptiveJointPullProbability(diamondPulls, copies, pullCalculator.pilotCopies, {
          msTickets: pullCalculator.msTickets,
          pilotTickets: pullCalculator.pilotTickets,
          msUsePity: pullCalculator.msUsePity,
          pilotUsePity: pullCalculator.pilotUsePity
        });
    const pct = Math.max(0, Math.min(100, probability * 100));
    const targetClass = copies === target ? " target" : "";
    rows.push(`
      <div class="pull-probability-row${targetClass}">
        <div class="pull-probability-level"><strong>P${copies - 1}</strong><span>${copies} ${copies === 1 ? "copy" : "copies"}</span></div>
        <div class="pull-probability-meter" aria-hidden="true"><i style="width:${pct.toFixed(4)}%"></i></div>
        <strong class="pull-probability-value">${formatProbability(probability)}</strong>
      </div>`);
  }
  const context = otherTarget
    ? `${isPilotBreakdown ? "Pilot" : "MS"} target · while also targeting ${otherLabel} ${pullTargetLabel(otherTarget)}`
    : `${isPilotBreakdown ? "Pilot" : "MS"} · chance to pull at least each level`;
  els.pullCalcProbabilityList.innerHTML = `<div class="pull-probability-context"><span>${escapeHtml(context)}</span><strong>Adaptive</strong></div>${rows.join("")}`;
}

function renderPullCalculator() {
  if (!els.pullCalculator || !els.pullCalcDiamonds || !els.pullCalcResult) return;
  if (document.activeElement !== els.pullCalcDiamonds) els.pullCalcDiamonds.value = String(pullCalculator.diamonds || 0);
  if (els.pullCalcMsTarget) els.pullCalcMsTarget.value = String(clampPullTarget(pullCalculator.msCopies));
  if (els.pullCalcPilotTarget) els.pullCalcPilotTarget.value = String(clampPullTarget(pullCalculator.pilotCopies));
  if (els.pullCalcMsTickets && document.activeElement !== els.pullCalcMsTickets) els.pullCalcMsTickets.value = String(clampPullTickets(pullCalculator.msTickets));
  if (els.pullCalcPilotTickets && document.activeElement !== els.pullCalcPilotTickets) els.pullCalcPilotTickets.value = String(clampPullTickets(pullCalculator.pilotTickets));
  if (els.pullCalcMsPity) els.pullCalcMsPity.checked = Boolean(pullCalculator.msUsePity);
  if (els.pullCalcPilotPity) els.pullCalcPilotPity.checked = Boolean(pullCalculator.pilotUsePity);

  const diamondPulls = Math.floor((pullCalculator.diamonds || 0) / PULL_COST_DIAMONDS);
  const unusedDiamonds = (pullCalculator.diamonds || 0) - diamondPulls * PULL_COST_DIAMONDS;
  const msTickets = clampPullTickets(pullCalculator.msTickets);
  const pilotTickets = clampPullTickets(pullCalculator.pilotTickets);
  const hasGoal = pullCalculator.msCopies > 0 || pullCalculator.pilotCopies > 0;
  const goalProbability = hasGoal
    ? adaptiveJointPullProbability(diamondPulls, pullCalculator.msCopies, pullCalculator.pilotCopies, {
        msTickets,
        pilotTickets,
        msUsePity: pullCalculator.msUsePity,
        pilotUsePity: pullCalculator.pilotUsePity
      })
    : 1;

  els.pullCalcResult.innerHTML = `
    <div class="pull-calc-goal">
      <span>Chance to pull ${escapeHtml(pullGoalLabel(pullCalculator.msCopies, pullCalculator.pilotCopies))}</span>
      <strong>${hasGoal ? formatProbability(goalProbability) : "—"}</strong>
      <small>${hasGoal ? "Adaptive strategy · Diamonds switch banners as targets are reached" : "Choose an MS or Pilot target above"}</small>
    </div>
    <div class="pull-calc-stats">
      ${pullResourceStat("Diamond pulls", diamondPulls, `${(diamondPulls * PULL_COST_DIAMONDS).toLocaleString("en-US")} Diamonds`)}
      ${pullResourceStat("MS tickets", msTickets, `${msTickets.toLocaleString("en-US")} MS ${msTickets === 1 ? "pull" : "pulls"}`)}
      ${pullResourceStat("Pilot tickets", pilotTickets, `${pilotTickets.toLocaleString("en-US")} Pilot ${pilotTickets === 1 ? "pull" : "pulls"}`)}
    </div>
    ${unusedDiamonds ? `<div class="pull-calc-unused">${unusedDiamonds.toLocaleString("en-US")} Dia remains below the 300-Diamond cost of one pull.</div>` : ""}`;

  const breakdown = pullCalculator.breakdown === "pilot" ? "pilot" : "ms";
  els.pullCalcMsBreakdown?.setAttribute("aria-pressed", String(breakdown === "ms"));
  els.pullCalcPilotBreakdown?.setAttribute("aria-pressed", String(breakdown === "pilot"));
  renderPullProbabilityBreakdown(breakdown, diamondPulls);
}

window.__ucePlaceholder = function(name) {
  const div = document.createElement("div");
  div.className = "placeholder";
  div.textContent = initials(name);
  return div;
};

function bindAppTooltip(element, htmlFactory, { pinOnCoarseClick = true } = {}) {
  if (!element) return;
  element.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    showAppTooltip(event, htmlFactory, false, element);
  });
  // Keep anchored tooltips stationary while the pointer moves inside the same
  // reference. This avoids high-frequency layout work and visual jitter.
  element.addEventListener("pointerleave", () => { if (!appTooltipPinned) hideAppTooltip(); });
  if (pinOnCoarseClick) element.addEventListener("click", (event) => {
    if (window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches) return;
    event.stopPropagation();
    showAppTooltip(event, htmlFactory, true, element);
  });
}

function showAppTooltip(event, htmlFactory, pin = false, anchorEl = null) {
  hideAppTooltip(true);
  const html = typeof htmlFactory === "function" ? htmlFactory() : String(htmlFactory || "");
  if (!html) return;
  appTooltipEl = document.createElement("div");
  appTooltipEl.className = "tooltip app-tooltip";
  appTooltipEl.setAttribute("role", "tooltip");
  appTooltipEl.innerHTML = html;
  document.body.appendChild(appTooltipEl);
  appTooltipPinned = !!pin;
  appTooltipAnchorEl = anchorEl instanceof Element ? anchorEl : (event?.currentTarget instanceof Element ? event.currentTarget : null);
  if (appTooltipAnchorEl?.classList?.contains("legend-info")) appTooltipAnchorEl.setAttribute("aria-expanded", "true");
  positionAppTooltip(appTooltipEl, event, appTooltipAnchorEl);
}

function tooltipIntersectionArea(a, b) {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return width * height;
}
function tooltipOwnerId(anchorEl) {
  return anchorEl?.dataset?.id || anchorEl?.dataset?.unitId || null;
}
function tooltipPlacementOrder(anchorEl, anchorRect) {
  const ownerId = tooltipOwnerId(anchorEl);
  if (ownerId && els.roadmap?.contains(anchorEl)) {
    if (anchorEl.classList.contains("unit-card")) {
      const lane = els.roadmap.querySelector(`.lane-track[data-unit-id="${CSS.escape(ownerId)}"]`);
      const laneRect = lane?.getBoundingClientRect();
      if (laneRect) return laneRect.top + laneRect.height / 2 >= anchorRect.top + anchorRect.height / 2
        ? ["top", "right", "left", "bottom"]
        : ["bottom", "right", "left", "top"];
    }
    if (anchorEl.classList.contains("meta-bar")) {
      const card = els.roadmap.querySelector(`.unit-card[data-id="${CSS.escape(ownerId)}"]`);
      const cardRect = card?.getBoundingClientRect();
      if (cardRect) return cardRect.top + cardRect.height / 2 <= anchorRect.top + anchorRect.height / 2
        ? ["bottom", "right", "left", "top"]
        : ["top", "right", "left", "bottom"];
    }
  }
  return ["right", "left", "bottom", "top"];
}
function tooltipOwnerObstacleRects(anchorEl) {
  if (!anchorEl || !els.roadmap?.contains(anchorEl)) return [];
  const ownerId = tooltipOwnerId(anchorEl);
  if (!ownerId) return [];
  const id = CSS.escape(ownerId);
  const nodes = els.roadmap.querySelectorAll(
    `.unit-card[data-id="${id}"],.meta-bar[data-unit-id="${id}"],.meta-link[data-unit-id="${id}"],` +
    `.meta-owner-tether[data-unit-id="${id}"],.meta-owner-node[data-unit-id="${id}"]`
  );
  return Array.from(nodes).filter(node => node !== anchorEl).map(node => {
    const rect = node.getBoundingClientRect();
    const weight = node.classList.contains("meta-bar") ? 12 : node.classList.contains("unit-card") ? 11 : 5;
    return { rect, weight };
  }).filter(item => item.rect.width > 0 && item.rect.height > 0);
}
function viewportSafeAreaInsets() {
  if (!safeAreaProbeEl?.isConnected) {
    safeAreaProbeEl = document.createElement("div");
    safeAreaProbeEl.setAttribute("aria-hidden", "true");
    safeAreaProbeEl.style.cssText = "position:fixed;inset:0 auto auto 0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);";
    document.body.appendChild(safeAreaProbeEl);
  }
  const style = getComputedStyle(safeAreaProbeEl);
  return {
    top: Number.parseFloat(style.paddingTop) || 0,
    right: Number.parseFloat(style.paddingRight) || 0,
    bottom: Number.parseFloat(style.paddingBottom) || 0,
    left: Number.parseFloat(style.paddingLeft) || 0
  };
}
function positionSmartTooltip(element, event, anchorEl = null, maxWidth = 360) {
  if (!element) return;
  const margin = 12;
  const gap = element.classList.contains("unit-tooltip-card") ? 30 : 18;
  const visualViewport = window.visualViewport;
  const viewportLeft = Number(visualViewport?.offsetLeft) || 0;
  const viewportTop = Number(visualViewport?.offsetTop) || 0;
  const viewportWidth = Number(visualViewport?.width) || window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = Number(visualViewport?.height) || window.innerHeight || document.documentElement.clientHeight || 0;
  const safe = viewportSafeAreaInsets();
  const safeLeft = viewportLeft + safe.left + margin;
  const safeTop = viewportTop + safe.top + margin;
  const safeRight = viewportLeft + viewportWidth - safe.right - margin;
  const safeBottom = viewportTop + viewportHeight - safe.bottom - margin;
  const usableWidth = Math.max(180, safeRight - safeLeft);
  element.style.maxWidth = `${Math.max(180, Math.min(maxWidth, usableWidth))}px`;
  const tooltipRect = element.getBoundingClientRect();
  const clientX = Number.isFinite(event?.clientX) ? event.clientX : viewportLeft + viewportWidth / 2;
  const clientY = Number.isFinite(event?.clientY) ? event.clientY : viewportTop + viewportHeight / 2;
  const reference = anchorEl instanceof Element && anchorEl.isConnected ? anchorEl : null;
  const anchorRect = reference?.getBoundingClientRect() || { left: clientX, right: clientX, top: clientY, bottom: clientY, width: 0, height: 0 };
  const order = tooltipPlacementOrder(reference, anchorRect);
  const ownerObstacles = tooltipOwnerObstacleRects(reference);
  const maxLeft = Math.max(safeLeft, safeRight - tooltipRect.width);
  const maxTop = Math.max(safeTop, safeBottom - tooltipRect.height);
  const candidates = order.map((placement, preferenceIndex) => {
    let rawLeft = anchorRect.left + (anchorRect.width - tooltipRect.width) / 2;
    let rawTop = anchorRect.top + (anchorRect.height - tooltipRect.height) / 2;
    if (placement === "right") rawLeft = anchorRect.right + gap;
    if (placement === "left") rawLeft = anchorRect.left - tooltipRect.width - gap;
    if (placement === "bottom") rawTop = anchorRect.bottom + gap;
    if (placement === "top") rawTop = anchorRect.top - tooltipRect.height - gap;
    const left = clamp(rawLeft, safeLeft, maxLeft);
    const top = clamp(rawTop, safeTop, maxTop);
    const candidateRect = { left, top, right: left + tooltipRect.width, bottom: top + tooltipRect.height };
    let score = preferenceIndex * 650 + (Math.abs(left - rawLeft) + Math.abs(top - rawTop)) * 18;
    const anchorOverlap = tooltipIntersectionArea(candidateRect, anchorRect);
    if (anchorOverlap) score += 2_000_000 + anchorOverlap * 20;
    for (const obstacle of ownerObstacles) {
      const area = tooltipIntersectionArea(candidateRect, obstacle.rect);
      if (area) score += obstacle.weight * (1800 + area);
    }
    return { left, top, placement, score };
  });
  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0];
  element.dataset.placement = best.placement;
  element.style.left = `${Math.round(best.left)}px`;
  element.style.top = `${Math.round(best.top)}px`;
}
function positionAppTooltip(element, event, anchorEl = null) {
  positionSmartTooltip(element, event, anchorEl, 360);
}

function hideAppTooltip(force = false) {
  if (appTooltipPinned && !force) return;
  if (appTooltipAnchorEl?.classList?.contains("legend-info")) appTooltipAnchorEl.setAttribute("aria-expanded", "false");
  appTooltipEl?.remove();
  appTooltipEl = null;
  appTooltipPinned = false;
  appTooltipAnchorEl = null;
}


function profileTagsHtml(unit) {
  if (!unit?.tags?.length) return "";
  return `<div class="unit-profile-tags">${unit.tags.map(tag => {
    const description = tagDescription(tag);
    return `<span class="unit-profile-tag ${tagClass(tag)}${description ? " has-description" : ""}" data-profile-tag="${escapeAttr(tag)}"${description ? ` aria-label="${escapeAttr(`${tag}: ${description}`)}"` : ""}>${escapeHtml(tag)}</span>`;
  }).join("")}</div>`;
}

function bindProfileTagTooltips(root) {
  root?.querySelectorAll(".unit-profile-tag[data-profile-tag]").forEach(chip => {
    if (chip.dataset.profileTooltipBound === "true") return;
    const tag = chip.dataset.profileTag || "";
    const description = tagDescription(tag);
    if (!description) return;
    chip.dataset.profileTooltipBound = "true";
    bindAppTooltip(chip, () => `<h3>${escapeHtml(tag)}</h3><div class="app-tooltip-description">${multilineHtml(description)}</div>`);
  });
}

function profileArtHtml(unit, typeLabel) {
  if (!unit) return `<div class="unit-profile-art empty"><div class="unit-profile-placeholder">?</div><span>${escapeHtml(typeLabel)}</span></div>`;
  const warmed = unit.icon ? profileImageWarmCache.get(String(unit.icon).trim()) : null;
  const decoding = !isMobileTouchViewport() && warmed?.ready ? "sync" : "async";
  const image = unit.icon
    ? `<img class="unit-profile-image" src="${escapeAttr(unit.icon)}" alt="${escapeAttr(unit.name)}" width="200" height="200" decoding="${decoding}" loading="eager" fetchpriority="high" crossorigin="anonymous"><div class="unit-profile-placeholder image-fallback">${escapeHtml(initials(unit.name))}</div>`
    : `<div class="unit-profile-placeholder">${escapeHtml(initials(unit.name))}</div>`;
  return `<div class="unit-profile-art">${image}</div>`;
}


function profileAltemaLinkHtml(unit) {
  if (!isMs(unit)) return "";
  const sourceUrl = catalogAltemaUrlForUnit(unit);
  if (!sourceUrl) return "";
  return `<a class="unit-profile-source-link" href="${escapeAttr(sourceUrl)}" target="_blank" rel="noopener noreferrer" data-profile-altema-link aria-label="See on Altema"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 5h5v5M19 5l-9 9M17 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5"/></svg></a>`;
}

function bindProfileAltemaTooltips(root) {
  root?.querySelectorAll("[data-profile-altema-link]").forEach(link => {
    if (link.dataset.profileTooltipBound === "true") return;
    link.dataset.profileTooltipBound = "true";
    let suppressUntilPointerLeaves = false;
    const tooltipHtml = () => `<strong>See on Altema</strong>`;
    const showSourceTooltip = event => {
      if (suppressUntilPointerLeaves) return;
      showAppTooltip(event, tooltipHtml, false, link);
      appTooltipEl?.classList.add("unit-profile-source-tooltip");
    };
    link.addEventListener("pointerenter", event => {
      if (event.pointerType === "touch") return;
      showSourceTooltip(event);
    });
    link.addEventListener("pointerleave", () => {
      suppressUntilPointerLeaves = false;
      hideAppTooltip(true);
    });
    link.addEventListener("pointerdown", () => {
      suppressUntilPointerLeaves = true;
      hideAppTooltip(true);
    });
    link.addEventListener("focus", () => {
      if (suppressUntilPointerLeaves) return;
      const rect = link.getBoundingClientRect();
      showSourceTooltip({ clientX: rect.right, clientY: rect.top + rect.height / 2 });
    });
    link.addEventListener("blur", () => {
      // Keep suppression latched after activation. Opening Altema in a new tab can
      // blur and then refocus this link when the user returns; clearing the latch
      // here would make the tooltip immediately reappear without a fresh hover.
      hideAppTooltip(true);
    });
    link.addEventListener("click", () => {
      suppressUntilPointerLeaves = true;
      hideAppTooltip(true);
    });
  });
}

function profileContextHtml(unit) {
  if (!unit) return "";
  const color = tierById(unit.tier).color || "#8d96a6";
  const tier = `<span class="unit-profile-tier" style="--profile-tier-color:${escapeAttr(color)}">${escapeHtml(unitRowLabel(unit))}</span>`;
  const releaseWeek = `<span>${escapeHtml(formatWeek(unit.week))}</span>`;
  const altema = profileAltemaLinkHtml(unit);
  if (!isMobileTouchViewport()) {
    // Desktop is already polished; preserve its exact context-item structure.
    return `<div class="unit-profile-context">${tier}${releaseWeek}${altema}</div>`;
  }
  return `<div class="unit-profile-context">${tier}<span class="unit-profile-release-source"><span class="unit-profile-release-week">${escapeHtml(formatWeek(unit.week))}</span>${altema}</span></div>`;
}

function profileInvestmentHtml(unit) {
  if (!isMs(unit)) return "";
  const minimum = normalizePotentialLevel(unit.minPotential);
  const ideal = normalizePotentialLevel(unit.idealPotential);
  if (minimum == null && ideal == null) return "";
  const cells = [];
  if (minimum != null) cells.push(`<div class="unit-profile-investment-stat"><span>Minimum</span><strong>P${minimum}</strong></div>`);
  if (ideal != null) cells.push(`<div class="unit-profile-investment-stat"><span>Ideal</span><strong>P${ideal}</strong></div>`);
  return `<section class="unit-profile-section unit-profile-investment-section"><div class="unit-profile-section-title">Investment</div><div class="unit-profile-investment">${cells.join("")}</div></section>`;
}

function profileMetaHtml(unit, activeSegmentId = null) {
  if (!unit) return "";
  const segments = (unit.segments || []).slice().sort((a, b) => a.start - b.start || a.end - b.end);
  if (!segments.length) return "";
  const rows = segments.map(seg => {
    const status = metaStatus(seg.statusId);
    const description = String(status.description || "").trim();
    const labelAttrs = description
      ? ` class="unit-profile-meta-label has-description" data-meta-label="${escapeAttr(status.label)}" data-meta-description="${escapeAttr(description)}" tabindex="0" role="button" aria-label="${escapeAttr(`${status.label}: ${description}`)}"`
      : ` class="unit-profile-meta-label"`;
    return `<div class="unit-profile-meta-row${activeSegmentId === seg.id ? " active" : ""}" data-profile-segment-id="${escapeAttr(seg.id)}"><i style="background:${escapeAttr(status.color)}"></i><div class="unit-profile-meta-copy"><div class="unit-profile-meta-top"><strong${labelAttrs}>${escapeHtml(status.label)}</strong><span>${escapeHtml(formatWeekRange(seg.start, seg.end))}</span></div></div></div>`;
  }).join("");
  return `<section class="unit-profile-section unit-profile-meta-section"><div class="unit-profile-section-title">PVP Meta</div><div class="unit-profile-meta-list">${rows}</div></section>`;
}

function profileScrollableNotesHtml(title, text, emptyText, extraClass = "", expandable = false) {
  const content = String(text || "").trim();
  const readerAttrs = expandable && content ? ` data-note-reader="true" data-note-title="${escapeAttr(title)}"` : "";
  const readerButton = expandable && content
    ? `<button class="unit-profile-note-expand" type="button" aria-label="Open full ${escapeAttr(title)}" hidden><span aria-hidden="true">i</span></button>`
    : "";
  return `<section class="unit-profile-section unit-profile-scroll-notes ${extraClass}"${readerAttrs}><div class="unit-profile-section-heading"><div class="unit-profile-section-title">${escapeHtml(title)}</div>${readerButton}</div><div class="unit-profile-note-scroll">${content ? `<div class="unit-profile-note-copy">${multilineHtml(content)}</div>` : `<div class="unit-profile-note-empty">${escapeHtml(emptyText)}</div>`}</div></section>`;
}

function bindProfileMetaTooltips(root) {
  root?.querySelectorAll(".unit-profile-meta-label[data-meta-description]").forEach(label => {
    if (label.dataset.profileTooltipBound === "true") return;
    label.dataset.profileTooltipBound = "true";
    const metaLabel = label.dataset.metaLabel || label.textContent || "PVP Meta";
    const description = label.dataset.metaDescription || "";
    const htmlFactory = () => `<h3>${escapeHtml(metaLabel)}</h3><div class="app-tooltip-description">${multilineHtml(description)}</div>`;
    const tooltipTarget = isMobileTouchViewport() ? label.closest(".unit-profile-meta-row") || label : label;
    bindAppTooltip(tooltipTarget, htmlFactory);
    label.addEventListener("focus", () => {
      const rect = label.getBoundingClientRect();
      showAppTooltip({ clientX: rect.left + rect.width / 2, clientY: rect.bottom }, htmlFactory, true, label);
    });
    label.addEventListener("blur", () => hideAppTooltip(true));
    label.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const rect = label.getBoundingClientRect();
      showAppTooltip({ clientX: rect.left + rect.width / 2, clientY: rect.bottom }, htmlFactory, true, label);
    });
  });
}

function modalFocusableElements(root) {
  return [...(root?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') || [])]
    .filter(element => element instanceof HTMLElement && element.offsetParent !== null);
}
function trapModalTabKey(root, event) {
  if (event.key !== "Tab") return;
  const focusable = modalFocusableElements(root);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !root.contains(active))) {
    event.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!event.shiftKey && (active === last || !root.contains(active))) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
}

function openUnitNoteReader(title, text, sourceButton = null) {
  const content = String(text || "").trim();
  if (!content) return;
  closeUnitNoteReader(true);
  hideAppTooltip(true);
  unitNoteReaderReturnFocus = sourceButton instanceof HTMLElement ? sourceButton : null;
  unitNoteReaderReturnFocusByKeyboard = lastInputModality === "keyboard";

  const overlay = document.createElement("div");
  overlay.className = "unit-note-reader-overlay";
  overlay.innerHTML = `
    <article class="unit-note-reader-card" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)} full notes">
      <header class="unit-note-reader-header">
        <div><span>FULL NOTES</span><h2>${escapeHtml(title)}</h2></div>
        <button class="unit-note-reader-close" type="button" aria-label="Close full notes">×</button>
      </header>
      <div class="unit-note-reader-body">${multilineHtml(content)}</div>
    </article>`;
  overlay.addEventListener("click", event => { if (event.target === overlay) closeUnitNoteReader(); });
  overlay.querySelector(".unit-note-reader-close")?.addEventListener("click", () => closeUnitNoteReader());
  overlay.addEventListener("keydown", event => trapModalTabKey(overlay, event));
  document.body.appendChild(overlay);
  unitNoteReaderOverlay = overlay;
  if (!isMobileTouchViewport() || unitNoteReaderReturnFocusByKeyboard) {
    overlay.querySelector(".unit-note-reader-close")?.focus({ preventScroll: true });
  }
}

function closeUnitNoteReader(immediate = false) {
  if (!unitNoteReaderOverlay) return;
  const overlay = unitNoteReaderOverlay;
  if (overlay.classList.contains("closing") && !immediate) return;
  const returnFocus = unitNoteReaderReturnFocus;
  const shouldRestoreFocus = !isMobileTouchViewport() || unitNoteReaderReturnFocusByKeyboard;
  unitNoteReaderOverlay = null;
  unitNoteReaderReturnFocus = null;
  unitNoteReaderReturnFocusByKeyboard = false;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    overlay.remove();
    if (shouldRestoreFocus && !unitNoteReaderOverlay && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  };
  if (immediate || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    finish();
    return;
  }
  overlay.classList.add("closing");
  overlay.addEventListener("animationend", finish, { once: true });
  setTimeout(finish, 260);
}

function bindProfileNoteReaders(root, generation = unitProfileBindingGeneration) {
  unitProfileOverflowObserver?.disconnect();
  unitProfileOverflowObserver = null;
  const sections = [...(root?.querySelectorAll('.unit-profile-scroll-notes[data-note-reader="true"]') || [])];
  if (!sections.length) return;

  const updateSection = section => {
    const scroller = section.querySelector(".unit-profile-note-scroll");
    const copy = section.querySelector(".unit-profile-note-copy");
    const button = section.querySelector(".unit-profile-note-expand");
    if (!scroller || !copy || !button) return;
    const overflowed = scroller.scrollHeight > scroller.clientHeight + 2;
    button.hidden = !overflowed;
    section.classList.toggle("has-note-overflow", overflowed);
  };

  sections.forEach(section => {
    const button = section.querySelector(".unit-profile-note-expand");
    if (button && button.dataset.profileReaderBound !== "true") {
      button.dataset.profileReaderBound = "true";
      button.addEventListener("click", event => {
        event.stopPropagation();
        const copy = section.querySelector(".unit-profile-note-copy");
        openUnitNoteReader(section.dataset.noteTitle || "Notes", copy?.innerText || copy?.textContent || "", button);
      });
    }
  });

  if (typeof ResizeObserver === "function") {
    unitProfileOverflowObserver = new ResizeObserver(entries => {
      if (generation !== unitProfileBindingGeneration || unitProfileOverlay !== root || !root?.isConnected) return;
      entries.forEach(entry => {
        const section = entry.target.closest?.('.unit-profile-scroll-notes[data-note-reader="true"]') || entry.target;
        if (section?.matches?.('.unit-profile-scroll-notes[data-note-reader="true"]')) updateSection(section);
      });
    });
    sections.forEach(section => {
      unitProfileOverflowObserver.observe(section);
      const scroller = section.querySelector(".unit-profile-note-scroll");
      if (scroller) unitProfileOverflowObserver.observe(scroller);
    });
  }

  const updateAll = () => {
    if (generation !== unitProfileBindingGeneration || unitProfileOverlay !== root || !root?.isConnected) return;
    sections.forEach(updateSection);
  };
  requestAnimationFrame(() => requestAnimationFrame(updateAll));
  // On mobile, ResizeObserver already catches late layout/image changes and the
  // double-rAF handles the initial settle. Avoid leaving an extra delayed
  // layout-read timer competing with rapid profile navigation.
  if (!isMobileTouchViewport() || typeof ResizeObserver !== "function") {
    scheduleUnitProfileBindingTimeout(updateAll, 120, generation, root);
  }
}


function profileRequiredContentBottom(panel, target) {
  if (!panel || !target) return 0;
  const panelRect = panel.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const panelStyle = getComputedStyle(panel);
  const paddingBottom = Number.parseFloat(panelStyle.paddingBottom) || 0;
  const fullTargetHeight = Math.max(targetRect.height, target.scrollHeight || 0);
  return Math.ceil((targetRect.top - panelRect.top) + fullTargetHeight + paddingBottom);
}

function updateUnitProfileAdaptiveRows(root) {
  const grid = root?.querySelector('.unit-profile-grid-lshape');
  if (!grid) return;

  // Mobile uses one continuous stacked scroll surface; row sizing only applies to desktop.
  if (window.matchMedia?.('(max-width: 820px), (max-height: 600px) and (pointer: coarse)')?.matches) {
    grid.style.removeProperty('--profile-top-row');
    return;
  }

  const gridHeight = grid.clientHeight;
  if (gridHeight <= 0) return;

  const msPanel = grid.querySelector(':scope > .unit-profile-ms-panel');
  const pilotPrimary = grid.querySelector(':scope > .unit-profile-pilot-panel > .unit-profile-pilot-primary');
  const metaList = msPanel?.querySelector('.unit-profile-meta-list');
  const pilotNotes = pilotPrimary?.querySelector('.unit-profile-pilot-notes .unit-profile-note-scroll');

  // Measure the deepest real content node, not the scroll container itself: a flexing scroll
  // container is always at least as tall as its assigned row and would make every unit look
  // artificially identical. The last meta row / pilot note copy reveal the true content depth.
  const msTarget = metaList?.querySelector('.unit-profile-meta-row:last-child') || metaList || msPanel?.lastElementChild;
  const pilotTarget = pilotNotes?.querySelector('.unit-profile-note-copy, .unit-profile-note-empty') || pilotNotes || pilotPrimary?.lastElementChild;
  const msRequired = profileRequiredContentBottom(msPanel, msTarget);
  const pilotRequired = profileRequiredContentBottom(pilotPrimary, pilotTarget);

  // Leave a small measured safety margin above the exact content bottom. Without it,
  // fractional font/layout rounding can produce a 1-2px scroll range even when every
  // visible line appears to fit, which makes an unnecessary scrollbar flash into view.
  const topContentBuffer = 12;

  // Notes are the flexible, lower-priority region, but always retain a usable preview floor.
  // On shorter windows that floor shrinks modestly; on taller windows it is capped so unused
  // top-row space naturally flows back into PVP/PVE notes.
  const notesFloor = clamp(Math.round(gridHeight * 0.24), 130, 190);
  const maxTop = Math.max(0, gridHeight - notesFloor);
  const topFloor = Math.min(maxTop, clamp(Math.round(gridHeight * 0.4), 250, 330));
  const desiredTop = Math.max(topFloor, msRequired + topContentBuffer, pilotRequired + topContentBuffer);
  const topHeight = Math.min(maxTop, Math.ceil(desiredTop));

  grid.style.setProperty('--profile-top-row', `${topHeight}px`);
}

function bindUnitProfileAdaptiveRows(root, generation = unitProfileBindingGeneration) {
  unitProfileLayoutObserver?.disconnect();
  unitProfileLayoutObserver = null;

  const card = root?.querySelector('.unit-profile-card');
  if (!card) return;

  // Mobile profiles are one continuous stacked scroll surface. Creating a live
  // ResizeObserver here did no useful layout work (the updater immediately returned)
  // but still generated callbacks during every rapid previous/next content swap.
  if (window.matchMedia?.('(max-width: 820px), (max-height: 600px) and (pointer: coarse)')?.matches) return;

  let frame = 0;
  const update = () => {
    if (generation !== unitProfileBindingGeneration || unitProfileOverlay !== root || !root?.isConnected) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (generation !== unitProfileBindingGeneration || unitProfileOverlay !== root || !root?.isConnected) return;
      updateUnitProfileAdaptiveRows(root);
    });
  };

  if (typeof ResizeObserver === 'function') {
    unitProfileLayoutObserver = new ResizeObserver(update);
    unitProfileLayoutObserver.observe(card);
  }

  requestAnimationFrame(() => requestAnimationFrame(update));
  scheduleUnitProfileBindingTimeout(update, 120, generation, root);
  if (document.fonts?.ready) document.fonts.ready.then(update).catch(() => {});
}

function profileTimelineMsUnits() {
  if (profileTimelineCache.length) return profileTimelineCache;
  return state.units
    .filter(isMs)
    .slice()
    .sort((a, b) =>
      normalizeWeek(a.week) - normalizeWeek(b.week)
      || (tierIndex(a.tier) + normalizeRowOffset(a.rowOffset)) - (tierIndex(b.tier) + normalizeRowOffset(b.rowOffset))
      || (Number(a.stackOrder) || 0) - (Number(b.stackOrder) || 0)
      || a.name.localeCompare(b.name)
      || a.id.localeCompare(b.id)
    );
}

function profileNavigationTargets(clicked, ms) {
  const timeline = profileTimelineMsUnits();
  if (!timeline.length) return { previous: null, next: null };

  if (ms) {
    const index = profileTimelineIndexById.get(ms.id) ?? timeline.findIndex(unit => unit.id === ms.id);
    if (index >= 0) {
      return {
        previous: index > 0 ? timeline[index - 1] : null,
        next: index < timeline.length - 1 ? timeline[index + 1] : null
      };
    }
  }

  // A standalone pilot can still move into the MS timeline from its visual position.
  const anchorWeek = normalizeWeek(clicked?.week);
  const anchorRow = tierIndex(clicked?.tier) + normalizeRowOffset(clicked?.rowOffset);
  let insertion = timeline.findIndex(unit =>
    normalizeWeek(unit.week) > anchorWeek
    || (normalizeWeek(unit.week) === anchorWeek
      && tierIndex(unit.tier) + normalizeRowOffset(unit.rowOffset) > anchorRow)
  );
  if (insertion < 0) insertion = timeline.length;
  return {
    previous: insertion > 0 ? timeline[insertion - 1] : null,
    next: insertion < timeline.length ? timeline[insertion] : null
  };
}

function unitProfileGridHtml(ms, pilot, activeId) {
  return `
    <section class="unit-profile-panel unit-profile-ms-panel">
      ${profilePanelHeaderHtml(ms, "MOBILE SUIT", "No paired MS")}
      ${ms ? profileInvestmentHtml(ms) : ""}
      ${ms ? profileMetaHtml(ms, activeId) : ""}
    </section>
    <section class="unit-profile-panel unit-profile-pilot-panel">
      <div class="unit-profile-pilot-primary">
        ${profilePanelHeaderHtml(pilot, "PILOT", "No paired pilot")}
        ${pilot ? profileScrollableNotesHtml("Pilot Notes", [pilot.notesPvp, pilot.notesPve].filter(Boolean).join("\n\n"), "No pilot notes added.", "unit-profile-pilot-notes", false) : ""}
      </div>
    </section>
    <section class="unit-profile-ms-notes-band" aria-label="Mobile Suit notes">
      <div class="unit-profile-ms-note-cell unit-profile-ms-pvp-cell">
        ${ms ? profileScrollableNotesHtml("PVP Notes", ms.notesPvp, "No PVP notes added.", "unit-profile-pvp-notes", true) : `<div class="unit-profile-note-empty standalone">No paired MS PVP notes.</div>`}
      </div>
      <div class="unit-profile-ms-note-cell unit-profile-ms-pve-cell">
        ${ms ? profileScrollableNotesHtml("PVE Notes", ms.notesPve, "No PVE notes added.", "unit-profile-pve-notes", true) : `<div class="unit-profile-note-empty standalone">No paired MS PVE notes.</div>`}
      </div>
    </section>`;
}

function unitProfileGridClass(ms) {
  return `unit-profile-grid unit-profile-grid-lshape${ms && (ms.segments || []).length >= 5 ? " meta-very-dense" : ms && (ms.segments || []).length >= 3 ? " meta-dense" : ""}`;
}

function setUnitProfileGridActiveSegment(grid, activeId = null) {
  if (!grid) return;
  grid.querySelectorAll(".unit-profile-meta-row[data-profile-segment-id]").forEach(row => {
    row.classList.toggle("active", Boolean(activeId) && row.dataset.profileSegmentId === activeId);
  });
}

function bindUnitProfileImageFallbacks(root) {
  root?.querySelectorAll(".unit-profile-image").forEach(img => {
    if (img.dataset.profileImageBound === "true") return;
    img.dataset.profileImageBound = "true";
    img.addEventListener("error", () => {
      img.style.display = "none";
      const fallback = img.nextElementSibling;
      if (fallback) fallback.classList.remove("image-fallback");
    }, { once: true });
  });
}

function resetUnitProfileContentBindings() {
  unitProfileBindingGeneration += 1;
  if (unitProfileBindingFrame) {
    cancelAnimationFrame(unitProfileBindingFrame);
    unitProfileBindingFrame = 0;
  }
  unitProfileBindingTimers.forEach(timer => clearTimeout(timer));
  unitProfileBindingTimers.clear();
  unitProfileOverflowObserver?.disconnect();
  unitProfileOverflowObserver = null;
  unitProfileLayoutObserver?.disconnect();
  unitProfileLayoutObserver = null;
}

function scheduleUnitProfileBindingTimeout(callback, delay, generation, root) {
  const timer = setTimeout(() => {
    unitProfileBindingTimers.delete(timer);
    if (generation !== unitProfileBindingGeneration || unitProfileOverlay !== root || !root?.isConnected) return;
    callback();
  }, delay);
  unitProfileBindingTimers.add(timer);
}

function scheduleUnitProfileContentBindings(overlay, grid = null) {
  const generation = unitProfileBindingGeneration;
  if (isMobileTouchViewport()) {
    // None of the profile tooltip listeners contribute to the first visible frame.
    // Leave the tap -> modal paint path as small as possible on iOS, then attach
    // those secondary interactions after the browser has had a rendering
    // opportunity. The generation guard makes rapid open/nav/close cancellable.
    unitProfileBindingFrame = requestAnimationFrame(() => {
      unitProfileBindingFrame = requestAnimationFrame(() => {
        unitProfileBindingFrame = 0;
        if (generation !== unitProfileBindingGeneration || unitProfileOverlay !== overlay || !overlay.isConnected) return;
        const liveGrid = grid?.isConnected ? grid : overlay.querySelector(".unit-profile-grid");
        bindProfileTagTooltips(liveGrid);
        bindProfileMetaTooltips(liveGrid);
        bindProfileAltemaTooltips(liveGrid);
      });
    });
    // Mobile profiles deliberately show their full notes in the stacked scroll
    // surface and hide the overflow-reader affordance. Do not create observers or
    // layout reads for a control that cannot appear on this presentation.
    return;
  }
  unitProfileBindingFrame = requestAnimationFrame(() => {
    unitProfileBindingFrame = requestAnimationFrame(() => {
      unitProfileBindingFrame = 0;
      if (generation !== unitProfileBindingGeneration || unitProfileOverlay !== overlay || !overlay.isConnected) return;
      bindUnitProfileAdaptiveRows(overlay, generation);
      bindProfileNoteReaders(overlay, generation);
    });
  });
}

function updateUnitProfileContent(overlay, unitId, activeSegmentId = null) {
  const clicked = unitByIdIndex.get(unitId) || state.units.find(unit => unit.id === unitId);
  if (!overlay || !clicked || (!isMs(clicked) && !isPilot(clicked))) return null;

  closeUnitNoteReader(true);
  hideAppTooltip(true);
  resetUnitProfileContentBindings();

  const ms = isMs(clicked) ? clicked : pairedMsForPilot(clicked);
  const pilot = isPilot(clicked) ? clicked : pairedPilotForMs(clicked);
  const activeId = ms ? (activeSegmentId || ms.segments?.[0]?.id || null) : null;
  const { previous, next } = profileNavigationTargets(clicked, ms);
  overlay.dataset.currentMsId = ms?.id || clicked.id;
  overlay.dataset.previousMsId = previous?.id || "";
  overlay.dataset.nextMsId = next?.id || "";

  const prevButton = overlay.querySelector(".unit-profile-nav-prev");
  const nextButton = overlay.querySelector(".unit-profile-nav-next");
  if (prevButton) {
    prevButton.disabled = !previous;
    prevButton.setAttribute("aria-label", previous ? `Previous MS: ${previous.name}` : "No previous MS");
  }
  if (nextButton) {
    nextButton.disabled = !next;
    nextButton.setAttribute("aria-label", next ? `Next MS: ${next.name}` : "No next MS");
  }

  const card = overlay.querySelector(".unit-profile-card");
  overlay.setAttribute("aria-label", ms?.name || pilot?.name || "Unit profile");
  card?.setAttribute("aria-label", ms?.name || pilot?.name || "Unit profile");
  const grid = overlay.querySelector(".unit-profile-grid");
  if (!grid) return null;
  // Keep the profile shell retained, but rebuild only its inner content exactly as
  // desktop does. Mobile previously cached detached profile DOM trees; on WebKit
  // that trades a few milliseconds of HTML creation for retained image/layout
  // state and unpredictable memory/paint pressure after several rapid profiles.
  grid.className = unitProfileGridClass(ms);
  grid.innerHTML = unitProfileGridHtml(ms, pilot, activeId);
  bindUnitProfileImageFallbacks(grid);
  if (card) card.scrollTop = 0;

  if (isMobileTouchViewport()) {
    scheduleUnitProfileContentBindings(overlay, grid);
  } else {
    bindProfileTagTooltips(grid);
    bindProfileMetaTooltips(grid);
    bindProfileAltemaTooltips(grid);
    scheduleUnitProfileContentBindings(overlay);
  }
  setMetaOwnerProfile(ms?.id || null);

  return { clicked, ms, pilot };
}

function applyUnitProfileNavigationTarget(overlay, targetId, direction = 0) {
  if (!overlay || overlay !== unitProfileOverlay || !targetId) return null;
  const updated = updateUnitProfileContent(overlay, targetId);
  if (!updated) return null;
  if (isMobileTouchViewport() && lastInputModality === "touch") setMetaOwnerTouchSelection(updated.ms?.id || targetId);

  if (lastInputModality === "keyboard") {
    const currentButton = overlay.querySelector(direction < 0 ? ".unit-profile-nav-prev" : ".unit-profile-nav-next");
    if (currentButton?.disabled) overlay.querySelector(".unit-profile-close")?.focus({ preventScroll: true });
  }
  return updated;
}

function armDirectTouchClickSuppression(event, duration = 800) {
  pendingDirectTouchClickSuppression = {
    x: Number(event?.clientX) || 0,
    y: Number(event?.clientY) || 0,
    until: performance.now() + duration
  };
}

function bindDirectTouchRoadmapActivation(element, action) {
  if (!element || typeof action !== "function") return;
  let touchPress = null;

  element.addEventListener("pointerdown", event => {
    if (event.pointerType !== "touch" || event.isPrimary === false) return;
    touchPress = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    // On the restored WebKit-native roadmap path, leave the pointer completely
    // uncaptured so Safari can own one-finger scrolling and GestureEvent pinch
    // recognition even when the contact begins on a dense card/meta target.
    // Stationary taps still receive pointerup directly on the same element.
    if (!useWebKitNativeGestureInput) {
      try { element.setPointerCapture(event.pointerId); } catch {}
    }
  });
  element.addEventListener("pointermove", event => {
    if (!touchPress || event.pointerId !== touchPress.pointerId) return;
    if (Math.hypot(event.clientX - touchPress.x, event.clientY - touchPress.y) > 4) touchPress.moved = true;
  });
  element.addEventListener("pointercancel", event => {
    if (touchPress?.pointerId === event.pointerId) touchPress = null;
  });
  element.addEventListener("pointerup", event => {
    if (event.pointerType !== "touch" || touchPress?.pointerId !== event.pointerId) return;
    const shouldActivate = !touchPress.moved
      && touchPoints.size <= 1
      && !touchPanGesture?.moved
      && !pinchGesture;
    touchPress = null;
    if (!shouldActivate) return;

    // Use the physical end of the tap instead of waiting for Safari's synthesized
    // click. Keep the event bubbling so the chart-level touch state machine can
    // finish this same pointer normally, and swallow only the compatibility click
    // that may be retargeted to the newly opened modal.
    event.preventDefault();
    armDirectTouchClickSuppression(event);
    action(event);
  });
}

function bindDirectTouchActionButton(button, action) {
  if (!button || typeof action !== "function") return;
  let touchPress = null;
  let suppressClickUntil = 0;
  const clearTouchPress = pointerId => {
    if (pointerId != null && touchPress?.pointerId !== pointerId) return;
    touchPress = null;
    button.classList.remove("touch-pressed");
  };

  button.addEventListener("pointerdown", event => {
    if (event.pointerType !== "touch" || button.disabled) return;
    event.preventDefault();
    clearTouchPress();
    touchPress = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    button.classList.add("touch-pressed");
    try { button.setPointerCapture(event.pointerId); } catch {}
  });
  button.addEventListener("pointermove", event => {
    if (!touchPress || event.pointerId !== touchPress.pointerId) return;
    if (Math.hypot(event.clientX - touchPress.x, event.clientY - touchPress.y) > 10) {
      touchPress.moved = true;
      button.classList.remove("touch-pressed");
    }
  });
  button.addEventListener("pointercancel", event => {
    clearTouchPress(event.pointerId);
  });
  button.addEventListener("lostpointercapture", event => {
    clearTouchPress(event.pointerId);
  });
  button.addEventListener("pointerup", event => {
    if (event.pointerType !== "touch" || touchPress?.pointerId !== event.pointerId) return;
    const shouldActivate = !touchPress.moved && !button.disabled;
    clearTouchPress(event.pointerId);
    event.preventDefault();
    // pointerup is the direct end of the physical touch contact. Act here instead
    // of waiting for WebKit's synthesized click recognition. Keep suppression
    // local to the compatibility click from this exact contact; a blanket roadmap
    // dead-period would make a legitimate next tap feel lost.
    suppressClickUntil = performance.now() + 800;
    armDirectTouchClickSuppression(event);
    event.stopPropagation();
    if (shouldActivate) action(event);
  });
  button.addEventListener("click", event => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    action(event);
  });
}

function bindDirectTouchReleaseDismissButton(button, action) {
  if (!button || typeof action !== "function") return;
  let touchPress = null;
  let suppressClickUntil = 0;
  const clearTouchPress = pointerId => {
    if (pointerId != null && touchPress?.pointerId !== pointerId) return;
    touchPress = null;
    button.classList.remove("touch-pressed");
  };

  button.addEventListener("pointerdown", event => {
    if (event.pointerType !== "touch" || event.isPrimary === false || button.disabled) return;
    event.preventDefault();
    clearTouchPress();
    touchPress = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    button.classList.add("touch-pressed");

    // Direct-manipulation touch pointers may be implicitly captured to the pressed
    // element before pointerdown is dispatched. The profile X removes itself when
    // activated, so opt out of capture here: a release outside is then naturally
    // hit-tested away from the button, and a valid pointerup can remove the modal
    // without leaving WebKit to reconcile a detached capture target afterward.
    try { button.releasePointerCapture?.(event.pointerId); } catch {}
  });
  button.addEventListener("pointermove", event => {
    if (!touchPress || event.pointerId !== touchPress.pointerId) return;
    if (Math.hypot(event.clientX - touchPress.x, event.clientY - touchPress.y) > 10) {
      touchPress.moved = true;
      button.classList.remove("touch-pressed");
    }
  });
  button.addEventListener("pointerleave", event => {
    if (event.pointerType === "touch" && touchPress?.pointerId === event.pointerId) clearTouchPress(event.pointerId);
  });
  button.addEventListener("pointercancel", event => {
    clearTouchPress(event.pointerId);
  });
  button.addEventListener("lostpointercapture", event => {
    clearTouchPress(event.pointerId);
  });
  button.addEventListener("pointerup", event => {
    if (event.pointerType !== "touch" || touchPress?.pointerId !== event.pointerId) return;
    const shouldActivate = !touchPress.moved && !button.disabled;
    clearTouchPress(event.pointerId);
    event.preventDefault();
    suppressClickUntil = performance.now() + 800;
    armDirectTouchClickSuppression(event);
    event.stopPropagation();
    if (shouldActivate) action(event);
  });
  button.addEventListener("click", event => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    action(event);
  });
}

function navigateUnitProfile(direction) {
  if (!unitProfileOverlay) return;
  const overlay = unitProfileOverlay;
  const targetId = direction < 0 ? overlay.dataset.previousMsId : overlay.dataset.nextMsId;
  if (!targetId) return;
  applyUnitProfileNavigationTarget(overlay, targetId, direction);
}

function profilePanelHeaderHtml(unit, label, emptyMessage) {
  if (!unit) {
    return `<div class="unit-profile-empty">${profileArtHtml(null, label)}<div><span class="unit-profile-eyebrow">${escapeHtml(label)}</span><h2>${escapeHtml(emptyMessage)}</h2><p>This roadmap entry does not currently have a paired ${label.toLowerCase()} in the same release slot.</p></div></div>`;
  }
  return `<div class="unit-profile-hero">${profileArtHtml(unit, label)}<div class="unit-profile-identity"><span class="unit-profile-eyebrow">${escapeHtml(label)}</span><h2>${escapeHtml(unit.name)}</h2>${profileContextHtml(unit)}${profileTagsHtml(unit)}</div></div>`;
}

function openUnitProfile(unitId, activeSegmentId = null) {
  const clicked = unitByIdIndex.get(unitId) || state.units.find(unit => unit.id === unitId);
  if (!clicked || (!isMs(clicked) && !isPilot(clicked))) return;
  if (isMobileTouchViewport()) cancelDeferredTouchZoomPresentation();
  hideTooltip(true);
  hideAppTooltip(true);
  closeDrawer();
  closePullCalculator();
  closeUnitProfile(true);
  if (isMobileTouchViewport()) suspendMetaOwnerHighlightForTouchProfile();

  profileReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  profileReturnFocusByKeyboard = lastInputModality === "keyboard";

  const overlay = document.createElement("div");
  overlay.className = "unit-profile-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Unit profile");
  overlay.innerHTML = `
    <button class="unit-profile-nav unit-profile-nav-prev" type="button" aria-label="No previous MS" disabled><span aria-hidden="true">‹</span></button>
    <article class="unit-profile-card" aria-label="Unit profile">
      <button class="unit-profile-close" type="button" aria-label="Close profile">×</button>
      <div class="unit-profile-grid unit-profile-grid-lshape"></div>
    </article>
    <button class="unit-profile-nav unit-profile-nav-next" type="button" aria-label="No next MS" disabled><span aria-hidden="true">›</span></button>`;

  overlay.addEventListener("click", event => { if (event.target === overlay) closeUnitProfile(); });
  overlay.addEventListener("keydown", event => trapModalTabKey(overlay, event));
  bindDirectTouchReleaseDismissButton(overlay.querySelector(".unit-profile-close"), () => closeUnitProfile());
  bindDirectTouchActionButton(overlay.querySelector(".unit-profile-nav-prev"), () => navigateUnitProfile(-1));
  bindDirectTouchActionButton(overlay.querySelector(".unit-profile-nav-next"), () => navigateUnitProfile(1));

  document.body.appendChild(overlay);
  document.body.classList.add("unit-profile-open");
  unitProfileOverlay = overlay;
  updateUnitProfileContent(overlay, unitId, activeSegmentId);

  // Programmatic focus is useful for desktop/keyboard dialog semantics, but on a
  // touch-opened mobile profile it creates an extra focus/scroll cycle for no gain.
  if (!isMobileTouchViewport() || profileReturnFocusByKeyboard) {
    overlay.querySelector(".unit-profile-close")?.focus({ preventScroll: true });
  }
}

function closeUnitProfile(immediate = false) {
  closeUnitNoteReader(true);
  resetUnitProfileContentBindings();
  if (!unitProfileOverlay) return;
  const closingProfileOwnerId = metaOwnerProfileId;
  const overlay = unitProfileOverlay;
  if (overlay.classList.contains("closing") && !immediate) return;
  const returnFocus = profileReturnFocus;
  const shouldRestoreFocus = !isMobileTouchViewport() || profileReturnFocusByKeyboard;
  unitProfileOverlay = null;
  profileReturnFocus = null;
  profileReturnFocusByKeyboard = false;
  hideAppTooltip(true);

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    overlay.remove();
    if (!document.querySelector(".unit-profile-overlay")) document.body.classList.remove("unit-profile-open");
    if (shouldRestoreFocus && !unitProfileOverlay && !unitNoteReaderOverlay && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    else if (isMobileTouchViewport()) {
      setMetaOwnerHover(null);
      setMetaOwnerFocus(null);
    }
    // Keep the owner highlighted through the close animation and focus restoration,
    // then let the underlying hover/focus state take over without a one-frame flash.
    requestAnimationFrame(() => {
      if (!unitProfileOverlay && metaOwnerProfileId === closingProfileOwnerId) setMetaOwnerProfile(null);
      if (!unitProfileOverlay) maybeScheduleDeferredTouchZoomPresentation();
    });
  };

  if (immediate || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    finish();
    return;
  }
  if (isMobileTouchViewport()) {
    // Direct-touch controls already arm one-contact compatibility-click suppression
    // before invoking this close. Remove the modal in the physical pointerup handler
    // instead of waiting for a later animation frame: when WebKit is under rendering
    // pressure, that frame can arrive much later even though the close input itself
    // was delivered promptly. The capture-phase suppression still prevents the same
    // Safari compatibility click from activating the control exposed underneath.
    finish();
    return;
  }

  overlay.classList.add("closing");
  const onAnimationEnd = (event) => {
    if (event.target !== overlay) return;
    overlay.removeEventListener("animationend", onAnimationEnd);
    finish();
  };
  overlay.addEventListener("animationend", onAnimationEnd);
  setTimeout(finish, 260);
}

let unitTooltipWarmupScheduled = false;
function scheduleUnitTooltipWarmup() {
  // Touch users do not have a hover-preview path to warm. Avoid a speculative
  // forced layout during the first second of mobile use.
  if (isMobileTouchViewport() || unitTooltipWarmupScheduled) return;
  unitTooltipWarmupScheduled = true;
  const run = () => {
    unitTooltipWarmupScheduled = false;
    if (!tooltipEl || !tooltipEl.classList.contains("hidden") || document.hidden) return;
    const previousHtml = tooltipEl.innerHTML;
    const previousVisibility = tooltipEl.style.visibility;
    const previousLeft = tooltipEl.style.left;
    const previousTop = tooltipEl.style.top;
    tooltipEl.innerHTML = `<div class="tooltip-card-header"><h3 class="tooltip-card-title">Preview</h3><div class="tooltip-card-context"><span class="tooltip-tier-badge">Tier</span><span class="tooltip-release">W1</span></div><div class="tooltip-tags"><span class="tooltip-tag">PVP</span><span class="tooltip-tag buff">Buff</span></div></div><div class="tooltip-card-body"><section class="tooltip-card-section tooltip-meta-section"><div class="tooltip-section-title">PVP Meta</div><div class="tooltip-meta-list"><div class="tooltip-meta-row"><i class="tooltip-meta-dot"></i><span class="tooltip-meta-status">Strong</span><span class="tooltip-meta-range">W1–W4</span></div></div></section><section class="tooltip-card-section tooltip-notes-section"><div class="tooltip-section-title">Notes</div><div class="tooltip-note-body">Preview</div></section></div>`;
    tooltipEl.classList.add("unit-tooltip-card");
    tooltipEl.classList.remove("hidden");
    tooltipEl.style.visibility = "hidden";
    tooltipEl.style.left = "-10000px";
    tooltipEl.style.top = "0";
    tooltipEl.getBoundingClientRect();
    tooltipEl.classList.add("hidden");
    tooltipEl.style.visibility = previousVisibility;
    tooltipEl.style.left = previousLeft;
    tooltipEl.style.top = previousTop;
    tooltipEl.innerHTML = previousHtml;
  };
  if (typeof requestIdleCallback === "function") requestIdleCallback(run, { timeout: 900 });
  else setTimeout(run, 180);
}

function showTooltip(event, unit, activeSegment = null, options = {}) {
  const shouldPin = !!options.pin;
  if (tooltipPinned && !shouldPin) return;
  hideAppTooltip(true);
  const metaUnit = metaOwnerForUnit(unit);
  const activeId = metaUnit ? (activeSegment?.id || metaUnit.segments?.[0]?.id || null) : null;
  tooltipEl.innerHTML = tooltipHtml(unit, activeId);
  tooltipEl.classList.add("unit-tooltip-card");
  tooltipEl.classList.remove("hidden");
  tooltipPinned = shouldPin;
  tooltipAnchorEl = options.anchor instanceof Element ? options.anchor : (event?.currentTarget instanceof Element ? event.currentTarget : null);
  tooltipEl.classList.toggle("pinned", tooltipPinned);
  moveTooltip(event, true);
}

function moveTooltip(event, force = false) {
  if (!tooltipEl || tooltipEl.classList.contains("hidden") || (tooltipPinned && !force)) return;
  positionSmartTooltip(tooltipEl, event, tooltipAnchorEl, 360);
}

function hideTooltip(force = false) {
  if (tooltipPinned && !force) return;
  tooltipPinned = false;
  tooltipAnchorEl = null;
  tooltipEl?.classList.add("hidden");
  tooltipEl?.classList.remove("pinned");
}

function tooltipHtml(unit, activeSegmentId = null) {
  const pairedMs = isPilot(unit) ? pairedMsForPilot(unit) : null;
  const metaUnit = metaOwnerForUnit(unit);
  const title = pairedMs ? `${unit.name} (${pairedMs.name})` : unit.name;
  const tierColor = tierById(unit.tier).color || "#8d96a6";
  const tagHtml = unit.tags.length
    ? `<div class="tooltip-tags">${unit.tags.map(tag => `<span class="tooltip-tag ${tagClass(tag)}">${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";
  return `
    <div class="tooltip-card-header">
      <h3 class="tooltip-card-title">${escapeHtml(title)}</h3>
      <div class="tooltip-card-context">
        <span class="tooltip-tier-badge" style="--tooltip-tier-color:${escapeAttr(tierColor)}">${escapeHtml(unitRowLabel(unit))}</span>
        <span class="tooltip-release">${escapeHtml(formatWeek(unit.week))}</span>
      </div>
      ${tagHtml}
    </div>
    <div class="tooltip-card-body">
      ${tooltipInvestmentHtml(unit)}
      ${metaUnit ? tooltipMetaHtml(metaUnit, activeSegmentId, isPilot(unit)) : ""}
      ${tooltipNotesHtml(unit)}
    </div>
  `;
}

function tooltipSection(title, body, extraClass = "") {
  if (!body) return "";
  return `<section class="tooltip-card-section${extraClass ? ` ${extraClass}` : ""}"><div class="tooltip-section-title">${escapeHtml(title)}</div>${body}</section>`;
}

function investmentStatsHtml(unit, extraClass = "") {
  if (!isMs(unit)) return "";
  const minimum = normalizePotentialLevel(unit.minPotential);
  const ideal = normalizePotentialLevel(unit.idealPotential);
  if (minimum == null && ideal == null) return "";
  const stats = [];
  if (minimum != null) stats.push(`<div class="tooltip-investment-stat"><span class="tooltip-investment-label">Minimum</span><strong class="tooltip-investment-value">P${minimum}</strong></div>`);
  if (ideal != null) stats.push(`<div class="tooltip-investment-stat"><span class="tooltip-investment-label">Ideal</span><strong class="tooltip-investment-value">P${ideal}</strong></div>`);
  return `<div class="tooltip-investment-grid${extraClass ? ` ${extraClass}` : ""}">${stats.join("")}</div>`;
}
function tooltipInvestmentHtml(unit) {
  if (!isMs(unit)) return "";
  const minimum = normalizePotentialLevel(unit.minPotential);
  const ideal = normalizePotentialLevel(unit.idealPotential);
  if (minimum == null && ideal == null) return "";
  const stats = [];
  if (minimum != null) stats.push(`<div class="tooltip-investment-stat"><span class="tooltip-investment-label">Minimum</span><strong class="tooltip-investment-value">P${minimum}</strong></div>`);
  if (ideal != null) stats.push(`<div class="tooltip-investment-stat"><span class="tooltip-investment-label">Ideal</span><strong class="tooltip-investment-value">P${ideal}</strong></div>`);
  return tooltipSection("Investment", `<div class="tooltip-investment-summary">${stats.join("")}</div>`, "tooltip-investment");
}
function investmentDetailHtml(unit) {
  const stats = investmentStatsHtml(unit, "drawer-investment-grid");
  return stats ? `<section class="drawer-section"><h3>Investment</h3>${stats}</section>` : "";
}

function multilineHtml(text) {
  return escapeHtml(String(text || "").trim()).replace(/\r?\n/g, "<br>");
}

function tooltipNotesHtml(unit) {
  if (isPilot(unit)) {
    const notes = [unit.notesPvp, unit.notesPve].filter(Boolean).join("\n\n");
    return notes ? tooltipSection("Notes", `<div class="tooltip-note-body">${multilineHtml(notes)}</div>`, "tooltip-notes-section") : "";
  }
  const blocks = [];
  if (unit.notesPvp) blocks.push(`<div class="tooltip-note-block"><span class="tooltip-note-mode">PVP</span><div class="tooltip-note-body">${multilineHtml(unit.notesPvp)}</div></div>`);
  if (unit.notesPve) blocks.push(`<div class="tooltip-note-block"><span class="tooltip-note-mode">PVE</span><div class="tooltip-note-body">${multilineHtml(unit.notesPve)}</div></div>`);
  return blocks.length ? tooltipSection("Notes", `<div class="tooltip-note-list">${blocks.join("")}</div>`, "tooltip-notes-section") : "";
}

function tooltipMetaHtml(unit, activeSegmentId = null, inheritedFromMs = false) {
  const segments = (unit.segments || []).slice().sort((a, b) => a.start - b.start || a.end - b.end);
  if (!segments.length) return "";
  const rows = segments.map(seg => {
    const status = metaStatus(seg.statusId);
    const active = activeSegmentId === seg.id ? " active" : "";
    return `<div class="tooltip-meta-row${active}"><i class="tooltip-meta-dot" style="background:${escapeAttr(status.color)}"></i><span class="tooltip-meta-status">${escapeHtml(status.label)}</span><span class="tooltip-meta-range">${escapeHtml(formatWeekRange(seg.start, seg.end))}</span></div>`;
  }).join("");
  return tooltipSection(inheritedFromMs ? "MS PVP Meta" : "PVP Meta", `<div class="tooltip-meta-list">${rows}</div>`, "tooltip-meta-section");
}

function segmentListHtml(unit, activeSegmentId = null) {
  return (unit.segments || []).slice().sort((a, b) => a.start - b.start || a.end - b.end).map(seg => {
    const status = metaStatus(seg.statusId);
    const active = activeSegmentId === seg.id ? " active" : "";
    return `<div class="segment-chip${active}"><i class="segment-dot" style="background:${escapeAttr(status.color)}"></i><span>${escapeHtml(formatWeekRange(seg.start, seg.end))} · ${escapeHtml(status.label)}</span></div>`;
  }).join("") || `<div class="segment-chip"><i class="segment-dot"></i><span>No meta segments</span></div>`;
}

function addDiv(className, style = {}) {
  const el = document.createElement("div");
  el.className = className;
  Object.assign(el.style, style);
  els.roadmap.appendChild(el);
  return el;
}

function addMobileVectorGrid(width, height, monthBoundaries) {
  const svgNs = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNs, "svg");
  svg.classList.add("grid-vector-layer");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const minorSegments = [];
  const monthSegments = [];
  for (let w = 0; w <= weekCount(); w++) {
    const x = weekBoundaryX(w);
    const target = monthBoundaries.has(w) ? monthSegments : minorSegments;
    target.push(`M ${x} ${monthBoundaries.has(w) ? 0 : HEADER_H} V ${height}`);
  }
  getTiers().forEach(tier => {
    const y = tierY(tier.id);
    minorSegments.push(`M 0 ${y} H ${width}`);
  });
  minorSegments.push(`M 0 ${height} H ${width}`);

  const addPath = (className, segments) => {
    if (!segments.length) return;
    const path = document.createElementNS(svgNs, "path");
    path.setAttribute("class", className);
    path.setAttribute("d", segments.join(" "));
    path.setAttribute("vector-effect", "non-scaling-stroke");
    svg.appendChild(path);
  };
  // Two batched paths replace the many mobile grid DOM nodes. Their stroke stays
  // in screen space during Safari pinch transforms, so the gesture loop performs
  // zero grid-width writes while preserving the desktop minor/month hierarchy.
  addPath("grid-vector-line minor", minorSegments);
  addPath("grid-vector-line month", monthSegments);
  els.roadmap.appendChild(svg);
}

function isMobileTouchViewport() {
  return Boolean(window.matchMedia?.("(pointer: coarse)")?.matches);
}
function useMobileTransformCamera() {
  // The persistent whole-stage transform camera is intentionally disabled. Real
  // iPhone Safari testing showed severe pan/pinch freezes when this path stayed
  // active between gestures. Keep the dormant implementation available for
  // isolated investigation without changing the proven scroll-backed mobile path.
  return false;
}
function minimumZoom() {
  return isMobileTouchViewport() ? MOBILE_MIN_ZOOM : MIN_ZOOM;
}
function mobileCameraBounds(scale = zoomScale) {
  const viewportWidth = Math.max(0, els.chartScroll?.clientWidth || 0);
  const viewportHeight = Math.max(0, els.chartScroll?.clientHeight || 0);
  const contentWidth = baseChartWidth() * scale;
  const contentHeight = baseChartHeight() * scale;
  return {
    minX: Math.min(0, viewportWidth - contentWidth),
    maxX: 0,
    minY: Math.min(0, viewportHeight - contentHeight),
    maxY: 0
  };
}
function clampMobileCamera(x = mobileCameraX, y = mobileCameraY, scale = zoomScale) {
  const bounds = mobileCameraBounds(scale);
  return {
    x: clamp(Number(x) || 0, bounds.minX, bounds.maxX),
    y: clamp(Number(y) || 0, bounds.minY, bounds.maxY)
  };
}
function applyMobileCameraTransform(x = mobileCameraX, y = mobileCameraY, scale = zoomScale) {
  if (!els.chartStage) return;
  const camera = clampMobileCamera(x, y, scale);
  mobileCameraX = camera.x;
  mobileCameraY = camera.y;
  els.chartStage.style.transform = `translate3d(${mobileCameraX}px, ${mobileCameraY}px, 0) scale(${scale})`;
}

function setZoom(value) {
  zoomScale = clamp(Math.round(Number(value || 1) * 100) / 100, minimumZoom(), MAX_ZOOM);
  applyZoom();
}

function setZoomAtClientPoint(value, clientX, clientY) {
  const oldZoom = zoomScale;
  const nextZoom = clamp(Math.round(Number(value || 1) * 100) / 100, minimumZoom(), MAX_ZOOM);
  if (Math.abs(nextZoom - oldZoom) < 0.0001) return;
  const rect = els.chartScroll.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  if (useMobileTransformCamera()) {
    const contentX = (localX - mobileCameraX) / oldZoom;
    const contentY = (localY - mobileCameraY) / oldZoom;
    zoomScale = nextZoom;
    const camera = clampMobileCamera(localX - contentX * nextZoom, localY - contentY * nextZoom, nextZoom);
    mobileCameraX = camera.x;
    mobileCameraY = camera.y;
    applyZoom();
    return;
  }
  const contentX = (els.chartScroll.scrollLeft + localX) / oldZoom;
  const contentY = (els.chartScroll.scrollTop + localY) / oldZoom;
  setZoom(nextZoom);
  els.chartScroll.scrollLeft = contentX * zoomScale - localX;
  els.chartScroll.scrollTop = contentY * zoomScale - localY;
}

function handleWheelZoom(event) {
  cancelInitialFitToWidth();
  if (!event.deltaY) return;
  event.preventDefault();
  event.stopPropagation();
  const delta = clamp(event.deltaY, -200, 200);
  const factor = Math.exp(-delta * 0.0005);
  setZoomAtClientPoint(zoomScale * factor, event.clientX, event.clientY);
}

function applyZoomGeometry() {
  const width = baseChartWidth();
  const height = baseChartHeight();
  mobileStageShrinkPending = false;
  if (useMobileTransformCamera()) {
    // Mobile owns navigation as a single transform camera. Do not bounce between
    // CSS transforms and hidden scroll offsets at gesture boundaries. Keeping the
    // camera in one coordinate system avoids scroll-tree/compositor handoffs on iOS.
    els.roadmap.style.transform = "";
    els.chartStage.style.width = `${width}px`;
    els.chartStage.style.height = `${height}px`;
    if (els.chartScroll.scrollLeft) els.chartScroll.scrollLeft = 0;
    if (els.chartScroll.scrollTop) els.chartScroll.scrollTop = 0;
    applyMobileCameraTransform(mobileCameraX, mobileCameraY, zoomScale);
  } else {
    els.chartStage.style.transform = "";
    els.roadmap.style.transform = `scale(${zoomScale})`;
    els.chartStage.style.width = `${width * zoomScale}px`;
    els.chartStage.style.height = `${height * zoomScale}px`;
  }
  mobileStageGeometryScale = zoomScale;
  if (els.zoomLabel) els.zoomLabel.textContent = `${Math.round(zoomScale * 100)}%`;
}
function applyZoomStructuralVariables() {
  if (isMobileTouchViewport()) return;
  const gridLinePx = clamp(1 / zoomScale, 1, 1 / minimumZoom());
  els.roadmap.style.setProperty("--gridLine", `${gridLinePx.toFixed(2)}px`);
  els.roadmap.style.setProperty("--monthGridLine", `${(gridLinePx * 2).toFixed(2)}px`);
}
function cancelMobileZoomStyleWork({ markDirty = false } = {}) {
  const hadPending = Boolean(mobileZoomStyleJob || mobileZoomStyleFrame || mobileZoomStyleTimer);
  mobileZoomStyleGeneration += 1;
  if (mobileZoomStyleTimer) {
    clearTimeout(mobileZoomStyleTimer);
    mobileZoomStyleTimer = 0;
  }
  if (mobileZoomStyleFrame) {
    cancelAnimationFrame(mobileZoomStyleFrame);
    mobileZoomStyleFrame = 0;
  }
  mobileZoomStyleJob = null;
  if (markDirty && hadPending) touchZoomSemanticDirty = true;
}
function scheduleMobileZoomStyleSlice() {
  if (!mobileZoomStyleJob || mobileZoomStyleTimer || mobileZoomStyleFrame) return;
  const generation = mobileZoomStyleGeneration;
  // Do not occupy every animation frame with cosmetic/semantic catch-up. A small
  // task gap gives WebKit a reliable opportunity to dispatch the next physical
  // touch, which then cancels this work in capture phase.
  mobileZoomStyleTimer = setTimeout(() => {
    mobileZoomStyleTimer = 0;
    if (!mobileZoomStyleJob || generation !== mobileZoomStyleGeneration) return;
    mobileZoomStyleFrame = requestAnimationFrame(processMobileZoomStyleFrame);
  }, 24);
}
function mobileTextBoostTargets() {
  return mobileTextBoostTargetsCache;
}

function mobileSemanticViewportRect(scale = zoomScale) {
  const safeScale = Math.max(0.001, Number(scale) || 1);
  // Avoid reading chart layout during post-gesture work. The window/visual
  // viewport is a safe over-estimate of the chart viewport, so this can include
  // a few extra targets without forcing a layout flush.
  const viewportWidth = Math.max(1, Number(window.visualViewport?.width) || Number(window.innerWidth) || 1);
  const viewportHeight = Math.max(1, Number(window.visualViewport?.height) || Number(window.innerHeight) || 1);
  const marginScreenPx = 48;
  if (useMobileTransformCamera()) {
    // Camera transform: screen = camera + base * scale. Convert the visual
    // viewport (plus prefetch margin) back into immutable roadmap coordinates.
    return {
      left: Math.max(0, (-mobileCameraX - marginScreenPx) / safeScale),
      right: (-mobileCameraX + viewportWidth + marginScreenPx) / safeScale,
      top: Math.max(0, (-mobileCameraY - marginScreenPx) / safeScale),
      bottom: (-mobileCameraY + viewportHeight + marginScreenPx) / safeScale
    };
  }
  const scrollLeft = Math.max(0, Number(els.chartScroll?.scrollLeft) || 0);
  const scrollTop = Math.max(0, Number(els.chartScroll?.scrollTop) || 0);
  return {
    left: Math.max(0, (scrollLeft - marginScreenPx) / safeScale),
    right: (scrollLeft + viewportWidth + marginScreenPx) / safeScale,
    top: Math.max(0, (scrollTop - marginScreenPx) / safeScale),
    bottom: (scrollTop + viewportHeight + marginScreenPx) / safeScale
  };
}
function mobileSemanticRectIntersects(rect, viewport) {
  return Boolean(rect && viewport
    && rect.right >= viewport.left
    && rect.left <= viewport.right
    && rect.bottom >= viewport.top
    && rect.top <= viewport.bottom);
}
function mobileSemanticElementRect(element) {
  if (!element) return null;
  const style = element.style;
  const number = value => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  let left = number(style.left);
  let top = number(style.top);
  let width = number(style.width);
  let height = number(style.height);

  if (element.classList.contains("month-head")) {
    top = 0;
    height = MONTH_H;
    if (!width && element.classList.contains("corner")) width = LEFT_W;
  } else if (element.classList.contains("week-head")) {
    top = MONTH_H;
    height = WEEK_H;
    if (!width) width = CELL_W;
  } else if (element.classList.contains("tier-label")) {
    left = 0;
    width = LEFT_W;
    if (!height) height = tierHeight(element.dataset.tierId);
  } else if (element.classList.contains("lane-track")) {
    left = LEFT_W + 10;
    height = BAR_H;
    if (!width) width = Math.max(4, baseChartWidth() - LEFT_W - 20);
  } else if (element.classList.contains("meta-bar") || element.classList.contains("meta-link")) {
    height = BAR_H;
  } else if (element.classList.contains("meta-owner-node")) {
    return { left: left - 16, right: left + 16, top: top - 16, bottom: top + 16 };
  } else if (element.classList.contains("meta-owner-tether")) {
    if (element.classList.contains("stem")) {
      return { left: left - 12, right: left + 12, top, bottom: top + Math.max(1, height) };
    }
    return { left, right: left + Math.max(1, width), top: top - 12, bottom: top + 12 };
  }

  return {
    left,
    right: left + Math.max(1, width),
    top,
    bottom: top + Math.max(1, height)
  };
}
function mobileSemanticElementVisible(element, viewport) {
  return mobileSemanticRectIntersects(mobileSemanticElementRect(element), viewport);
}
function scheduleMobileViewportSemanticCatchup() {
  if (!isMobileTouchViewport() || touchInteractionIsActive() || touchZoomSemanticPresentationBlocked()) return;
  if (mobileViewportSemanticFrame) cancelAnimationFrame(mobileViewportSemanticFrame);
  mobileViewportSemanticFrame = requestAnimationFrame(() => {
    mobileViewportSemanticFrame = 0;
    if (touchInteractionIsActive() || touchZoomSemanticPresentationBlocked() || touchZoomSemanticDirty) return;
    scheduleMobileZoomStyleWork(zoomScale);
  });
}

function processMobileZoomStyleFrame() {
  mobileZoomStyleFrame = 0;
  const job = mobileZoomStyleJob;
  if (!job || job.generation !== mobileZoomStyleGeneration) return;
  if (touchInteractionIsActive() || touchZoomSemanticPresentationBlocked()) {
    mobileZoomStyleJob = null;
    touchZoomSemanticDirty = true;
    return;
  }

  // Every entry in this job is known to need an actual DOM change. Planning is
  // read-only (inline style/class/text state only), so unchanged zoom states do not
  // create a multi-second chain of empty animation frames.
  if (job.verticalIndex < job.verticalLines.length || job.horizontalIndex < job.horizontalLines.length) {
    let structuralRemaining = 12;
    while (structuralRemaining > 0 && job.verticalIndex < job.verticalLines.length) {
      const line = job.verticalLines[job.verticalIndex++];
      const width = line.classList.contains("month") ? job.monthGridLine : job.gridLine;
      if (line?.isConnected) line.style.width = width;
      structuralRemaining -= 1;
    }
    while (structuralRemaining > 0 && job.horizontalIndex < job.horizontalLines.length) {
      const line = job.horizontalLines[job.horizontalIndex++];
      if (line?.isConnected) line.style.height = job.gridLine;
      structuralRemaining -= 1;
    }
    if (job.verticalIndex < job.verticalLines.length || job.horizontalIndex < job.horizontalLines.length) {
      scheduleMobileZoomStyleSlice();
      return;
    }
  }

  if (job.cardIndex < job.cardEntries.length) {
    const cardLimit = Math.min(job.cardEntries.length, job.cardIndex + 6);
    while (job.cardIndex < cardLimit) {
      const entry = job.cardEntries[job.cardIndex++];
      const { card, detail, updateBoost } = entry;
      if (!card?.isConnected) continue;
      if (updateBoost) card.style.setProperty("--textBoost", job.textBoost);
      card.classList.toggle("icon-only", Boolean(detail.iconOnly));
      card.classList.toggle("tags-only", Boolean(detail.tagsOnly));
    }
    if (job.cardIndex < job.cardEntries.length) {
      scheduleMobileZoomStyleSlice();
      return;
    }
  }

  if (job.metaIndex < job.metaEntries.length) {
    const metaLimit = Math.min(job.metaEntries.length, job.metaIndex + 6);
    while (job.metaIndex < metaLimit) {
      const work = job.metaEntries[job.metaIndex++];
      const label = work.entry?.label;
      if (!label?.isConnected) continue;
      if (work.updateBoost) label.style.setProperty("--barTextBoost", job.barBoost);
      if (work.updateText) label.textContent = work.presentation.desiredText;
      if (work.updateHidden) label.hidden = work.presentation.shouldHide;
    }
    if (job.metaIndex < job.metaEntries.length) {
      scheduleMobileZoomStyleSlice();
      return;
    }
  }

  let remaining = 12;
  while (remaining > 0 && job.textIndex < job.textTargets.length) {
    const element = job.textTargets[job.textIndex++];
    if (element?.isConnected) element.style.setProperty("--textBoost", job.textBoost);
    remaining -= 1;
  }

  if (
    job.verticalIndex < job.verticalLines.length
    || job.horizontalIndex < job.horizontalLines.length
    || job.cardIndex < job.cardEntries.length
    || job.metaIndex < job.metaEntries.length
    || job.textIndex < job.textTargets.length
  ) {
    scheduleMobileZoomStyleSlice();
    return;
  }
  mobileZoomStyleJob = null;
}
function scheduleMobileZoomStyleWork(scale = zoomScale) {
  if (!isMobileTouchViewport() || !els.roadmap) return;
  cancelMobileZoomStyleWork();
  const generation = mobileZoomStyleGeneration;
  const gridLinePx = clamp(1 / scale, 1, 1 / minimumZoom());
  const gridLine = `${gridLinePx.toFixed(2)}px`;
  const monthGridLine = `${(gridLinePx * 2).toFixed(2)}px`;
  const textBoost = legibleTextScale(scale).toFixed(3);
  const barBoost = barLabelTextScale(scale).toFixed(3);
  const viewport = mobileSemanticViewportRect(scale);

  const verticalLines = mobileGridVerticalCache.filter(line => {
    if (!line?.isConnected) return false;
    const x = Number.parseFloat(line.style.left) || 0;
    if (x < viewport.left || x > viewport.right) return false;
    const desired = line.classList.contains("month") ? monthGridLine : gridLine;
    return line.style.width !== desired;
  });
  const horizontalLines = mobileGridHorizontalCache.filter(line => {
    if (!line?.isConnected) return false;
    const y = Number.parseFloat(line.style.top) || 0;
    return y >= viewport.top && y <= viewport.bottom && line.style.height !== gridLine;
  });

  const cardEntries = [];
  for (const unit of state.units || []) {
    const card = liveUnitCardForId(unit.id);
    if (!card?.isConnected || !mobileSemanticRectIntersects(iconRect(unit), viewport)) continue;
    const detail = mobileUnitCardDetailState(unit, scale);
    const updateBoost = card.style.getPropertyValue("--textBoost") !== textBoost;
    const updateIconOnly = card.classList.contains("icon-only") !== Boolean(detail.iconOnly);
    const updateTagsOnly = card.classList.contains("tags-only") !== Boolean(detail.tagsOnly);
    if (updateBoost || updateIconOnly || updateTagsOnly) cardEntries.push({ card, detail, updateBoost });
  }

  const metaEntries = [];
  for (const entry of mobileMetaLabelEntriesCache) {
    const label = entry?.label;
    if (!label?.isConnected || !mobileSemanticElementVisible(entry.bar, viewport)) continue;
    const presentation = mobileMetaLabelPresentation(entry, scale);
    if (!presentation) continue;
    const updateBoost = label.style.getPropertyValue("--barTextBoost") !== barBoost;
    const updateText = label.textContent !== presentation.desiredText;
    const updateHidden = label.hidden !== presentation.shouldHide;
    if (updateBoost || updateText || updateHidden) {
      metaEntries.push({ entry, presentation, updateBoost, updateText, updateHidden });
    }
  }

  const textTargets = mobileTextBoostTargets().filter(element =>
    element?.isConnected
    && mobileSemanticElementVisible(element, viewport)
    && element.style.getPropertyValue("--textBoost") !== textBoost
  );

  mobileZoomStyleJob = {
    generation,
    scale,
    gridLine,
    monthGridLine,
    verticalLines,
    verticalIndex: 0,
    horizontalLines,
    horizontalIndex: 0,
    textBoost,
    barBoost,
    cardEntries,
    cardIndex: 0,
    metaEntries,
    metaIndex: 0,
    textTargets,
    textIndex: 0
  };
  if (
    !verticalLines.length
    && !horizontalLines.length
    && !cardEntries.length
    && !metaEntries.length
    && !textTargets.length
  ) {
    mobileZoomStyleJob = null;
    return;
  }
  scheduleMobileZoomStyleSlice();
}
function applyZoomSemanticVariables() {
  if (isMobileTouchViewport()) {
    // Mobile structural grid is static vector paint. Semantic/card work remains
    // local and cancellable; no grid writes are needed during or after a pinch.
    return;
  }
  els.roadmap.style.setProperty("--textBoost", legibleTextScale().toFixed(3));
  els.roadmap.style.setProperty("--barTextBoost", barLabelTextScale().toFixed(3));
  applyZoomStructuralVariables();
}
function applyZoomSemanticPresentation() {
  applyZoomSemanticVariables();
  if (isMobileTouchViewport()) {
    updateAdaptiveTierLabels();
    scheduleMobileZoomStyleWork();
  } else {
    updateAdaptiveRoadmapPresentation();
  }
  touchZoomSemanticDirty = false;
}
function cancelDeferredTouchZoomPresentation() {
  touchZoomSemanticGeneration += 1;
  cancelMobileZoomStyleWork({ markDirty: true });
  if (touchZoomSemanticTimer) {
    clearTimeout(touchZoomSemanticTimer);
    touchZoomSemanticTimer = 0;
  }
  if (touchZoomSemanticFrame) {
    cancelAnimationFrame(touchZoomSemanticFrame);
    touchZoomSemanticFrame = 0;
  }
  if (mobileViewportSemanticFrame) {
    cancelAnimationFrame(mobileViewportSemanticFrame);
    mobileViewportSemanticFrame = 0;
  }
}

function touchInteractionIsActive() {
  return touchPoints.size > 0
    || Boolean(touchPanGesture || pinchGesture || webKitPinchGesture)
    || Boolean(webKitPinchBurstSettleTimer || webKitPinchBurstSettleFrame)
    || Boolean(els.chartScroll?.classList.contains("touch-active"));
}
function touchZoomSemanticPresentationBlocked() {
  return Boolean(unitProfileOverlay || unitNoteReaderOverlay || !els.pullCalculator?.classList.contains("hidden") || customUnitFilterEditing);
}
function maybeScheduleDeferredTouchZoomPresentation() {
  if (!touchZoomSemanticDirty || touchInteractionIsActive() || touchZoomSemanticPresentationBlocked()) return;
  cancelDeferredTouchZoomPresentation();
  const generation = touchZoomSemanticGeneration;
  touchZoomSemanticTimer = setTimeout(() => {
    touchZoomSemanticTimer = 0;
    if (generation !== touchZoomSemanticGeneration || touchInteractionIsActive() || touchZoomSemanticPresentationBlocked()) return;

    // Nothing in the post-gesture semantic pass may synchronously measure or
    // invalidate the giant roadmap. Tier/meta decisions are pure math and zoom-
    // dependent style is written to small local scopes across cancellable frames.
    applyZoomSemanticVariables();
    updateAdaptiveTierLabels();
    scheduleMobileZoomStyleWork();
    touchZoomSemanticDirty = false;
  }, TOUCH_ZOOM_SEMANTIC_SETTLE_MS);
}
function markTouchZoomSemanticDirty() {
  touchZoomSemanticDirty = true;
  maybeScheduleDeferredTouchZoomPresentation();
}
function applyZoom() {
  cancelDeferredTouchZoomPresentation();
  if (useWebKitNativeGestureInput) {
    webKitPinchBurstContinuation = false;
    cancelWebKitPinchBurstSettle({ releaseLayer: true });
  }
  touchZoomSemanticDirty = false;
  applyZoomGeometry();
  applyZoomSemanticPresentation();
}

function fitToWidth() {
  const available = Math.max(240, els.chartScroll.clientWidth - 20);
  const scale = available / baseChartWidth();
  // On touch/mobile, round fit-to-width downward so the full timeline actually
  // fits instead of a nearest-percent round-up pushing the far edge offscreen.
  const fittedScale = isMobileTouchViewport() ? Math.floor(scale * 100) / 100 : scale;
  setZoom(clamp(fittedScale, minimumZoom(), 1.2));
}

function baseChartWidth() { return weekBoundaryX(weekCount()); }
function baseChartHeight() {
  if (layoutGeometryCache.baseChartHeight != null) return layoutGeometryCache.baseChartHeight;
  layoutGeometryCache.baseChartHeight = HEADER_H + getTiers().reduce((sum, t) => sum + tierHeight(t.id), 0);
  return layoutGeometryCache.baseChartHeight;
}
function normalizeMonthWeekCount(value) { return Number(value) === 5 ? 5 : 4; }
function getMonthWeeks() {
  const months = Array.isArray(state.months) && state.months.length ? state.months : DEFAULT_MONTHS;
  const raw = Array.isArray(state.monthWeeks) ? state.monthWeeks : [];
  return months.map((_, i) => normalizeMonthWeekCount(raw[i]));
}
function weekCount() { return Math.max(1, getMonthWeeks().reduce((sum, weeks) => sum + weeks, 0)); }
function monthStartWeek(index) { return 1 + getMonthWeeks().slice(0, index).reduce((sum, weeks) => sum + weeks, 0); }
function weekToMonthWeek(week) {
  const total = weekCount();
  const normalized = clamp(Math.round(Number(week) || 1), 1, total);
  const counts = getMonthWeeks();
  let start = 1;
  for (let i = 0; i < counts.length; i++) {
    const end = start + counts[i] - 1;
    if (normalized <= end) return { monthIndex: i, weekInMonth: normalized - start + 1, monthStart: start, monthEnd: end };
    start = end + 1;
  }
  const last = Math.max(0, counts.length - 1);
  return { monthIndex: last, weekInMonth: counts[last] || 1, monthStart: Math.max(1, total - (counts[last] || 1) + 1), monthEnd: total };
}
function getTiers() { return state.tiers?.length ? state.tiers : DEFAULT_TIERS; }
function getStatuses() { return state.metaStatuses?.length ? state.metaStatuses : DEFAULT_META_STATUSES; }
function tierById(id) { return getTiers().find(t => t.id === id) || getTiers()[0] || DEFAULT_TIERS[0]; }
function tierIndex(id) { return Math.max(0, getTiers().findIndex(t => t.id === id)); }
function metaStatus(id) { return getStatuses().find(s => s.id === id) || getStatuses()[2] || DEFAULT_META_STATUSES[2]; }
function defaultMetaStatusId() { return getStatuses()[2]?.id || getStatuses()[0]?.id || "s3"; }
function segmentColor(segment) { return metaStatus(segment.statusId).color; }
function applyMetaOwnerColor(element, segment) {
  if (!element || !segment) return;
  const color = segmentColor(segment);
  const rgb = parseHexColor(color) || [132, 224, 252];
  element.style.setProperty("--meta-owner-color", color);
  element.style.setProperty("--meta-owner-rgb", rgb.join(", "));
}
function wideWeekSet() {
  if (layoutGeometryCache.wideWeeks) return layoutGeometryCache.wideWeeks;
  const slots = new Map();
  const wideWeeks = new Set();
  for (const unit of state.units || []) {
    if (!normalizeRowOffset(unit.rowOffset)) continue;
    const rowKey = rowSlotKey(unit);
    if (!rowKey.startsWith("between:")) continue;
    const week = normalizeWeek(unit.week);
    const key = `${week}|${rowKey}`;
    const flags = slots.get(key) || 0;
    const next = flags | (isMs(unit) ? 1 : 0) | (isPilot(unit) ? 2 : 0);
    slots.set(key, next);
    if (next === 3) wideWeeks.add(week);
  }
  layoutGeometryCache.wideWeeks = wideWeeks;
  return wideWeeks;
}
function weekNeedsWideColumn(week) { return wideWeekSet().has(normalizeWeek(week)); }
function weekWidth(week) { return weekNeedsWideColumn(week) ? WIDE_CELL_W : CELL_W; }
function ensureWeekBoundaryXs() {
  if (layoutGeometryCache.weekBoundaryXs) return layoutGeometryCache.weekBoundaryXs;
  const total = weekCount();
  const boundaries = new Array(total + 1);
  boundaries[0] = LEFT_W;
  for (let week = 1; week <= total; week++) boundaries[week] = boundaries[week - 1] + weekWidth(week);
  layoutGeometryCache.weekBoundaryXs = boundaries;
  return boundaries;
}
function weekBoundaryX(completedWeeks) {
  const count = clamp(Math.round(Number(completedWeeks) || 0), 0, weekCount());
  return ensureWeekBoundaryXs()[count];
}
function weekSpanWidth(start, end) {
  const first = Math.min(normalizeWeek(start), normalizeWeek(end));
  const last = Math.max(normalizeWeek(start), normalizeWeek(end));
  const boundaries = ensureWeekBoundaryXs();
  return boundaries[last] - boundaries[first - 1];
}
function monthPixelWidth(index) {
  const counts = getMonthWeeks();
  const start = monthStartWeek(index);
  let width = 0;
  for (let offset = 0; offset < (counts[index] || 0); offset++) width += weekWidth(start + offset);
  return width;
}
function sortedVisibleSegments(unit) {
  return (unit?.segments || []).filter(Boolean).slice().sort((a, b) => normalizeWeek(a.start) - normalizeWeek(b.start) || normalizeWeek(a.end) - normalizeWeek(b.end));
}
function hasVisibleMetaSegments(unit) { return hasMetaBars(unit) && Array.isArray(unit?.segments) && unit.segments.length > 0; }
function segmentHorizontalRect(segment) {
  const start = Math.min(normalizeWeek(segment?.start), normalizeWeek(segment?.end));
  const end = Math.max(normalizeWeek(segment?.start), normalizeWeek(segment?.end));
  const key = `${start}|${end}`;
  const cached = layoutGeometryCache.segmentHorizontalRects.get(key);
  if (cached) return cached;
  const rect = { x: weekX(start) + META_BAR_EDGE_INSET, w: Math.max(4, weekSpanWidth(start, end) - META_BAR_EDGE_INSET * 2) };
  layoutGeometryCache.segmentHorizontalRects.set(key, rect);
  return rect;
}
function segmentBarRect(unit, segment) {
  const key = `${unit?.id || ""}|${segment?.id || `${segment?.start}|${segment?.end}`}`;
  const cached = layoutGeometryCache.segmentBarRects.get(key);
  if (cached) return cached;
  const span = segmentHorizontalRect(segment);
  const rect = { x: span.x, y: laneY(unit), w: span.w, h: BAR_H };
  layoutGeometryCache.segmentBarRects.set(key, rect);
  return rect;
}
function metaSegmentsTouch(previousSegment, nextSegment) {
  if (!previousSegment || !nextSegment) return false;
  const previousEnd = Math.max(normalizeWeek(previousSegment.start), normalizeWeek(previousSegment.end));
  const nextStart = Math.min(normalizeWeek(nextSegment.start), normalizeWeek(nextSegment.end));
  return nextStart <= previousEnd + 1;
}
function metaSegmentLinks(unit) {
  const segments = sortedVisibleSegments(unit);
  const links = [];
  for (let i = 1; i < segments.length; i++) {
    if (!metaSegmentsTouch(segments[i - 1], segments[i])) continue;
    const previous = segmentBarRect(unit, segments[i - 1]);
    const next = segmentBarRect(unit, segments[i]);
    const x = previous.x + previous.w - META_LINK_OVERLAP;
    const w = next.x - x + META_LINK_OVERLAP;
    if (w <= META_LINK_OVERLAP * 2) continue;
    links.push({
      x,
      y: previous.y + (BAR_H - META_LINK_H) / 2,
      w,
      unitId: unit.id,
      fromStatusId: segments[i - 1].statusId,
      toStatusId: segments[i].statusId,
      fromColor: segmentColor(segments[i - 1]),
      toColor: segmentColor(segments[i])
    });
  }
  return links;
}
function renderMetaSegmentLinks(unit) {
  metaSegmentLinks(unit).forEach(link => {
    const connector = addDiv("meta-link", {
      left: `${link.x}px`,
      top: `${link.y}px`,
      width: `${link.w}px`
    });
    connector.dataset.unitId = link.unitId;
    connector.dataset.statusFrom = link.fromStatusId;
    connector.dataset.statusTo = link.toStatusId;
    connector.style.setProperty("--link-from", link.fromColor);
    connector.style.setProperty("--link-to", link.toColor);
  });
}
function cardRectEntriesByLeft() {
  if (layoutGeometryCache.cardRectsByLeft) return layoutGeometryCache.cardRectsByLeft;
  const entries = (state.units || []).map(unit => ({ unit, rect: iconRect(unit) })).sort((a, b) => a.rect.left - b.rect.left);
  layoutGeometryCache.cardRectsByLeft = entries;
  return entries;
}
function lowerBoundCardRectLeft(entries, value) {
  let low = 0;
  let high = entries.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (entries[mid].rect.left < value) low = mid + 1;
    else high = mid;
  }
  return low;
}
function metaOwnerRouteBlocked(unitId, x, top, bottom) {
  const entries = cardRectEntriesByLeft();
  let index = lowerBoundCardRectLeft(entries, x - ICON_W - 6);
  for (; index < entries.length; index++) {
    const { unit, rect } = entries[index];
    if (rect.left > x + 4) break;
    if (unit.id === unitId || rect.right < x - 4) continue;
    const crossesVertically = bottom > rect.top + 2 && top < rect.bottom - 2;
    if (crossesVertically && x > rect.left - 4 && x < rect.right + 4) return true;
  }
  return false;
}
function metaOwnerRouteX(unit, cardRect, cardEdgeY, laneCenter) {
  const center = (cardRect.left + cardRect.right) / 2;
  const peers = sameSlotGroup(unit).filter(hasVisibleMetaSegments);
  const peerIndex = Math.max(0, peers.findIndex(peer => peer.id === unit.id));
  const candidates = [];
  if (peers.length <= 1) candidates.push(center);
  const preferredSide = peerIndex % 2 ? "right" : "left";
  const oppositeSide = preferredSide === "left" ? "right" : "left";
  const baseLevel = Math.floor(peerIndex / 2) + 1;
  const addSide = (side, offset) => candidates.push(side === "left" ? cardRect.left - offset : cardRect.right + offset);
  for (let level = baseLevel; level <= baseLevel + 3; level++) {
    const offset = 12 * level;
    addSide(preferredSide, offset);
    addSide(oppositeSide, offset);
  }
  if (peers.length > 1) candidates.push(center);
  const top = Math.min(cardEdgeY, laneCenter);
  const bottom = Math.max(cardEdgeY, laneCenter);
  const isBlocked = (x) => metaOwnerRouteBlocked(unit.id, x, top, bottom);
  const minX = LEFT_W + 4;
  const maxX = baseChartWidth() - 4;
  return candidates.find(x => x >= minX && x <= maxX && !isBlocked(x)) ?? clamp(center, minX, maxX);
}
function metaOwnerTetherGeometry(unit) {
  const firstSegment = sortedVisibleSegments(unit)[0];
  if (!firstSegment) return null;
  const slot = sameSlotOffset(unit);
  const size = slot.size || ICON_W;
  const cardTop = iconY(unit);
  const cardBottom = cardTop + size;
  const cardCenterY = cardTop + size / 2;
  const cardRect = { left: iconX(unit), right: iconX(unit) + size, top: cardTop, bottom: cardBottom };
  const laneCenter = laneY(unit) + BAR_H / 2;
  const cardEdgeY = laneCenter >= cardCenterY ? cardBottom : cardTop;
  const anchorX = metaOwnerRouteX(unit, cardRect, cardEdgeY, laneCenter);
  const firstRect = segmentBarRect(unit, firstSegment);
  const targetX = clamp(anchorX, firstRect.x, firstRect.x + firstRect.w);
  const cardPortX = anchorX < cardRect.left ? cardRect.left : anchorX > cardRect.right ? cardRect.right : anchorX;
  return {
    anchorX,
    laneCenter,
    stemTop: Math.min(cardEdgeY, laneCenter),
    stemHeight: Math.abs(laneCenter - cardEdgeY),
    cardArmTop: cardEdgeY,
    cardArmLeft: anchorX < cardRect.left ? anchorX : cardRect.right,
    cardArmWidth: anchorX < cardRect.left ? cardRect.left - anchorX : anchorX > cardRect.right ? anchorX - cardRect.right : 0,
    armLeft: Math.min(anchorX, targetX),
    armWidth: Math.abs(targetX - anchorX),
    cardPortX,
    cardPortY: cardEdgeY,
    laneNodeX: anchorX,
    laneNodeY: laneCenter
  };
}
function renderMetaOwnerTether(unit) {
  const geometry = metaOwnerTetherGeometry(unit);
  if (!geometry) return;
  const firstSegment = sortedVisibleSegments(unit)[0];
  if (geometry.stemHeight > 1) {
    const stem = addDiv("meta-owner-tether stem", {
      left: `${geometry.anchorX}px`,
      top: `${geometry.stemTop}px`,
      height: `${geometry.stemHeight}px`
    });
    stem.dataset.unitId = unit.id;
    stem.setAttribute("aria-hidden", "true");
    applyMetaOwnerColor(stem, firstSegment);
  }
  if (geometry.cardArmWidth > 1) {
    const cardArm = addDiv("meta-owner-tether arm card-arm", {
      left: `${geometry.cardArmLeft}px`,
      top: `${geometry.cardArmTop}px`,
      width: `${geometry.cardArmWidth}px`
    });
    cardArm.dataset.unitId = unit.id;
    cardArm.setAttribute("aria-hidden", "true");
    applyMetaOwnerColor(cardArm, firstSegment);
  }
  if (geometry.armWidth > 1) {
    const arm = addDiv("meta-owner-tether arm", {
      left: `${geometry.armLeft}px`,
      top: `${geometry.laneCenter}px`,
      width: `${geometry.armWidth}px`
    });
    arm.dataset.unitId = unit.id;
    arm.setAttribute("aria-hidden", "true");
    applyMetaOwnerColor(arm, firstSegment);
  }
  const cardPort = addDiv("meta-owner-node card-port", {
    left: `${geometry.cardPortX}px`,
    top: `${geometry.cardPortY}px`
  });
  cardPort.dataset.unitId = unit.id;
  cardPort.setAttribute("aria-hidden", "true");
  applyMetaOwnerColor(cardPort, firstSegment);

  const laneNode = addDiv("meta-owner-node lane-node", {
    left: `${geometry.laneNodeX}px`,
    top: `${geometry.laneNodeY}px`
  });
  laneNode.dataset.unitId = unit.id;
  laneNode.setAttribute("aria-hidden", "true");
  applyMetaOwnerColor(laneNode, firstSegment);
}
function setMetaOwnerHover(unitId) {
  metaOwnerHoverId = unitId || null;
  updateMetaOwnerHighlight();
}
function setMetaOwnerFocus(unitId) {
  metaOwnerFocusId = unitId || null;
  updateMetaOwnerHighlight();
}
function setMetaOwnerTouchSelection(unitId) {
  metaOwnerTouchSelectionId = unitId || null;
  // While a touch profile is open, changing the background roadmap highlight on
  // every Previous/Next press needlessly restyles the very large scene behind the
  // modal. Keep the logical selection current and reconcile the roadmap once when
  // the profile closes. Desktop keeps live background ownership updates.
  if (isMobileTouchViewport() && unitProfileOverlay) return;
  updateMetaOwnerHighlight();
}
function setMetaOwnerProfile(unitId) {
  metaOwnerProfileId = unitId || null;
  if (isMobileTouchViewport() && unitProfileOverlay) return;
  updateMetaOwnerHighlight();
}
function suspendMetaOwnerHighlightForTouchProfile() {
  if (!isMobileTouchViewport() || !els.roadmap) return;
  // Full Profile already supplies its own viewport veil. Keeping the roadmap's
  // ownership dimmer active underneath it leaves a second, roadmap-sized opacity
  // surface alive for no visible benefit and makes profile open/nav/close compete
  // with that large layer on iOS. Preserve all logical owner ids, but temporarily
  // remove only the rendered ownership focus. closeUnitProfile() reconciles the
  // current logical touch selection once the modal is gone.
  if (metaOwnerHighlightedId) setMetaOwnerHighlightState(metaOwnerHighlightedId, false);
  metaFocusDimmerEl?.classList.remove("active");
  els.roadmap.classList.remove("meta-owner-context-active");
  metaOwnerHighlightedId = null;
}
function rebuildMobileStaticPresentationIndex() {
  if (!els.roadmap || !isMobileTouchViewport()) {
    mobileTextBoostTargetsCache = [];
    mobileMetaLabelEntriesCache = [];
    mobileTierLabelEntriesCache = [];
    mobileGridVerticalCache = [];
    mobileGridHorizontalCache = [];
    mobileCardNameMetricsById.clear();
    return;
  }
  // Viewer roadmap markup is immutable after render. Query the semantic/style
  // targets once instead of rediscovering hundreds of elements after every pinch.
  const headers = Array.from(els.roadmap.querySelectorAll(".month-head,.week-head,.tier-label"));
  const ownership = Array.from(els.roadmap.querySelectorAll(
    ".lane-track,.meta-owner-tether,.meta-owner-node,.meta-bar,.meta-link"
  ));
  // Cards are handled together with their density state so the text scale and
  // visibility decision become visible in the same bounded slice.
  mobileTextBoostTargetsCache = [...headers, ...ownership];
  mobileMetaLabelEntriesCache = Array.from(els.roadmap.querySelectorAll(".meta-bar")).map(bar => ({
    bar,
    label: bar.querySelector(".bar-label")
  })).filter(entry => entry.label);
  mobileTierLabelEntriesCache = Array.from(els.roadmap.querySelectorAll(".tier-label")).map(label => ({
    label,
    text: label.querySelector(".tier-label-text")
  })).filter(entry => entry.text);
  mobileGridVerticalCache = Array.from(els.roadmap.querySelectorAll(".grid-line.v"));
  mobileGridHorizontalCache = Array.from(els.roadmap.querySelectorAll(".grid-line.h"));
  rebuildMobileCardPresentationMetrics();
}

function rebuildMetaOwnerElementIndex() {
  metaOwnerElementIndex = new Map();
  if (!els.roadmap) return;
  const remember = (unitId, element) => {
    if (!unitId || !element) return;
    if (!metaOwnerElementIndex.has(unitId)) metaOwnerElementIndex.set(unitId, []);
    metaOwnerElementIndex.get(unitId).push(element);
  };
  // Preserve the previous ownership semantics exactly: the roadmap card itself
  // is keyed by its own unit id, while meta/tether/lane elements are keyed by
  // their MS timeline owner id.
  els.roadmap.querySelectorAll(".unit-card[data-id]").forEach(card => remember(card.dataset.id, card));
  els.roadmap.querySelectorAll(".meta-bar[data-unit-id],.meta-link[data-unit-id],.meta-owner-tether[data-unit-id],.meta-owner-node[data-unit-id],.lane-track[data-unit-id]")
    .forEach(element => remember(element.dataset.unitId, element));
  rebuildMobileStaticPresentationIndex();
}
function setMetaOwnerHighlightState(unitId, highlighted) {
  if (!unitId) return;
  for (const element of metaOwnerElementIndex.get(unitId) || []) {
    element.classList.toggle("meta-owner-highlight", highlighted);
  }
}
function updateMetaOwnerHighlight() {
  if (!els.roadmap) return;
  const activeId = metaOwnerProfileId || metaOwnerHoverId || metaOwnerFocusId || metaOwnerTouchSelectionId || null;
  if (activeId === metaOwnerHighlightedId) return;
  if (metaOwnerHighlightedId) setMetaOwnerHighlightState(metaOwnerHighlightedId, false);
  if (activeId) setMetaOwnerHighlightState(activeId, true);
  // Use one timeline dimming overlay instead of restyling every unrelated mark.
  // The active owner's bars/links/tether/lane are elevated above it in CSS.
  // This restores strong focus+context while keeping hover work essentially O(1).
  metaFocusDimmerEl?.classList.toggle("active", !!activeId);
  els.roadmap.classList.remove("meta-owner-context-active");
  metaOwnerHighlightedId = activeId;
}

function weekX(week) {
  const target = clamp(Math.round(Number(week) || 1), 1, weekCount());
  return ensureWeekBoundaryXs()[target - 1];
}
function tierY(tierId) {
  if (layoutGeometryCache.tierYs.has(tierId)) return layoutGeometryCache.tierYs.get(tierId);
  let y = HEADER_H;
  for (const tier of getTiers()) {
    layoutGeometryCache.tierYs.set(tier.id, y);
    if (tier.id === tierId) return y;
    y += tierHeight(tier.id);
  }
  return y;
}
function computeBetweenSafeHeights() {
  if (layoutGeometryCache.betweenSafeComputed) return;
  layoutGeometryCache.betweenSafeComputed = true;
  const tiers = getTiers();
  for (const tier of tiers) layoutGeometryCache.betweenSafeHeights.set(tier.id, 0);

  const groupsByTier = new Map();
  const seenSlots = new Set();
  for (const seed of state.units || []) {
    const offset = normalizeRowOffset(seed.rowOffset);
    if (!offset) continue;
    const index = tierIndex(seed.tier);
    const upperTier = offset < 0 ? tiers[index - 1] : tiers[index];
    const lowerTier = offset < 0 ? tiers[index] : tiers[index + 1];
    if (!upperTier || !lowerTier) continue;
    const boundaryKey = `between:${upperTier.id}|${lowerTier.id}`;
    if (rowSlotKey(seed) !== boundaryKey) continue;
    const slotKey = visualSlotKey(seed);
    if (seenSlots.has(slotKey)) continue;
    seenSlots.add(slotKey);
    const slot = sameSlotOffset(seed);
    const groupWidth = slot.groupWidth || ICON_W;
    const maxGroupLeft = Math.max(LEFT_W, baseChartWidth() - groupWidth);
    const left = clamp(weekX(seed.week) + Math.round((weekWidth(seed.week) - groupWidth) / 2), LEFT_W, maxGroupLeft);
    const group = { left, right: left + groupWidth, halfHeight: (slot.groupHeight || ICON_W) / 2, lowestBarBottom: 0 };
    const list = groupsByTier.get(upperTier.id) || [];
    list.push(group);
    groupsByTier.set(upperTier.id, list);
  }

  for (const owner of state.units || []) {
    if (!hasVisibleMetaSegments(owner)) continue;
    const groups = groupsByTier.get(owner.tier);
    if (!groups?.length) continue;
    const laneTop = dynamicBarTop(owner.tier) + ((Number(owner.lane) || 1) - 1) * BAR_GAP;
    const barBottom = laneTop + BAR_H;
    for (const segment of sortedVisibleSegments(owner)) {
      const span = segmentHorizontalRect(segment);
      const right = span.x + span.w;
      for (const group of groups) {
        if (span.x < group.right + 8 && right > group.left - 8) group.lowestBarBottom = Math.max(group.lowestBarBottom, barBottom);
      }
    }
  }

  for (const [tierId, groups] of groupsByTier) {
    let requiredHeight = 0;
    for (const group of groups) {
      if (group.lowestBarBottom) requiredHeight = Math.max(requiredHeight, group.lowestBarBottom + group.halfHeight + 12);
    }
    layoutGeometryCache.betweenSafeHeights.set(tierId, requiredHeight);
  }
}
function betweenBoundaryMetaSafeHeight(tierId) {
  computeBetweenSafeHeights();
  return layoutGeometryCache.betweenSafeHeights.get(tierId) || 0;
}
function tierHeight(tierId) {
  if (layoutGeometryCache.tierHeights.has(tierId)) return layoutGeometryCache.tierHeights.get(tierId);
  const lanes = visibleLaneCount(tierId);
  const iconContentHeight = ICON_TOP + maxIconStackVisualHeight(tierId) + 28;
  const minHeight = Math.max(BLANK_TIER_H, iconContentHeight);
  const betweenSafeHeight = betweenBoundaryMetaSafeHeight(tierId);
  const value = !lanes
    ? Math.max(minHeight, betweenSafeHeight)
    : Math.max(minHeight, dynamicBarTop(tierId) + lanes * BAR_GAP + BAR_BOTTOM_PAD, betweenSafeHeight);
  layoutGeometryCache.tierHeights.set(tierId, value);
  return value;
}
function visibleLaneCount(tierId) {
  if (layoutGeometryCache.visibleLaneCounts.has(tierId)) return layoutGeometryCache.visibleLaneCounts.get(tierId);
  let maxLane = 0;
  for (const unit of state.units || []) {
    if (unit.tier !== tierId || !hasVisibleMetaSegments(unit)) continue;
    const lane = Number(unit.lane) || 0;
    maxLane = Math.max(maxLane, lane);
    layoutGeometryCache.laneOwners.set(`${tierId}|${lane}`, unit);
  }
  layoutGeometryCache.visibleLaneCounts.set(tierId, maxLane);
  return maxLane;
}

function laneY(unitOrTier, laneMaybe) {
  const tier = typeof unitOrTier === "string" ? unitOrTier : unitOrTier.tier;
  const lane = typeof unitOrTier === "string" ? laneMaybe : unitOrTier.lane;
  return tierY(tier) + dynamicBarTop(tier) + (lane - 1) * BAR_GAP;
}
function dynamicBarTop(tierId) {
  if (layoutGeometryCache.dynamicBarTops.has(tierId)) return layoutGeometryCache.dynamicBarTops.get(tierId);
  const value = Math.max(BAR_TOP, ICON_TOP + maxIconStackVisualHeight(tierId) + 18);
  layoutGeometryCache.dynamicBarTops.set(tierId, value);
  return value;
}
function maxIconStackVisualHeight(tierId) {
  if (layoutGeometryCache.maxIconStackHeights.has(tierId)) return layoutGeometryCache.maxIconStackHeights.get(tierId);
  const seen = new Set();
  let maxHeight = ICON_W;
  for (const unit of state.units || []) {
    if (unit.tier !== tierId) continue;
    const key = visualSlotKey(unit);
    if (seen.has(key)) continue;
    seen.add(key);
    maxHeight = Math.max(maxHeight, sameSlotOffset(unit).groupHeight || ICON_W);
  }
  layoutGeometryCache.maxIconStackHeights.set(tierId, maxHeight);
  return maxHeight;
}
function iconX(unit) {
  if (layoutGeometryCache.iconXs.has(unit.id)) return layoutGeometryCache.iconXs.get(unit.id);
  const slot = sameSlotOffset(unit);
  const groupWidth = slot.groupWidth || ICON_W;
  const maxGroupLeft = Math.max(LEFT_W, baseChartWidth() - groupWidth);
  const groupLeft = clamp(weekX(unit.week) + Math.round((weekWidth(unit.week) - groupWidth) / 2), LEFT_W, maxGroupLeft);
  const value = groupLeft + slot.x;
  layoutGeometryCache.iconXs.set(unit.id, value);
  return value;
}
function iconY(unit) {
  if (layoutGeometryCache.iconYs.has(unit.id)) return layoutGeometryCache.iconYs.get(unit.id);
  const slot = sameSlotOffset(unit);
  const size = slot.size || ICON_W;
  const rowOffset = normalizeRowOffset(unit.rowOffset);
  let top = tierY(unit.tier) + ICON_TOP + slot.y;
  if (rowOffset > 0) top = tierY(unit.tier) + tierHeight(unit.tier) - slot.groupHeight / 2 + slot.y;
  if (rowOffset < 0) top = tierY(unit.tier) - slot.groupHeight / 2 + slot.y;
  const value = clamp(top, HEADER_H - size / 2, baseChartHeight() - size);
  layoutGeometryCache.iconYs.set(unit.id, value);
  return value;
}
function normalizeWeek(n) {
  const fallbackWeeks = Math.max(1, Math.ceil(maxUsedWeek(state.units || []) / 4) * 4, (state.months?.length || 3) * 4);
  const max = Number.isFinite(weekCount()) ? Math.max(1, weekCount()) : fallbackWeeks;
  return clamp(Math.round(Number(n) || 1), 1, Math.max(max, fallbackWeeks));
}
function normalizeLane(n) { return clamp(Math.round(Number(n) || 1), 1, 99); }
function normalizeRowOffset(value) {
  const n = Number(value) || 0;
  if (n <= -0.25) return -0.5;
  if (n >= 0.25) return 0.5;
  return 0;
}
function rowOffsetLabel(value, tierId = null) {
  const offset = normalizeRowOffset(value);
  if (!offset) return "In row";
  const tiers = getTiers();
  const index = tierId ? tiers.findIndex(t => t.id === tierId) : -1;
  if (index >= 0) {
    const upper = offset < 0 ? tiers[index - 1] : tiers[index];
    const lower = offset < 0 ? tiers[index] : tiers[index + 1];
    if (upper && lower) return `${upper.label} / ${lower.label}`;
  }
  return "Between rows";
}
function unitRowLabel(unit) { return normalizeRowOffset(unit.rowOffset) ? rowOffsetLabel(unit.rowOffset, unit.tier) : tierById(unit.tier).label; }
function normalizePotentialLevel(value) { if (value === "" || value === null || value === undefined) return null; const n = Number(value); return Number.isFinite(n) ? clamp(Math.round(n), 0, 5) : null; }
function isPilot(unit) { return String(unit?.kind || "").toLowerCase() === "pilot"; }
function isMs(unit) { return String(unit?.kind || "").toLowerCase() === "ms"; }
function hasMetaBars(unit) { return !isPilot(unit); }
function hasTag(unit, tag) { return !!unit?.tags?.some(t => t.toLowerCase() === tag.toLowerCase()); }
function hasMustP5(unit) { return hasTag(unit, MUST_P5_TAG); }
function hasBuff(unit) { return hasTag(unit, BUFF_TAG); }
function rowSlotKey(unit) {
  if (!unit) return "row:";
  const offset = normalizeRowOffset(unit.rowOffset);
  const tiers = getTiers();
  const index = tierIndex(unit.tier);
  if (!offset || index < 0) return `row:${unit.tier}`;
  const upper = offset < 0 ? tiers[index - 1] : tiers[index];
  const lower = offset < 0 ? tiers[index] : tiers[index + 1];
  return upper && lower ? `between:${upper.id}|${lower.id}` : `row:${unit.tier}`;
}
function visualSlotKey(unit) { return `${normalizeWeek(unit?.week)}|${rowSlotKey(unit)}`; }
function sameVisualSlot(a, b) { return !!a && !!b && normalizeWeek(a.week) === normalizeWeek(b.week) && rowSlotKey(a) === rowSlotKey(b); }
function visualStackRank(unit) {
  if (isMs(unit)) return 0;
  if (String(unit?.kind || "").toLowerCase() === "custom") return 1;
  if (isPilot(unit)) return 2;
  return 1;
}
function sameSlotGroup(unit) {
  if (!unit) return [];
  const key = visualSlotKey(unit);
  const cached = layoutGeometryCache.slotGroups.get(key);
  if (cached) return cached;
  const group = (state.units || [])
    .filter(other => visualSlotKey(other) === key)
    .sort((a, b) => {
      const rankDiff = visualStackRank(a) - visualStackRank(b);
      if (rankDiff) return rankDiff;
      const orderDiff = (Number(a.stackOrder) || 0) - (Number(b.stackOrder) || 0);
      return orderDiff || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    });
  layoutGeometryCache.slotGroups.set(key, group);
  return group;
}
function isCompactBetweenSlot(group) {
  return group.length > 1
    && group.some(unit => normalizeRowOffset(unit.rowOffset))
    && group.some(isMs)
    && group.some(isPilot);
}
function slotSizeForUnit() { return ICON_W; }
function slotLayoutForGroup(group) {
  const compact = isCompactBetweenSlot(group);
  const layout = new Map();
  if (compact) {
    const leftColumn = group.filter(unit => !isPilot(unit));
    const rightColumn = group.filter(isPilot);
    const rightX = ICON_W + BETWEEN_PAIR_GAP;
    const leftHeight = leftColumn.length ? leftColumn.length * ICON_W + (leftColumn.length - 1) * ICON_STACK_GAP : 0;
    const rightHeight = rightColumn.length ? rightColumn.length * ICON_W + (rightColumn.length - 1) * ICON_STACK_GAP : 0;
    const groupHeight = Math.max(ICON_W, leftHeight, rightHeight);
    let leftY = Math.max(0, Math.round((groupHeight - leftHeight) / 2));
    let rightY = Math.max(0, Math.round((groupHeight - rightHeight) / 2));
    leftColumn.forEach((unit, index) => {
      layout.set(unit.id, { x: 0, y: leftY, size: ICON_W, z: group.length - index, index });
      leftY += ICON_W + ICON_STACK_GAP;
    });
    rightColumn.forEach((unit, index) => {
      const groupIndex = group.indexOf(unit);
      layout.set(unit.id, { x: rightX, y: rightY, size: ICON_W, z: group.length - groupIndex, index: groupIndex });
      rightY += ICON_W + ICON_STACK_GAP;
    });
    return { layout, groupHeight, groupWidth: ICON_W + BETWEEN_PAIR_GAP + ICON_W, compact };
  }

  let y = 0;
  group.forEach((unit, index) => {
    const size = slotSizeForUnit(unit, group);
    layout.set(unit.id, { x: 0, y, size, z: group.length - index, index });
    y += size + ICON_STACK_GAP;
  });
  return { layout, groupHeight: Math.max(ICON_W, y - ICON_STACK_GAP), groupWidth: ICON_W, compact };
}
function sameSlotOffset(unit) {
  if (!unit) return { x: 0, y: 0, z: 0, index: 0, count: 1, groupHeight: ICON_W, groupWidth: ICON_W, size: ICON_W, compact: false };
  const key = visualSlotKey(unit);
  let cached = layoutGeometryCache.slotLayouts.get(key);
  if (!cached) {
    const group = sameSlotGroup(unit);
    if (group.length <= 1) {
      cached = { byId: new Map([[unit.id, { x: 0, y: 0, z: 0, index: 0, count: 1, groupHeight: ICON_W, groupWidth: ICON_W, size: ICON_W, compact: false }]]) };
    } else {
      const { layout, groupHeight, groupWidth, compact } = slotLayoutForGroup(group);
      const byId = new Map();
      group.forEach(member => {
        const slot = layout.get(member.id) || { x: 0, y: 0, z: 0, index: 0, size: ICON_W };
        byId.set(member.id, { ...slot, count: group.length, groupHeight, groupWidth, compact });
      });
      cached = { byId };
    }
    layoutGeometryCache.slotLayouts.set(key, cached);
  }
  return cached.byId.get(unit.id) || { x: 0, y: 0, z: 0, index: 0, count: 1, groupHeight: ICON_W, groupWidth: ICON_W, size: ICON_W, compact: false };
}
function slotGroupHeight(group) { return slotLayoutForGroup(group).groupHeight || ICON_W; }
function unitZIndex(unit, slot = sameSlotOffset(unit)) {
  const stack = Math.max(0, Number(unit?.stackOrder) || 0);
  const activeBoost = activeUnitId === unit?.id ? 2 : 0;
  return 20 + stack * 2 + (slot?.z || 0) + activeBoost;
}
function iconRect(unit) {
  if (!unit) return { left: 0, top: 0, right: 0, bottom: 0 };
  const cached = layoutGeometryCache.iconRects.get(unit.id);
  if (cached) return cached;
  const size = sameSlotOffset(unit).size || ICON_W;
  const left = iconX(unit);
  const top = iconY(unit);
  const rect = { left, top, right: left + size, bottom: top + size };
  layoutGeometryCache.iconRects.set(unit.id, rect);
  return rect;
}
function rectsOverlap(a, b) { return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
function overlappingUnits(unit) {
  if (!unit) return [];
  const rect = iconRect(unit);
  return (state.units || []).filter(other => other.id !== unit.id && rectsOverlap(rect, iconRect(other)));
}
function bringUnitToFront(unitId, cardEl = null) {
  const unit = unitByIdIndex.get(unitId) || state.units.find(u => u.id === unitId);
  if (!unit) return;
  const overlaps = overlappingUnits(unit);
  if (!overlaps.length) return;
  const currentZ = unitZIndex(unit, sameSlotOffset(unit));
  const maxOverlapZ = Math.max(...overlaps.map(other => unitZIndex(other, sameSlotOffset(other))));
  if (currentZ > maxOverlapZ) return;
  let maxOrder = Math.max(0, ...state.units.map(u => Number(u.stackOrder) || 0));
  let normalizedStackOrders = false;
  if (maxOrder > 100000) {
    state.units.slice().sort((a, b) => (Number(a.stackOrder) || 0) - (Number(b.stackOrder) || 0)).forEach((u, index) => { u.stackOrder = index; });
    maxOrder = Math.max(0, ...state.units.map(u => Number(u.stackOrder) || 0));
    normalizedStackOrders = true;
  }
  unit.stackOrder = maxOrder + 1;
  if (normalizedStackOrders) refreshUnitZIndices();
  else {
    const card = cardEl?.isConnected ? cardEl : els.roadmap?.querySelector?.(`.unit-card[data-id="${CSS.escape(unitId)}"]`);
    if (card) card.style.zIndex = String(unitZIndex(unit, sameSlotOffset(unit)));
  }
}
function refreshUnitZIndices() {
  const unitsById = new Map((state.units || []).map(unit => [unit.id, unit]));
  els.roadmap?.querySelectorAll?.(".unit-card").forEach(card => {
    const unit = unitsById.get(card.dataset.id);
    if (!unit) return;
    card.style.zIndex = String(unitZIndex(unit, sameSlotOffset(unit)));
  });
}
function computePairedMsForPilot(pilot) {
  if (!isPilot(pilot)) return null;
  const sameWeek = state.units.filter(unit => isMs(unit) && normalizeWeek(unit.week) === normalizeWeek(pilot.week));
  if (!sameWeek.length) return null;
  return sameWeek.sort((a, b) => {
    const aExact = sameVisualSlot(a, pilot) ? 1 : 0;
    const bExact = sameVisualSlot(b, pilot) ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    const aTier = a.tier === pilot.tier ? 1 : 0;
    const bTier = b.tier === pilot.tier ? 1 : 0;
    if (aTier !== bTier) return bTier - aTier;
    const aDistance = Math.abs(tierIndex(a.tier) + normalizeRowOffset(a.rowOffset) - (tierIndex(pilot.tier) + normalizeRowOffset(pilot.rowOffset)));
    const bDistance = Math.abs(tierIndex(b.tier) + normalizeRowOffset(b.rowOffset) - (tierIndex(pilot.tier) + normalizeRowOffset(pilot.rowOffset)));
    return aDistance - bDistance || visualStackRank(a) - visualStackRank(b) || a.name.localeCompare(b.name);
  })[0] || null;
}
function computePairedPilotForMs(ms) {
  if (!isMs(ms)) return null;
  return state.units
    .filter(isPilot)
    .filter(pilot => computePairedMsForPilot(pilot)?.id === ms.id)
    .sort((a, b) => {
      const aExact = sameVisualSlot(a, ms) ? 1 : 0;
      const bExact = sameVisualSlot(b, ms) ? 1 : 0;
      return bExact - aExact || (Number(a.stackOrder) || 0) - (Number(b.stackOrder) || 0) || a.name.localeCompare(b.name);
    })[0] || null;
}
function rebuildStaticRuntimeIndices() {
  const units = state.units || [];
  const msUnits = [];
  const pilots = [];
  const msByWeek = new Map();

  unitByIdIndex = new Map();
  pairedMsByPilotId = new Map();
  pairedPilotByMsId = new Map();

  for (const unit of units) {
    unitByIdIndex.set(unit.id, unit);
    if (isMs(unit)) {
      msUnits.push(unit);
      const week = normalizeWeek(unit.week);
      if (!msByWeek.has(week)) msByWeek.set(week, []);
      msByWeek.get(week).push(unit);
    } else if (isPilot(unit)) {
      pilots.push(unit);
    }
  }

  const pilotsByMsId = new Map();
  for (const pilot of pilots) {
    const sameWeek = msByWeek.get(normalizeWeek(pilot.week)) || [];
    const ms = sameWeek.length ? sameWeek.slice().sort((a, b) => {
      const aExact = sameVisualSlot(a, pilot) ? 1 : 0;
      const bExact = sameVisualSlot(b, pilot) ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      const aTier = a.tier === pilot.tier ? 1 : 0;
      const bTier = b.tier === pilot.tier ? 1 : 0;
      if (aTier !== bTier) return bTier - aTier;
      const pilotPosition = tierIndex(pilot.tier) + normalizeRowOffset(pilot.rowOffset);
      const aDistance = Math.abs(tierIndex(a.tier) + normalizeRowOffset(a.rowOffset) - pilotPosition);
      const bDistance = Math.abs(tierIndex(b.tier) + normalizeRowOffset(b.rowOffset) - pilotPosition);
      return aDistance - bDistance || visualStackRank(a) - visualStackRank(b) || a.name.localeCompare(b.name);
    })[0] : null;
    pairedMsByPilotId.set(pilot.id, ms || null);
    if (ms) {
      if (!pilotsByMsId.has(ms.id)) pilotsByMsId.set(ms.id, []);
      pilotsByMsId.get(ms.id).push(pilot);
    }
  }

  for (const ms of msUnits) {
    const candidates = pilotsByMsId.get(ms.id) || [];
    candidates.sort((a, b) => {
      const aExact = sameVisualSlot(a, ms) ? 1 : 0;
      const bExact = sameVisualSlot(b, ms) ? 1 : 0;
      return bExact - aExact || (Number(a.stackOrder) || 0) - (Number(b.stackOrder) || 0) || a.name.localeCompare(b.name);
    });
    pairedPilotByMsId.set(ms.id, candidates[0] || null);
  }

  profileTimelineCache = msUnits.slice().sort((a, b) =>
    normalizeWeek(a.week) - normalizeWeek(b.week)
    || (tierIndex(a.tier) + normalizeRowOffset(a.rowOffset)) - (tierIndex(b.tier) + normalizeRowOffset(b.rowOffset))
    || (Number(a.stackOrder) || 0) - (Number(b.stackOrder) || 0)
    || a.name.localeCompare(b.name)
    || a.id.localeCompare(b.id)
  );
  profileTimelineIndexById = new Map(profileTimelineCache.map((unit, index) => [unit.id, index]));
}

function pairedMsForPilot(pilot) {
  if (!isPilot(pilot)) return null;
  if (pairedMsByPilotId.has(pilot.id)) return pairedMsByPilotId.get(pilot.id) || null;
  return computePairedMsForPilot(pilot);
}
function pairedPilotForMs(ms) {
  if (!isMs(ms)) return null;
  if (pairedPilotByMsId.has(ms.id)) return pairedPilotByMsId.get(ms.id) || null;
  return computePairedPilotForMs(ms);
}
function metaOwnerForUnit(unit) { return isPilot(unit) ? (pairedMsForPilot(unit) || null) : unit; }
function syncPilotLanes() {
  for (const pilot of state.units.filter(isPilot)) {
    const ms = pairedMsForPilot(pilot);
    if (ms) pilot.lane = ms.lane;
  }
}
function maxUsedWeek(units = []) {
  let max = 1;
  units.forEach(unit => {
    max = Math.max(max, Number(unit.week) || 1, Number(unit.metaEnd) || 1, Number(unit.metaStart) || 1);
    (unit.segments || []).forEach(seg => max = Math.max(max, Number(seg.end || seg.metaEnd || seg.start || seg.metaStart) || 1));
  });
  return max;
}
function reflowLanes(tierId) {
  state.units
    .filter(unit => unit.tier === tierId && hasVisibleMetaSegments(unit))
    .sort((a, b) => normalizeWeek(a.week) - normalizeWeek(b.week)
      || normalizeRowOffset(a.rowOffset) - normalizeRowOffset(b.rowOffset)
      || sameSlotOffset(a).y - sameSlotOffset(b).y
      || a.name.localeCompare(b.name))
    .forEach((unit, index) => { unit.lane = index + 1; });
}
function formatWeek(week) {
  const { monthIndex, weekInMonth } = weekToMonthWeek(week);
  const label = state.months?.[monthIndex] || suggestedMonthLabel(monthIndex);
  return `${label} W${weekInMonth}`;
}
function formatWeekRange(start, end) { return Number(start) === Number(end) ? formatWeek(start) : `${formatWeek(start)}–${formatWeek(end)}`; }
function makeDefaultMonthLabels(count, startDate = new Date()) {
  const labels = [];
  const base = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const fmt = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" });
  for (let i = 0; i < count; i++) labels.push(fmt.format(new Date(base.getFullYear(), base.getMonth() + i, 1)));
  return labels;
}
function suggestedMonthLabel(index) { return makeDefaultMonthLabels(index + 1)[index] || `Month ${index + 1}`; }
function isGenericMonthLabels(months) {
  if (!Array.isArray(months) || !months.length) return true;
  return months.every((m, i) => String(m || "").trim() === (OLD_GENERIC_MONTHS[i] || `${i + 1} Months Later`));
}
function cleanTags(tags) {
  const byKey = new Map();
  (tags || []).forEach(tag => {
    const clean = sanitizeText(tag);
    if (!clean) return;
    const canonical = TAG_OPTIONS.find(t => t.toLowerCase() === clean.toLowerCase()) || clean;
    byKey.set(canonical.toLowerCase(), canonical);
  });
  return [...byKey.values()].sort((a, b) => {
    const ai = TAG_ORDER.has(a.toLowerCase()) ? TAG_ORDER.get(a.toLowerCase()) : 100 + a.toLowerCase().charCodeAt(0);
    const bi = TAG_ORDER.has(b.toLowerCase()) ? TAG_ORDER.get(b.toLowerCase()) : 100 + b.toLowerCase().charCodeAt(0);
    return ai === bi ? a.localeCompare(b) : ai - bi;
  }).slice(0, MAX_TAGS);
}
function normalizeTagDescriptions(input) {
  const normalized = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return normalized;
  for (const [rawTag, rawDescription] of Object.entries(input)) {
    const cleanTag = sanitizeText(rawTag);
    const description = String(rawDescription || "").trim();
    if (!cleanTag || !description) continue;
    const canonical = TAG_OPTIONS.find(tag => tag.toLowerCase() === cleanTag.toLowerCase()) || cleanTag;
    normalized[canonical] = description;
  }
  return normalized;
}
function tagDescription(tag) {
  const key = String(tag || "").toLowerCase();
  const match = Object.entries(state.tagDescriptions || {}).find(([name]) => name.toLowerCase() === key);
  return match ? String(match[1] || "").trim() : "";
}

function tagClass(tag) {
  const t = String(tag || "").toLowerCase();
  if (t === "pvp") return "pvp";
  if (t === "pve") return "pve";
  if (t === "buff") return "buff";
  if (t === "must p5" || t === "must-p5") return "must-p5";
  if (t === "core") return "core";
  if (t === "tech") return "tech";
  if (t === "def") return "def";
  if (t === "sub") return "sub";
  if (t === "cb") return "cb";
  return "custom";
}
function placeholder(name) {
  const div = document.createElement("div");
  div.className = "placeholder";
  div.textContent = initials(name);
  return div;
}
function placeholderHtml(name) { return `<div class="placeholder">${escapeHtml(initials(name))}</div>`; }
function initials(name) {
  const parts = sanitizeText(name).split(/[\s・()\-_/]+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map(p => p[0]).join("").toUpperCase();
}
function legibleTextScale(scale = zoomScale) {
  const normalized = clamp(Number(scale) || 1, TEXT_SCALE_MIN_ZOOM, MAX_ZOOM);
  return clamp(Math.pow(1 / normalized, 0.65), 1, 3);
}
function barLabelTextScale(scale = zoomScale) {
  const normalized = clamp(Number(scale) || 1, TEXT_SCALE_MIN_ZOOM, MAX_ZOOM);
  return clamp(Math.pow(1 / normalized, 0.9), 1, 3.4);
}
function parseHexColor(value) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(value || "").trim());
  if (!match) return null;
  const hex = match[1];
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}
function relativeLuminance(rgb) {
  if (!rgb) return 0;
  const linear = rgb.map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function metaBarTextPresentation(color) {
  const background = relativeLuminance(parseHexColor(color));
  const light = [248, 251, 255];
  const dark = [7, 13, 18];
  const lightContrast = (relativeLuminance(light) + 0.05) / (background + 0.05);
  const darkContrast = (background + 0.05) / (relativeLuminance(dark) + 0.05);
  return darkContrast > lightContrast
    ? { color: "#070d12", tone: "dark" }
    : { color: "#f8fbff", tone: "light" };
}
function compactTierLabel(fullLabel, tierId = "") {
  const preset = TIER_LABEL_ABBREVIATIONS[tierId];
  if (preset) return preset;
  const words = sanitizeText(fullLabel).split(/[\s/|&+\-]+/).filter(Boolean);
  if (words.length > 1) return words.slice(0, 4).map(word => word[0]).join("").toUpperCase();
  const single = words[0] || sanitizeText(fullLabel);
  return single.length > 4 ? single.slice(0, 4).toUpperCase() : single;
}
const tierLabelTextWidthCache = new Map();
let tierLabelMeasureContext = null;
function tierLabelBaseTextWidth(labelText) {
  const renderedText = sanitizeText(labelText).toUpperCase();
  if (tierLabelTextWidthCache.has(renderedText)) return tierLabelTextWidthCache.get(renderedText);
  tierLabelMeasureContext ||= document.createElement("canvas").getContext("2d");
  const context = tierLabelMeasureContext;
  if (!context) return Number.POSITIVE_INFINITY;
  // Match the tier rail typography in CSS at --textBoost:1. Canvas text metrics use
  // the same browser font resolver as the rendered label; letter spacing is added
  // explicitly because CanvasRenderingContext2D.measureText() does not include it.
  const family = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  const fontSize = 15;
  context.font = `850 ${fontSize}px ${family}`;
  const letterSpacing = fontSize * 0.095;
  const width = context.measureText(renderedText).width + Math.max(0, renderedText.length - 1) * letterSpacing;
  tierLabelTextWidthCache.set(renderedText, width);
  return width;
}
const metaLabelTextWidthCache = new Map();
let metaLabelMeasureContext = null;
function metaLabelBaseTextWidth(labelText) {
  const renderedText = sanitizeText(labelText);
  if (metaLabelTextWidthCache.has(renderedText)) return metaLabelTextWidthCache.get(renderedText);
  metaLabelMeasureContext ||= document.createElement("canvas").getContext("2d");
  const context = metaLabelMeasureContext;
  if (!context) return Number.POSITIVE_INFINITY;
  const family = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  const fontSize = 12;
  // Final CSS cascade: 850 weight and .005em letter spacing at --barTextBoost:1.
  context.font = `850 ${fontSize}px ${family}`;
  const letterSpacing = fontSize * 0.005;
  const width = context.measureText(renderedText).width + Math.max(0, renderedText.length - 1) * letterSpacing;
  metaLabelTextWidthCache.set(renderedText, width);
  return width;
}
function immutableMetaLabelMetrics(bar, label) {
  const fullLabel = label.dataset.fullLabel || label.textContent || "";
  const unitLabel = label.dataset.unitLabel || fullLabel;
  // .meta-bar uses border-box width; .bar-label is inset 8px on each side and
  // client width excludes the bar's two 1px borders: available = width - 18px.
  const barWidth = Math.max(0, Number.parseFloat(bar.style.width) || 0);
  return {
    available: Math.max(0, barWidth - 18),
    fullBaseWidth: metaLabelBaseTextWidth(fullLabel),
    unitBaseWidth: metaLabelBaseTextWidth(unitLabel)
  };
}

function tierLabelAvailableTextWidth() {
  // .tier-label is LEFT_W wide with 22px left padding, 18px right padding and a
  // 1px right border. Keeping this geometry calculation outside the transformed
  // roadmap avoids forcing a full layout merely to fit five immutable labels.
  return LEFT_W - 22 - 18 - 1;
}
function updateAdaptiveTierLabels() {
  if (!els.roadmap) return;
  if (!isMobileTouchViewport()) {
    // Preserve the established desktop implementation exactly. Desktop is already
    // responsive and has no reason to trade its direct rendered-fit check for the
    // mobile no-forced-layout path.
    const entries = Array.from(els.roadmap.querySelectorAll(".tier-label")).map(label => ({
      label,
      text: label.querySelector(".tier-label-text")
    })).filter(entry => entry.text);
    for (const { label, text } of entries) {
      const fullLabel = label.dataset.fullLabel || text.textContent || "";
      text.textContent = fullLabel;
      label.dataset.abbreviated = "false";
      label.removeAttribute("tabindex");
      label.removeAttribute("aria-label");
    }
    const compact = entries.filter(({ text }) => text.scrollWidth > text.clientWidth + 0.5);
    for (const { label, text } of compact) {
      const fullLabel = label.dataset.fullLabel || text.textContent || "";
      text.textContent = compactTierLabel(fullLabel, label.dataset.tierId || "");
      label.dataset.abbreviated = "true";
      label.tabIndex = 0;
      label.setAttribute("aria-label", fullLabel);
    }
    return;
  }

  const available = tierLabelAvailableTextWidth();
  const boost = legibleTextScale();
  for (const { label, text } of mobileTierLabelEntriesCache) {
    const fullLabel = label.dataset.fullLabel || text.textContent || "";
    const needsCompact = tierLabelBaseTextWidth(fullLabel) * boost > available + 0.5;
    const desiredText = needsCompact ? compactTierLabel(fullLabel, label.dataset.tierId || "") : fullLabel;
    const desiredFlag = needsCompact ? "true" : "false";
    if (text.textContent !== desiredText) text.textContent = desiredText;
    if (label.dataset.abbreviated !== desiredFlag) label.dataset.abbreviated = desiredFlag;
    if (needsCompact) {
      if (label.tabIndex !== 0) label.tabIndex = 0;
      if (label.getAttribute("aria-label") !== fullLabel) label.setAttribute("aria-label", fullLabel);
    } else {
      if (label.hasAttribute("tabindex")) label.removeAttribute("tabindex");
      if (label.hasAttribute("aria-label")) label.removeAttribute("aria-label");
    }
  }
}
function mobileCardNameTokens(name) {
  const clean = sanitizeText(name);
  if (!clean) return [];
  const tokens = [];
  let latin = "";
  const flushLatin = () => {
    if (!latin) return;
    tokens.push({ text: latin, space: false });
    latin = "";
  };

  for (const char of clean) {
    if (/\s/u.test(char)) {
      flushLatin();
      if (tokens.length && !tokens[tokens.length - 1].space) tokens.push({ text: " ", space: true });
      continue;
    }
    if (/[\p{Script=Latin}\p{Number}]/u.test(char)) {
      latin += char;
      continue;
    }
    if (/[-/_]/u.test(char)) {
      flushLatin();
      const previous = tokens[tokens.length - 1];
      if (previous && !previous.space) previous.text += char;
      else tokens.push({ text: char, space: false });
      continue;
    }
    flushLatin();
    tokens.push({ text: char, space: false });
  }
  flushLatin();
  while (tokens.length && tokens[tokens.length - 1].space) tokens.pop();
  return tokens;
}
function rebuildMobileCardPresentationMetrics() {
  mobileCardNameMetricsById.clear();
  if (!isMobileTouchViewport() || !(state.units || []).length) return;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;
  const bodyFontFamily = getComputedStyle(document.body).fontFamily
    || 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.font = `900 11px ${bodyFontFamily}`;
  for (const unit of state.units || []) {
    const tokens = mobileCardNameTokens(unit.name).map(token => ({
      ...token,
      width: context.measureText(token.text).width
    }));
    mobileCardNameMetricsById.set(unit.id, tokens);
  }
}
function mobileCardNameLineCount(unit, textBoost) {
  const tokens = mobileCardNameMetricsById.get(unit?.id) || [];
  if (!tokens.length) return 1;
  const contentWidth = ICON_W - 18;
  let lines = 1;
  let lineWidth = 0;
  let pendingSpaceWidth = 0;
  for (const token of tokens) {
    const tokenWidth = token.width * textBoost;
    if (token.space) {
      if (lineWidth > 0) pendingSpaceWidth = tokenWidth;
      continue;
    }
    const proposed = lineWidth + pendingSpaceWidth + tokenWidth;
    if (lineWidth > 0 && proposed > contentWidth + 0.01) {
      lines += 1;
      lineWidth = tokenWidth;
    } else {
      lineWidth = proposed;
    }
    pendingSpaceWidth = 0;
  }
  return lines;
}
function mobileUnitCardDetailState(unit, scale = zoomScale) {
  const safeScale = Math.max(0.001, Number(scale) || 1);
  const visualSize = ICON_W * safeScale;
  const tagCount = Math.min(MAX_TAGS, unit?.tags?.length || 0);
  const hasTags = tagCount > 0;
  const textBoost = legibleTextScale(safeScale);

  // Mirror the immutable card CSS geometry from data + premeasured base text
  // widths only. No clone, getBoundingClientRect(), clientWidth or scrollWidth
  // is allowed in the post-pinch mobile presentation path.
  const tagRows = Math.min(tagCount, TAGS_PER_COLUMN);
  const tagHeight = Math.max(17, 9 * textBoost + 6);
  const tagsHeight = hasTags ? tagRows * tagHeight + Math.max(0, tagRows - 1) * 4 : 0;
  const tagsBottom = hasTags ? 8 + tagsHeight : Number.NEGATIVE_INFINITY;

  const nameLines = mobileCardNameLineCount(unit, textBoost);
  const nameHeight = Math.max(44, 33 + nameLines * 11 * textBoost * 1.12);
  const nameTop = 175 - nameHeight;
  const renderedNameGap = hasTags ? (nameTop - tagsBottom) * safeScale : Number.POSITIVE_INFINITY;

  if (isMs(unit)) {
    const renderedBottomGap = hasTags ? (176 - tagsBottom) * safeScale : Number.POSITIVE_INFINITY;
    const tagsFitCard = !hasTags || renderedBottomGap >= CARD_TAGS_MIN_BOTTOM_GAP;
    const nameHasRoom = visualSize >= CARD_NAME_MIN_VISUAL_SIZE
      && (!hasTags || renderedNameGap >= CARD_NAME_MIN_TAG_GAP);
    const iconOnly = visualSize < CARD_DETAILS_MIN_VISUAL_SIZE || !tagsFitCard;
    return { iconOnly, tagsOnly: !iconOnly && !nameHasRoom };
  }

  const detailsCollide = hasTags && renderedNameGap <= 2;
  return { iconOnly: visualSize < CARD_DETAILS_MIN_VISUAL_SIZE || detailsCollide, tagsOnly: false };
}
function liveUnitCardForId(unitId) {
  return (metaOwnerElementIndex.get(unitId) || []).find(element => element.classList?.contains("unit-card") && element.dataset.id === unitId) || null;
}
function applyUnitCardDetailState(unitId, detail) {
  const card = liveUnitCardForId(unitId);
  if (!card || !detail) return;
  card.classList.toggle("icon-only", Boolean(detail.iconOnly));
  card.classList.toggle("tags-only", Boolean(detail.tagsOnly));
}
function applyUnitCardDetailStates(states) {
  if (!states) return;
  for (const [unitId, detail] of states) applyUnitCardDetailState(unitId, detail);
}

function updateUnitCardDetailVisibility(precomputedStates = null) {
  if (!els.roadmap) return;
  if (isMobileTouchViewport()) {
    if (precomputedStates) {
      applyUnitCardDetailStates(precomputedStates);
    } else {
      for (const unit of state.units || []) applyUnitCardDetailState(unit.id, mobileUnitCardDetailState(unit));
    }
    return;
  }
  const unitsById = new Map((state.units || []).map(unit => [unit.id, unit]));
  const measurements = [];
  for (const card of els.roadmap.querySelectorAll(".unit-card")) {
    const unit = unitsById.get(card.dataset.id);
    const cardRect = card.getBoundingClientRect();
    const tags = card.querySelector(".tags");
    const nameplate = card.querySelector(".nameplate");
    const tagsRect = tags?.children.length ? tags.getBoundingClientRect() : null;
    const nameRect = nameplate?.getBoundingClientRect() || null;
    measurements.push({ card, unit, cardRect, tagsRect, nameRect, hasTags: !!tags?.children.length });
  }
  for (const { card, unit, cardRect, tagsRect, nameRect, hasTags } of measurements) {
    const visualSize = Math.min(cardRect.width, cardRect.height);
    if (isMs(unit)) {
      const tagsFitCard = !hasTags || !tagsRect || tagsRect.bottom <= cardRect.bottom - CARD_TAGS_MIN_BOTTOM_GAP;
      const nameHasRoom = visualSize >= CARD_NAME_MIN_VISUAL_SIZE
        && (!tagsRect || !nameRect || nameRect.top - tagsRect.bottom >= CARD_NAME_MIN_TAG_GAP);
      const iconOnly = visualSize < CARD_DETAILS_MIN_VISUAL_SIZE || !tagsFitCard;
      card.classList.toggle("icon-only", iconOnly);
      card.classList.toggle("tags-only", !iconOnly && !nameHasRoom);
      continue;
    }
    const detailsCollide = !!(hasTags && tagsRect && nameRect && tagsRect.bottom >= nameRect.top - 2);
    card.classList.toggle("icon-only", visualSize < CARD_DETAILS_MIN_VISUAL_SIZE || detailsCollide);
    card.classList.remove("tags-only");
  }
}
function mobileMetaLabelPresentation(entry, scale = zoomScale) {
  const { bar, label } = entry || {};
  if (!bar || !label) return null;
  const fullLabel = label.dataset.fullLabel || label.textContent || "";
  const unitLabel = label.dataset.unitLabel || fullLabel;
  const metrics = label.__uceMetaLabelMetrics || immutableMetaLabelMetrics(bar, label);
  label.__uceMetaLabelMetrics = metrics;
  const boost = barLabelTextScale(scale);
  const renderedHeight = BAR_H * scale;
  let desiredText = fullLabel;
  let shouldHide = renderedHeight < META_LABEL_MIN_RENDERED_HEIGHT;
  if (!shouldHide && metrics.fullBaseWidth * boost > metrics.available + 1) {
    desiredText = unitLabel;
    if (metrics.unitBaseWidth * boost > metrics.available + 1) shouldHide = true;
  }
  return { desiredText, shouldHide };
}
function applyMobileMetaLabelPresentation(entry, scale = zoomScale) {
  const label = entry?.label;
  const presentation = mobileMetaLabelPresentation(entry, scale);
  if (!label || !presentation) return;
  if (label.textContent !== presentation.desiredText) label.textContent = presentation.desiredText;
  if (label.hidden !== presentation.shouldHide) label.hidden = presentation.shouldHide;
}
function updateMetaBarLabelVisibility() {
  if (!els.roadmap) return;
  const mobile = isMobileTouchViewport();
  const entries = mobile
    ? mobileMetaLabelEntriesCache
    : Array.from(els.roadmap.querySelectorAll(".meta-bar")).map(bar => ({
        bar,
        label: bar.querySelector(".bar-label")
      })).filter(entry => entry.label);

  if (!mobile) {
    // Preserve desktop's established direct rendered-geometry behavior.
    for (const { label } of entries) {
      label.hidden = false;
      label.textContent = label.dataset.fullLabel || label.textContent || "";
    }
    const needsUnitLabel = [];
    const shouldHide = new Set();
    for (const { bar, label } of entries) {
      const renderedHeight = bar.getBoundingClientRect().height;
      if (renderedHeight < META_LABEL_MIN_RENDERED_HEIGHT) {
        shouldHide.add(label);
        continue;
      }
      if (label.scrollWidth > label.clientWidth + 1) needsUnitLabel.push(label);
    }
    for (const label of needsUnitLabel) label.textContent = label.dataset.unitLabel || label.dataset.fullLabel || "";
    for (const label of needsUnitLabel) {
      if (label.scrollWidth > label.clientWidth + 1) shouldHide.add(label);
    }
    for (const { label } of entries) label.hidden = shouldHide.has(label);
    return;
  }

  for (const entry of entries) applyMobileMetaLabelPresentation(entry, zoomScale);

}

function toggleMetaStatusFilter(statusId) {
  if (activeMetaStatusFilters.has(statusId)) activeMetaStatusFilters.delete(statusId);
  else activeMetaStatusFilters.add(statusId);
  saveViewerLocalState();
  applyMetaFilters();
}
function effectiveMetaUnitFilters() {
  return customUnitFilterEditing ? customUnitFilterDraft : activeMetaUnitFilters;
}
function enterCustomUnitFilterMode() {
  if (customUnitFilterEditing) return;
  customUnitFilterDraft = new Set(activeMetaUnitFilters);
  customUnitFilterEditing = true;
  setMetaOwnerHover(null);
  setMetaOwnerFocus(null);
  setMetaOwnerTouchSelection(null);
  hideTooltip(true);
  hideAppTooltip(true);
  updateCustomUnitFilterControls();
  applyMetaFilters();
  els.roadmap?.classList.add("custom-unit-filter-editing");
}
function saveCustomUnitFilter() {
  if (!customUnitFilterEditing) return;
  activeMetaUnitFilters.clear();
  customUnitFilterDraft.forEach(unitId => activeMetaUnitFilters.add(unitId));
  customUnitFilterEditing = false;
  customUnitFilterDraft = new Set();
  els.roadmap?.classList.remove("custom-unit-filter-editing");
  saveViewerLocalState();
  applyMetaFilters();
  updateCustomUnitFilterControls();
}
function cancelCustomUnitFilterMode() {
  if (!customUnitFilterEditing) return;
  customUnitFilterEditing = false;
  customUnitFilterDraft = new Set();
  els.roadmap?.classList.remove("custom-unit-filter-editing");
  applyMetaFilters();
  updateCustomUnitFilterControls();
}
function clearCustomUnitFilterDraft() {
  if (!customUnitFilterEditing) return;
  customUnitFilterDraft.clear();
  applyMetaFilters();
  updateCustomUnitFilterControls();
}
function toggleCustomUnitFilterDraft(unit) {
  const owner = metaOwnerForUnit(unit);
  if (!owner?.id || !hasVisibleMetaSegments(owner)) return;
  if (customUnitFilterDraft.has(owner.id)) customUnitFilterDraft.delete(owner.id);
  else customUnitFilterDraft.add(owner.id);
  applyMetaFilters();
  updateCustomUnitFilterControls();
}
function updateCustomUnitFilterControls() {
  const count = customUnitFilterEditing ? customUnitFilterDraft.size : activeMetaUnitFilters.size;
  if (els.customUnitFilterButton) {
    els.customUnitFilterButton.textContent = `Filter Units${!customUnitFilterEditing && count ? ` (${count})` : ""}`;
    els.customUnitFilterButton.classList.toggle("active", !customUnitFilterEditing && count > 0);
    els.customUnitFilterButton.classList.toggle("hidden", customUnitFilterEditing);
    els.customUnitFilterButton.setAttribute("aria-pressed", !customUnitFilterEditing && count > 0 ? "true" : "false");
    els.customUnitFilterButton.setAttribute("aria-expanded", customUnitFilterEditing ? "true" : "false");
  }
  if (els.customUnitFilterStatus) {
    els.customUnitFilterStatus.textContent = isMobileTouchViewport()
      ? (count ? `${count} selected` : "None selected")
      : `Selecting units · ${count ? `${count} selected` : "none selected"}`;
    els.customUnitFilterStatus.classList.toggle("hidden", !customUnitFilterEditing);
  }
  els.customUnitFilterSaveButton?.classList.toggle("hidden", !customUnitFilterEditing);
  els.customUnitFilterClearButton?.classList.toggle("hidden", !customUnitFilterEditing);
  els.customUnitFilterCancelButton?.classList.toggle("hidden", !customUnitFilterEditing);
  els.customUnitFilterHint?.classList.toggle("hidden", !customUnitFilterEditing);
  els.legendPanel?.classList.toggle("custom-filter-editing", customUnitFilterEditing);
}
function applyMetaFilters() {
  const unitFilters = effectiveMetaUnitFilters();
  const hasStatusFilters = activeMetaStatusFilters.size > 0;
  const hasUnitFilters = unitFilters.size > 0;
  const filtersActive = hasStatusFilters || hasUnitFilters;
  els.legend?.querySelectorAll(".legend-item[data-status-id]").forEach(item => {
    const selected = activeMetaStatusFilters.has(item.dataset.statusId);
    item.classList.toggle("meta-filter-selected", selected);
    item.classList.toggle("meta-filter-muted", hasStatusFilters && !selected);
    item.setAttribute("aria-pressed", selected ? "true" : "false");
    const status = getStatuses().find(candidate => candidate.id === item.dataset.statusId);
    if (status) {
      const description = String(status.description || "").trim();
      item.setAttribute("aria-label", `${status.label}. ${selected ? "Active" : "Inactive"} PVP meta filter.${description ? ` ${description}` : ""}`);
    }
  });
  els.roadmap?.querySelectorAll(".meta-bar[data-unit-id]").forEach(bar => {
    const unitMatches = !hasUnitFilters || unitFilters.has(bar.dataset.unitId);
    const statusMatches = !hasStatusFilters || activeMetaStatusFilters.has(bar.dataset.statusId);
    const matches = unitMatches && statusMatches;
    bar.classList.toggle("meta-filter-selected", filtersActive && matches);
    bar.classList.toggle("meta-filter-muted", filtersActive && !matches);
  });
  els.roadmap?.querySelectorAll(".meta-link[data-unit-id]").forEach(link => {
    const unitMatches = !hasUnitFilters || unitFilters.has(link.dataset.unitId);
    const statusMatches = !hasStatusFilters || activeMetaStatusFilters.has(link.dataset.statusFrom) || activeMetaStatusFilters.has(link.dataset.statusTo);
    const matches = unitMatches && statusMatches;
    link.classList.toggle("meta-filter-selected", filtersActive && matches);
    link.classList.toggle("meta-filter-muted", filtersActive && !matches);
  });
  els.roadmap?.querySelectorAll(".meta-owner-tether[data-unit-id], .meta-owner-node[data-unit-id], .lane-track[data-unit-id]").forEach(element => {
    const unitId = element.dataset.unitId;
    const unit = unitByIdIndex.get(unitId) || state.units.find(candidate => candidate.id === unitId);
    const unitMatches = !hasUnitFilters || unitFilters.has(unitId);
    const statusMatches = !hasStatusFilters || sortedVisibleSegments(unit).some(segment => activeMetaStatusFilters.has(segment.statusId));
    const matches = unitMatches && statusMatches;
    element.classList.toggle("meta-filter-selected", filtersActive && matches);
    element.classList.toggle("meta-filter-muted", filtersActive && !matches);
  });
  els.roadmap?.querySelectorAll(".unit-card[data-meta-owner-id]").forEach(card => {
    const ownerId = card.dataset.metaOwnerId;
    card.classList.toggle("custom-filter-picked", customUnitFilterEditing && customUnitFilterDraft.has(ownerId));
    card.classList.toggle("custom-filter-eligible", customUnitFilterEditing);
    card.classList.toggle("custom-filter-active-selected", !customUnitFilterEditing && hasUnitFilters && unitFilters.has(ownerId));
  });
}
function updateAdaptiveRoadmapPresentation(precomputedCardStates = null) {
  updateAdaptiveTierLabels();
  updateUnitCardDetailVisibility(precomputedCardStates);
  updateMetaBarLabelVisibility();
}
function setMessage(text) {
  if (!text) {
    els.message.classList.add("hidden");
    els.message.textContent = "";
  } else {
    els.message.textContent = text;
    els.message.classList.remove("hidden");
  }
}

function touchPairGeometry() {
  const points = [...touchPoints.values()].slice(0, 2);
  if (points.length < 2) return null;
  const [a, b] = points;
  return {
    midpointX: (a.x + b.x) / 2,
    midpointY: (a.y + b.y) / 2,
    distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y))
  };
}
function clearTouchStageTransform() {
  if (!els.chartStage) return;
  if (useMobileTransformCamera()) applyMobileCameraTransform();
  else els.chartStage.style.transform = "";
}
function scheduleTouchGestureFrame() {
  if (touchGestureFrame) return;
  touchGestureFrame = requestAnimationFrame(flushTouchGestureFrame);
}
function applyPinchPreviewFrame(frame) {
  if (!frame || !pinchGesture) return;
  const nextZoom = clamp(Number(frame.zoom) || zoomScale, minimumZoom(), MAX_ZOOM);
  const localX = frame.midpointX - pinchGesture.rectLeft;
  const localY = frame.midpointY - pinchGesture.rectTop;

  if (useMobileTransformCamera()) {
    const camera = clampMobileCamera(
      localX - pinchGesture.anchorContentX * nextZoom,
      localY - pinchGesture.anchorContentY * nextZoom,
      nextZoom
    );
    mobileCameraX = camera.x;
    mobileCameraY = camera.y;
    els.chartStage.style.transform = `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${nextZoom})`;
    pinchGesture.finalZoom = nextZoom;
    pinchGesture.targetCameraX = camera.x;
    pinchGesture.targetCameraY = camera.y;
    if (els.zoomLabel) els.zoomLabel.textContent = `${Math.round(nextZoom * 100)}%`;
    return;
  }

  const ratio = nextZoom / pinchGesture.startZoom;
  const maxScrollLeft = Math.max(0, pinchGesture.baseWidth * nextZoom - pinchGesture.viewportWidth);
  const maxScrollTop = Math.max(0, pinchGesture.baseHeight * nextZoom - pinchGesture.viewportHeight);
  const targetScrollLeft = clamp(pinchGesture.anchorStageX * ratio - localX, 0, maxScrollLeft);
  const targetScrollTop = clamp(pinchGesture.anchorStageY * ratio - localY, 0, maxScrollTop);
  const translateX = pinchGesture.startScrollLeft - targetScrollLeft;
  const translateY = pinchGesture.startScrollTop - targetScrollTop;
  els.chartStage.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${ratio})`;
  pinchGesture.finalZoom = nextZoom;
  pinchGesture.targetScrollLeft = targetScrollLeft;
  pinchGesture.targetScrollTop = targetScrollTop;
  if (els.zoomLabel) els.zoomLabel.textContent = `${Math.round(nextZoom * 100)}%`;
}
function flushTouchGestureFrame() {
  touchGestureFrame = 0;
  if (pendingTouchPinchFrame && pinchGesture) {
    const frame = pendingTouchPinchFrame;
    pendingTouchPinchFrame = null;
    applyPinchPreviewFrame(frame);
    return;
  }

  if (pendingTouchPanFrame && touchPanGesture) {
    const frame = pendingTouchPanFrame;
    pendingTouchPanFrame = null;
    if (useMobileTransformCamera()) {
      const camera = clampMobileCamera(frame.x, frame.y, zoomScale);
      mobileCameraX = camera.x;
      mobileCameraY = camera.y;
      els.chartStage.style.transform = `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${zoomScale})`;
      touchPanGesture.targetCameraX = camera.x;
      touchPanGesture.targetCameraY = camera.y;
      return;
    }
    // Keep one-finger navigation on the scroll-backed camera. The persistent
    // transform camera is already disabled after real-iPhone regressions; avoiding
    // even a temporary whole-stage transform during ordinary drag also keeps WebKit
    // from promoting/rasterizing the full roadmap just to move the viewport.
    els.chartScroll.scrollLeft = frame.scrollLeft;
    els.chartScroll.scrollTop = frame.scrollTop;
    touchPanGesture.targetScrollLeft = frame.scrollLeft;
    touchPanGesture.targetScrollTop = frame.scrollTop;
  }
}
function flushPendingTouchGestureFrame() {
  if (touchGestureFrame) {
    cancelAnimationFrame(touchGestureFrame);
    touchGestureFrame = 0;
  }
  flushTouchGestureFrame();
}
function beginTouchPan(pointerId, point) {
  if (!point) return;
  cancelDeferredTouchZoomPresentation();
  pendingTouchPanFrame = null;
  if (useMobileTransformCamera()) {
    touchPanGesture = {
      pointerId,
      startX: point.x,
      startY: point.y,
      startCameraX: mobileCameraX,
      startCameraY: mobileCameraY,
      targetCameraX: mobileCameraX,
      targetCameraY: mobileCameraY,
      moved: false
    };
    return;
  }
  touchPanGesture = {
    pointerId,
    startX: point.x,
    startY: point.y,
    startScrollLeft: els.chartScroll.scrollLeft,
    startScrollTop: els.chartScroll.scrollTop,
    targetScrollLeft: els.chartScroll.scrollLeft,
    targetScrollTop: els.chartScroll.scrollTop,
    maxScrollLeft: Math.max(0, baseChartWidth() * zoomScale - els.chartScroll.clientWidth),
    maxScrollTop: Math.max(0, baseChartHeight() * zoomScale - els.chartScroll.clientHeight),
    moved: false
  };
}
function commitTouchPanVisual() {
  if (!touchPanGesture) return;
  flushPendingTouchGestureFrame();
  if (useMobileTransformCamera()) {
    mobileCameraX = Number.isFinite(touchPanGesture.targetCameraX) ? touchPanGesture.targetCameraX : touchPanGesture.startCameraX;
    mobileCameraY = Number.isFinite(touchPanGesture.targetCameraY) ? touchPanGesture.targetCameraY : touchPanGesture.startCameraY;
    applyMobileCameraTransform(mobileCameraX, mobileCameraY, zoomScale);
    return;
  }
  const targetScrollLeft = Number.isFinite(touchPanGesture.targetScrollLeft)
    ? touchPanGesture.targetScrollLeft
    : touchPanGesture.startScrollLeft;
  const targetScrollTop = Number.isFinite(touchPanGesture.targetScrollTop)
    ? touchPanGesture.targetScrollTop
    : touchPanGesture.startScrollTop;
  clearTouchStageTransform();
  els.chartScroll.scrollLeft = targetScrollLeft;
  els.chartScroll.scrollTop = targetScrollTop;
}
function cancelWebKitPinchBurstSettle({ releaseLayer = false } = {}) {
  if (webKitPinchBurstSettleTimer) {
    clearTimeout(webKitPinchBurstSettleTimer);
    webKitPinchBurstSettleTimer = 0;
  }
  if (webKitPinchBurstSettleFrame) {
    cancelAnimationFrame(webKitPinchBurstSettleFrame);
    webKitPinchBurstSettleFrame = 0;
  }
  if (releaseLayer) els.chartScroll?.classList.remove("touch-gesturing");
}
function settleDeferredMobileStageGeometry() {
  if (!mobileStageShrinkPending || useMobileTransformCamera()) return;
  const width = baseChartWidth();
  const height = baseChartHeight();
  els.chartStage.style.width = `${width * zoomScale}px`;
  els.chartStage.style.height = `${height * zoomScale}px`;
  mobileStageGeometryScale = zoomScale;
  mobileStageShrinkPending = false;
  webKitPinchBurstContinuation = false;

  // The stage may have deliberately kept a larger scroll extent throughout a
  // rapid zoom-out burst. Clamp only once when that retained extent is released.
  const maxScrollLeft = Math.max(0, width * zoomScale - els.chartScroll.clientWidth);
  const maxScrollTop = Math.max(0, height * zoomScale - els.chartScroll.clientHeight);
  if (els.chartScroll.scrollLeft > maxScrollLeft) els.chartScroll.scrollLeft = maxScrollLeft;
  if (els.chartScroll.scrollTop > maxScrollTop) els.chartScroll.scrollTop = maxScrollTop;
}
function finishSettledWebKitPinchPresentation() {
  webKitPinchBurstSettleFrame = 0;
  if (touchInteractionIsActive()) {
    scheduleWebKitPinchBurstSettle();
    return;
  }
  els.chartScroll?.classList.remove("touch-gesturing");
  if (!touchZoomSemanticDirty || touchZoomSemanticPresentationBlocked()) return;

  // This is the same settled semantic work normally scheduled by the generic
  // mobile timer, but native WebKit pinch already waited through the burst idle
  // window. Do not add a second 420ms delay after the final finger lift.
  applyZoomSemanticVariables();
  updateAdaptiveTierLabels();
  scheduleMobileZoomStyleWork();
  touchZoomSemanticDirty = false;
}
function scheduleWebKitPinchBurstSettle() {
  if (!useWebKitNativeGestureInput || !isMobileTouchViewport()) return;
  cancelWebKitPinchBurstSettle();
  webKitPinchBurstSettleTimer = setTimeout(() => {
    webKitPinchBurstSettleTimer = 0;
    if (touchInteractionIsActive()) {
      scheduleWebKitPinchBurstSettle();
      return;
    }

    // Zoom-out commits keep the previous (larger) scroll extent during a rapid
    // lift/re-pinch burst. Shrink it once, after input has actually settled, so
    // WebKit does not repeatedly rebuild the scroll tree/backing surface between
    // contacts. The roadmap itself was already visually scaled at each gesture end.
    settleDeferredMobileStageGeometry();
    webKitPinchBurstSettleFrame = requestAnimationFrame(finishSettledWebKitPinchPresentation);
  }, TOUCH_ZOOM_SEMANTIC_SETTLE_MS);
}
function commitWebKitNativePinchVisual(nextZoom, targetScrollLeft, targetScrollTop) {
  const previousZoom = zoomScale;
  clearTouchStageTransform();
  zoomScale = nextZoom;

  // A normal single pinch still commits exact scroll geometry immediately. Only
  // the second and later pinches in a rapid lift/re-pinch burst reuse the already
  // valid larger extent. That keeps the ordinary post-pinch scroll bounds exact,
  // while removing repeated large-stage shrink/layout work from the failure case.
  // If a continuation pinch grows beyond the retained extent, expand immediately
  // so native scroll bounds can never be too small.
  if (!webKitPinchBurstContinuation || zoomScale > mobileStageGeometryScale + 0.0001) {
    applyZoomGeometry();
  } else {
    els.chartStage.style.transform = "";
    els.roadmap.style.transform = `scale(${zoomScale})`;
    if (els.zoomLabel) els.zoomLabel.textContent = `${Math.round(zoomScale * 100)}%`;
    mobileStageShrinkPending = zoomScale < mobileStageGeometryScale - 0.0001;
  }

  els.chartScroll.scrollLeft = targetScrollLeft;
  els.chartScroll.scrollTop = targetScrollTop;
  if (Math.abs(previousZoom - zoomScale) > 0.0001) touchZoomSemanticDirty = true;
}

function commitTouchPinchVisual() {
  if (!pinchGesture) return;
  flushPendingTouchGestureFrame();
  const nextZoom = clamp(Number(pinchGesture.finalZoom) || pinchGesture.startZoom, minimumZoom(), MAX_ZOOM);
  if (useMobileTransformCamera()) {
    zoomScale = nextZoom;
    mobileCameraX = Number.isFinite(pinchGesture.targetCameraX) ? pinchGesture.targetCameraX : mobileCameraX;
    mobileCameraY = Number.isFinite(pinchGesture.targetCameraY) ? pinchGesture.targetCameraY : mobileCameraY;
    applyMobileCameraTransform(mobileCameraX, mobileCameraY, zoomScale);
    if (els.zoomLabel) els.zoomLabel.textContent = `${Math.round(zoomScale * 100)}%`;
    markTouchZoomSemanticDirty();
    return;
  }
  const targetScrollLeft = Number.isFinite(pinchGesture.targetScrollLeft) ? pinchGesture.targetScrollLeft : pinchGesture.startScrollLeft;
  const targetScrollTop = Number.isFinite(pinchGesture.targetScrollTop) ? pinchGesture.targetScrollTop : pinchGesture.startScrollTop;
  if (useWebKitNativeGestureInput) {
    commitWebKitNativePinchVisual(nextZoom, targetScrollLeft, targetScrollTop);
    return;
  }
  clearTouchStageTransform();
  zoomScale = nextZoom;
  applyZoomGeometry();
  els.chartScroll.scrollLeft = targetScrollLeft;
  els.chartScroll.scrollTop = targetScrollTop;
  markTouchZoomSemanticDirty();
}
function beginPinchGestureAt(midpointX, midpointY, distance = 1) {
  cancelDeferredTouchZoomPresentation();
  flushPendingTouchGestureFrame();
  clearTouchStageTransform();

  const rect = els.chartScroll.getBoundingClientRect();
  const localX = midpointX - rect.left;
  const localY = midpointY - rect.top;
  const startScrollLeft = els.chartScroll.scrollLeft;
  const startScrollTop = els.chartScroll.scrollTop;
  pinchGesture = {
    startDistance: Math.max(1, Number(distance) || 1),
    lastDistance: Math.max(1, Number(distance) || 1),
    previewZoom: zoomScale,
    startZoom: zoomScale,
    startScrollLeft,
    startScrollTop,
    startCameraX: mobileCameraX,
    startCameraY: mobileCameraY,
    anchorContentX: useMobileTransformCamera() ? (localX - mobileCameraX) / zoomScale : null,
    anchorContentY: useMobileTransformCamera() ? (localY - mobileCameraY) / zoomScale : null,
    anchorStageX: startScrollLeft + localX,
    anchorStageY: startScrollTop + localY,
    rectLeft: rect.left,
    rectTop: rect.top,
    baseWidth: baseChartWidth(),
    baseHeight: baseChartHeight(),
    viewportWidth: els.chartScroll.clientWidth,
    viewportHeight: els.chartScroll.clientHeight,
    finalZoom: zoomScale,
    targetScrollLeft: startScrollLeft,
    targetScrollTop: startScrollTop,
    targetCameraX: mobileCameraX,
    targetCameraY: mobileCameraY,
    moved: false
  };
  pendingTouchPinchFrame = null;
  els.chartScroll.classList.add("touch-gesturing", "touch-pinching");
}
function beginPinchGesture() {
  const geometry = touchPairGeometry();
  if (!geometry) return;
  beginPinchGestureAt(geometry.midpointX, geometry.midpointY, geometry.distance);
}
function markWebKitTouchActive(event) {
  if (!useWebKitNativeGestureInput) return;
  const touchCount = event.touches?.length || 0;
  if (touchCount > 0) {
    if (touchCount === 1 && !webKitPinchGesture && !pinchGesture) webKitNativeTouchHadPinch = false;
    els.chartScroll.classList.add("touch-active");
    cancelDeferredTouchZoomPresentation();
  } else {
    els.chartScroll.classList.remove("touch-active");
  }
}
function finishWebKitPinchGesture() {
  const hadActivePinch = Boolean(webKitPinchGesture || pinchGesture);
  webKitPinchGesture = null;
  if (pinchGesture) commitTouchPinchVisual();
  pinchGesture = null;
  pendingTouchPinchFrame = null;
  clearTouchStageTransform();
  // Keep the already-created compositor layer warm across a rapid lift/re-pinch
  // burst. Repeatedly demoting/promoting the giant chart stage is unnecessary
  // layer/backing-store churn; release it once the same idle window used by mobile
  // zoom semantics confirms the burst is over.
  els.chartScroll.classList.remove("touch-pinching");
  if (hadActivePinch) {
    suppressTouchClickUntil = performance.now() + 400;
    scheduleWebKitPinchBurstSettle();
  }
}
function endWebKitTouchActive(event) {
  if (!useWebKitNativeGestureInput) return;
  markWebKitTouchActive(event);
  // GestureEvent is proprietary WebKit input. Treat the standards-based touch
  // count as a teardown backstop so a missing/out-of-order gestureend cannot
  // leave the preview transform and pinch state stuck after one finger lifts.
  if ((event.touches?.length || 0) < 2 && (webKitPinchGesture || pinchGesture)) {
    finishWebKitPinchGesture();
  }
  if ((event.touches?.length || 0) === 0) {
    const hadPinch = webKitNativeTouchHadPinch;
    webKitNativeTouchHadPinch = false;
    if (hadPinch) {
      // Native pinch owns its own burst-settle lifecycle so repeated lift/re-pinch
      // input cannot start layout/semantic catch-up between contacts.
      scheduleWebKitPinchBurstSettle();
    } else if (!("onscrollend" in els.chartScroll)) {
      maybeScheduleDeferredTouchZoomPresentation();
      if (!touchZoomSemanticDirty) scheduleMobileViewportSemanticCatchup();
    }
  }
}
function cancelWebKitTouchActive() {
  if (!useWebKitNativeGestureInput) return;
  webKitNativeTouchHadPinch = false;
  webKitPinchBurstContinuation = false;
  els.chartScroll.classList.remove("touch-active");
  finishWebKitPinchGesture();
  cancelWebKitPinchBurstSettle({ releaseLayer: true });
  settleDeferredMobileStageGeometry();
  maybeScheduleDeferredTouchZoomPresentation();
}

function beginWebKitPinchGesture(event) {
  if (!useWebKitNativeGestureInput || !isMobileTouchViewport()) return;
  cancelInitialFitToWidth();
  webKitPinchBurstContinuation = Boolean(
    webKitPinchBurstSettleTimer || webKitPinchBurstSettleFrame || mobileStageShrinkPending
  );
  cancelWebKitPinchBurstSettle();
  event.preventDefault();
  // A new native gesture is authoritative. Finalize any orphaned prior preview
  // before establishing the new baseline, then keep semantic fitting deferred.
  if (webKitPinchGesture || pinchGesture) finishWebKitPinchGesture();
  cancelDeferredTouchZoomPresentation();
  suppressTouchClickUntil = performance.now() + 400;

  // GestureEvent is independent of the PointerEvent stream that native scrolling
  // may have cancelled. That lets WebKit keep its native single-finger momentum
  // scroll while giving us a stable, target-independent pinch scale.
  touchSelectionTapCandidate = null;
  touchPoints.clear();
  touchPanGesture = null;
  pendingTouchPanFrame = null;
  const scale = Math.max(0.001, Number(event.scale) || 1);
  webKitNativeTouchHadPinch = true;
  webKitPinchGesture = { lastScale: scale };
  const clientX = Number(event.clientX);
  const clientY = Number(event.clientY);
  beginPinchGestureAt(Number.isFinite(clientX) ? clientX : innerWidth / 2, Number.isFinite(clientY) ? clientY : innerHeight / 2, 1);
}
function moveWebKitPinchGesture(event) {
  if (!useWebKitNativeGestureInput || !webKitPinchGesture || !pinchGesture) return;
  event.preventDefault();
  const currentScale = Math.max(0.001, Number(event.scale) || webKitPinchGesture.lastScale || 1);
  const previousScale = Math.max(0.001, Number(webKitPinchGesture.lastScale) || currentScale);
  const factor = clamp(currentScale / previousScale, 0.5, 2);
  webKitPinchGesture.lastScale = currentScale;
  pinchGesture.previewZoom = clamp(
    (Number(pinchGesture.previewZoom) || pinchGesture.startZoom) * factor,
    minimumZoom(),
    MAX_ZOOM
  );
  pinchGesture.moved = true;
  suppressTouchClickUntil = performance.now() + 400;

  // Apply the latest native gesture scale immediately. WebKit batches the style
  // mutation for presentation; avoiding an extra rAF hop removes a frame of input
  // latency on iOS, where web content may otherwise update less frequently than a
  // 120 Hz native UIKit gesture.
  const clientX = Number(event.clientX);
  const clientY = Number(event.clientY);
  applyPinchPreviewFrame({
    zoom: pinchGesture.previewZoom,
    midpointX: Number.isFinite(clientX) ? clientX : innerWidth / 2,
    midpointY: Number.isFinite(clientY) ? clientY : innerHeight / 2
  });
}
function endWebKitPinchGesture(event) {
  if (!useWebKitNativeGestureInput) return;
  event.preventDefault();
  if (!webKitPinchGesture && !pinchGesture) return;
  finishWebKitPinchGesture();
}
function beginTouchGesture(event) {
  if (event.pointerType !== "touch") return;
  // The time window below exists only to swallow a click synthesized from the
  // gesture that just ended. A fresh pointerdown is an explicit new user action,
  // so it must immediately regain click eligibility instead of inheriting a
  // 400ms dead period from the previous pan/pinch.
  suppressTouchClickUntil = 0;
  cancelInitialFitToWidth();
  const point = { x: event.clientX, y: event.clientY };
  const backgroundTarget = event.target?.closest?.("#roadmap")
    && !event.target.closest?.(".unit-card, .meta-bar, .tier-label");
  touchSelectionTapCandidate = event.isPrimary !== false && metaOwnerTouchSelectionId && backgroundTarget
    ? { pointerId: event.pointerId, startX: point.x, startY: point.y }
    : null;
  if (useWebKitNativeGestureInput) return;
  // Ignore accidental third+ contacts instead of letting them replace one of the
  // two active pinch points when a finger lifts. The active pair stays stable.
  if (!touchPoints.has(event.pointerId) && touchPoints.size >= 2) {
    touchSelectionTapCandidate = null;
    suppressTouchClickUntil = performance.now() + 400;
    event.preventDefault();
    return;
  }
  touchPoints.set(event.pointerId, point);

  // Keep the entire mobile chart under app control (touch-action:none). A single
  // finger drives the existing scroll-backed camera while two fingers use the
  // temporary pinch preview transform, so the pointer stream stays app-owned
  // without reviving the failed persistent transform-camera architecture.
  if (touchPoints.size === 1) {
    beginTouchPan(event.pointerId, point);
    return;
  }

  if (touchPoints.size === 2) {
    touchSelectionTapCandidate = null;
    if (touchPanGesture) {
      commitTouchPanVisual();
      touchPanGesture = null;
      pendingTouchPanFrame = null;
    }
    beginPinchGesture();
  }
  suppressTouchClickUntil = performance.now() + 400;
  event.preventDefault();
}
function moveTouchGesture(event) {
  if (event.pointerType !== "touch") return;
  if (touchSelectionTapCandidate?.pointerId === event.pointerId
      && Math.hypot(event.clientX - touchSelectionTapCandidate.startX, event.clientY - touchSelectionTapCandidate.startY) > 4) {
    touchSelectionTapCandidate = null;
  }
  if (useWebKitNativeGestureInput || !touchPoints.has(event.pointerId)) return;
  const point = { x: event.clientX, y: event.clientY };
  touchPoints.set(event.pointerId, point);

  if (pinchGesture && touchPoints.size >= 2) {
    const geometry = touchPairGeometry();
    if (!geometry) return;

    // Use incremental distance changes instead of always comparing with the very
    // first pinch distance. This removes the large "dead zone" that otherwise
    // appears after the gesture briefly reaches MIN/MAX zoom and then reverses.
    const previousDistance = Math.max(1, Number(pinchGesture.lastDistance) || geometry.distance);
    const distanceFactor = clamp(geometry.distance / previousDistance, 0.5, 2);
    pinchGesture.lastDistance = geometry.distance;
    pinchGesture.previewZoom = clamp(
      (Number(pinchGesture.previewZoom) || pinchGesture.startZoom) * distanceFactor,
      minimumZoom(),
      MAX_ZOOM
    );
    pendingTouchPinchFrame = {
      zoom: pinchGesture.previewZoom,
      midpointX: geometry.midpointX,
      midpointY: geometry.midpointY
    };
    pinchGesture.moved = true;
    suppressTouchClickUntil = performance.now() + 400;
    scheduleTouchGestureFrame();
    event.preventDefault();
    return;
  }

  if (!touchPanGesture || touchPoints.size !== 1 || event.pointerId !== touchPanGesture.pointerId) return;
  const dx = point.x - touchPanGesture.startX;
  const dy = point.y - touchPanGesture.startY;
  if (!touchPanGesture.moved && Math.hypot(dx, dy) <= 4) return;
  if (!touchPanGesture.moved) {
    touchPanGesture.moved = true;
  }
  pendingTouchPanFrame = useMobileTransformCamera()
    ? {
        x: touchPanGesture.startCameraX + dx,
        y: touchPanGesture.startCameraY + dy
      }
    : {
        scrollLeft: clamp(touchPanGesture.startScrollLeft - dx, 0, touchPanGesture.maxScrollLeft),
        scrollTop: clamp(touchPanGesture.startScrollTop - dy, 0, touchPanGesture.maxScrollTop)
      };
  suppressTouchClickUntil = performance.now() + 400;
  scheduleTouchGestureFrame();
  event.preventDefault();
}
function endTouchGesture(event) {
  if (event.pointerType !== "touch") return;
  // A stationary background tap dismisses the transient touch selection, but
  // movement hands off to the existing pan/pinch path without changing selection.
  const clearTouchSelection = event.type === "pointerup"
    && touchSelectionTapCandidate?.pointerId === event.pointerId;
  if (touchSelectionTapCandidate?.pointerId === event.pointerId || event.type === "pointercancel") {
    touchSelectionTapCandidate = null;
  }
  if (clearTouchSelection) setMetaOwnerTouchSelection(null);
  if (useWebKitNativeGestureInput || !touchPoints.has(event.pointerId)) return;

  if (pinchGesture) {
    flushPendingTouchGestureFrame();
    touchPoints.delete(event.pointerId);

    if (touchPoints.size < 2) {
      const moved = Boolean(pinchGesture.moved);
      commitTouchPinchVisual();
      pinchGesture = null;
      pendingTouchPinchFrame = null;
      clearTouchStageTransform();
      if (moved) suppressTouchClickUntil = performance.now() + 400;

      // If one finger remains down, seamlessly continue as a custom pan without
      // forcing the user to lift both fingers and start a brand-new gesture.
      const survivor = [...touchPoints.entries()][0];
      if (survivor) {
        beginTouchPan(survivor[0], survivor[1]);
      } else {
        els.chartScroll.classList.remove("touch-gesturing", "touch-pinching");
        maybeScheduleDeferredTouchZoomPresentation();
      }
      return;
    }
    return;
  }

  if (touchPanGesture && event.pointerId === touchPanGesture.pointerId) {
    flushPendingTouchGestureFrame();
    const moved = Boolean(touchPanGesture.moved);
    commitTouchPanVisual();
    touchPanGesture = null;
    pendingTouchPanFrame = null;
    touchPoints.delete(event.pointerId);
    clearTouchStageTransform();
    els.chartScroll.classList.remove("touch-gesturing", "touch-pinching");
    if (moved) suppressTouchClickUntil = performance.now() + 400;
    // Panning never changes semantic zoom. It can, however, reveal offscreen
    // elements that intentionally stayed stale while they were outside the
    // viewport. Reconcile only the newly visible slice; if a pinch semantic pass
    // is still dirty, let the normal settled-zoom path handle it instead.
    if (touchZoomSemanticDirty) maybeScheduleDeferredTouchZoomPresentation();
    else scheduleMobileViewportSemanticCatchup();
    return;
  }

  touchPoints.delete(event.pointerId);
  if (!touchPoints.size) {
    touchPanGesture = null;
    pendingTouchPanFrame = null;
    clearTouchStageTransform();
    els.chartScroll.classList.remove("touch-gesturing", "touch-pinching");
    if (touchZoomSemanticDirty) maybeScheduleDeferredTouchZoomPresentation();
    else scheduleMobileViewportSemanticCatchup();
  }
}

function handleLostPanPointerCapture(event) {
  if (!panDrag || event.pointerId !== panDrag.pointerId) return;
  endPan(event);
}
function recoverInterruptedPointerInteractions({ schedulePresentation = true } = {}) {
  touchSelectionTapCandidate = null;

  if (useWebKitNativeGestureInput) {
    webKitNativeTouchHadPinch = false;
    webKitPinchBurstContinuation = false;
    finishWebKitPinchGesture();
    cancelWebKitPinchBurstSettle({ releaseLayer: true });
    settleDeferredMobileStageGeometry();
    els.chartScroll.classList.remove("touch-active");
  } else {
    if (pinchGesture) commitTouchPinchVisual();
    else if (touchPanGesture) commitTouchPanVisual();
    touchPoints.clear();
    touchPanGesture = null;
    pinchGesture = null;
    pendingTouchPanFrame = null;
    pendingTouchPinchFrame = null;
    if (touchGestureFrame) {
      cancelAnimationFrame(touchGestureFrame);
      touchGestureFrame = 0;
    }
    clearTouchStageTransform();
    els.chartScroll.classList.remove("touch-gesturing", "touch-pinching");
  }

  if (panDrag) {
    panDrag = null;
    els.chartScroll.classList.remove("panning");
  }
  if (schedulePresentation) maybeScheduleDeferredTouchZoomPresentation();
  else cancelDeferredTouchZoomPresentation();
}

function beginPan(event) {
  if (event.button !== 0 || event.pointerType === "touch") return;
  if (event.target.closest?.(".unit-card, .meta-bar, .month-head, .week-head, .tier-label, .viewer-controls, button, a, input, select, textarea")) return;
  panDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: els.chartScroll.scrollLeft,
    scrollTop: els.chartScroll.scrollTop,
    moved: false
  };
  els.chartScroll.classList.add("panning");
  try { els.roadmap.setPointerCapture(event.pointerId); } catch {}
}
function movePan(event) {
  if (!panDrag || event.pointerId !== panDrag.pointerId) return;
  const dx = event.clientX - panDrag.startX;
  const dy = event.clientY - panDrag.startY;
  if (!panDrag.moved && Math.hypot(dx, dy) > 4) panDrag.moved = true;
  if (!panDrag.moved) return;
  els.chartScroll.scrollLeft = panDrag.scrollLeft - dx;
  els.chartScroll.scrollTop = panDrag.scrollTop - dy;
  event.preventDefault();
}
function endPan(event) {
  if (!panDrag || event.pointerId !== panDrag.pointerId) return;
  suppressRoadmapClick = panDrag.moved;
  panDrag = null;
  els.chartScroll.classList.remove("panning");
  if (suppressRoadmapClick) setTimeout(() => { suppressRoadmapClick = false; }, 0);
}
function sanitizeText(text) { return String(text || "").replace(/\s+/g, " ").trim(); }
function validHex(value) { return /^#[0-9a-f]{6}$/i.test(String(value || "")); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>'"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]));
}
function escapeAttr(text) { return escapeHtml(text).replace(/`/g, "&#96;"); }
function base64urlToBytes(text) {
  const clean = String(text || "").trim();
  const padded = clean.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((clean.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, ch => ch.charCodeAt(0));
}
function base64urlDecode(text) {
  return new TextDecoder().decode(base64urlToBytes(text));
}
function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}
