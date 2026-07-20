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
const MAX_ZOOM = 1.6;
const ZOOM_BUTTON_STEP = 0.05;
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
const BAR_BOTTOM_PAD = 34;

const DEFAULT_STATE = {
  updated: "",
  months: [...DEFAULT_MONTHS],
  monthWeeks: DEFAULT_MONTHS.map(() => 4),
  tiers: structuredClone(DEFAULT_TIERS),
  metaStatuses: structuredClone(DEFAULT_META_STATUSES),
  units: []
};

let state = structuredClone(DEFAULT_STATE);
let catalogIndex = new Map();
let zoomScale = 1;
let activeUnitId = null;
let tooltipEl = null;
let tooltipPinned = false;
let unitProfileOverlay = null;
let profileReturnFocus = null;
let appTooltipEl = null;
let appTooltipPinned = false;
let panDrag = null;
let suppressRoadmapClick = false;
const touchPoints = new Map();
let touchPan = null;
let pinchGesture = null;
let suppressTouchClickUntil = 0;
const DIAMOND_PLANNER_STORAGE_KEY = "uceDiamondPlannerV1";
let diamondPlanner = { balance: 0, spends: {} };

const els = {
  roadmap: document.getElementById("roadmap"),
  chartStage: document.getElementById("chartStage"),
  chartScroll: document.getElementById("chartScroll"),
  legend: document.getElementById("statusLegend"),
  summary: document.getElementById("summary"),
  message: document.getElementById("message"),
  zoomLabel: document.getElementById("zoomLabel"),
  drawer: document.getElementById("unitDrawer"),
  drawerContent: document.getElementById("drawerContent"),
  tooltip: document.getElementById("tooltip"),
  planner: document.getElementById("diamondPlanner"),
  plannerList: document.getElementById("diamondPlannerList"),
  plannerBalance: document.getElementById("diamondBalance"),
  plannerSummary: document.getElementById("diamondPlannerSummary")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  tooltipEl = els.tooltip;
  loadDiamondPlanner();
  bindControls();
  await loadOptionalCatalog();
  await loadRoadmap();
  normalizeState();
  renderAll();
  setTimeout(fitToWidth, 40);
}

function bindControls() {
  document.getElementById("btnCloseDrawer").addEventListener("click", closeDrawer);
  document.getElementById("btnOpenDiamondPlanner")?.addEventListener("click", openDiamondPlanner);
  document.getElementById("btnCloseDiamondPlanner")?.addEventListener("click", closeDiamondPlanner);
  document.getElementById("btnClearDiamondPlanner")?.addEventListener("click", clearDiamondPlanner);
  els.plannerBalance?.addEventListener("input", () => {
    diamondPlanner.balance = Math.max(0, Math.round(Number(els.plannerBalance.value) || 0));
    saveDiamondPlanner();
    renderDiamondPlanner();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (unitProfileOverlay) { closeUnitProfile(); return; }
    closeDrawer();
    closeDiamondPlanner();
    hideTooltip(true);
  });
  document.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (!event.target.closest?.(".legend-item")) hideAppTooltip(true);
    if (event.target.closest?.(".unit-card, .meta-bar, .unit-drawer, .unit-tooltip-card, .viewer-controls, .topbar, .legend-panel, button, a, input, select, textarea")) return;
    hideTooltip(true);
  });
  els.roadmap.addEventListener("pointerdown", beginPan);
  els.chartScroll.addEventListener("wheel", handleWheelZoom, { passive: false });
  els.chartScroll.addEventListener("pointerdown", beginTouchGesture);
  window.addEventListener("pointermove", movePan);
  window.addEventListener("pointerup", endPan);
  window.addEventListener("pointercancel", endPan);
  window.addEventListener("pointermove", moveTouchGesture, { passive: false });
  window.addEventListener("pointerup", endTouchGesture);
  window.addEventListener("pointercancel", endTouchGesture);
  window.addEventListener("resize", () => applyZoom());
}

async function loadRoadmap() {
  const fromHash = readHashRoadmap();
  if (fromHash) {
    state = fromHash;
    setMessage("");
    return;
  }

  try {
    const response = await fetch("data/roadmap.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    state = Array.isArray(json) ? { ...structuredClone(DEFAULT_STATE), units: json } : { ...structuredClone(DEFAULT_STATE), ...json };
    setMessage("");
  } catch (error) {
    state = structuredClone(DEFAULT_STATE);
    setMessage("No published roadmap data found. Use a builder share link with #roadmap=… to view private roadmap data.");
  }
}

async function loadOptionalCatalog() {
  try {
    const response = await fetch("data/catalog.json", { cache: "no-store" });
    if (!response.ok) return;
    const json = await response.json();
    const items = Array.isArray(json) ? json : json.items || [];
    catalogIndex = new Map(items.map(item => [sanitizeText(item.name).toLowerCase(), item]));
  } catch {
    catalogIndex = new Map();
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
  syncPilotLanes();
}

function resolveIcon(unit) {
  const direct = String(unit.icon || "").trim();
  if (direct) return direct;
  const found = catalogIndex.get(sanitizeText(unit.name).toLowerCase());
  return found?.icon || found?.remoteIcon || "";
}

function renderAll() {
  renderSummary();
  renderLegend();
  renderChart();
  applyZoom();
  renderDiamondPlanner();
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
    const item = document.createElement("span");
    item.className = "legend-item";
    item.innerHTML = `<i class="legend-dot" style="background:${escapeAttr(status.color)}"></i>${escapeHtml(status.label)}`;
    const description = String(status.description || "").trim();
    item.setAttribute("aria-label", description ? `${status.label}: ${description}` : status.label);
    bindAppTooltip(item, () => `<h3>${escapeHtml(status.label)}</h3>${description ? `<div class="app-tooltip-description">${multilineHtml(description)}</div>` : ""}`);
    els.legend.appendChild(item);
  });
}

