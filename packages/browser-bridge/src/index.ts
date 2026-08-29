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

  function sensitiveCategory(element) {
    if (!(element instanceof Element)) return null;
    const field = element.matches?.('input, select, textarea')
      ? element : element.querySelector?.('input, select, textarea');
    if (field instanceof HTMLInputElement && field.type?.toLowerCase() === 'password') {
      return 'password';
    }
    const autocomplete = field?.getAttribute('autocomplete')
      || element.getAttribute('autocomplete') || '';
    const token = autocomplete.toLowerCase().split(/\s+/).pop() || '';
    if (token === 'current-password' || token === 'new-password') return 'password';
    if (token === 'cc-csc') return 'securityCode';
    if (token.startsWith('cc-')) return 'paymentCard';
    if (token === 'one-time-code') return 'oneTimeCode';
    if (token === 'webauthn') return 'protected';
    return sensitivePattern.test([
      element.id,
      element.getAttribute('name'),
      element.getAttribute('aria-label'),
      element.getAttribute('placeholder'),
    ].filter(Boolean).join(' ')) ? 'protected' : null;
  }

  function isSensitive(element) {
    return sensitiveCategory(element) !== null;
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

  function safeText(maxChars) {
    if (!document.body) return '';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const parts = [];
    let length = 0;
    for (let node = walker.nextNode(); node && length < maxChars; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || parent.closest('script, style, noscript, template') || !isVisible(parent)) continue;
      const field = parent.closest('input, textarea, [contenteditable="true"]');
      if (field && isSensitive(field)) continue;
      const value = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!value) continue;
      const bounded = value.slice(0, Math.max(0, maxChars - length));
      parts.push(bounded);
      length += bounded.length + 1;
    }
    return parts.join(' ').slice(0, maxChars);
  }

  function strictText(maxChars) {
    if (!document.body) return '';
    const excluded = [
      'script', 'style', 'noscript', 'template', 'form', 'input', 'textarea',
      'select', 'option', '[contenteditable]', 'iframe', 'frame',
      '[data-locus-private]', '[aria-hidden="true"]',
    ].join(',');
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const parts = [];
    let length = 0;
    for (let node = walker.nextNode(); node && length < maxChars; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || parent.closest(excluded) || !isVisible(parent) || isSensitive(parent)) continue;
      const value = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!value) continue;
      const bounded = value.slice(0, Math.max(0, maxChars - length));
      parts.push(bounded);
      length += bounded.length + 1;
    }
    return parts.join('\n').slice(0, maxChars);
  }

  function strictSnapshot(options = {}) {
    const maxChars = Math.min(Math.max(Number(options.maxChars || 60_000), 1), 100_000);
    return {
      url: location.href,
      title: document.title,
      lang: document.documentElement.lang || '',
      capturedAt: new Date().toISOString(),
      text: strictText(maxChars),
    };
  }

  function readerArticle(options = {}) {
    if (!document.body) return { available: false, reason: 'This page has no readable document body.' };
    const candidates = Array.from(document.querySelectorAll('article, main, [role="main"], .article, .post, .entry-content'));
    candidates.push(document.body);
    let best = null;
    let bestScore = 0;
    for (const candidate of candidates) {
      if (!(candidate instanceof Element) || !isVisible(candidate)) continue;
      const text = (candidate.innerText || '').replace(/\s+/g, ' ').trim();
      const paragraphs = candidate.querySelectorAll('p').length;
      const links = candidate.querySelectorAll('a').length;
      const score = Math.min(text.length, 100_000) + paragraphs * 180 - links * 18;
      if (text.length >= 350 && score > bestScore) { best = candidate; bestScore = score; }
    }
    if (!best) return { available: false, reason: 'Locus could not reliably extract an article from this page.' };
    const clone = best.cloneNode(true);
    if (!(clone instanceof Element)) return { available: false, reason: 'Article extraction failed.' };
    for (const element of clone.querySelectorAll('script, style, noscript, template, form, input, textarea, select, button, iframe, frame, nav, aside, footer, [contenteditable], [aria-hidden="true"]')) element.remove();
    for (const element of clone.querySelectorAll('*')) {
      for (const attribute of Array.from(element.attributes)) {
        if (/^on/i.test(attribute.name) || attribute.name === 'srcdoc' || attribute.name === 'style') element.removeAttribute(attribute.name);
      }
      if (element instanceof HTMLAnchorElement) {
        try { element.href = new URL(element.getAttribute('href') || '', location.href).href; } catch { element.removeAttribute('href'); }
      }
      if (element instanceof HTMLImageElement) {
        try { element.src = new URL(element.getAttribute('src') || '', location.href).href; } catch { element.remove(); }
        element.removeAttribute('srcset');
      }
    }
    const text = (clone.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100_000);
    if (text.length < 350) return { available: false, reason: 'This page does not contain enough article text.' };
    const maxHtmlChars = Math.min(Math.max(Number(options.maxHtmlChars || 250_000), 1), 300_000);
    return {
      available: true,
      url: location.href,
      title: document.title,
      byline: document.querySelector('[rel="author"], .byline, [itemprop="author"]')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 500) || '',
      lang: document.documentElement.lang || '',
      text,
      html: clone.innerHTML.slice(0, maxHtmlChars),
    };
  }

  function readerDocument(options = {}) {
    if (!document.documentElement || !document.body) return { available: false, reason: 'This page has no readable document body.' };
    const clone = document.documentElement.cloneNode(true);
    if (!(clone instanceof Element)) return { available: false, reason: 'Article extraction failed.' };
    const sources = [document.documentElement, ...document.documentElement.querySelectorAll('*')];
    const copies = [clone, ...clone.querySelectorAll('*')];
    const excluded = 'script,style,noscript,template,form,input,textarea,select,option,button,iframe,frame,nav,[contenteditable],[aria-hidden="true"],[data-locus-private]';
    for (let index = 0; index < Math.min(sources.length, copies.length); index += 1) {
      const source = sources[index];
      const copy = copies[index];
      if (!source || !copy) continue;
      if (source.matches(excluded) || isSensitive(source) || (!source.matches('html,body') && !isVisible(source))) {
        copy.remove();
        continue;
      }
      for (const attribute of Array.from(copy.attributes)) {
        if (/^on/i.test(attribute.name) || ['srcdoc', 'style', 'value', 'placeholder', 'name', 'autocomplete'].includes(attribute.name)) copy.removeAttribute(attribute.name);
      }
    }
    const maxHtmlChars = Math.min(Math.max(Number(options.maxHtmlChars || 300_000), 1), 400_000);
    const html = '<!doctype html>' + clone.outerHTML;
    if (html.length < 500) return { available: false, reason: 'This page does not contain enough readable markup.' };
    return {
      available: true,
      url: location.href,
      title: document.title,
      lang: document.documentElement.lang || '',
      html: html.slice(0, maxHtmlChars),
    };
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
        protectedCategory: sensitiveCategory(element),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      });
      if (elements.length >= Math.min(Number(options.limit || 500), 1000)) break;
    }
    return {
      epoch,
      url: location.href,
      title: document.title,
      text: safeText(Math.min(Number(options.maxChars || 20_000), 100_000)),
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

  function setValue(ref, value, allowedCategories = []) {
    const result = resolve(ref);
    if (!result.element) return result;
    const element = result.element;
    const category = sensitiveCategory(element);
    const allowed = new Set(Array.isArray(allowedCategories) ? allowedCategories : []);
    if (category && !(['password', 'paymentCard'].includes(category) && allowed.has(category))) {
      return { protected: true, protectedCategory: category, error: 'protected field' };
    }
    if (!('value' in element)) return { error: 'element does not accept a value' };
    const prototype = element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (setter) setter.call(element, String(value)); else element.value = String(value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, name: nameFor(element) };
  }

  function protectedRects() {
    const rects = [];
    const candidates = Array.from(document.querySelectorAll('input, textarea, [contenteditable="true"], iframe, frame'));
    for (const element of candidates) {
      if (!element.matches('iframe, frame') && !isSensitive(element)) continue;
      if (!isVisible(element)) continue;
      const rect = element.getBoundingClientRect();
      rects.push({
        x: Math.max(0, rect.x),
        y: Math.max(0, rect.y),
        width: Math.max(0, Math.min(innerWidth, rect.right) - Math.max(0, rect.x)),
        height: Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.y)),
      });
    }
    return {
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      rects: rects.filter((rect) => rect.width > 0 && rect.height > 0).slice(0, 250),
    };
  }

  globalThis.__locusBrowserBridge = Object.freeze({
    snapshot,
    strictSnapshot,
    readerArticle,
    readerDocument,
    target,
    setValue,
    sensitiveAt(x, y) {
      const element = document.elementFromPoint(Number(x), Number(y));
      return {
        protected: isSensitive(element),
        protectedCategory: sensitiveCategory(element),
        name: element ? nameFor(element) : '',
      };
    },
    focusedSensitive() {
      return {
        protected: isSensitive(document.activeElement),
        protectedCategory: sensitiveCategory(document.activeElement),
        name: document.activeElement ? nameFor(document.activeElement) : '',
      };
    },
    hasSensitiveFields() {
      return Array.from(document.querySelectorAll('input, textarea, [contenteditable="true"]')).some(isSensitive);
    },
    protectedRects,
    maskSensitive() {
      const token = 'mask-' + nextMask++;
      const covers = [];
      const candidates = Array.from(document.querySelectorAll('input, textarea, [contenteditable="true"], iframe, frame'));
      for (const element of candidates) {
        if (!element.matches('iframe, frame') && !isSensitive(element)) continue;
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
  strictSnapshot: (options: Record<string, unknown> = {}) =>
    `globalThis.__locusBrowserBridge.strictSnapshot(${JSON.stringify(options)})`,
  readerArticle: (options: Record<string, unknown> = {}) =>
    `globalThis.__locusBrowserBridge.readerArticle(${JSON.stringify(options)})`,
  readerDocument: (options: Record<string, unknown> = {}) =>
    `globalThis.__locusBrowserBridge.readerDocument(${JSON.stringify(options)})`,
  target: (ref: string) =>
    `globalThis.__locusBrowserBridge.target(${JSON.stringify(ref)})`,
  setValue: (ref: string, value: string, allowedCategories: string[] = []) =>
    `globalThis.__locusBrowserBridge.setValue(${JSON.stringify(ref)}, ${JSON.stringify(value)}, ${JSON.stringify(allowedCategories)})`,
  find: (query: string) =>
    `globalThis.__locusBrowserBridge.find(${JSON.stringify(query)})`,
  sensitiveAt: (x: number, y: number) =>
    `globalThis.__locusBrowserBridge.sensitiveAt(${JSON.stringify(x)}, ${JSON.stringify(y)})`,
  focusedSensitive: () => "globalThis.__locusBrowserBridge.focusedSensitive()",
  hasSensitiveFields: () => "globalThis.__locusBrowserBridge.hasSensitiveFields()",
  protectedRects: () => "globalThis.__locusBrowserBridge.protectedRects()",
  maskSensitive: () => "globalThis.__locusBrowserBridge.maskSensitive()",
  unmaskSensitive: (token: string) =>
    `globalThis.__locusBrowserBridge.unmaskSensitive(${JSON.stringify(token)})`,
} as const;
