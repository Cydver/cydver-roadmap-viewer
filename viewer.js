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
const TAG_OPTIONS = ["PVP", "PVE", "Core", "Tech", "Def"];
const TAG_ORDER = new Map(TAG_OPTIONS.map((tag, i) => [tag.toLowerCase(), i]));

const CELL_W = 200;
const LEFT_W = 260;
const MONTH_H = 58;
const WEEK_H = 48;
const HEADER_H = MONTH_H + WEEK_H;
const BLANK_TIER_H = 250;
const ICON_W = 176;
const ICON_TOP = 28;
const BAR_TOP = 222;
const BAR_GAP = 23;
const BAR_H = 18;
const BAR_BOTTOM_PAD = 34;

const DEFAULT_STATE = {
  updated: "",
  months: [...DEFAULT_MONTHS],
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
    setMessage("No published roadmap data found.");
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

  const existingTiers = new Map((state.tiers || []).map(t => [t.id, t]));
  state.tiers = DEFAULT_TIERS.map(fallback => {
    const old = existingTiers.get(fallback.id) || {};
    return {
      id: fallback.id,
      label: sanitizeText(old.label) || fallback.label,
      color: validHex(old.color) ? old.color : fallback.color
    };
  });

  if (!Array.isArray(state.metaStatuses) || !state.metaStatuses.length) state.metaStatuses = structuredClone(DEFAULT_META_STATUSES);
  state.metaStatuses = state.metaStatuses.slice(0, 8).map((s, i) => {
    const fallback = DEFAULT_META_STATUSES[i] || { id: `s${i + 1}`, label: `Status ${i + 1}`, color: "#8aa0ff" };
    return {
      id: sanitizeText(s.id) || fallback.id,
      label: sanitizeText(s.label) || fallback.label,
      color: validHex(s.color) ? s.color : fallback.color
    };
  });

  const tierIds = new Set(state.tiers.map(t => t.id));
  const statusIds = new Set(state.metaStatuses.map(s => s.id));
  const fallbackStatus = state.metaStatuses[2]?.id || state.metaStatuses[0]?.id || "s3";

  state.units = unitsBefore.map((u, i) => {
    const tier = tierIds.has(u.tier) ? u.tier : "must";
    const week = normalizeWeek(u.week || u.releaseWeek || 1);
    const oldStatus = OLD_STATUS_MAP[u.metaStatus] || u.metaStatus || fallbackStatus;
    let segments = Array.isArray(u.segments) ? u.segments : [];

    if (!segments.length) {
      const start = normalizeWeek(u.metaStart || week);
      const end = normalizeWeek(u.metaEnd || start);
      segments = [{ start: Math.min(start, end), end: Math.max(start, end), statusId: oldStatus }];
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
      kind: sanitizeText(u.kind) || "custom",
      tier,
      week,
      lane: normalizeLane(u.lane || 1),
      icon: resolveIcon(u),
      tags: cleanTags(rawTags),
      note: String(u.note || "").trim(),
      segments
    };
  });

  state.units.forEach(unit => {
    unit.week = normalizeWeek(unit.week);
    unit.segments.forEach(seg => {
      seg.start = normalizeWeek(seg.start);
      seg.end = normalizeWeek(seg.end);
      if (seg.end < seg.start) [seg.start, seg.end] = [seg.end, seg.start];
    });
  });

  state.tiers.forEach(tier => reflowLanes(tier.id));
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
  const updated = state.updated ? ` · Updated ${formatDate(state.updated)}` : "";
  els.summary.textContent = `${count} unit${count === 1 ? "" : "s"} · ${months} month${months === 1 ? "" : "s"}${updated}`;
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

  addDiv("month-head corner", { left: "0px", width: `${LEFT_W}px` });

  state.months.forEach((month, i) => {
    const el = addDiv("month-head", {
      left: `${LEFT_W + i * 4 * CELL_W}px`,
      width: `${4 * CELL_W}px`
    });
    el.textContent = month;
  });

  for (let w = 1; w <= weekCount(); w++) {
    const el = addDiv("week-head", { left: `${weekX(w)}px` });
    el.textContent = `W${((w - 1) % 4) + 1}`;
  }

  getTiers().forEach(tier => {
    const label = addDiv("tier-label", {
      top: `${tierY(tier.id)}px`,
      height: `${tierHeight(tier.id)}px`,
      color: tier.color
    });
    label.textContent = tier.label;
  });

  for (let w = 0; w <= weekCount(); w++) {
    const line = addDiv(`grid-line v${w % 4 === 0 ? " month" : ""}`, {
      left: `${LEFT_W + w * CELL_W}px`
    });
    if (w % 4 !== 0) line.style.height = `${height - HEADER_H}px`;
  }

  getTiers().forEach(tier => addDiv("grid-line h", { top: `${tierY(tier.id)}px` }));
  addDiv("grid-line h", { top: `${height}px` });

  getTiers().forEach(tier => {
    for (let lane = 1; lane <= visibleLaneCount(tier.id); lane++) {
      addDiv("lane-track", { top: `${laneY(tier.id, lane)}px` });
    }
  });

  state.units.forEach(renderUnit);
}

function renderUnit(unit) {
  const card = document.createElement("article");
  card.className = `unit-card${activeUnitId === unit.id ? " active" : ""}`;
  card.style.left = `${iconX(unit)}px`;
  card.style.top = `${iconY(unit)}px`;
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

  const tags = document.createElement("div");
  tags.className = "tags";
  unit.tags.slice(0, 6).forEach(tag => {
    const span = document.createElement("span");
    span.className = `tag ${tagClass(tag)}`;
    span.textContent = tag;
    tags.appendChild(span);
  });
  card.appendChild(tags);

  const plate = document.createElement("div");
  plate.className = "nameplate";
  plate.textContent = unit.name;
  card.appendChild(plate);

  card.addEventListener("click", () => openDrawer(unit.id));
  card.addEventListener("mouseenter", event => showTooltip(event, unit));
  card.addEventListener("mouseleave", hideTooltip);
  card.addEventListener("pointermove", moveTooltip);
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDrawer(unit.id);
    }
  });
  els.roadmap.appendChild(card);

  unit.segments.forEach(segment => renderSegment(unit, segment));
}

