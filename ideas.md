# Odoo 19 POS Mobile UI Mockup — Design Brainstorm

## Three Design Directions

<response>
<text>

### Idea A — "Dark Commerce" (Probability: 0.08)
**Design Movement:** High-contrast dark-mode retail terminal meets Bloomberg Terminal brutalism

**Core Principles:**
- Near-black backgrounds (#0D0D0D) with electric amber/orange accents for CTAs
- Dense information architecture — every pixel earns its place
- Monospaced data readouts alongside humanist labels

**Color Philosophy:** Charcoal base (#111827) with amber (#F59E0B) primary actions and emerald (#10B981) for confirmations. Inspired by trading terminals — serious, fast, trustworthy.

**Layout Paradigm:** Asymmetric split: 60% product grid on the right, 40% order panel on the left. Status bar always visible at top. Bottom tab nav with haptic-feel press states.

**Signature Elements:**
- Thin amber underlines on active states
- Monospaced price display (JetBrains Mono)
- Subtle scanline texture overlay on header

**Interaction Philosophy:** Every tap produces immediate visual feedback. No modals — slide-up drawers only. Swipe-to-remove on cart items.

**Animation:** Spring physics on cart item additions. Slide-up payment sheet. Number counter animation on quantity changes.

**Typography System:** Display — Space Grotesk Bold; Body — Inter Regular; Prices — JetBrains Mono

</text>
<probability>0.07</probability>
</response>

<response>
<text>

### Idea B — "Warm Retail" (Probability: 0.09) ← SELECTED
**Design Movement:** Material You meets Scandinavian retail warmth — approachable, tactile, professional

**Core Principles:**
- Warm off-white surfaces with deep teal primary and coral accent
- Card-based product grid with generous touch targets (min 56px)
- Layered elevation system: background → surface → card → overlay
- Mobile-first, thumb-reachable bottom navigation

**Color Philosophy:** Deep teal (#0F766E) as brand anchor — confident and trustworthy. Warm cream (#FAFAF7) backgrounds to avoid cold sterility. Coral (#F97316) for urgent actions (checkout, delete). Slate for typography hierarchy.

**Layout Paradigm:** Phone-frame mockup container centered on desktop. Two-panel layout on tablet: left = product catalog, right = live order. Bottom navigation bar with 4 tabs. Floating action button for quick scan.

**Signature Elements:**
- Pill-shaped category filter chips with teal fill on active
- Product cards with subtle drop shadow and image-top layout
- Slide-up payment drawer with blurred backdrop

**Interaction Philosophy:** Generous tap targets. Swipe gestures for cart management. Haptic-style visual feedback (scale bounce on add to cart).

**Animation:** Cart item count badge bounce. Product card scale-up on press. Smooth tab transitions with shared element feel.

**Typography System:** Display — Sora SemiBold; Body — DM Sans Regular; Prices — Sora Bold Tabular

</text>
<probability>0.09</probability>
</response>

<response>
<text>

### Idea C — "Glass Commerce" (Probability: 0.06)
**Design Movement:** Glassmorphism meets Apple Pay — ultra-modern, premium, translucent

**Core Principles:**
- Frosted glass cards on gradient backgrounds
- Indigo-to-violet gradient system
- Soft blur overlays for modals and drawers

**Color Philosophy:** Deep indigo (#312E81) to violet (#7C3AED) gradient as the base canvas. White/10% glass cards. Gold (#D97706) for premium product highlights.

**Layout Paradigm:** Full-bleed gradient background. Glass-panel product grid. Floating bottom sheet for cart. Circular avatar for cashier profile.

**Signature Elements:**
- backdrop-blur glass cards with white/10 border
- Gradient progress bar for order completion
- Circular product images with ring highlight

**Interaction Philosophy:** Smooth, premium feel. Long-press for product details. Pinch-to-zoom on product images.

**Animation:** Blur-in for modals. Elastic spring on cart drawer. Particle burst on payment success.

**Typography System:** Display — Clash Display Bold; Body — Satoshi Regular; Prices — Clash Display Tabular

</text>
<probability>0.06</probability>
</response>

---

## Selected Direction: **Idea B — "Warm Retail"**

Warm, approachable, and professional. Deep teal + warm cream + coral. Sora + DM Sans typography. Mobile-first phone frame mockup with interactive screen navigation.
