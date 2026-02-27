# Theme Audit: Spacing, Tokens, Typography

## Scope
Review of token architecture and typography/spacing consistency across the Shopify theme.

## Executive Summary
- The theme has a strong base token foundation in `assets/base.css`.
- Main risk is **split source-of-truth**: core tokens are duplicated in `layout/theme.liquid` and `assets/base.css`.
- Many sections still use inline Liquid px values and `!important`, reducing consistency and maintainability.
- No critical runtime breakage found; issues are primarily architecture/consistency and future regression risk.

---

## Priority Issues and Recommended Fixes

## 1) Duplicate Core Tokens Across Files (High)
**Issue**
- Core spacing/radius/button-height tokens are defined in both:
  - `layout/theme.liquid` (`:root` inline block)
  - `assets/base.css` (`:root` token system)
- This creates drift risk when one file changes and the other does not.

**Examples**
- `layout/theme.liquid`: `--gap-section`, `--padding-medium`, `--radius-*`, `--height-button`
- `assets/base.css`: `--spacing-*`, `--padding-*`, `--radius-*`, `--height-button*`
- Helpful refs:
  - `layout/theme.liquid` (lines ~58-66, ~163-176)
  - `assets/base.css` (lines ~12-92, ~134-153, ~310-315)

**Impact**
- Inconsistent UI over time.
- Confusing ownership for designers/developers.
- Harder QA and onboarding.

**Recommended Fix**
- Make `assets/base.css` the single source of truth for static design tokens.
- Keep `layout/theme.liquid` only for dynamic settings-driven tokens (font families/weights, color scheme vars).
- Remove duplicated static tokens from `layout/theme.liquid`.

---

## 2) Section-Level Inline px Values Bypass Token System (High)
**Issue**
- Multiple sections define spacing/typography in inline Liquid style blocks or inline styles using raw px.
- This bypasses global token governance.

**Examples**
- `sections/main-search.liquid` (lines ~90-123, inline px in `{% style %}`)
- `sections/collection-list.liquid` (lines ~41-67, section padding/gap/height px)
- `sections/bento-grid.liquid` (line ~597, inline CSS vars with px values)
- `sections/main-collection-product-grid.liquid` (e.g. line ~97 `font-size ... !important`)

**Impact**
- Global token changes do not propagate reliably.
- Layout/typography inconsistency across templates.
- Higher effort for redesigns and theming.

**Recommended Fix**
- Migrate repeated px values to shared tokens in `assets/base.css`.
- Keep section-specific values only where truly unique.
- For section configurability, map section settings to tokenized CSS vars, then consume those vars in section CSS.

---

## 3) Excessive `!important` Usage in Typography/Spacing Hotspots (Medium)
**Issue**
- Several sections rely on `!important` for text size/weight/layout overrides.

**Examples**
- `sections/cart.liquid` (lines ~507-520)
- `sections/main-collection-product-grid.liquid` (line ~97, ~157)
- `sections/related-products.liquid` (line ~54)
- `sections/main-search.liquid` (mobile title rule with `!important`, around line ~122)
- `sections/slideshow.liquid` (lines ~548, ~681)

**Impact**
- Specificity wars and brittle styling.
- Hard to safely refactor.
- More accidental regressions when adding new styles.

**Recommended Fix**
- Remove `!important` incrementally in high-traffic templates first.
- Use scoped selectors and cleaner cascade instead.
- Introduce component-level classes/tokens for intended overrides.

---

## 4) Inconsistent Token Naming Across Layers (Medium)
**Issue**
- Similar concepts have multiple token names:
  - `--gap-section` vs `--spacing-section`
  - `--padding-medium` vs `--padding-m`
  - `--radius-small` vs `--radius-s`
- Helpful refs:
  - `layout/theme.liquid` (`--gap-section`, `--padding-medium`, `--radius-small`) around lines ~58-64
  - `assets/base.css` (`--spacing-section`, `--padding-m`, `--radius-s`) around lines ~46-60 and ~134-139

**Impact**
- Token confusion and accidental misuse.
- Slower implementation and review cycles.

**Recommended Fix**
- Standardize naming convention to one token namespace (recommended: scale + semantic aliases in `assets/base.css`).
- Keep compatibility aliases temporarily, then deprecate.

---

## 5) Subheading Font Setting Has Limited Practical Reach (Medium)
**Issue**
- `type_subheader_font` is configured globally, but usage is limited in practice.
- This can create expectation mismatch for merchants.
- Helpful refs:
  - `config/settings_schema.json` (`id: "type_subheader_font"`) around line ~442
  - `layout/theme.liquid` (`--font-subheading-*`) around lines ~149-156
  - `assets/section-bento-grid.css` (only clear consumer) line ~990

**Impact**
- Merchant changes in Theme Settings may appear to have little effect.

**Recommended Fix (choose one)**
- Option A: Expand usage of `--font-subheading-*` for agreed subtitle patterns globally.
- Option B: Remove subheading setting if not part of intended design system.

---

## 6) Remaining Architecture Debt: Section-Centric Typography (Low/Medium)
**Issue**
- Typography control is still spread across many section templates and settings.

**Impact**
- More maintenance overhead; less predictable theme-wide typography behavior.

**Recommended Fix**
- Define a clear rule:
  - Global typography in `assets/base.css`
  - Section overrides only for intentional exceptions
- Add internal guideline: "Use tokens first, raw px only when justified."

---

## Proposed Implementation Plan (Low Risk)

## Phase 1 (Quick Wins)
- Remove duplicated static tokens from `layout/theme.liquid`.
- Keep dynamic settings vars there only.
- Document token ownership in one short `README` note or dev doc.

## Phase 2 (High ROI Refactor)
- Refactor these first:
  - `sections/main-search.liquid`
  - `sections/main-collection-product-grid.liquid`
  - `sections/cart.liquid`
- Replace repeated px values with tokenized vars.
- Reduce `!important` usage in these files.

## Phase 3 (System Hardening)
- Normalize token names and maintain temporary aliases.
- Decide subheading strategy (expand or remove).
- Add QA checklist for spacing/typography regressions.

---

## QA Checklist for Verification
- Heading sizes and weights are consistent across Home/Collection/Product/Search/Blog.
- Body text scale is consistent and not section-dependent by accident.
- Button height/padding/radius follow tokens.
- No unexpected changes when adjusting token values.
- Mobile and desktop both pass visual checks.

---

## Current Status Snapshot
- Strength: robust token inventory exists in `assets/base.css`.
- Main gap: not yet consistently enforced across sections.
- Recommended next step: execute Phase 1 + Phase 2 on 3 key sections.
