// OTHER
// ==UserScript==
// @name         Universal Price & Labour Calculator
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Highlight a price/number to see Price + GST + Labour totals. Selection-only (no click triggers).
// @author       Gemini (patched)
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==
(function() {
    'use strict';

    const DEBUG = true;

    const popup = document.createElement('div');
    popup.id = '__price_calc_popup__';
    document.body.appendChild(popup);
    if (DEBUG) console.log('[Calc] loaded on', location.href);

    // Force every critical style with !important so no site CSS can hide it.
    function applyBaseStyle() {
        popup.style.cssText = [
            'position:fixed !important',
            'background:#ffffff !important',
            'border:2px solid #333 !important',
            'border-radius:8px !important',
            'padding:12px !important',
            'box-shadow:0 4px 18px rgba(0,0,0,0.4) !important',
            'z-index:2147483647 !important',
            'font-size:14px !important',
            'font-family:sans-serif !important',
            'color:#333 !important',
            'min-width:220px !important',
            'margin:0 !important',
            'opacity:1 !important',
            'visibility:visible !important',
            'pointer-events:none !important',
            'transform:none !important',
            'display:none'
        ].join(';');
    }
    applyBaseStyle();

    const labourOptions = [
        { rate: 80,  label: "Base" },
        { rate: 130, label: "Android Device" },
        { rate: 150, label: "Galaxy S Series" },
        { rate: 175, label: "Google Pixel" },
        { rate: 200, label: "" }
    ];
    const GST_RATE = 0.10;
    const formatCurrency = (n) =>
        new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n);

    function el(tag, css, text) {
        const n = document.createElement(tag);
        if (css) n.style.cssText = css;
        if (text) n.textContent = text;
        return n;
    }

    function render(priceWithGst) {
        popup.textContent = '';
        popup.appendChild(el('div',
            'font-weight:bold;border-bottom:1px solid #ccc;margin-bottom:8px;padding-bottom:4px;color:#d32f2f;',
            'Price Estimator'));
        const line = el('div', 'font-size:13px;color:#333;');
        line.appendChild(document.createTextNode('Part + GST: '));
        line.appendChild(el('strong', '', formatCurrency(priceWithGst)));
        popup.appendChild(line);
        popup.appendChild(el('div',
            'margin-top:10px;font-weight:bold;font-size:11px;color:#666;text-transform:uppercase;',
            'Total (Inc. Labour):'));
        const table = el('table', 'width:100%;border-collapse:collapse;margin-top:4px;');
        labourOptions.forEach(opt => {
            const total = priceWithGst + opt.rate;
            const tr = el('tr', 'border-bottom:1px solid #eee;');
            const td1 = el('td', 'padding:4px 0;font-size:12px;color:#555;');
            td1.appendChild(document.createTextNode('$' + opt.rate + ' '));
            td1.appendChild(el('span', 'font-style:italic;opacity:0.8;', opt.label));
            const td2 = el('td', 'text-align:right;font-weight:bold;padding-left:10px;color:#000;', formatCurrency(total));
            tr.appendChild(td1); tr.appendChild(td2); table.appendChild(tr);
        });
        popup.appendChild(table);
    }

    function extractPrice(text) {
        if (!text) return NaN;
        const cleaned = text.replace(/,/g, '');
        // Prefer a $-prefixed amount if present...
        const matches = cleaned.match(/\$\s*\d+(?:\.\d{1,2})?/g);
        if (matches && matches.length)
            return parseFloat(matches[matches.length - 1].replace(/[^\d.]/g, ''));
        // ...otherwise fall back to the first plain number in the selection.
        const m = cleaned.match(/\d+(?:\.\d{1,2})?/);
        return m ? parseFloat(m[0]) : NaN;
    }

    // Read ONLY what the user has highlighted. Includes a shadow-DOM fallback
    // so selections inside web-component / SPA shadow roots still register.
    function getSelectedText(e) {
        let text = (window.getSelection && window.getSelection().toString()) || '';
        if (text.trim()) return text;

        if (e && typeof e.composedPath === 'function') {
            for (const node of e.composedPath()) {
                if (node && node.shadowRoot && typeof node.shadowRoot.getSelection === 'function') {
                    const t = node.shadowRoot.getSelection().toString();
                    if (t && t.trim()) return t;
                }
                if (typeof ShadowRoot !== 'undefined' && node instanceof ShadowRoot
                    && typeof node.getSelection === 'function') {
                    const t = node.getSelection().toString();
                    if (t && t.trim()) return t;
                }
            }
        }
        return text;
    }

    function hide() {
        popup.style.setProperty('display', 'none', 'important');
    }

    function showAt(clientX, clientY) {
        // Make sure it's still in the page and is the last (top-most) body child.
        if (popup.parentNode !== document.body) document.body.appendChild(popup);
        else document.body.appendChild(popup); // move to end => wins z-index ties

        const vw = window.innerWidth, vh = window.innerHeight, w = 240, h = 220;
        let x = clientX + 12, y = clientY + 12;
        if (x + w > vw) x = vw - w - 10;
        if (y + h > vh) y = vh - h - 10;
        if (x < 0) x = 10;
        if (y < 0) y = 10;
        popup.style.setProperty('left', x + 'px', 'important');
        popup.style.setProperty('top',  y + 'px', 'important');
        popup.style.setProperty('display', 'block', 'important');

        if (DEBUG) {
            const r = popup.getBoundingClientRect();
            console.log('[Calc] popup connected:', popup.isConnected,
                        '| box:', Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height),
                        '| display:', getComputedStyle(popup).display,
                        '| visibility:', getComputedStyle(popup).visibility);
        }
    }

    // Figure out a good anchor point for the popup from the current selection,
    // used when there's no mouse coordinate (e.g. keyboard selection).
    function selectionPoint() {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
            const r = sel.getRangeAt(0).getBoundingClientRect();
            if (r && (r.width || r.height)) return { x: r.right, y: r.bottom };
        }
        return { x: 60, y: 60 };
    }

    function handleSelection(e) {
        if (e && (e.target === popup || popup.contains(e.target))) return;

        const text = getSelectedText(e);
        // No highlight = do nothing visible.
        if (!text.trim()) { hide(); return; }

        const basePrice = extractPrice(text);
        if (!isNaN(basePrice) && basePrice > 0) {
            render(basePrice * (1 + GST_RATE));
            let x, y;
            if (e && typeof e.clientX === 'number' && (e.clientX || e.clientY)) {
                x = e.clientX; y = e.clientY;
            } else {
                const p = selectionPoint(); x = p.x; y = p.y;
            }
            showAt(x, y);
        } else {
            hide();
        }
    }

    // Mouse highlight: react when the drag-select finishes.
    document.addEventListener('mouseup', handleSelection, true);

    // Keyboard highlight (Shift+arrows, Ctrl/Cmd+A, etc.).
    document.addEventListener('keyup', (e) => {
        if (e.shiftKey || e.key === 'Shift' || (e.ctrlKey || e.metaKey)) handleSelection(e);
    }, true);

    // Click away (or start a new drag) dismisses the popup.
    document.addEventListener('mousedown', (e) => {
        if (e.target !== popup && !popup.contains(e.target)) hide();
    }, true);
})();
