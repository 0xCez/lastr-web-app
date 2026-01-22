# Mobile Responsive Design Patterns

This document outlines the responsive design patterns used in the Creator Platform for consistent mobile experiences.

## Core Utilities

### useIsMobile Hook
Located at: `src/hooks/use-mobile.tsx`

```tsx
import { useIsMobile } from "@/hooks/use-mobile";

const MyComponent = () => {
  const isMobile = useIsMobile();

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
};
```

**Breakpoint**: 768px (matches Tailwind's `md` breakpoint)

---

## Components

### 1. ResponsiveModal
Located at: `src/components/ui/responsive-modal.tsx`

Automatically renders as a **Drawer** (bottom sheet) on mobile and a **Dialog** (centered modal) on desktop.

```tsx
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";

<ResponsiveModal open={open} onOpenChange={setOpen}>
  <ResponsiveModalContent>
    <ResponsiveModalHeader>
      <ResponsiveModalTitle>Title</ResponsiveModalTitle>
      <ResponsiveModalDescription>Description</ResponsiveModalDescription>
    </ResponsiveModalHeader>
    <div>Content here</div>
    <ResponsiveModalFooter>
      <Button>Action</Button>
    </ResponsiveModalFooter>
  </ResponsiveModalContent>
</ResponsiveModal>
```

### 2. FloatingActionButton (FAB)
Located at: `src/components/ui/floating-action-button.tsx`

Mobile-only FAB with expandable actions. Hidden on desktop (`md:hidden`).

```tsx
import { FloatingActionButton, FloatingAction } from "@/components/ui/floating-action-button";

<FloatingActionButton
  actions={[
    {
      icon: <Plus className="w-5 h-5" />,
      label: "Submit Post",
      onClick: () => setOpen(true),
      className: "bg-primary text-primary-foreground", // Optional custom styling
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Scripts",
      onClick: () => setScriptsOpen(true),
    },
  ]}
/>
```

**Features:**
- Single action: Direct click (no expand)
- Multiple actions: Expands on tap with labels
- Auto-closes on scroll
- Backdrop overlay when expanded

---

## Layout Patterns

### 1. Mobile-First Grid
```tsx
// Stack on mobile, 2 columns on tablet, 3 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### 2. Conditional Layout with isMobile
```tsx
const isMobile = useIsMobile();

return (
  <div className="glass-card p-4">
    {isMobile ? (
      // Mobile: Stacked card layout
      <div className="space-y-3">
        <div className="flex justify-between">...</div>
        <div className="flex flex-wrap gap-1.5">...</div>
        <div className="flex gap-2">...</div>
      </div>
    ) : (
      // Desktop: Horizontal row layout
      <div className="flex items-center justify-between gap-6">
        ...
      </div>
    )}
  </div>
);
```

### 3. Horizontal Scroll for Filters
```tsx
<div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
  <Select>...</Select>
  <Select>...</Select>
  <Button>...</Button>
</div>
```

### 4. Responsive Text Hiding
```tsx
// Show icon only on mobile, icon + text on desktop
<Button>
  <Icon className="w-4 h-4" />
  <span className="hidden sm:inline">Button Text</span>
</Button>
```

### 5. Responsive Container
```tsx
// Vertical on mobile, horizontal on tablet+
<div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-2">
```

---

## Common Patterns

### Card-Based Mobile Lists
For data tables/lists that are horizontal on desktop:

**Desktop**: Single row with all data inline
**Mobile**: Stacked card with sections

```tsx
// Mobile card structure:
<div className="space-y-3">
  {/* Header: Name + Amount */}
  <div className="flex items-start justify-between gap-2">
    <div className="min-w-0 flex-1">
      <div className="font-semibold truncate">{name}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </div>
    <div className="text-right flex-shrink-0">
      <div className="text-lg font-bold">{amount}</div>
    </div>
  </div>

  {/* Badges Row */}
  <div className="flex flex-wrap items-center gap-1.5">
    {badges}
  </div>

  {/* Stats Row */}
  <div className="flex items-center gap-3 text-sm text-muted-foreground">
    {stats}
  </div>

  {/* Actions */}
  <div className="flex gap-2 pt-1">
    <Button className="flex-1">Primary Action</Button>
  </div>
</div>
```

### Touch-Friendly Buttons
Minimum touch target: 44x44px

```tsx
// For icon-only buttons on mobile
<Button size="icon" className="h-11 w-11">
  <Icon className="w-5 h-5" />
</Button>

// Full-width actions on mobile
<Button className="flex-1">Action</Button>
```

---

## Tailwind Breakpoints Reference

| Breakpoint | Min Width | CSS |
|------------|-----------|-----|
| `sm` | 640px | `@media (min-width: 640px)` |
| `md` | 768px | `@media (min-width: 768px)` |
| `lg` | 1024px | `@media (min-width: 1024px)` |
| `xl` | 1280px | `@media (min-width: 1280px)` |
| `2xl` | 1400px | `@media (min-width: 1400px)` |

---

## iOS Safe Area Insets

For iPhones with notch/Dynamic Island and home indicator, use safe area utilities defined in `src/index.css`.

### Setup
The viewport meta tag includes `viewport-fit=cover` to enable edge-to-edge display:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### Safe Area Utilities

| Class | Description |
|-------|-------------|
| `pt-safe` | Padding top for notch/Dynamic Island |
| `pb-safe` | Padding bottom for home indicator |
| `pl-safe` | Padding left for landscape |
| `pr-safe` | Padding right for landscape |
| `px-safe` | Padding left + right |
| `py-safe` | Padding top + bottom |
| `mt-safe` / `mb-safe` | Margin variants |
| `bottom-safe` | For fixed positioned elements (includes fallback) |
| `right-safe` | For fixed positioned elements (includes fallback) |

### Usage Examples

```tsx
// Header with notch protection
<header className="sticky top-0 pt-safe">
  ...
</header>

// Main content with bottom home indicator protection
<main className="pb-safe">
  ...
</main>

// Floating button with safe positioning
<div className="fixed bottom-safe right-safe">
  <Button>...</Button>
</div>
```

### Applied Locations
- **TabNav**: `pt-safe` for notch, `px-safe` for mobile content
- **FloatingActionButton**: `bottom-safe right-safe` for home indicator
- **Index page**: `pb-safe` on main container

---

## Checklist for Mobile-Responsive Components

- [ ] Use `useIsMobile` for JS-based layout switching
- [ ] Use Tailwind breakpoints (`md:`, `lg:`) for CSS-based responsive
- [ ] Test touch targets are at least 44px
- [ ] Ensure text is readable (min 14px on mobile)
- [ ] Check horizontal overflow - use `overflow-x-auto` if needed
- [ ] Hide decorative elements on mobile (`hidden md:block`)
- [ ] Use `ResponsiveModal` for modals/dialogs
- [ ] Consider `FloatingActionButton` for key actions
- [ ] Apply safe area classes for iOS notch/home indicator
- [ ] Test with actual mobile device or browser DevTools
