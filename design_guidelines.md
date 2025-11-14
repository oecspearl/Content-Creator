# Design Guidelines: Interactive Educational Content Creator

## Design Approach
**Selected System:** Material Design 3 with productivity-focused adaptations, inspired by Notion's content organization and Linear's clarity for complex tools.

**Rationale:** This application requires clear information hierarchy, extensive form handling, and content management - Material Design's elevation system, clear typography, and robust component library are ideal for educational productivity tools.

## Typography System

**Font Family:** 
- Primary: Inter (via Google Fonts CDN) for UI elements and body text
- Monospace: JetBrains Mono for code snippets or technical content

**Hierarchy:**
- Page Titles: text-3xl font-bold (48px)
- Section Headers: text-2xl font-semibold (32px)
- Card/Component Titles: text-xl font-semibold (24px)
- Subheadings: text-lg font-medium (20px)
- Body Text: text-base (16px)
- Helper Text/Labels: text-sm text-gray-600 (14px)
- Micro-copy: text-xs (12px)

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20 for consistent rhythm
- Component padding: p-6 or p-8
- Section spacing: space-y-8 or space-y-12
- Card gaps: gap-6
- Form field spacing: space-y-4

**Grid System:**
- Dashboard content library: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Creator layouts: Two-column split (8-4 or 7-5 ratio) for editor + preview
- Form layouts: Single column max-w-2xl for focused input

**Container Widths:**
- Full app wrapper: max-w-7xl mx-auto px-6
- Content creators: Full-width with internal constraints
- Forms and modals: max-w-2xl

## Component Library

### Navigation & App Shell
**Top Navigation Bar:**
- Full-width with max-w-7xl container
- Height: h-16
- Logo/brand (left), user profile menu (right)
- Subtle bottom border (border-b)

**Sidebar (for Dashboard):**
- Fixed width: w-64 on desktop, collapsible drawer on mobile
- Content type filters with icons
- Persistent across dashboard views

### Dashboard Components
**Content Cards:**
- Elevated containers with rounded-xl borders
- Header area with type icon (h-12 w-12 rounded-lg background), title, status badge
- Metadata row: Last modified, completion percentage
- Action buttons row at bottom (Edit, Preview, Share, Delete)
- Hover state: subtle elevation increase

**Empty State:**
- Centered layout with large icon (h-24 w-24)
- Heading + description + prominent CTA button
- Illustration suggestion: Creative workspace or content creation metaphor

### Content Creator Components
**Toolbar:**
- Sticky top position (sticky top-0 z-10)
- Height: h-14
- Contains: Back button, auto-save indicator, publish toggle, AI generate button, settings icon
- Background with backdrop blur

**Editor Panels:**
- Left panel (w-2/3): Main editing area with form inputs
- Right panel (w-1/3): Live preview or settings
- Resizable divider between panels

**Question/Card Items:**
- Each item in bordered container with rounded-lg
- Drag handle icon (left), content (center), action buttons (right)
- Reorder with visual feedback
- Spacing: space-y-4 between items

**Form Inputs:**
- Labels above inputs (text-sm font-medium)
- Inputs with rounded-lg borders, focus:ring-2 focus:ring-offset-2
- Helper text below (text-xs text-gray-500)
- Consistent height: h-10 for single-line, h-24 for textareas

### Modals & Overlays
**AI Generation Modal:**
- Centered overlay (max-w-2xl)
- Header with title + close button (h-16)
- Content area with form fields (space-y-6 p-6)
- Footer with cancel + generate button (h-16)

**Share Modal:**
- Similar structure to AI modal (max-w-lg)
- Shareable link with copy button
- Share options as icon buttons in row

### Buttons & Actions
**Primary CTA:** Solid background, rounded-lg, px-6 py-3, font-medium
**Secondary:** Outlined variant with same sizing
**Tertiary/Ghost:** Text only with hover background
**Icon Buttons:** Square (h-10 w-10), rounded-lg, centered icon

### Content Players
**Quiz Player:**
- Question card centered (max-w-2xl)
- Options as selectable cards (hover + selected states)
- Navigation: Previous/Next at bottom
- Progress indicator at top (progress bar, thin h-1)

**Flashcard Player:**
- Card centered (aspect-ratio-[3/2], max-w-xl)
- Flip animation on click
- Card counter below (e.g., "5 / 20")
- Shuffle and restart controls

**Interactive Video:**
- YouTube embed full-width in container
- Hotspot overlays at precise timestamps
- Timeline scrubber below video with hotspot markers

**Image Hotspot:**
- Image container with relative positioning
- Clickable hotspot dots (absolute positioned circles)
- Tooltip/popup on click with descriptions

### Status & Feedback
**Loading States:** Skeleton screens matching content structure
**Toasts:** Top-right corner, rounded-xl, auto-dismiss, max-w-sm
**Error States:** Alert boxes with icon, rounded-lg, appropriate color treatment
**Success States:** Checkmark icon with confirmation message

## Animations
Use sparingly and purposefully:
- Page transitions: Fade (200ms)
- Modal enter/exit: Scale + fade (150ms)
- Drag and drop: Visual lift with shadow
- Card hovers: Subtle elevation shift (100ms)
- Button interactions: Native browser defaults
**NO:** Scroll-triggered animations, decorative motion, auto-playing effects

## Images

**Dashboard Empty State:**
- Illustration of content creation tools (quiz, flashcards, video) in friendly style
- Placement: Center of empty content grid
- Size: max-w-md

**Help Page:**
- Screenshot examples of each creator interface
- Placement: Alongside feature descriptions
- Bordered with rounded corners

**User Profile:**
- Avatar/profile image (h-10 w-10 rounded-full) in navigation
- Default to initials if no image

**Content Type Icons:**
- Use Lucide icons consistently: FileQuestion (quiz), Layers (flashcard), Video (video), Image (image hotspot)
- Size: h-5 w-5 in cards, h-6 w-6 in headers

## Responsive Behavior
- Mobile (< 768px): Single column, collapsible navigation, stacked creator panels
- Tablet (768-1024px): Two columns for dashboard, maintain split for creators
- Desktop (1024px+): Full three-column dashboard grid, side-by-side creator layout

## Accessibility Notes
- All interactive elements keyboard navigable
- Focus indicators with 2px offset ring
- ARIA labels for icon-only buttons
- Color contrast minimum WCAG AA
- Form validation messages with icons + text

This design system creates a professional, efficient educational content creation environment prioritizing clarity, productivity, and ease of use over decorative elements.