function renderSegment(unit, segment) {
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
  const tagHtml = unit.tags.map(tag => `<span class="tag ${tagClass(tag)}">${escapeHtml(tag)}</span>`).join("");
  const imgHtml = unit.icon
    ? `<img src="${escapeAttr(unit.icon)}" alt="${escapeAttr(unit.name)}" onerror="this.replaceWith(window.__ucePlaceholder('${escapeAttr(unit.name)}'))">`
    : placeholderHtml(unit.name);

  return `
    <section class="drawer-hero">
      ${imgHtml}
      <div>
        <h2>${escapeHtml(unit.name)}</h2>
        <div class="drawer-tags">${tagHtml}</div>
      </div>
    </section>
    <section class="drawer-section">
      <div class="meta-row"><span class="k">Tier</span><span style="color:${escapeAttr(tierById(unit.tier).color)}">${escapeHtml(tierById(unit.tier).label)}</span></div>
      <div class="meta-row"><span class="k">Release</span><span>${escapeHtml(formatWeek(unit.week))}</span></div>
      <div class="meta-row"><span class="k">Type</span><span>${escapeHtml(unit.kind || "custom")}</span></div>
    </section>
    <section class="drawer-section">
      <h3>Meta timeline</h3>
      <div class="segment-list">${segmentListHtml(unit, activeSegmentId)}</div>
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
  tooltipEl.innerHTML = tooltipHtml(unit, activeSegment?.id || null);
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
  const tagHtml = unit.tags.length ? `<div class="drawer-tags">${unit.tags.map(tag => `<span class="tag ${tagClass(tag)}">${escapeHtml(tag)}</span>`).join("")}</div>` : "";
  return `
    <h3>${escapeHtml(unit.name)}</h3>
    ${tagHtml}
    <div class="meta-row"><span class="k">Tier</span><span style="color:${escapeAttr(tierById(unit.tier).color)}">${escapeHtml(tierById(unit.tier).label)}</span></div>
    <div class="meta-row"><span class="k">Release</span><span>${escapeHtml(formatWeek(unit.week))}</span></div>
    <div class="segment-list">${segmentListHtml(unit, activeSegmentId)}</div>
    ${unit.note ? `<div class="note">${escapeHtml(unit.note)}</div>` : ""}
  `;
}

function segmentListHtml(unit, activeSegmentId = null) {
  return unit.segments.map(seg => {
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
function weekCount() { return Math.max(1, (state.months || DEFAULT_MONTHS).length * 4); }
function getTiers() { return state.tiers?.length ? state.tiers : DEFAULT_TIERS; }
function getStatuses() { return state.metaStatuses?.length ? state.metaStatuses : DEFAULT_META_STATUSES; }
function tierById(id) { return getTiers().find(t => t.id === id) || getTiers()[0] || DEFAULT_TIERS[0]; }
function metaStatus(id) { return getStatuses().find(s => s.id === id) || getStatuses()[2] || DEFAULT_META_STATUSES[2]; }
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
  if (!lanes) return BLANK_TIER_H;
  return Math.max(BLANK_TIER_H, BAR_TOP + lanes * BAR_GAP + BAR_BOTTOM_PAD);
}
function visibleLaneCount(tierId) {
  let max = 0;
  state.units.forEach(unit => { if (unit.tier === tierId) max = Math.max(max, Number(unit.lane) || 0); });
  return max;
}
function laneY(unitOrTier, laneMaybe) {
  const tier = typeof unitOrTier === "string" ? unitOrTier : unitOrTier.tier;
  const lane = typeof unitOrTier === "string" ? laneMaybe : unitOrTier.lane;
  return tierY(tier) + BAR_TOP + (lane - 1) * BAR_GAP;
}
function iconX(unit) { return weekX(unit.week) + Math.round((CELL_W - ICON_W) / 2); }
function iconY(unit) { return tierY(unit.tier) + ICON_TOP; }
function normalizeWeek(n) { return clamp(Math.round(Number(n) || 1), 1, Math.max(1, Math.ceil(maxUsedWeek(state.units || []) / 4) * 4, (state.months?.length || 3) * 4)); }
function normalizeLane(n) { return clamp(Math.round(Number(n) || 1), 1, 99); }
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
    .filter(unit => unit.tier === tierId)
    .sort((a, b) => b.week - a.week || a.name.localeCompare(b.name))
    .forEach((unit, index) => { unit.lane = index + 1; });
}

function formatWeek(week) {
  const normalized = clamp(Math.round(Number(week) || 1), 1, weekCount());
  const monthIndex = Math.floor((normalized - 1) / 4);
  const weekInMonth = ((normalized - 1) % 4) + 1;
  const label = state.months?.[monthIndex] || suggestedMonthLabel(monthIndex);
  return `${label} W${weekInMonth}`;
}
function formatWeekRange(start, end) {
  return Number(start) === Number(end) ? formatWeek(start) : `${formatWeek(start)}–${formatWeek(end)}`;
}
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
  });
}
function tagClass(tag) {
  const t = String(tag || "").toLowerCase();
  if (t === "pvp") return "pvp";
  if (t === "pve") return "pve";
  if (t === "core") return "core";
  if (t === "tech") return "tech";
  if (t === "def") return "def";
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
