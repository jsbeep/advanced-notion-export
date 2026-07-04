/**
 * Rewrites every selector in `css` so the whole sheet only takes effect inside `scope`
 * (e.g. `.anx-export`). Global/root selectors (`html`, `body`, `:root`, `*`) are remapped onto
 * the scope root so a full Notion export stylesheet can be embedded in a blog post via a single
 * <style> tag without restyling the host page.
 *
 * Parsing is done through the live CSSOM (a throwaway <style> element) rather than regex, so
 * modern selectors (:has, :not, :focus-within) and @media/@supports blocks round-trip correctly.
 */
export function scopeCss(css: string, scope: string): string {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  try {
    const sheet = style.sheet;
    return sheet ? serializeRules(sheet.cssRules, scope) : '';
  } finally {
    document.head.removeChild(style);
  }
}

function serializeRules(rules: CSSRuleList, scope: string): string {
  let out = '';
  for (const rule of Array.from(rules)) out += serializeRule(rule, scope);
  return out;
}

function serializeRule(rule: CSSRule, scope: string): string {
  if (rule instanceof CSSStyleRule) {
    return `${scopeSelector(rule.selectorText, scope)}{${rule.style.cssText}}`;
  }
  // Grouping at-rules: keep the condition, but recurse so the nested selectors get scoped too.
  if (rule instanceof CSSMediaRule) {
    return `@media ${rule.media.mediaText}{${serializeRules(rule.cssRules, scope)}}`;
  }
  if (typeof CSSSupportsRule !== 'undefined' && rule instanceof CSSSupportsRule) {
    return `@supports ${rule.conditionText}{${serializeRules(rule.cssRules, scope)}}`;
  }
  // @font-face, @keyframes, @import, @page, … — nothing to scope, emit verbatim.
  return rule.cssText;
}

const ROOT_TOKEN = /^(?:html|body|:root)(?=[\s>+~.:#[]|$)/;

function scopeSelector(selectorText: string, scope: string): string {
  return selectorText
    .split(',')
    .map((raw) => {
      const s = raw.trim();
      if (!s) return '';
      // `* { box-sizing }` must cover the scope root itself plus every descendant.
      if (s === '*') return `${scope},${scope} *`;
      // A leading root token (html/body/:root) *is* the export root — swap it for the scope.
      // `body` -> `.anx-export`, `body .x` -> `.anx-export .x`, `body.x` -> `.anx-export.x`.
      const stripped = s.replace(ROOT_TOKEN, '');
      if (stripped !== s) return `${scope}${stripped}`;
      return `${scope} ${s}`;
    })
    .filter(Boolean)
    .join(',');
}