function renderChart() {
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
    label.textContent = tier.label;
  });

  const monthBoundaries = new Set([0]);
  getMonthWeeks().reduce((sum, weeks) => {
    const next = sum + weeks;
    monthBoundaries.add(next);
    return next;
  }, 0);
  for (let w = 0; w <= weekCount(); w++) {
    const line = addDiv(`grid-line v${monthBoundaries.has(w) ? " month" : ""}`, {
      left: `${weekBoundaryX(w)}px`
    });
    line.style.height = monthBoundaries.has(w) ? "100%" : `${height - HEADER_H}px`;
  }

  getTiers().forEach(tier => addDiv("grid-line h", { top: `${tierY(tier.id)}px` }));
  addDiv("grid-line h", { top: `${height}px` });

  getTiers().forEach(tier => {
    for (let lane = 1; lane <= visibleLaneCount(tier.id); lane++) {
      addDiv("lane-track", {
        top: `${laneY(tier.id, lane)}px`,
        width: `${Math.max(4, width - LEFT_W - 20)}px`
      });
    }
  });

  state.units
    .filter(hasVisibleMetaSegments)
    .sort((a, b) => laneY(a) - laneY(b) || normalizeWeek(a.week) - normalizeWeek(b.week) || a.name.localeCompare(b.name))
    .forEach(unit => {
      renderMetaSegmentLinks(unit);
      const segments = sortedVisibleSegments(unit);
      segments.forEach((segment, index) => renderSegment(unit, segment, index, segments.length));
    });

  state.units
    .slice()
    .sort((a, b) => unitZIndex(a, sameSlotOffset(a)) - unitZIndex(b, sameSlotOffset(b)) || a.name.localeCompare(b.name))
    .forEach(renderUnit);
}

function renderUnit(unit) {
  const slot = sameSlotOffset(unit);
  const size = slot.size || ICON_W;
  const card = document.createElement("article");
  card.className = `unit-card${activeUnitId === unit.id ? " active" : ""}${hasMustP5(unit) ? " must-p5" : ""}${hasBuff(unit) ? " buff" : ""}${normalizeRowOffset(unit.rowOffset) ? " between-row" : ""}`;
  card.dataset.id = unit.id;
  card.style.left = `${iconX(unit)}px`;
  card.style.top = `${iconY(unit)}px`;
  card.style.width = `${size}px`;
  card.style.height = `${size}px`;
  card.style.zIndex = String(unitZIndex(unit, slot));
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", unit.name);

  if (unit.icon) {
    const img = document.createElement("img");
    img.src = unit.icon;
    img.alt = unit.name;
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

  card.addEventListener("click", event => {
    event.stopPropagation();
    if (suppressRoadmapClick || performance.now() < suppressTouchClickUntil) return;
    bringUnitToFront(unit.id);
    openUnitProfile(unit.id);
  });
  card.addEventListener("mouseenter", event => {
    bringUnitToFront(unit.id);
    showTooltip(event, unit);
  });
  card.addEventListener("mouseleave", () => hideTooltip(false));
  card.addEventListener("pointermove", moveTooltip);
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openUnitProfile(unit.id);
    }
  });
  els.roadmap.appendChild(card);
}

function renderSegment(unit, segment, index = 0, total = 1) {
  if (!hasVisibleMetaSegments(unit)) return;
  const rect = segmentBarRect(unit, segment);
  const bar = document.createElement("div");
  const isFirst = index === 0;
  const isLast = index === total - 1;
  bar.className = `meta-bar${activeUnitId === unit.id ? " active" : ""}${isFirst ? " segment-first" : " segment-inner-left"}${isLast ? " segment-last" : " segment-inner-right"}`;
  bar.style.left = `${rect.x}px`;
  bar.style.top = `${rect.y}px`;
  bar.style.width = `${rect.w}px`;
  bar.style.setProperty("--bar", segmentColor(segment));
  bar.setAttribute("tabindex", "0");
  bar.setAttribute("aria-label", `${unit.name} - ${metaStatus(segment.statusId).label}`);

  const label = document.createElement("span");
  label.className = "bar-label";
  label.textContent = `${unit.name} - ${metaStatus(segment.statusId).label}`;
  bar.appendChild(label);

  bar.addEventListener("click", event => {
    event.stopPropagation();
    if (suppressRoadmapClick || performance.now() < suppressTouchClickUntil) return;
    openUnitProfile(unit.id, segment.id);
  });
  bar.addEventListener("mouseenter", event => showTooltip(event, unit, segment));
  bar.addEventListener("mouseleave", () => hideTooltip(false));
  bar.addEventListener("pointermove", moveTooltip);
  bar.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openUnitProfile(unit.id, segment.id);
    }
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
  const unit = state.units.find(u => u.id === unitId);
  if (!unit) return;
  activeUnitId = unit.id;
  closeDiamondPlanner();
  els.drawerContent.innerHTML = unitDetailHtml(unit, segmentId);
  els.drawer.classList.remove("hidden");
  renderChart();
}

