// ==UserScript==
// @name         Universal Price & Labour Calculator
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Shows Price + GST + Specific Labour labels on highlight
// @author       Gemini
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create the popup element
    const popup = document.createElement('div');
    Object.assign(popup.style, {
        position: 'absolute',
        backgroundColor: '#ffffff',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        zIndex: '10000',
        display: 'none',
        fontSize: '14px',
        fontFamily: 'sans-serif',
        color: '#333',
        minWidth: '220px',
        pointerEvents: 'none'
    });
    document.body.appendChild(popup);

    // Configuration for Labour Levels
    const labourOptions = [
        { rate: 80, label: "Base" },
        { rate: 130, label: "Android Device" },
        { rate: 150, label: "Galaxy S Series" },
        { rate: 175, label: "Google Pixel" },
        { rate: 200, label: "" } // Blank label
    ];

    const GST_RATE = 0.10;

    const formatCurrency = (num) => {
        return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(num);
    };

    document.addEventListener('mouseup', (e) => {
        const selection = window.getSelection().toString().trim();

        // Clean price string and parse
        const cleanPrice = selection.replace(/[$,]/g, '');
        const basePrice = parseFloat(cleanPrice);

        if (!isNaN(basePrice) && basePrice > 0) {
            const gstAmount = basePrice * GST_RATE;
            const priceWithGst = basePrice + gstAmount;

            let html = `<div style="font-weight:bold; border-bottom:1px solid #ccc; margin-bottom:8px; padding-bottom:4px; color: #d32f2f;">Price Estimator</div>`;
            html += `<div style="font-size: 13px;">Part + GST: <strong>${formatCurrency(priceWithGst)}</strong></div>`;
            html += `<div style="margin-top:10px; font-weight:bold; font-size:11px; color:#666; text-transform: uppercase;">Total (Inc. Labour):</div>`;
            html += `<table style="width:100%; border-collapse: collapse; margin-top:4px;">`;

            labourOptions.forEach(opt => {
                const total = priceWithGst + opt.rate;
                html += `<tr style="border-bottom: 1px solid #eee;">
                            <td style="padding:4px 0; font-size: 12px; color: #555;">
                                $${opt.rate} <span style="font-style: italic; opacity: 0.8;">${opt.label}</span>
                            </td>
                            <td style="text-align:right; font-weight:bold; padding-left: 10px;">${formatCurrency(total)}</td>
                         </tr>`;
            });

            html += `</table>`;

            popup.innerHTML = html;
            popup.style.left = `${e.pageX + 10}px`;
            popup.style.top = `${e.pageY + 10}px`;
            popup.style.display = 'block';
        } else {
            popup.style.display = 'none';
        }
    });

    // Hide popup when clicking
    document.addEventListener('mousedown', (e) => {
        if (e.target !== popup) {
            popup.style.display = 'none';
        }
    });
})();