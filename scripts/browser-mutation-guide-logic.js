(function () {
  "use strict";

  const defaultThreshold = 6;
  const svgInternalTags = new Set([
    "animate",
    "circle",
    "clipPath",
    "defs",
    "ellipse",
    "feBlend",
    "feColorMatrix",
    "feComposite",
    "feDropShadow",
    "feFlood",
    "feGaussianBlur",
    "feMerge",
    "feOffset",
    "filter",
    "g",
    "line",
    "linearGradient",
    "mask",
    "path",
    "polygon",
    "polyline",
    "radialGradient",
    "rect",
    "stop",
    "symbol",
    "text",
    "tspan",
    "use"
  ]);
  const textContainerTags = new Set([
    "blockquote",
    "caption",
    "dd",
    "dt",
    "figcaption",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "label",
    "legend",
    "li",
    "p",
    "td",
    "th"
  ]);

  function round(value) {
    return Math.round(value * 100) / 100;
  }

  function normalizeRect(rect) {
    const left = Number(rect.left);
    const top = Number(rect.top);
    const width = Number(rect.width);
    const height = Number(rect.height);
    const right = Number.isFinite(rect.right) ? Number(rect.right) : left + width;
    const bottom = Number.isFinite(rect.bottom) ? Number(rect.bottom) : top + height;
    return {
      id: rect.id || "",
      label: rect.label || rect.id || "",
      role: rect.role || "element",
      left,
      top,
      width,
      height,
      right,
      bottom,
      centerX: Number.isFinite(rect.centerX) ? Number(rect.centerX) : left + width / 2,
      centerY: Number.isFinite(rect.centerY) ? Number(rect.centerY) : top + height / 2,
      priority: Number.isFinite(rect.priority) ? Number(rect.priority) : 0
    };
  }

  function moveRect(rect, dx, dy) {
    const source = normalizeRect(rect);
    return normalizeRect({
      ...source,
      left: source.left + dx,
      top: source.top + dy,
      right: source.right + dx,
      bottom: source.bottom + dy,
      centerX: source.centerX + dx,
      centerY: source.centerY + dy
    });
  }

  function axisPoints(rect, axis) {
    if (axis === "x") {
      return [
        { key: "left", value: rect.left },
        { key: "center", value: rect.centerX },
        { key: "right", value: rect.right }
      ];
    }
    return [
      { key: "top", value: rect.top },
      { key: "center", value: rect.centerY },
      { key: "bottom", value: rect.bottom }
    ];
  }

  function guideLine(candidate, axis, key, value) {
    if (axis === "x") {
      return {
        axis,
        value: round(value),
        from: round(candidate.top),
        to: round(candidate.bottom)
      };
    }
    return {
      axis,
      value: round(value),
      from: round(candidate.left),
      to: round(candidate.right)
    };
  }

  function matchKind(sourceKey, targetKey) {
    if (sourceKey === "center" && targetKey === "center") {
      return "center";
    }
    if (sourceKey === targetKey) {
      return "edge";
    }
    return "edge-gap";
  }

  function axisSize(rect, axis) {
    return axis === "x" ? rect.width : rect.height;
  }

  function hasSimilarAxisSize(source, target, axis) {
    const sourceSize = axisSize(source, axis);
    const targetSize = axisSize(target, axis);
    const tolerance = Math.max(8, Math.min(sourceSize, targetSize) * 0.2);
    return Math.abs(sourceSize - targetSize) <= tolerance;
  }

  function shouldPreferMatch(candidate, best, centerSlack) {
    if (!best) {
      return true;
    }
    if (candidate.priority > best.priority + 20) {
      return true;
    }
    if (candidate.centerPreferred && !best.centerPreferred && candidate.priority + 20 >= best.priority && candidate.distance <= best.distance + centerSlack) {
      return true;
    }
    if (best.centerPreferred && !candidate.centerPreferred && best.priority + 20 >= candidate.priority && candidate.distance >= best.distance - centerSlack) {
      return false;
    }
    if (candidate.distance < best.distance && !(best.distance <= centerSlack && best.priority > candidate.priority + 20)) {
      return true;
    }
    if (candidate.distance === best.distance && candidate.priority === best.priority && candidate.kind === "center") {
      return true;
    }
    return false;
  }

  function nearestSnapForAxis(moved, candidates, axis, threshold, options = {}) {
    let best = null;
    const centerOnly = options.centerOnly === true;
    const preferSimilarCenter = options.preferSimilarCenter !== false;
    const centerSlack = Number.isFinite(options.centerSlack) ? options.centerSlack : 3;
    for (const sourcePoint of axisPoints(moved, axis)) {
      for (const candidate of candidates) {
        for (const targetPoint of axisPoints(candidate, axis)) {
          const adjustment = targetPoint.value - sourcePoint.value;
          const distance = Math.abs(adjustment);
          if (distance > threshold) {
            continue;
          }
          const kind = matchKind(sourcePoint.key, targetPoint.key);
          if (centerOnly && kind !== "center") {
            continue;
          }
          const candidateMatch = {
            axis,
            adjustment,
            distance,
            kind,
            source: sourcePoint.key,
            target: targetPoint.key,
            targetId: candidate.id,
            targetLabel: candidate.label,
            targetRole: candidate.role,
            priority: candidate.priority,
            centerPreferred: preferSimilarCenter && kind === "center" && hasSimilarAxisSize(moved, candidate, axis),
            guide: guideLine(candidate, axis, targetPoint.key, targetPoint.value)
          };
          if (shouldPreferMatch(candidateMatch, best, centerSlack)) {
            best = candidateMatch;
          }
        }
      }
    }
    return best;
  }

  function snapRect(rect, options) {
    const threshold = Number.isFinite(options?.threshold) ? options.threshold : defaultThreshold;
    const dx = Number(options?.dx || 0);
    const dy = Number(options?.dy || 0);
    const candidates = (options?.candidates || []).map(normalizeRect);
    const axes = Array.isArray(options?.axes) && options.axes.length ? new Set(options.axes) : new Set(["x", "y"]);
    const moved = moveRect(rect, dx, dy);
    const snapOptions = {
      centerOnly: options?.centerOnly === true,
      centerSlack: options?.centerSlack,
      preferSimilarCenter: options?.preferSimilarCenter
    };
    const xMatch = axes.has("x") ? nearestSnapForAxis(moved, candidates, "x", threshold, snapOptions) : null;
    const yMatch = axes.has("y") ? nearestSnapForAxis(moved, candidates, "y", threshold, snapOptions) : null;
    const snappedDx = dx + (xMatch ? xMatch.adjustment : 0);
    const snappedDy = dy + (yMatch ? yMatch.adjustment : 0);
    const snapped = moveRect(rect, snappedDx, snappedDy);
    const matches = [xMatch, yMatch]
      .filter(Boolean)
      .map((match) => ({
        axis: match.axis,
        kind: match.kind,
        source: match.source,
        target: match.target,
        targetId: match.targetId,
        targetLabel: match.targetLabel,
        targetRole: match.targetRole,
        distance: round(match.distance),
        adjustment: round(match.adjustment),
        centerPreferred: match.centerPreferred === true,
        guide: match.guide
      }));

    return {
      rect: snapped,
      delta: { x: round(snappedDx), y: round(snappedDy) },
      matches
    };
  }

  function overlaps(aStart, aEnd, bStart, bEnd) {
    return Math.min(aEnd, bEnd) - Math.max(aStart, bStart) > 0;
  }

  function spacingCandidate(side, distance, target) {
    return {
      side,
      distance: round(distance),
      targetId: target.id,
      targetLabel: target.label,
      targetRole: target.role
    };
  }

  function nearestSpacing(current, candidates, side) {
    let best = null;
    for (const target of candidates) {
      let item = null;
      const isContainer = (
        (target.role === "parent" || target.role === "ancestor") &&
        target.left <= current.left &&
        target.right >= current.right &&
        target.top <= current.top &&
        target.bottom >= current.bottom
      );
      if (isContainer && side === "left") {
        item = spacingCandidate(side, current.left - target.left, target);
      }
      if (isContainer && side === "right") {
        item = spacingCandidate(side, target.right - current.right, target);
      }
      if (isContainer && side === "top") {
        item = spacingCandidate(side, current.top - target.top, target);
      }
      if (isContainer && side === "bottom") {
        item = spacingCandidate(side, target.bottom - current.bottom, target);
      }
      if (side === "left" && target.right <= current.left && overlaps(current.top, current.bottom, target.top, target.bottom)) {
        item = spacingCandidate(side, current.left - target.right, target);
      }
      if (side === "right" && target.left >= current.right && overlaps(current.top, current.bottom, target.top, target.bottom)) {
        item = spacingCandidate(side, target.left - current.right, target);
      }
      if (side === "top" && target.bottom <= current.top && overlaps(current.left, current.right, target.left, target.right)) {
        item = spacingCandidate(side, current.top - target.bottom, target);
      }
      if (side === "bottom" && target.top >= current.bottom && overlaps(current.left, current.right, target.left, target.right)) {
        item = spacingCandidate(side, target.top - current.bottom, target);
      }
      if (item && (!best || item.distance < best.distance)) {
        best = item;
      }
    }
    return best;
  }

  function measureSpacing(rect, candidates) {
    const current = normalizeRect(rect);
    const normalizedCandidates = (candidates || []).map(normalizeRect);
    return ["left", "right", "top", "bottom"]
      .map((side) => nearestSpacing(current, normalizedCandidates, side))
      .filter(Boolean);
  }

  function rectGap(a, b) {
    const current = normalizeRect(a);
    const target = normalizeRect(b);
    const dx = Math.max(0, target.left - current.right, current.left - target.right);
    const dy = Math.max(0, target.top - current.bottom, current.top - target.bottom);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function centerDistance(a, b) {
    const current = normalizeRect(a);
    const target = normalizeRect(b);
    const dx = current.centerX - target.centerX;
    const dy = current.centerY - target.centerY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function isStructuralCandidate(candidate) {
    return candidate.role === "parent" || candidate.role === "ancestor" || candidate.role === "surface";
  }

  function filterMoveCandidates(rect, candidates, options = {}) {
    const radius = Number.isFinite(options.radius) ? options.radius : 240;
    const current = normalizeRect(rect);
    return (candidates || [])
      .map(normalizeRect)
      .filter((candidate) => isStructuralCandidate(candidate) || rectGap(current, candidate) <= radius)
      .sort((a, b) => {
        if (isStructuralCandidate(a) && !isStructuralCandidate(b)) return -1;
        if (!isStructuralCandidate(a) && isStructuralCandidate(b)) return 1;
        return rectGap(current, a) - rectGap(current, b);
      });
  }

  function mergeNearbyCandidates(rect, baseCandidates, poolCandidates, options = {}) {
    const radius = Number.isFinite(options.radius) ? options.radius : 240;
    const current = normalizeRect(rect);
    const seen = new Set();
    const merged = [];
    for (const candidate of [...(baseCandidates || []), ...(poolCandidates || [])]) {
      const normalized = normalizeRect(candidate);
      if (seen.has(normalized.id)) {
        continue;
      }
      if (isStructuralCandidate(normalized) || rectGap(current, normalized) <= radius) {
        seen.add(normalized.id);
        merged.push(normalized);
      }
    }
    return filterMoveCandidates(current, merged, { radius });
  }

  function nearestMoveReferences(rect, candidates, options = {}) {
    const limit = Number.isFinite(options.limit) ? options.limit : 4;
    const current = normalizeRect(rect);
    return (candidates || [])
      .map(normalizeRect)
      .map((candidate) => ({
        id: candidate.id,
        label: candidate.label,
        role: candidate.role,
        distance: round(rectGap(current, candidate)),
        centerDistance: round(centerDistance(current, candidate)),
        structural: isStructuralCandidate(candidate),
        rect: {
          left: round(candidate.left),
          top: round(candidate.top),
          right: round(candidate.right),
          bottom: round(candidate.bottom),
          width: round(candidate.width),
          height: round(candidate.height)
        }
      }))
      .sort((a, b) => {
        if (a.structural !== b.structural) return a.structural ? 1 : -1;
        return a.distance - b.distance || a.centerDistance - b.centerDistance;
      })
      .slice(0, Math.max(0, limit))
      .map(({ structural, ...reference }) => reference);
  }

  function applyAxisLock(dx, dy, options = {}) {
    if (!options.shiftKey) {
      return { dx, dy, axisLock: null };
    }
    const threshold = Number.isFinite(options.threshold) ? options.threshold : 4;
    let axisLock = options.currentLock === "x" || options.currentLock === "y" ? options.currentLock : null;
    if (!axisLock) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) {
        return { dx, dy, axisLock: null };
      }
      axisLock = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
    return axisLock === "x"
      ? { dx, dy: 0, axisLock }
      : { dx: 0, dy, axisLock };
  }

  function isMeaningfulGuideCandidate(meta) {
    const tag = String(meta?.tag || "").toLowerCase();
    const namespace = String(meta?.namespace || "").toLowerCase();
    const display = String(meta?.display || "").toLowerCase();
    const text = String(meta?.text || "").replace(/\s+/g, " ").trim();
    const placeholder = String(meta?.placeholder || "").replace(/\s+/g, " ").trim();
    const width = Number(meta?.width || 0);
    const height = Number(meta?.height || 0);

    if (width < 2 || height < 2) {
      return false;
    }
    if (namespace === "svg" && tag !== "svg") {
      return false;
    }
    if (svgInternalTags.has(tag)) {
      return false;
    }
    if (tag === "svg") {
      return false;
    }
    if (meta?.interactive || meta?.formControl || meta?.contentEditable) {
      return true;
    }
    if (meta?.iconRoot || tag === "img" || tag === "canvas") {
      return width >= 8 && height >= 8;
    }
    if (placeholder) {
      return true;
    }
    if (textContainerTags.has(tag)) {
      return text.length >= 2;
    }
    if (text.length <= 1) {
      return false;
    }
    if (display === "inline") {
      return false;
    }
    if (meta?.hasRole || meta?.hasAriaLabel || meta?.hasTestId) {
      return true;
    }
    return width >= 12 && height >= 12;
  }

  globalThis.__codexBrowserMutationGuideLogic = {
    applyAxisLock,
    defaultThreshold,
    filterMoveCandidates,
    isMeaningfulGuideCandidate,
    measureSpacing,
    mergeNearbyCandidates,
    moveRect,
    nearestMoveReferences,
    normalizeRect,
    snapRect
  };
})();
