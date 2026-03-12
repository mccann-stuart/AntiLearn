## 2026-02-18 - Mobile-Safe Desktop Hover States
**Learning:** Adding hover scaling (`transform: scale()`) to grid items like calendar days causes two distinct UX issues: 1) The scaled item gets clipped by adjacent grid items if `z-index` isn't simultaneously elevated. 2) On iOS/touch devices, hover states "stick" after tapping, leaving the element permanently scaled until another element is tapped.
**Action:** Always wrap non-essential hover micro-interactions (like scaling or box-shadows on buttons) in a `@media (hover: hover)` query to ensure they only apply to cursor devices. Furthermore, when scaling an element within a grid or flex layout, simultaneously increase its `z-index` to prevent clipping by siblings.

## 2026-02-18 - Hover State Transitions
**Learning:** When adding CSS transitions to hover states (like `transform` on `:hover`), putting the `transition` property only on the `:hover` pseudo-class makes the animation snap back instantly when the cursor leaves the element.
**Action:** Always place the base `transition` property on the normal element selector (e.g. `.day[role="button"]`) rather than the `:hover` pseudo-class to ensure smooth animations in both directions (hover in, hover out).

## 2026-02-18 - Actionable Empty States
**Learning:** Users might hesitate to click a destructive-looking button like 'Reset Plan' to auto-generate a schedule. Adding a positive, action-oriented call-to-action directly within an empty state significantly improves the discoverability of core features for new users.
**Action:** Whenever a view requires user action to populate (like a recommendation list), include a clear, descriptive CTA button directly in the empty state instead of just providing helper text.

## 2026-02-19 - Destructive Inline Actions Feedback
**Learning:** Destructive inline actions (like removing custom holidays) that lack distinct hover and focus states make it difficult for users to confirm they are interacting with the correct element, increasing the risk of accidental deletions.
**Action:** Always provide clear visual feedback (e.g., scale, opacity change, outline) for destructive actions on hover and focus. Remember to wrap hover states in `@media (hover: hover)` for mobile safety, and add a clear `focus-visible` outline for keyboard navigation accessibility.

## 2026-02-18 - Mobile Tactile Polish and Sticky Hovers
**Learning:** Found that many interactive elements (buttons, cards) had `:hover` transitions but lacked `@media (hover: hover)` constraints, causing standard "sticky hover" issues on iOS where the hover state gets stuck after tapping. Additionally, these elements lacked `:active` states, leading to a "dead" feeling upon tapping on touch devices.
**Action:** Always wrap all pseudo-class `:hover` states for interactive elements (like buttons and cards) in `@media (hover: hover)` queries, and proactively define global `:active` transformations (e.g., `transform: scale(0.96)`) so every primary interaction gives satisfying tactile feedback.
