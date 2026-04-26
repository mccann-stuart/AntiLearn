## 2024-03-20 - iOS Safe Area Padding & Fullscreen Meta Tags
**Learning:** iOS devices with notches and bottom home indicators can easily obscure sticky headers and absolutely positioned content. Applying `viewport-fit=cover` isn't enough; CSS `env(safe-area-inset-*)` combined with `max()` functions must be explicitly used to ensure that padding remains consistent whether the device is in portrait, landscape, or on an older screen without a notch. Additionally, adding mobile app tags like `apple-mobile-web-app-capable` prevents the top status bar from clashing with custom themes.
**Action:** When creating fixed position headers or fullscreen layouts, explicitly include iOS specific meta tags for theme styling and systematically use `padding: max(DEFAULT_PAD, env(safe-area-inset-*))` rather than just a fixed unit, particularly for `.container` and `#sticky-header` type classes.

## 2024-05-15 - Missing Screen Reader Feedback for Clipboard Actions
**Learning:** Changing button text visually (e.g., to "Copied!") after a clipboard action provides no feedback to screen reader users if `aria-live` is not used. Sighted users see the confirmation, but screen readers only announce the initial button click.
**Action:** Always provide explicit audible feedback for non-navigational async actions. Triggering an existing toast notification system (which already uses `aria-live="polite"`) is a simple and effective way to ensure accessible feedback for clipboard copies or state saves.

## 2025-03-05 - Missing Screen Reader Context for Grid Cells & Dynamic Elements
**Learning:** For dynamic grids like calendars, omitting `aria-label` attributes on non-interactive cells (like weekends or holidays) leaves visually impaired users without necessary context, as screen readers will simply read the cell's raw content (e.g., the date number) without explaining its significance. Moreover, any dynamically created components containing emojis must hide those emojis with `aria-hidden` spans or utilize an explicit text-only `aria-label` to prevent screen readers from painfully announcing the literal emoji descriptions before reading the relevant information.
**Action:** Ensure all grid elements (interactive and non-interactive) have full descriptive text via `aria-label`, and always provide text-only accessible names for components or toast notifications that feature emojis.

## 2025-03-25 - Prevent Errors with Disabled States
**Learning:** Allowing users to click buttons that inevitably trigger error states (e.g., trying to export a calendar when no days are selected) is a frustrating UX pattern. Instead, buttons that perform actions dependent on other data should be disabled until those prerequisites are met. However, simply disabling a button without explanation can leave users confused.
**Action:** When adding a disabled state, always provide a `title` attribute (or `aria-description`) explaining *why* the button is disabled and what the user needs to do to enable it. This prevents the error and guides the user toward success.

## 2026-03-29 - Preserving Accessibility When Modifying Button Content
**Learning:** When temporarily replacing a button's content to indicate a state change (like changing "Share" to "✅ Copied!"), using `.textContent` permanently strips any nested HTML elements. If the original button contained structural elements for accessibility (such as `<span aria-hidden="true">` wrapping an icon/emoji), `.textContent` ruins the component's accessible markup when the original text is restored.
**Action:** Always use `.innerHTML` rather than `.textContent` to capture, temporarily replace, and restore button content if the button contains nested HTML structure, ensuring that `aria-hidden` spans or SVG elements are properly preserved throughout the interaction.

## 2026-03-31 - Mobile and Keyboard Fallbacks for Tooltips
**Learning:** Using `title` attributes for tooltips on non-interactive elements (like calendar holidays) completely alienates touch device users and keyboard navigators, as they cannot hover to see the information.
**Action:** To ensure crucial context from `title` attributes is accessible, make the elements natively focusable (`tabIndex=0`, `role="button"`) and provide an interactive fallback, such as a click/keydown handler that triggers an `aria-live` toast notification with the tooltip content.

## 2026-04-10 - Keyboard Accessibility of Disabled Buttons
**Learning:** Using the native `disabled` attribute on buttons removes them from the document tab order. This means keyboard-only users and screen readers cannot access explanatory tooltips (like `title` attributes) that explain *why* the button is disabled, creating an inaccessible barrier.
**Action:** When a disabled button requires an explanatory tooltip, use `aria-disabled="true"` instead of the native `disabled` attribute. Combine this with custom click-event blocking in JavaScript and CSS styling `button[aria-disabled="true"]` to visually indicate the disabled state, while preserving keyboard focusability.

## 2026-04-26 - Dynamic Date Picker Bounds
**Learning:** Native date inputs (`<input type="date">`) on mobile devices typically default to the current real-world date. If an application involves planning for future or specific years (like a vacation planner set to next year), the user is forced to manually scroll through months/years to reach the correct context, creating a high-friction UX.
**Action:** Always dynamically set the `min` and `max` attributes of native date inputs to bound the selection to the relevant working context (e.g., the currently selected year). This forces the native UI picker to snap directly to the relevant time period.
