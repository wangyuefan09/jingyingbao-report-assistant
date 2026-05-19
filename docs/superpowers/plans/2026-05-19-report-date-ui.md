# Report Date UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the store-name field from the page, add a selectable report-date preset, and remove the missing-fields UI while keeping the copied report text format intact.

**Architecture:** Keep the generated report text structure unchanged, but thread a `datePreset` parameter from the page into the report API. Use shared date-range helpers so overview replay and related fetch requests can request yesterday, today, or the recent 7-day range consistently.

**Tech Stack:** Node.js, plain browser JavaScript, local HTTP server, custom unit test runner

---

### Task 1: Lock the requested behavior with tests

**Files:**
- Create: `tests/date-utils.test.js`
- Modify: `tests/replay-request.test.js`
- Modify: `tests/flow-analysis.test.js`
- Modify: `tests/promo-board-report.test.js`
- Modify: `tests/trade.test.js`
- Modify: `tests/daily-report.test.js`
- Modify: `tests/run.js`

- [ ] Write failing tests for preset date ranges and report date labels.
- [ ] Run `node tests/run.js` and confirm the new assertions fail for the missing behavior.

### Task 2: Implement shared date-preset handling on the server

**Files:**
- Modify: `src/lib/api/date-utils.js`
- Modify: `src/lib/api/replay.js`
- Modify: `src/lib/api/flow-analysis.js`
- Modify: `src/lib/api/promo-board-report.js`
- Modify: `src/lib/api/trade.js`
- Modify: `src/lib/daily-report.js`
- Modify: `src/app.js`

- [ ] Add shared helpers to normalize `datePreset`, compute date ranges, and rewrite request payloads.
- [ ] Update report building so the displayed date label follows the selected preset.
- [ ] Update `/api/latest-report` to accept `datePreset` and prefer live fetches for non-default presets.

### Task 3: Update the page to match the new requirements

**Files:**
- Modify: `public/index.html`

- [ ] Remove the store-name input field and its local-storage wiring.
- [ ] Add the report-date select with `昨日` default and `今日` / `近7日` options.
- [ ] Remove the missing-fields card and hint block while keeping other hint content working.

### Task 4: Verify the end-to-end change

**Files:**
- Modify: `docs/superpowers/plans/2026-05-19-report-date-ui.md`

- [ ] Run `node tests/run.js` and confirm all tests pass.
- [ ] Review the updated page/request flow for accidental regressions before closing the task.
