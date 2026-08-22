/**
 * Installed into an isolated JavaScript world. The page never receives a
 * native bridge or an IPC handle; the host invokes these functions and reads
 * their serializable return values directly.
 */
export const browserBridgeSource = String.raw`
(() => {
  if (globalThis.__locusBrowserBridge) return;

  let epoch = 0;
  let nextRef = 1;
  let nextMask = 1;
  const refs = new Map();
  const masks = new Map();
  const sensitivePattern = /(pass(word)?|credential|secret|token|api[-_ ]?key|card|cc[-_ ]?(number|cvc|cvv)|one[-_ ]?time|otp|recovery|passkey)/i;
  const interactiveSelector = [
    'a[href]', 'button', 'input', 'select', 'textarea',
    '[role="button"]', '[role="link"]', '[role="checkbox"]',
    '[role="radio"]', '[role="tab"]', '[contenteditable="true"]',
  ].join(',');

  function isVisible(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none'
      && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
  }

  function isSensitive(element) {
    if (!(element instanceof Element)) return false;
    const input = element instanceof HTMLInputElement ? element : element.querySelector?.('input');
    if (input?.type?.toLowerCase() === 'password') return true;
    const autocomplete = input?.autocomplete || element.getAttribute('autocomplete') || '';
    if (/password|cc-|one-time-code|webauthn/i.test(autocomplete)) return true;
    return sensitivePattern.test([
      element.id,
      element.getAttribute('name'),
      element.getAttribute('aria-label'),
      element.getAttribute('placeholder'),
    ].filter(Boolean).join(' '));
  }

  function nameFor(element) {
    if (isSensitive(element)) return '[protected field]';
    return (element.getAttribute('aria-label')
      || element.getAttribute('title')
      || element.innerText
      || element.getAttribute('placeholder')
      || element.getAttribute('name')
      || '').replace(/\s+/g, ' ').trim().slice(0, 240);
  }

  function roleFor(element) {
    return element.getAttribute('role') || ({
      A: 'link', BUTTON: 'button', INPUT: 'textbox',
      SELECT: 'combobox', TEXTAREA: 'textbox',
    }[element.tagName] || element.tagName.toLowerCase());
  }

  function snapshot(options = {}) {
    epoch += 1;
    refs.clear();
    nextRef = 1;
    const filter = options.filter || 'interactive';
    const nodes = filter === 'all'
      ? Array.from(document.querySelectorAll('body *'))
      : Array.from(document.querySelectorAll(interactiveSelector));
    const elements = [];
    for (const element of nodes) {
      if (!isVisible(element)) continue;
      const ref = 'e' + epoch + '-' + nextRef++;
      refs.set(ref, element);
      const rect = element.getBoundingClientRect();
      elements.push({
        ref,
        role: roleFor(element),
        name: nameFor(element),
        protected: isSensitive(element),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      });
      if (elements.length >= Math.min(Number(options.limit || 500), 1000)) break;
    }
    return {
      epoch,
      url: location.href,
      title: document.title,
      text: (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, Number(options.maxChars || 20_000)),
      elements,
    };
  }

  function resolve(ref) {
    const element = refs.get(ref);
    if (!element || !element.isConnected) {
      return { stale: true, error: 'page changed; call browser_read_page again' };
    }
    return { element };
  }

  function target(ref) {
    const result = resolve(ref);
    if (!result.element) return result;
    if (isSensitive(result.element)) {
      return { protected: true, error: 'that field contains protected credential or payment data' };
    }
    const rect = result.element.getBoundingClientRect();
    return {
      ref,
      name: nameFor(result.element),
      point: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
    };
  }

  function setValue(ref, value) {
    const result = resolve(ref);
    if (!result.element) return result;
    if (isSensitive(result.element)) return { protected: true, error: 'protected field' };
    const element = result.element;
    if (!('value' in element)) return { error: 'element does not accept a value' };
    const prototype = element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (setter) setter.call(element, String(value)); else element.value = String(value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, name: nameFor(element) };
  }

  globalThis.__locusBrowserBridge = Object.freeze({
    snapshot,
    target,
    setValue,
    sensitiveAt(x, y) {
      const element = document.elementFromPoint(Number(x), Number(y));
      return { protected: isSensitive(element), name: element ? nameFor(element) : '' };
    },
    focusedSensitive() {
      return { protected: isSensitive(document.activeElement), name: document.activeElement ? nameFor(document.activeElement) : '' };
    },
    hasSensitiveFields() {
      return Array.from(document.querySelectorAll('input, textarea, [contenteditable="true"]')).some(isSensitive);
    },
    maskSensitive() {
      const token = 'mask-' + nextMask++;
      const covers = [];
      const candidates = Array.from(document.querySelectorAll('input, textarea, [contenteditable="true"], iframe'));
      for (const element of candidates) {
        if (!(element instanceof HTMLIFrameElement) && !isSensitive(element)) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        const cover = document.createElement('div');
        cover.setAttribute('data-locus-protected-cover', token);
        Object.assign(cover.style, {
          position: 'fixed', left: rect.left + 'px', top: rect.top + 'px',
          width: rect.width + 'px', height: rect.height + 'px',
          background: '#6f7177', borderRadius: '4px', zIndex: '2147483647',
          pointerEvents: 'none', color: '#fff', display: 'grid', placeItems: 'center',
        });
        cover.textContent = 'Protected';
        document.documentElement.appendChild(cover);
        covers.push(cover);
      }
      masks.set(token, covers);
      return { token, count: covers.length };
    },
    unmaskSensitive(token) {
      const covers = masks.get(String(token)) || [];
      for (const cover of covers) cover.remove();
      masks.delete(String(token));
      return { ok: true };
    },
    find(query) {
      const needle = String(query || '').toLowerCase();
      if (!needle) return [];
      return snapshot({ filter: 'all', limit: 1000 }).elements
        .filter((item) => item.name.toLowerCase().includes(needle))
        .slice(0, 50);
    },
  });
})();
`;

export const bridgeInvocation = {
  snapshot: (options: Record<string, unknown> = {}) =>
    `globalThis.__locusBrowserBridge.snapshot(${JSON.stringify(options)})`,
  target: (ref: string) =>
    `globalThis.__locusBrowserBridge.target(${JSON.stringify(ref)})`,
  setValue: (ref: string, value: string) =>
    `globalThis.__locusBrowserBridge.setValue(${JSON.stringify(ref)}, ${JSON.stringify(value)})`,
  find: (query: string) =>
    `globalThis.__locusBrowserBridge.find(${JSON.stringify(query)})`,
  sensitiveAt: (x: number, y: number) =>
    `globalThis.__locusBrowserBridge.sensitiveAt(${JSON.stringify(x)}, ${JSON.stringify(y)})`,
  focusedSensitive: () => "globalThis.__locusBrowserBridge.focusedSensitive()",
  hasSensitiveFields: () => "globalThis.__locusBrowserBridge.hasSensitiveFields()",
  maskSensitive: () => "globalThis.__locusBrowserBridge.maskSensitive()",
  unmaskSensitive: (token: string) =>
    `globalThis.__locusBrowserBridge.unmaskSensitive(${JSON.stringify(token)})`,
} as const;
