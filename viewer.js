const DEFAULT_MONTHS = makeDefaultMonthLabels(3);
const DEFAULT_TIERS = [
  { id: "human", label: "Human Rights", color: "#ff4b59" },
  { id: "must", label: "Must Pull", color: "#47a9ff" },
  { id: "ideal", label: "Ideally Pull", color: "#67ef87" },
  { id: "luxury", label: "Luxury Pull", color: "#ffcc4d" },
  { id: "skip", label: "Skip", color: "#8d96a6" }
];
const DEFAULT_META_STATUSES = [
  { id: "s1", label: "Human Rights", color: "#ff4b59" },
  { id: "s2", label: "Era-Defining", color: "#47a9ff" },
  { id: "s3", label: "Strong", color: "#67ef87" },
  { id: "s4", label: "Rotational", color: "#ffcc4d" },
  { id: "s5", label: "Situational", color: "#c18cff" }
];
const OLD_GENERIC_MONTHS = ["This Month", "Next Month", "2 Months Later", "3 Months Later", "4 Months Later"];
const OLD_STATUS_MAP = { top: "s1", strong: "s3", niche: "s5", fading: "s4", custom: "s5" };
const LEGACY_TIER_COLORS = { must: ["#ffa12a"], ideal: ["#47a9ff"], luxury: ["#a66bff"], skip: ["#9aa0ab", "#c18cff", "#a66bff", "#8b5cf6", "#9333ea", "#7c3aed", "#6d28d9"] };
const LEGACY_TIER_LABELS = { must: ["Era-Defining"], ideal: ["Strong"], luxury: ["Rotational"] };
const LEGACY_STATUS_COLORS = { s2: "#37e6ff" };
const TAG_OPTIONS = ["PVP", "PVE", "Must P5", "Core", "Tech", "Def", "Sub", "CB"];
const MUST_P5_TAG = "Must P5";
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
const COMPACT_PILOT_W = 96;
const COMPACT_STACK_GAP = 8;
const BAR_TOP = 222;
const BAR_GAP = 23;
const BAR_H = 18;
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
  tooltip: document.getElementById("tooltip")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  tooltipEl = els.tooltip;
  bindControls();
  await loadOptionalCatalog();
  await loadRoadmap();
  normalizeState();
  renderAll();
  setTimeout(fitToWidth, 40);
}

