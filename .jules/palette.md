## 2026-02-18 - Mobile-Safe Desktop Hover States
**Learning:** Adding hover scaling (`transform: scale()`) to grid items like calendar days causes two distinct UX issues: 1) The scaled item gets clipped by adjacent grid items if `z-index` isn't simultaneously elevated. 2) On iOS/touch devices, hover states "stick" after tapping, leaving the element permanently scaled until another element is tapped.
**Action:** Always wrap non-essential hover micro-interactions (like scaling or box-shadows on buttons) in a `@media (hover: hover)` query to ensure they only apply to cursor devices. Furthermore, when scaling an element within a grid or flex layout, simultaneously increase its `z-index` to prevent clipping by siblings.

## 2026-02-18 - Hover State Transitions
**Learning:** When adding CSS transitions to hover states (like `transform` on `:hover`), putting the `transition` property only on the `:hover` pseudo-class makes the animation snap back instantly when the cursor leaves the element.
**Action:** Always place the base `transition` property on the normal element selector (e.g. `.day[role="button"]`) rather than the `:hover` pseudo-class to ensure smooth animations in both directions (hover in, hover out).

## 2026-02-18 - Destructive vs Constructive Terminology
**Learning:** Labeling a button "Reset Plan" caused user hesitation, as "Reset" implies a destructive action (clearing all data). However, the button actually triggers a complex, constructive calculation to find the "Optimal Plan".
**Action:** Use constructive terminology for actions that generate value. The button was renamed to `✨ Reset to Optimal` to clarify its non-destructive, generative nature.

## 2026-02-18 - Input State De-synchronization
**Learning:** Silently failing validation on inputs (e.g., an allowance input that ignores values outside 1-365 but leaves the invalid number visible in the UI) causes severe state de-synchronization. The user believes their new input was accepted, but the application is still using the old state.
**Action:** When an input value fails validation in a single-page application without a full form submission, explicitly reject the change by both showing an error message (e.g., a toast notification) AND programmatically reverting the input's displayed value to match the true internal state.