function closeDrawer() {
  activeUnitId = null;
  els.drawer.classList.add("hidden");
  renderChart();
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

function loadDiamondPlanner() {
  try {
    const raw = JSON.parse(localStorage.getItem(DIAMOND_PLANNER_STORAGE_KEY) || "null");
    if (raw && typeof raw === "object") diamondPlanner = { balance: Math.max(0, Math.round(Number(raw.balance) || 0)), spends: raw.spends && typeof raw.spends === "object" ? raw.spends : {} };
  } catch { diamondPlanner = { balance: 0, spends: {} }; }
}
function saveDiamondPlanner() {
  try { localStorage.setItem(DIAMOND_PLANNER_STORAGE_KEY, JSON.stringify(diamondPlanner)); } catch {}
}
function openDiamondPlanner() {
  closeDrawer();
  renderDiamondPlanner();
  els.planner?.classList.remove("hidden");
}
function closeDiamondPlanner() { els.planner?.classList.add("hidden"); }
function clearDiamondPlanner() {
  diamondPlanner = { balance: 0, spends: {} };
  saveDiamondPlanner();
  renderDiamondPlanner();
}
function plannedSpend(unitId) { return Math.max(0, Math.round(Number(diamondPlanner.spends?.[unitId]) || 0)); }
function formatDiamonds(value) { return Math.round(Number(value) || 0).toLocaleString("en-US"); }
function renderDiamondPlanner() {
  if (!els.plannerList || !els.plannerBalance || !els.plannerSummary) return;
  if (document.activeElement !== els.plannerBalance) els.plannerBalance.value = String(diamondPlanner.balance || 0);
  const units = state.units.filter(isMs).slice().sort((a,b) => normalizeWeek(a.week)-normalizeWeek(b.week) || tierIndex(a.tier)-tierIndex(b.tier) || a.name.localeCompare(b.name));
  let running = diamondPlanner.balance || 0;
  let total = 0;
  els.plannerList.innerHTML = "";
  units.forEach(unit => {
    const spend = plannedSpend(unit.id); total += spend; running -= spend;
    const row = document.createElement("div");
    row.className = "diamond-plan-row";
    row.innerHTML = `<div class="diamond-plan-main"><strong>${escapeHtml(unit.name)}</strong><small>${escapeHtml(formatWeek(unit.week))} · ${escapeHtml(tierById(unit.tier).label)}</small></div><label><span>Spend</span><input type="number" min="0" step="100" inputmode="numeric" value="${spend || ""}" aria-label="Planned diamond spend for ${escapeAttr(unit.name)}"></label><div class="diamond-plan-balance${running < 0 ? " negative" : ""}">${formatDiamonds(running)}</div>`;
    const input = row.querySelector("input");
    input.addEventListener("change", () => {
      const value = Math.max(0, Math.round(Number(input.value) || 0));
      if (value) diamondPlanner.spends[unit.id] = value; else delete diamondPlanner.spends[unit.id];
      saveDiamondPlanner();
      renderDiamondPlanner();
    });
    els.plannerList.appendChild(row);
  });
  const remaining = (diamondPlanner.balance || 0) - total;
  els.plannerSummary.innerHTML = `<span>Planned <strong>${formatDiamonds(total)}</strong></span><span>Remaining <strong class="${remaining < 0 ? "negative" : ""}">${formatDiamonds(remaining)}</strong></span>`;
}

window.__ucePlaceholder = function(name) {
  const div = document.createElement("div");
  div.className = "placeholder";
  div.textContent = initials(name);
  return div;
};

function bindAppTooltip(element, htmlFactory) {
  if (!element) return;
  element.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    showAppTooltip(event, htmlFactory, false);
  });
  element.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || appTooltipPinned) return;
    if (!appTooltipEl) showAppTooltip(event, htmlFactory, false);
    else positionAppTooltip(appTooltipEl, event);
  });
  element.addEventListener("pointerleave", () => { if (!appTooltipPinned) hideAppTooltip(); });
  element.addEventListener("click", (event) => {
    if (window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches) return;
    event.stopPropagation();
    showAppTooltip(event, htmlFactory, true);
  });
}

function showAppTooltip(event, htmlFactory, pin = false) {
  hideAppTooltip(true);
  const html = typeof htmlFactory === "function" ? htmlFactory() : String(htmlFactory || "");
  if (!html) return;
  appTooltipEl = document.createElement("div");
  appTooltipEl.className = "tooltip app-tooltip";
  appTooltipEl.innerHTML = html;
  document.body.appendChild(appTooltipEl);
  appTooltipPinned = !!pin;
  positionAppTooltip(appTooltipEl, event);
}

