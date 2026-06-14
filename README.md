# Universal Price & Labour Calculator

**Version:** 1.1 · **Site:** All sites

Highlight any price on any webpage and instantly see it broken down with GST and common labour rates. Made by RK — Coffs Harbour store.

---

## What It Does

Select/highlight any number or price on any webpage — a popup appears showing:

| Label | Calculation |
|-------|-------------|
| Price + GST | price × 1.1 |
| Price + GST + $80 | price × 1.1 + $80 |
| Price + GST + $130 | price × 1.1 + $130 |
| Price + GST + $150 | price × 1.1 + $150 |
| Price + GST + $200 | price × 1.1 + $200 |

---

## How to Use

1. Highlight any number or price on any page
2. The calculator popup appears automatically near your selection
3. Click elsewhere or deselect to dismiss it

---

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) in Chrome
2. Click **Raw** on the `.user.js` file in this repo
3. Tampermonkey will prompt to install — click **Install**
4. Highlight any number on any webpage — the popup appears

---

## Notes

- Runs on all websites (`*://*/*`)
- The popup is non-interactive (`pointer-events: none`) — it will not interfere with clicking
- Handles numbers with or without a `$` prefix
- No configuration required

---

## Using Multiple Scripts

If you are using several of the THVjQ Tampermonkey scripts, check the **Issues** tab — a multi-script addon with live updates across all scripts is in progress.
