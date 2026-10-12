(() => {
  for (const tier of DEFAULT_TIERS || []) {
    if (!("description" in tier)) tier.description = "";
  }
  for (const tier of DEFAULT_STATE?.tiers || []) {
    if (!("description" in tier)) tier.description = "";
  }

  function tierDescriptionsFromCurrentState() {
    return new Map((state.tiers || []).map(tier => [
      tier.id,
      String(tier.description ?? "").trim()
    ]));
  }

  function restoreTierDescriptions(descriptions) {
    for (const tier of state.tiers || []) {
      if (descriptions.has(tier.id)) tier.description = descriptions.get(tier.id);
    }
  }

  // Keep descriptions while the existing compatibility normalizer rebuilds tiers.
  const originalNormalizeState = normalizeState;
  normalizeState = function (...args) {
    const descriptions = tierDescriptionsFromCurrentState();
    const result = originalNormalizeState.apply(this, args);
    restoreTierDescriptions(descriptions);
    return result;
  };

  // Reuse the Viewer's existing tooltip system. Only tier-label tooltips are
  // changed; every other tooltip continues through the original implementation.
  const originalBindAppTooltip = bindAppTooltip;
  bindAppTooltip = function (element, htmlFactory, options) {
    if (!element?.classList?.contains("tier-label")) {
      return originalBindAppTooltip.call(this, element, htmlFactory, options);
    }

    return originalBindAppTooltip.call(this, element, () => {
      const tierId = element.dataset.tierId || "";
      const tier = getTiers().find(item => item.id === tierId);
      const description = String(tier?.description || "").trim();

      if (description) {
        return `<strong>${escapeHtml(tier?.label || element.dataset.fullLabel || "")}</strong><div class="app-tooltip-description">${multilineHtml(description)}</div>`;
      }

      return typeof htmlFactory === "function" ? htmlFactory() : String(htmlFactory || "");
    }, options);
  };
})();
