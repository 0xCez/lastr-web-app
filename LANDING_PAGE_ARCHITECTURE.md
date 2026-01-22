# Landing Page Architecture Guide

A comprehensive guide to duplicating the landing page setup from this Creator Platform.

---

## Overview

This app uses **React + React Router + Framer Motion** for a multi-landing-page setup with:
- One main homepage (`/`)
- Two role-specific landing pages (`/creators`, `/account-managers`)
- Protected dashboard routes (`/dashboard/*`)

---

## 1. Routing Structure

### File: `src/App.tsx`

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserRoleProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/creators" element={<UGCLanding />} />
            <Route path="/account-managers" element={<AMLanding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard/calendar" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard/account" element={<ProtectedRoute><Index /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserRoleProvider>
  </QueryClientProvider>
);
```

### Key Patterns:
1. **Public pages** - No wrapper, directly render component
2. **Protected pages** - Wrap with `<ProtectedRoute>`
3. **Dashboard sub-routes** - All render the same `Index` component, which reads the URL to determine active tab

---

## 2. Shared Components

### A. GridBackground (Visual Foundation)

**File:** `src/components/ui/GridBackground.tsx`

Creates the perspective grid background used on all landing pages.

```tsx
interface GridBackgroundProps {
  children: React.ReactNode;
  className?: string;
  showGradient?: boolean;
  gridSize?: number;      // default: 40
  gridOpacity?: number;   // default: 0.03
}

export function GridBackground({ children, gridSize = 40, gridOpacity = 0.03 }) {
  return (
    <div className="relative min-h-screen w-full">
      {/* Fixed perspective grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden"
           style={{ perspective: "1000px", perspectiveOrigin: "50% 0%" }}>
        <div
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,${gridOpacity}) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,${gridOpacity}) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
            transform: "rotateX(65deg)",
            transformOrigin: "center top",
            height: "200vh",
          }}
        />
        {/* Fade out at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-[40%]"
             style={{ background: "linear-gradient(to top, var(--background), transparent)" }} />
      </div>

      {/* Radial gradient overlay */}
      {showGradient && (
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
      )}

      {/* Glow spots */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

### B. Navbar (Shared Navigation)

**File:** `src/components/homepage/Navbar.tsx`

A single navbar component that adapts based on context.

```tsx
interface NavbarProps {
  activePage?: "home" | "creators" | "dashboard";
  userName?: string;
}

export default function Navbar({ activePage = "home", userName }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isCreatorsPage = activePage === "creators" || location.pathname === "/creators";
  const isDashboard = activePage === "dashboard";

  // Scroll-to-section with cross-page support
  const scrollToSection = (id: string) => {
    if (location.pathname !== "/") {
      navigate("/?scrollTo=" + id);  // Navigate to home with query param
      return;
    }
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="grid grid-cols-3 items-center">
          {/* Logo - Left */}
          <Link to="/">
            <img src={logo} alt="Logo" className="w-14 h-14" />
          </Link>

          {/* Desktop Nav - Center */}
          <nav className="hidden md:flex items-center justify-center">
            <div className="flex items-center bg-white/[0.03] rounded-full p-1">
              <button onClick={() => scrollToSection("features")}>Features</button>
              <button onClick={() => scrollToSection("product")}>Product</button>
              <Link to="/creators">Creators</Link>
            </div>
          </nav>

          {/* Right Side - Conditional */}
          <div className="flex items-center gap-3 justify-end">
            {isDashboard ? (
              <>
                <span>{userName}</span>
                <Button onClick={handleSignOut}>Sign Out</Button>
              </>
            ) : (
              <>
                <a href="https://apps.apple.com/...">iOS</a>
                <a href="https://play.google.com/...">Android</a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu (AnimatePresence) */}
    </header>
  );
}
```

---

## 3. Landing Page Structure

### A. Role-Specific Landing Page Template

**Example:** `src/pages/UGCLanding.tsx`

```tsx
const UGCLanding = () => {
  const navigate = useNavigate();
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleGetStarted = () => {
    navigate("/onboarding?role=ugc_creator");  // Pass role via query param
  };

  return (
    <>
      {/* Modal (rendered outside main content) */}
      <UGCOpportunityModal open={showDetailsModal} onOpenChange={setShowDetailsModal} />

      <GridBackground className="bg-background" gridSize={120} gridOpacity={0.04}>
        {/* Navigation */}
        <Navbar activePage="creators" />

        {/* "Already have account?" link */}
        <div className="container mx-auto px-4 pt-4">
          <div className="flex justify-end">
            <Link to="/login">Already have an account?</Link>
          </div>
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Now Hiring UGC Creators</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl font-bold text-center">
              Create Viral Sports Content<br />
              Earn Up to $5,000/Month
            </h1>

            {/* CTA buttons */}
            <Button onClick={handleGetStarted}>Get Started Now</Button>
            <Button variant="outline" onClick={() => setShowDetailsModal(true)}>
              View Full Details
            </Button>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                className="glass-card p-6 text-center"
              >
                <stat.icon className="w-6 h-6 text-primary" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-secondary/30">
          {/* 3-step process */}
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-4 py-16">
          {/* Checklist of benefits */}
        </section>

        {/* Pricing/Contract Options */}
        <section className="py-16 bg-gradient-to-r from-primary/5 to-primary/10">
          {/* Cards for different tiers */}
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16">
          <div className="glass-card p-12 text-center">
            <h2>Ready to Start Earning?</h2>
            <Button onClick={handleGetStarted}>Create Your Account Now</Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8">
          <p>© 2025 Company. All rights reserved.</p>
        </footer>
      </GridBackground>
    </>
  );
};
```

### B. Section Pattern

Each section follows this pattern:

```tsx
<section className="container mx-auto px-4 md:px-6 py-16">
  <div className="max-w-4xl mx-auto">
    {/* Section header */}
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Section Title</h2>
      <p className="text-muted-foreground text-center mb-12">Subtitle</p>
    </motion.div>

    {/* Section content */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Cards/items */}
    </div>
  </div>
</section>
```

---

## 4. Protected Route Pattern

**File:** `src/components/ProtectedRoute.tsx`

```tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Check session exists
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // 2. Fetch user profile
      const { data: user, error } = await supabase
        .from('users')
        .select('application_status, role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        // No profile = incomplete onboarding, sign out
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      setApplicationStatus(user.application_status);
      setUserRole(user.role);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => checkAuth());
    return () => subscription.unsubscribe();
  }, []);

  // Loading state
  if (loading) return <PageLoader />;

  // Not authenticated
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Admin-only check
  if (adminOnly && userRole !== 'admin') return <Navigate to="/dashboard" replace />;

  // Pending application (role-specific)
  if (applicationStatus === 'pending' && userRole === 'ugc_creator') {
    if (location.pathname === '/application-pending') return <>{children}</>;
    return <Navigate to="/application-pending" replace />;
  }

  // Rejected application
  if (applicationStatus === 'rejected') {
    supabase.auth.signOut();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

---

## 5. Animation Patterns

### Entry Animations (Framer Motion)

```tsx
// Fade up on load
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.1 }}
>

// Fade up on scroll into view
<motion.div
  initial={{ opacity: 0, y: 15 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5 }}
>

// Hover lift effect
<motion.div
  whileHover={{ y: -8, transition: { duration: 0.2, ease: "easeOut" } }}
>

// Staggered children
{items.map((item, index) => (
  <motion.div
    key={index}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
  >
))}
```

### Mobile Menu Animation

```tsx
<AnimatePresence>
  {mobileMenuOpen && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Menu content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## 6. File Structure

```
src/
├── App.tsx                           # Route definitions
├── pages/
│   ├── Homepage.tsx                  # Main landing (/)
│   ├── UGCLanding.tsx                # /creators
│   ├── AMLanding.tsx                 # /account-managers
│   ├── Index.tsx                     # Dashboard (multi-tab)
│   ├── Login.tsx
│   ├── Onboarding.tsx
│   └── NotFound.tsx
├── components/
│   ├── ProtectedRoute.tsx            # Auth wrapper
│   ├── homepage/
│   │   ├── Navbar.tsx                # Shared navbar
│   │   ├── HeroSection.tsx
│   │   ├── FeatureGrid.tsx
│   │   ├── Footer.tsx
│   │   └── index.ts                  # Barrel export
│   ├── dashboard/
│   │   ├── UGCOpportunityModal.tsx   # Detail modals
│   │   └── AccountManagerOpportunityModal.tsx
│   └── ui/
│       ├── GridBackground.tsx        # Landing page background
│       ├── button.tsx
│       └── card.tsx
├── contexts/
│   └── UserRoleContext.tsx           # Role management
└── lib/
    └── supabase.ts                   # Auth client
```

---

## 7. Key Takeaways

1. **Single Navbar** - One component adapts via `activePage` prop
2. **GridBackground** - Consistent visual identity across all landing pages
3. **Query params for onboarding** - Pass role via `?role=ugc_creator`
4. **Scroll-to with navigation** - `/?scrollTo=features` handles cross-page scrolling
5. **Section pattern** - Container + max-width + motion wrapper + grid
6. **ProtectedRoute** - Handles auth, pending applications, role checks
7. **Framer Motion everywhere** - Entry animations, scroll triggers, hover effects
8. **Modal pattern** - State + trigger button + Dialog component

---

## 8. Dependencies

```json
{
  "react-router-dom": "^6.x",
  "framer-motion": "^10.x",
  "@tanstack/react-query": "^5.x",
  "@supabase/supabase-js": "^2.x",
  "lucide-react": "^0.x",
  "tailwindcss": "^3.x"
}
```

---

## 9. CSS Classes Used

```css
/* Glass card effect */
.glass-card {
  @apply bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl;
}

/* Primary button glow */
.hover:shadow-[0_10px_40px_rgba(0,200,255,0.1)]

/* Muted background sections */
.bg-secondary/30
.bg-gradient-to-r from-primary/5 to-primary/10
```

---

This architecture is designed to be:
- **Modular** - Easy to add new landing pages
- **Consistent** - Shared components ensure visual consistency
- **Performant** - Lazy loading friendly, minimal re-renders
- **Flexible** - Role-based routing and content