function positionAppTooltip(element, event) {
  if (!element || !event) return;
  const margin = 12;
  const offset = 16;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  element.style.maxWidth = `${Math.max(180, Math.min(360, viewportWidth - margin * 2))}px`;
  const rect = element.getBoundingClientRect();
  const clientX = Number.isFinite(event.clientX) ? event.clientX : viewportWidth / 2;
  const clientY = Number.isFinite(event.clientY) ? event.clientY : viewportHeight / 2;
  let left = clientX + offset;
  let top = clientY + offset;
  if (left + rect.width + margin > viewportWidth) left = clientX - rect.width - offset;
  if (top + rect.height + margin > viewportHeight) top = clientY - rect.height - offset;
  left = Math.min(Math.max(left, margin), Math.max(margin, viewportWidth - rect.width - margin));
  top = Math.min(Math.max(top, margin), Math.max(margin, viewportHeight - rect.height - margin));
  element.style.left = `${Math.round(left)}px`;
  element.style.top = `${Math.round(top)}px`;
}

function hideAppTooltip(force = false) {
  if (appTooltipPinned && !force) return;
  appTooltipEl?.remove();
  appTooltipEl = null;
  appTooltipPinned = false;
}


function profileTagsHtml(unit) {
  if (!unit?.tags?.length) return "";
  return `<div class="unit-profile-tags">${unit.tags.map(tag => `<span class="unit-profile-tag ${tagClass(tag)}">${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function profileArtHtml(unit, typeLabel) {
  if (!unit) return `<div class="unit-profile-art empty"><div class="unit-profile-placeholder">?</div><span>${escapeHtml(typeLabel)}</span></div>`;
  const image = unit.icon
    ? `<img class="unit-profile-image" src="${escapeAttr(unit.icon)}" alt="${escapeAttr(unit.name)}"><div class="unit-profile-placeholder image-fallback">${escapeHtml(initials(unit.name))}</div>`
    : `<div class="unit-profile-placeholder">${escapeHtml(initials(unit.name))}</div>`;
  return `<div class="unit-profile-art">${image}</div>`;
}

function profileContextHtml(unit) {
  if (!unit) return "";
  const color = tierById(unit.tier).color || "#8d96a6";
  return `<div class="unit-profile-context"><span class="unit-profile-tier" style="--profile-tier-color:${escapeAttr(color)}">${escapeHtml(unitRowLabel(unit))}</span><span>${escapeHtml(formatWeek(unit.week))}</span></div>`;
}

function profileInvestmentHtml(unit) {
  if (!isMs(unit)) return "";
  const minimum = normalizePotentialLevel(unit.minPotential);
  const ideal = normalizePotentialLevel(unit.idealPotential);
  if (minimum == null && ideal == null) return "";
  const cells = [];
  if (minimum != null) cells.push(`<div class="unit-profile-investment-stat"><span>Minimum</span><strong>P${minimum}</strong></div>`);
  if (ideal != null) cells.push(`<div class="unit-profile-investment-stat"><span>Ideal</span><strong>P${ideal}</strong></div>`);
  return `<section class="unit-profile-section"><div class="unit-profile-section-title">Investment</div><div class="unit-profile-investment">${cells.join("")}</div></section>`;
}

function profileMetaHtml(unit, activeSegmentId = null) {
  if (!unit) return "";
  const segments = (unit.segments || []).slice().sort((a, b) => a.start - b.start || a.end - b.end);
  if (!segments.length) return "";
  const rows = segments.map(seg => {
    const status = metaStatus(seg.statusId);
    const description = String(status.description || "").trim();
    return `<div class="unit-profile-meta-row${activeSegmentId === seg.id ? " active" : ""}"><i style="background:${escapeAttr(status.color)}"></i><div class="unit-profile-meta-copy"><div class="unit-profile-meta-top"><strong>${escapeHtml(status.label)}</strong><span>${escapeHtml(formatWeekRange(seg.start, seg.end))}</span></div>${description ? `<p>${multilineHtml(description)}</p>` : ""}</div></div>`;
  }).join("");
  return `<section class="unit-profile-section"><div class="unit-profile-section-title">PVP Meta</div><div class="unit-profile-meta-list">${rows}</div></section>`;
}

function profileMsNotesHtml(unit) {
  if (!unit) return "";
  const blocks = [];
  if (unit.notesPvp) blocks.push(`<div class="unit-profile-note"><span>PVP</span><div>${multilineHtml(unit.notesPvp)}</div></div>`);
  if (unit.notesPve) blocks.push(`<div class="unit-profile-note"><span>PVE</span><div>${multilineHtml(unit.notesPve)}</div></div>`);
  return blocks.length ? `<section class="unit-profile-section"><div class="unit-profile-section-title">Notes</div><div class="unit-profile-notes">${blocks.join("")}</div></section>` : "";
}

function profilePilotNotesHtml(unit) {
  if (!unit) return "";
  const notes = [unit.notesPvp, unit.notesPve].filter(Boolean).join("\n\n");
  return notes ? `<section class="unit-profile-section"><div class="unit-profile-section-title">Notes</div><div class="unit-profile-pilot-note">${multilineHtml(notes)}</div></section>` : "";
}

function profilePanelHeaderHtml(unit, label, emptyMessage) {
  if (!unit) {
    return `<div class="unit-profile-empty">${profileArtHtml(null, label)}<div><span class="unit-profile-eyebrow">${escapeHtml(label)}</span><h2>${escapeHtml(emptyMessage)}</h2><p>This roadmap entry does not currently have a paired ${label.toLowerCase()} in the same release slot.</p></div></div>`;
  }
  return `<div class="unit-profile-hero">${profileArtHtml(unit, label)}<div class="unit-profile-identity"><span class="unit-profile-eyebrow">${escapeHtml(label)}</span><h2>${escapeHtml(unit.name)}</h2>${profileContextHtml(unit)}${profileTagsHtml(unit)}</div></div>`;
}

function openUnitProfile(unitId, activeSegmentId = null) {
  const clicked = state.units.find(unit => unit.id === unitId);
  if (!clicked || (!isMs(clicked) && !isPilot(clicked))) return;
  hideTooltip(true);
  hideAppTooltip(true);
  closeDrawer();
  closeDiamondPlanner();
  closeUnitProfile();

  const ms = isMs(clicked) ? clicked : pairedMsForPilot(clicked);
  const pilot = isPilot(clicked) ? clicked : pairedPilotForMs(clicked);
  const activeId = ms ? (activeSegmentId || ms.segments?.[0]?.id || null) : null;
  profileReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const overlay = document.createElement("div");
  overlay.className = "unit-profile-overlay";
  overlay.innerHTML = `
    <article class="unit-profile-card" role="dialog" aria-modal="true" aria-label="${escapeAttr(ms?.name || pilot?.name || "Unit profile")}">
      <button class="unit-profile-close" type="button" aria-label="Close profile">×</button>
      <div class="unit-profile-grid">
        <section class="unit-profile-panel unit-profile-ms-panel">
          ${profilePanelHeaderHtml(ms, "MOBILE SUIT", "No paired MS")}
          ${ms ? profileInvestmentHtml(ms) : ""}
          ${ms ? profileMetaHtml(ms, activeId) : ""}
          ${ms ? profileMsNotesHtml(ms) : ""}
        </section>
        <section class="unit-profile-panel unit-profile-pilot-panel">
          ${profilePanelHeaderHtml(pilot, "PILOT", "No paired pilot")}
          ${pilot ? profilePilotNotesHtml(pilot) : ""}
        </section>
      </div>
    </article>`;

  overlay.addEventListener("click", event => { if (event.target === overlay) closeUnitProfile(); });
  overlay.querySelector(".unit-profile-close")?.addEventListener("click", closeUnitProfile);
  overlay.querySelectorAll(".unit-profile-image").forEach(img => {
    img.addEventListener("error", () => {
      img.style.display = "none";
      const fallback = img.nextElementSibling;
      if (fallback) fallback.classList.remove("image-fallback");
    }, { once: true });
  });
  document.body.appendChild(overlay);
  document.body.classList.add("unit-profile-open");
  unitProfileOverlay = overlay;
  overlay.querySelector(".unit-profile-close")?.focus({ preventScroll: true });
}

function closeUnitProfile() {
  if (!unitProfileOverlay) return;
  const overlay = unitProfileOverlay;
  unitProfileOverlay = null;
  overlay.remove();
  document.body.classList.remove("unit-profile-open");
  if (profileReturnFocus?.isConnected) profileReturnFocus.focus({ preventScroll: true });
  profileReturnFocus = null;
}

function showTooltip(event, unit, activeSegment = null, options = {}) {
  const shouldPin = !!options.pin;
  if (tooltipPinned && !shouldPin) return;
  const metaUnit = metaOwnerForUnit(unit);
  const activeId = metaUnit ? (activeSegment?.id || metaUnit.segments?.[0]?.id || null) : null;
  tooltipEl.innerHTML = tooltipHtml(unit, activeId);
  tooltipEl.classList.add("unit-tooltip-card");
  tooltipEl.classList.remove("hidden");
  tooltipPinned = shouldPin;
  tooltipEl.classList.toggle("pinned", tooltipPinned);
  moveTooltip(event, true);
}

function moveTooltip(event, force = false) {
  if (!tooltipEl || tooltipEl.classList.contains("hidden") || (tooltipPinned && !force)) return;
  const margin = 12;
  const offset = 16;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  tooltipEl.style.maxWidth = `${Math.max(180, Math.min(360, viewportWidth - margin * 2))}px`;
  const rect = tooltipEl.getBoundingClientRect();
  const maxLeft = Math.max(margin, viewportWidth - rect.width - margin);
  const maxTop = Math.max(margin, viewportHeight - rect.height - margin);
  let x = Number(event?.clientX);
  let y = Number(event?.clientY);
  if (!Number.isFinite(x)) x = viewportWidth / 2;
  if (!Number.isFinite(y)) y = viewportHeight / 2;
  let left = x + offset;
  let top = y + offset;
  if (left + rect.width + margin > viewportWidth) left = x - rect.width - offset;
  if (top + rect.height + margin > viewportHeight) top = y - rect.height - offset;
  left = Math.min(Math.max(left, margin), maxLeft);
  top = Math.min(Math.max(top, margin), maxTop);
  tooltipEl.style.left = `${Math.round(left)}px`;
  tooltipEl.style.top = `${Math.round(top)}px`;
}

function hideTooltip(force = false) {
  if (tooltipPinned && !force) return;
  tooltipPinned = false;
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

function setZoom(value) {
  zoomScale = clamp(Math.round(Number(value || 1) * 100) / 100, MIN_ZOOM, MAX_ZOOM);
  applyZoom();
}

function setZoomAtClientPoint(value, clientX, clientY) {
  const oldZoom = zoomScale;
  const nextZoom = clamp(Math.round(Number(value || 1) * 100) / 100, MIN_ZOOM, MAX_ZOOM);
  if (Math.abs(nextZoom - oldZoom) < 0.0001) return;
  const rect = els.chartScroll.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const contentX = (els.chartScroll.scrollLeft + localX) / oldZoom;
  const contentY = (els.chartScroll.scrollTop + localY) / oldZoom;
  setZoom(nextZoom);
  els.chartScroll.scrollLeft = contentX * zoomScale - localX;
  els.chartScroll.scrollTop = contentY * zoomScale - localY;
}

function handleWheelZoom(event) {
  if (!event.deltaY) return;
  event.preventDefault();
  event.stopPropagation();
  const delta = clamp(event.deltaY, -200, 200);
  const factor = Math.exp(-delta * 0.0005);
  setZoomAtClientPoint(zoomScale * factor, event.clientX, event.clientY);
}

function applyZoom() {
  const width = baseChartWidth();
  const height = baseChartHeight();
  els.roadmap.style.transform = `scale(${zoomScale})`;
  els.roadmap.style.setProperty("--textBoost", legibleTextScale().toFixed(3));
  els.roadmap.style.setProperty("--barTextBoost", barLabelTextScale().toFixed(3));
  const gridLinePx = clamp(1 / zoomScale, 1, 2.2);
  els.roadmap.style.setProperty("--gridLine", `${gridLinePx.toFixed(2)}px`);
  els.roadmap.style.setProperty("--monthGridLine", `${(gridLinePx * 2).toFixed(2)}px`);
  els.chartStage.style.width = `${width * zoomScale}px`;
  els.chartStage.style.height = `${height * zoomScale}px`;
  if (els.zoomLabel) els.zoomLabel.textContent = `${Math.round(zoomScale * 100)}%`;
}

function fitToWidth() {
  const available = Math.max(240, els.chartScroll.clientWidth - 20);
  const scale = available / baseChartWidth();
  setZoom(clamp(scale, MIN_ZOOM, 1.2));
}

function baseChartWidth() { return weekBoundaryX(weekCount()); }
function baseChartHeight() { return HEADER_H + getTiers().reduce((sum, t) => sum + tierHeight(t.id), 0); }
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
function weekNeedsWideColumn(week) {
  const targetWeek = normalizeWeek(week);
  const slots = new Map();
  for (const unit of state.units || []) {
    if (normalizeWeek(unit.week) !== targetWeek || !normalizeRowOffset(unit.rowOffset)) continue;
    const key = rowSlotKey(unit);
    if (!key.startsWith("between:")) continue;
    const entry = slots.get(key) || { ms: false, pilot: false };
    if (isMs(unit)) entry.ms = true;
    if (isPilot(unit)) entry.pilot = true;
    slots.set(key, entry);
    if (entry.ms && entry.pilot) return true;
  }
  return false;
}
function weekWidth(week) { return weekNeedsWideColumn(week) ? WIDE_CELL_W : CELL_W; }
function weekBoundaryX(completedWeeks) {
  let x = LEFT_W;
  const count = clamp(Math.round(Number(completedWeeks) || 0), 0, weekCount());
  for (let w = 1; w <= count; w++) x += weekWidth(w);
  return x;
}
function weekSpanWidth(start, end) {
  const first = Math.min(normalizeWeek(start), normalizeWeek(end));
  const last = Math.max(normalizeWeek(start), normalizeWeek(end));
  let width = 0;
  for (let w = first; w <= last; w++) width += weekWidth(w);
  return width;
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
function segmentBarRect(unit, segment) {
  const start = Math.min(normalizeWeek(segment.start), normalizeWeek(segment.end));
  const end = Math.max(normalizeWeek(segment.start), normalizeWeek(segment.end));
  return { x: weekX(start) + 12, y: laneY(unit), w: Math.max(4, weekSpanWidth(start, end) - 24), h: BAR_H };
}
function metaSegmentLinks(unit) {
  const segments = sortedVisibleSegments(unit);
  const links = [];
  for (let i = 1; i < segments.length; i++) {
    const previous = segmentBarRect(unit, segments[i - 1]);
    const next = segmentBarRect(unit, segments[i]);
    const x = previous.x + previous.w - META_LINK_OVERLAP;
    const w = next.x - x + META_LINK_OVERLAP;
    if (w <= META_LINK_OVERLAP * 2) continue;
    links.push({ x, y: previous.y + (BAR_H - META_LINK_H) / 2, w, fromColor: segmentColor(segments[i - 1]), toColor: segmentColor(segments[i]) });
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
    connector.style.setProperty("--link-from", link.fromColor);
    connector.style.setProperty("--link-to", link.toColor);
  });
}

function weekX(week) {
  let x = LEFT_W;
  const target = clamp(Math.round(Number(week) || 1), 1, weekCount());
  for (let w = 1; w < target; w++) x += weekWidth(w);
  return x;
}
function tierY(tierId) {
  let y = HEADER_H;
  for (const tier of getTiers()) {
    if (tier.id === tierId) return y;
    y += tierHeight(tier.id);
  }
  return y;
}
function tierHeight(tierId) {
  const lanes = visibleLaneCount(tierId);
  const iconContentHeight = ICON_TOP + maxIconStackVisualHeight(tierId) + 28;
  const minHeight = Math.max(BLANK_TIER_H, iconContentHeight);
  if (!lanes) return minHeight;
  return Math.max(minHeight, dynamicBarTop(tierId) + lanes * BAR_GAP + BAR_BOTTOM_PAD);
}
function visibleLaneCount(tierId) {
  let maxLane = 0;
  for (const unit of state.units || []) {
    if (unit.tier === tierId && hasVisibleMetaSegments(unit)) maxLane = Math.max(maxLane, Number(unit.lane) || 0);
  }
  return maxLane;
}
function laneY(unitOrTier, laneMaybe) {
  const tier = typeof unitOrTier === "string" ? unitOrTier : unitOrTier.tier;
  const lane = typeof unitOrTier === "string" ? laneMaybe : unitOrTier.lane;
  return tierY(tier) + dynamicBarTop(tier) + (lane - 1) * BAR_GAP;
}
function dynamicBarTop(tierId) { return Math.max(BAR_TOP, ICON_TOP + maxIconStackVisualHeight(tierId) + 18); }
function maxIconStackVisualHeight(tierId) {
  const seen = new Set();
  const heights = [ICON_W];
  for (const unit of state.units || []) {
    if (unit.tier !== tierId) continue;
    const key = visualSlotKey(unit);
    if (seen.has(key)) continue;
    seen.add(key);
    heights.push(slotGroupHeight(sameSlotGroup(unit)));
  }
  return Math.max(...heights);
}
function iconX(unit) {
  const slot = sameSlotOffset(unit);
  const groupWidth = slot.groupWidth || ICON_W;
  const maxGroupLeft = Math.max(LEFT_W, baseChartWidth() - groupWidth);
  const groupLeft = clamp(weekX(unit.week) + Math.round((weekWidth(unit.week) - groupWidth) / 2), LEFT_W, maxGroupLeft);
  return groupLeft + slot.x;
}
function iconY(unit) {
  const slot = sameSlotOffset(unit);
  const size = slot.size || ICON_W;
  const rowOffset = normalizeRowOffset(unit.rowOffset);
  let top = tierY(unit.tier) + ICON_TOP + slot.y;
  if (rowOffset > 0) top = tierY(unit.tier) + tierHeight(unit.tier) - slot.groupHeight / 2 + slot.y;
  if (rowOffset < 0) top = tierY(unit.tier) - slot.groupHeight / 2 + slot.y;
  return clamp(top, HEADER_H - size / 2, baseChartHeight() - size);
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
  return (state.units || [])
    .filter(other => sameVisualSlot(unit, other))
    .sort((a, b) => {
      const rankDiff = visualStackRank(a) - visualStackRank(b);
      if (rankDiff) return rankDiff;
      const orderDiff = (Number(a.stackOrder) || 0) - (Number(b.stackOrder) || 0);
      return orderDiff || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    });
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
  const group = sameSlotGroup(unit);
  if (group.length <= 1) return { x: 0, y: 0, z: 0, index: 0, count: 1, groupHeight: ICON_W, groupWidth: ICON_W, size: ICON_W, compact: false };
  const { layout, groupHeight, groupWidth, compact } = slotLayoutForGroup(group);
  const slot = layout.get(unit.id) || { x: 0, y: 0, z: 0, index: 0, size: ICON_W };
  return { ...slot, count: group.length, groupHeight, groupWidth, compact };
}
function slotGroupHeight(group) { return slotLayoutForGroup(group).groupHeight || ICON_W; }
function unitZIndex(unit, slot = sameSlotOffset(unit)) {
  const stack = Math.max(0, Number(unit?.stackOrder) || 0);
  const activeBoost = activeUnitId === unit?.id ? 2 : 0;
  return 20 + stack * 2 + (slot?.z || 0) + activeBoost;
}
function iconRect(unit) {
  const size = sameSlotOffset(unit).size || ICON_W;
  return { left: iconX(unit), top: iconY(unit), right: iconX(unit) + size, bottom: iconY(unit) + size };
}
function rectsOverlap(a, b) { return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
function overlappingUnits(unit) {
  if (!unit) return [];
  const rect = iconRect(unit);
  return (state.units || []).filter(other => other.id !== unit.id && rectsOverlap(rect, iconRect(other)));
}
function bringUnitToFront(unitId) {
  const unit = state.units.find(u => u.id === unitId);
  if (!unit) return;
  const overlaps = overlappingUnits(unit);
  if (!overlaps.length) return;
  const currentZ = unitZIndex(unit, sameSlotOffset(unit));
  const maxOverlapZ = Math.max(...overlaps.map(other => unitZIndex(other, sameSlotOffset(other))));
  if (currentZ > maxOverlapZ) return;
  let maxOrder = Math.max(0, ...state.units.map(u => Number(u.stackOrder) || 0));
  if (maxOrder > 100000) {
    state.units.slice().sort((a, b) => (Number(a.stackOrder) || 0) - (Number(b.stackOrder) || 0)).forEach((u, index) => { u.stackOrder = index; });
    maxOrder = Math.max(0, ...state.units.map(u => Number(u.stackOrder) || 0));
  }
  unit.stackOrder = maxOrder + 1;
  refreshUnitZIndices();
}
function refreshUnitZIndices() {
  els.roadmap?.querySelectorAll?.(".unit-card").forEach(card => {
    const unit = state.units.find(u => u.id === card.dataset.id);
    if (!unit) return;
    card.style.zIndex = String(unitZIndex(unit, sameSlotOffset(unit)));
  });
}
function pairedMsForPilot(pilot) {
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
function pairedPilotForMs(ms) {
  if (!isMs(ms)) return null;
  return state.units
    .filter(isPilot)
    .filter(pilot => pairedMsForPilot(pilot)?.id === ms.id)
    .sort((a, b) => {
      const aExact = sameVisualSlot(a, ms) ? 1 : 0;
      const bExact = sameVisualSlot(b, ms) ? 1 : 0;
      return bExact - aExact || (Number(a.stackOrder) || 0) - (Number(b.stackOrder) || 0) || a.name.localeCompare(b.name);
    })[0] || null;
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
    .sort((a, b) => normalizeWeek(a.week) - normalizeWeek(b.week) || normalizeRowOffset(a.rowOffset) - normalizeRowOffset(b.rowOffset) || a.name.localeCompare(b.name))
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
  const normalized = clamp(Number(scale) || 1, MIN_ZOOM, MAX_ZOOM);
  return clamp(Math.pow(1 / normalized, 0.65), 1, 3);
}
function barLabelTextScale(scale = zoomScale) {
  const normalized = clamp(Number(scale) || 1, MIN_ZOOM, MAX_ZOOM);
  return clamp(Math.pow(1 / normalized, 0.9), 1, 3.4);
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
function beginPinchGesture() {
  const geometry = touchPairGeometry();
  if (!geometry) return;
  const rect = els.chartScroll.getBoundingClientRect();
  const localX = geometry.midpointX - rect.left;
  const localY = geometry.midpointY - rect.top;
  pinchGesture = {
    startDistance: geometry.distance,
    startZoom: zoomScale,
    contentX: (els.chartScroll.scrollLeft + localX) / zoomScale,
    contentY: (els.chartScroll.scrollTop + localY) / zoomScale,
    moved: false
  };
  touchPan = null;
}
function beginTouchGesture(event) {
  if (event.pointerType !== "touch") return;
  touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
  try { els.chartScroll.setPointerCapture(event.pointerId); } catch {}
  if (touchPoints.size >= 2) {
    beginPinchGesture();
    event.preventDefault();
    return;
  }
  touchPan = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: els.chartScroll.scrollLeft,
    scrollTop: els.chartScroll.scrollTop,
    moved: false
  };
}
function moveTouchGesture(event) {
  if (event.pointerType !== "touch" || !touchPoints.has(event.pointerId)) return;
  touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (touchPoints.size >= 2 && pinchGesture) {
    const geometry = touchPairGeometry();
    if (!geometry) return;
    const nextZoom = pinchGesture.startZoom * (geometry.distance / pinchGesture.startDistance);
    const rect = els.chartScroll.getBoundingClientRect();
    const localX = geometry.midpointX - rect.left;
    const localY = geometry.midpointY - rect.top;
    setZoom(nextZoom);
    els.chartScroll.scrollLeft = pinchGesture.contentX * zoomScale - localX;
    els.chartScroll.scrollTop = pinchGesture.contentY * zoomScale - localY;
    pinchGesture.moved = true;
    suppressTouchClickUntil = performance.now() + 400;
    event.preventDefault();
    return;
  }

  if (!touchPan || event.pointerId !== touchPan.pointerId) return;
  const dx = event.clientX - touchPan.startX;
  const dy = event.clientY - touchPan.startY;
  if (!touchPan.moved && Math.hypot(dx, dy) > 4) touchPan.moved = true;
  if (!touchPan.moved) return;
  els.chartScroll.scrollLeft = touchPan.scrollLeft - dx;
  els.chartScroll.scrollTop = touchPan.scrollTop - dy;
  suppressTouchClickUntil = performance.now() + 400;
  event.preventDefault();
}
function endTouchGesture(event) {
  if (event.pointerType !== "touch" || !touchPoints.has(event.pointerId)) return;
  const moved = Boolean(touchPan?.moved || pinchGesture?.moved);
  touchPoints.delete(event.pointerId);
  try { els.chartScroll.releasePointerCapture(event.pointerId); } catch {}
  if (moved) suppressTouchClickUntil = performance.now() + 400;

  if (touchPoints.size >= 2) {
    beginPinchGesture();
    return;
  }
  pinchGesture = null;
  if (touchPoints.size === 1) {
    const [pointerId, point] = touchPoints.entries().next().value;
    touchPan = {
      pointerId,
      startX: point.x,
      startY: point.y,
      scrollLeft: els.chartScroll.scrollLeft,
      scrollTop: els.chartScroll.scrollTop,
      moved: false
    };
  } else {
    touchPan = null;
  }
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
function base64urlDecode(text) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}