function bindControls() {
  document.getElementById("btnZoomOut").addEventListener("click", () => setZoom(zoomScale - 0.1));
  document.getElementById("btnZoomIn").addEventListener("click", () => setZoom(zoomScale + 0.1));
  document.getElementById("btnFit").addEventListener("click", fitToWidth);
  document.getElementById("btnCloseDrawer").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDrawer(); });
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
    const fallback = DEFAULT_META_STATUSES[i] || { label: `Status ${i + 1}`, color: "#8aa0ff" };
    const color = validHex(s.color) && String(s.color).toLowerCase() !== (LEGACY_STATUS_COLORS[id] || "").toLowerCase()
      ? s.color
      : fallback.color;
    return { id, label: sanitizeText(s.label) || fallback.label, color };
  });

  const tierIdsSet = new Set(state.tiers.map(t => t.id));
  const statusIds = new Set(state.metaStatuses.map(s => s.id));
  const fallbackStatus = defaultMetaStatusId();

  state.units = unitsBefore.map((u, i) => {
    const tier = tierIdsSet.has(u.tier) ? u.tier : "must";
    const week = normalizeWeek(u.week || u.releaseWeek || 1);
    const oldStatus = OLD_STATUS_MAP[u.metaStatus] || u.metaStatus || fallbackStatus;
    let segments = Array.isArray(u.segments) ? u.segments : [];

    if (!segments.length) {
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
    return {
      id: u.id || `unit-${i}`,
      name: sanitizeText(u.name) || "Unnamed Unit",
      kind: sanitizeText(u.kind || u.type) || "custom",
      tier,
      week,
      lane: normalizeLane(u.lane || 1),
      rowOffset: normalizeRowOffset(u.rowOffset ?? u.tierOffset ?? 0),
      stackOrder: Number(u.stackOrder) || 0,
      icon: resolveIcon(u),
      tags: cleanTags(rawTags),
      note: String(u.note || "").trim(),
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

  const monthWeeks = getMonthWeeks();
  state.months.forEach((month, i) => {
    const el = addDiv("month-head", {
      left: `${weekX(monthStartWeek(i))}px`,
      width: `${monthWeeks[i] * CELL_W}px`
    });
    el.textContent = month;
  });

  for (let w = 1; w <= weekCount(); w++) {
    const el = addDiv("week-head", { left: `${weekX(w)}px` });
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
      left: `${LEFT_W + w * CELL_W}px`
    });
    line.style.height = monthBoundaries.has(w) ? "100%" : `${height - HEADER_H}px`;
  }

  getTiers().forEach(tier => addDiv("grid-line h", { top: `${tierY(tier.id)}px` }));
  addDiv("grid-line h", { top: `${height}px` });

  getTiers().forEach(tier => {
    for (let lane = 1; lane <= visibleLaneCount(tier.id); lane++) {
      addDiv("lane-track", { top: `${laneY(tier.id, lane)}px` });
    }
  });

  state.units
    .filter(hasMetaBars)
    .sort((a, b) => laneY(a) - laneY(b) || normalizeWeek(a.week) - normalizeWeek(b.week) || a.name.localeCompare(b.name))
    .forEach(unit => unit.segments.forEach(segment => renderSegment(unit, segment)));

  state.units
    .slice()
    .sort((a, b) => unitZIndex(a, sameSlotOffset(a)) - unitZIndex(b, sameSlotOffset(b)) || a.name.localeCompare(b.name))
    .forEach(renderUnit);
}

function renderUnit(unit) {
  const slot = sameSlotOffset(unit);
  const compactPilot = slot.compact && isPilot(unit);
  const size = slot.size || ICON_W;
  const card = document.createElement("article");
  card.className = `unit-card${activeUnitId === unit.id ? " active" : ""}${hasMustP5(unit) ? " must-p5" : ""}${normalizeRowOffset(unit.rowOffset) ? " between-row" : ""}${compactPilot ? " compact-pilot" : ""}`;
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

  const displayTags = unit.tags.slice(0, 8);
  const tags = document.createElement("div");
  tags.className = `tags${displayTags.length > 5 ? " two-col" : ""}`;
  const appendTag = (container, tag) => {
    const span = document.createElement("span");
    span.className = `tag ${tagClass(tag)}`;
    span.textContent = tag;
    container.appendChild(span);
  };
  if (displayTags.length > 5) {
    [displayTags.slice(0, 5), displayTags.slice(5)].forEach(colTags => {
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

  card.addEventListener("click", () => openDrawer(unit.id));
  card.addEventListener("mouseenter", event => { bringUnitToFront(unit.id); showTooltip(event, unit); });
  card.addEventListener("mouseleave", hideTooltip);
  card.addEventListener("pointermove", moveTooltip);
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDrawer(unit.id);
    }
  });
  els.roadmap.appendChild(card);
}

function renderSegment(unit, segment) {
  if (!hasMetaBars(unit)) return;
  const bar = document.createElement("div");
  bar.className = `meta-bar${activeUnitId === unit.id ? " active" : ""}`;
  bar.style.left = `${weekX(segment.start) + 12}px`;
  bar.style.top = `${laneY(unit)}px`;
  bar.style.width = `${(segment.end - segment.start + 1) * CELL_W - 24}px`;
  bar.style.setProperty("--bar", segmentColor(segment));
  bar.setAttribute("tabindex", "0");
  bar.setAttribute("aria-label", `${unit.name} - ${metaStatus(segment.statusId).label}`);

  const label = document.createElement("span");
  label.className = "bar-label";
  label.textContent = `${unit.name} - ${metaStatus(segment.statusId).label}`;
  bar.appendChild(label);

  bar.addEventListener("click", () => openDrawer(unit.id, segment.id));
  bar.addEventListener("mouseenter", event => showTooltip(event, unit, segment));
  bar.addEventListener("mouseleave", hideTooltip);
  bar.addEventListener("pointermove", moveTooltip);
  bar.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDrawer(unit.id, segment.id);
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
    <section class="drawer-section">
      <h3>Meta timeline${metaUnit && metaUnit.id !== unit.id ? ` · ${escapeHtml(metaUnit.name)}` : ""}</h3>
      <div class="segment-list">${metaHtml}</div>
    </section>
    ${unit.note ? `<section class="drawer-section"><h3>Note</h3><div class="note">${escapeHtml(unit.note)}</div></section>` : ""}
  `;
}

window.__ucePlaceholder = function(name) {
  const div = document.createElement("div");
  div.className = "placeholder";
  div.textContent = initials(name);
  return div;
};

function showTooltip(event, unit, activeSegment = null) {
  const metaUnit = metaOwnerForUnit(unit);
  const activeId = metaUnit ? (activeSegment?.id || metaUnit.segments?.[0]?.id || null) : null;
  tooltipEl.innerHTML = tooltipHtml(unit, activeId);
  tooltipEl.classList.remove("hidden");
  moveTooltip(event);
}

function moveTooltip(event) {
  if (tooltipEl.classList.contains("hidden")) return;
  const pad = 14;
  const rect = tooltipEl.getBoundingClientRect();
  let x = event.clientX + 16;
  let y = event.clientY + 16;
  if (x + rect.width > window.innerWidth - pad) x = event.clientX - rect.width - 16;
  if (y + rect.height > window.innerHeight - pad) y = window.innerHeight - rect.height - pad;
  if (x < pad) x = pad;
  if (y < pad) y = pad;
  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
}

function hideTooltip() {
  tooltipEl.classList.add("hidden");
}

function tooltipHtml(unit, activeSegmentId = null) {
  const pairedMs = isPilot(unit) ? pairedMsForPilot(unit) : null;
  const metaUnit = metaOwnerForUnit(unit);
  const title = pairedMs ? `${unit.name} (${pairedMs.name})` : unit.name;
  const tagHtml = unit.tags.length ? `<div class="drawer-tags tooltip-tags">${unit.tags.map(tag => `<span class="tag ${tagClass(tag)}">${escapeHtml(tag)}</span>`).join("")}</div>` : "";
  const mustP5Html = hasMustP5(unit) ? `<div class="tooltip-must-p5">Must P5</div>` : "";
  const segmentsHtml = metaUnit ? segmentListHtml(metaUnit, activeSegmentId) : `<div class="segment-chip"><i class="segment-dot"></i><span>No same-week MS meta segments</span></div>`;
  return `
    <h3>${escapeHtml(title)}</h3>
    <div class="tooltip-subline">${escapeHtml(unitRowLabel(unit))} · ${escapeHtml(formatWeek(unit.week))}</div>
    ${mustP5Html}
    ${tagHtml}
    <div class="segment-list">${segmentsHtml}</div>
    ${unit.note ? `<div class="note">${escapeHtml(unit.note)}</div>` : ""}
  `;
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
  zoomScale = clamp(Math.round(Number(value || 1) * 100) / 100, 0.35, 1.65);
  applyZoom();
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
  els.zoomLabel.textContent = `${Math.round(zoomScale * 100)}%`;
}

function fitToWidth() {
  const available = Math.max(320, els.chartScroll.clientWidth - 28);
  const scale = available / baseChartWidth();
  setZoom(clamp(scale, 0.35, 1.2));
}

function baseChartWidth() { return LEFT_W + weekCount() * CELL_W; }
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
function weekX(week) { return LEFT_W + (week - 1) * CELL_W; }
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
    if (unit.tier === tierId && hasMetaBars(unit)) maxLane = Math.max(maxLane, Number(unit.lane) || 0);
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
  const size = slot.size || ICON_W;
  return clamp(weekX(unit.week) + Math.round((CELL_W - ICON_W) / 2) + slot.x, LEFT_W, baseChartWidth() - size);
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
    if (upper && lower) return `${upper.label} - ${lower.label}`;
  }
  return "Between rows";
}
function unitRowLabel(unit) { return normalizeRowOffset(unit.rowOffset) ? rowOffsetLabel(unit.rowOffset, unit.tier) : tierById(unit.tier).label; }
function isPilot(unit) { return String(unit?.kind || "").toLowerCase() === "pilot"; }
function isMs(unit) { return String(unit?.kind || "").toLowerCase() === "ms"; }
function hasMetaBars(unit) { return !isPilot(unit); }
function hasTag(unit, tag) { return !!unit?.tags?.some(t => t.toLowerCase() === tag.toLowerCase()); }
function hasMustP5(unit) { return hasTag(unit, MUST_P5_TAG); }
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
function slotSizeForUnit(unit, group = sameSlotGroup(unit)) { return isCompactBetweenSlot(group) && isPilot(unit) ? COMPACT_PILOT_W : ICON_W; }
function slotLayoutForGroup(group) {
  const compact = isCompactBetweenSlot(group);
  let y = 0;
  const layout = new Map();
  group.forEach((unit, index) => {
    const size = slotSizeForUnit(unit, group);
    const x = compact && size < ICON_W ? Math.round((ICON_W - size) / 2) : 0;
    layout.set(unit.id, { x, y, size, z: group.length - index, index });
    y += size + (compact ? COMPACT_STACK_GAP : ICON_STACK_GAP);
  });
  return { layout, groupHeight: Math.max(ICON_W, y - (compact ? COMPACT_STACK_GAP : ICON_STACK_GAP)), compact };
}
function sameSlotOffset(unit) {
  const group = sameSlotGroup(unit);
  if (group.length <= 1) return { x: 0, y: 0, z: 0, index: 0, count: 1, groupHeight: ICON_W, size: ICON_W, compact: false };
  const { layout, groupHeight, compact } = slotLayoutForGroup(group);
  const slot = layout.get(unit.id) || { x: 0, y: 0, z: 0, index: 0, size: ICON_W };
  return { ...slot, count: group.length, groupHeight, compact };
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
    .filter(unit => unit.tier === tierId && hasMetaBars(unit))
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
  }).slice(0, 8);
}
function tagClass(tag) {
  const t = String(tag || "").toLowerCase();
  if (t === "pvp") return "pvp";
  if (t === "pve") return "pve";
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
  const normalized = clamp(Number(scale) || 1, 0.5, 1.6);
  return clamp(Math.pow(1 / normalized, 0.45), 1, 1.42);
}
function barLabelTextScale(scale = zoomScale) {
  const normalized = clamp(Number(scale) || 1, 0.5, 1.6);
  return clamp(Math.pow(1 / normalized, 0.85), 1, 1.82);
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
