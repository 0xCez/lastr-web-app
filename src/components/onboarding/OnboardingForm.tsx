import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useNavigate, useSearchParams } from "react-router-dom";
import UGCOpportunityModal from "@/components/dashboard/UGCOpportunityModal";
import AccountManagerOpportunityModal from "@/components/dashboard/AccountManagerOpportunityModal";
import Navbar from "@/components/homepage/Navbar";

type Role = "account_manager" | "influencer" | "ugc_creator" | "";

const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon",
  "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan",
  "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia",
  "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro",
  "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger",
  "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea",
  "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal",
  "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
  "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const ACCOUNT_MANAGER_COUNTRIES = ["United States", "Canada", "United Kingdom", "France", "Germany"];

interface FormData {
  // Step 1 - Basic Info
  fullName: string;
  email: string;
  country: string;
  paypalInfo: string;
  ageRange: string;
  gender: string;
  role: Role;

  // Step 2 - Role Info (varies by role)
  // Account Manager
  postsPerDay: string;
  devices: string;
  accountPairs: string;  // "1" or "2" - number of TT/IG pairs

  // Influencer (Micro)
  tiktokHandle: string;
  igHandle: string;
  minViews: string;
  minPosts: string;

  // UGC Creator
  contractOption: string;

  // Step 3 - Login Info
  password: string;
  confirmPassword: string;
}

const OnboardingForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUGCModal, setShowUGCModal] = useState(false);
  const [showAMModal, setShowAMModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    country: "",
    paypalInfo: "",
    ageRange: "",
    gender: "",
    role: "account_manager", // Lastr only has Account Managers for now
    postsPerDay: "",
    devices: "",
    accountPairs: "",
    tiktokHandle: "",
    igHandle: "",
    minViews: "",
    minPosts: "",
    contractOption: "",
    password: "",
    confirmPassword: "",
  });

  // Pre-fill role from URL parameters (Lastr: always default to account_manager)
  useEffect(() => {
    // For Lastr, we only support account_manager role
    // Keep this effect in case we add other roles later
    const roleParam = searchParams.get("role");
    if (roleParam === "account_manager") {
      setFormData(prev => ({ ...prev, role: "account_manager" as Role }));
    }
  }, [searchParams]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle validation regex - must start with @ followed by alphanumeric/underscore/period
  const handleRegex = /^@[a-zA-Z0-9_.]+$/;

  const validateHandle = (handle: string): boolean => {
    if (!handle) return true; // Empty is OK (optional)
    return handleRegex.test(handle);
  };

  const validateStep1 = () => {
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName || !formData.email || !formData.country || !formData.paypalInfo || !formData.role) {
      return false;
    }

    // Validate email format
    if (!emailRegex.test(formData.email)) {
      return false;
    }

    // For Account Managers, validate country is in the allowed list
    if (formData.role === "account_manager" && !ACCOUNT_MANAGER_COUNTRIES.includes(formData.country)) {
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    switch (formData.role) {
      case "account_manager":
        // Account Managers only need to select account pairs (handles added later)
        return formData.accountPairs !== "";
      case "influencer":
        // Influencers must have handles and they must be valid format
        if (!formData.tiktokHandle || !formData.igHandle || !formData.minViews || !formData.minPosts) {
          return false;
        }
        if (!validateHandle(formData.tiktokHandle) || !validateHandle(formData.igHandle)) {
          return false;
        }
        return true;
      case "ugc_creator":
        // UGC creators - validate handles if provided (they're optional)
        if (formData.tiktokHandle && !validateHandle(formData.tiktokHandle)) {
          return false;
        }
        if (formData.igHandle && !validateHandle(formData.igHandle)) {
          return false;
        }
        return formData.contractOption !== "";
      default:
        return false;
    }
  };

  const validateStep3 = () => {
    // Password strength requirements
    const minLength = 8;

    if (!formData.password || !formData.confirmPassword) {
      return false;
    }

    if (formData.password.length < minLength) {
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Step 1: Create auth user with metadata (trigger will create profile)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email, // Use the same email from Step 1
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
          data: {
            full_name: formData.fullName,
            role: formData.role,
          },
        },
      });

      if (authError) {
        // Handle specific error cases
        if (authError.message.includes("already registered")) {
          throw new Error("This email is already registered. Please use a different email or log in.");
        }
        throw authError;
      }
      if (!authData.user) throw new Error("Failed to create user");

      // Check if email confirmation is required
      const emailConfirmationRequired = authData.user.identities && authData.user.identities.length === 0;

      if (emailConfirmationRequired) {
        // Save form data to localStorage so we can complete profile after email confirmation
        // SECURITY: Do NOT store role - always use 'ugc_creator' to prevent privilege escalation
        localStorage.setItem('pendingProfileSetup', JSON.stringify({
          userId: authData.user.id,
          fullName: formData.fullName,
          email: formData.email,
          country: formData.country,
          paypalInfo: formData.paypalInfo,
          // role intentionally omitted - always defaults to 'ugc_creator' on server
          postsPerDay: formData.postsPerDay,
          devices: formData.devices,
          accountPairs: formData.accountPairs,
          contractOption: formData.contractOption,
          tiktokHandle: formData.tiktokHandle,
          igHandle: formData.igHandle,
          minViews: formData.minViews,
          minPosts: formData.minPosts,
          ageRange: formData.ageRange,
          gender: formData.gender,
        }));

        toast.success("Account created! Please check your email to confirm your account before logging in.");
        navigate("/login");
        return;
      }

      // Convert postsPerDay string to number
      let postsPerDayNumber: number | null = null;
      if (formData.postsPerDay) {
        // Extract the first number from strings like "3-5" or "10+"
        const match = formData.postsPerDay.match(/\d+/);
        postsPerDayNumber = match ? parseInt(match[0]) : null;
      }

      // Step 2: Complete user profile using secure function
      // This function handles all profile setup, account creation, and contract creation
      // with proper permissions using SECURITY DEFINER
      const { data: result, error: profileError } = await supabase.rpc('complete_user_profile', {
        p_user_id: authData.user.id,
        p_full_name: formData.fullName,
        p_email: formData.email,
        p_country: formData.country,
        p_paypal_info: formData.paypalInfo,
        p_posts_per_day: postsPerDayNumber,
        p_devices: formData.devices ? parseInt(formData.devices) : null,
        p_contract_option: formData.contractOption || null,
        p_tiktok_handle: formData.tiktokHandle || null,
        p_ig_handle: formData.igHandle || null,
        p_min_views: formData.minViews ? parseInt(formData.minViews) : null,
        p_min_posts: formData.minPosts ? parseInt(formData.minPosts) : null,
        p_age_range: formData.ageRange || null,
        p_gender: formData.gender || null,
        p_account_pairs: formData.accountPairs ? parseInt(formData.accountPairs) : null,
      });

      if (profileError) throw profileError;
      if (!result) throw new Error("Failed to complete profile");

      toast.success("Account created successfully!");

      // Check if user is a UGC creator who needs approval
      const applicationStatus = (result as { application_status?: string })?.application_status;

      // Navigate based on application status
      if (formData.role === "ugc_creator" && applicationStatus === "pending") {
        // UGC creators with pending status go to application pending page
        navigate("/application-pending");
      } else {
        // All other users (admins, account managers, influencers, or approved users) go to dashboard
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!formData.email || !emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
      } else if (formData.role === "account_manager" && !ACCOUNT_MANAGER_COUNTRIES.includes(formData.country)) {
        toast.error("Account Managers must be based in: US, Canada, UK, France, or Germany");
      } else {
        toast.error("Please fill in all fields before continuing");
      }
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      // Check for handle format errors first
      if (formData.tiktokHandle && !validateHandle(formData.tiktokHandle)) {
        toast.error("TikTok handle must start with @ (e.g., @username)");
        return;
      }
      if (formData.igHandle && !validateHandle(formData.igHandle)) {
        toast.error("Instagram handle must start with @ (e.g., @username)");
        return;
      }
      toast.error("Please fill in all fields before continuing");
      return;
    }
    if (currentStep === 3 && !validateStep3()) {
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
      } else if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters long");
      } else {
        toast.error("Please fill in all fields before continuing");
      }
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const steps = [
    { number: 1, label: "Basic info" },
    { number: 2, label: "Contract" },
    { number: 3, label: "Login info" },
  ];

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">What's your full name?</label>
        <Input
          value={formData.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          className="bg-secondary/50 border-border/50"
          placeholder="Enter your full name"
        />
      </div>
      
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">What's your email address? <span className="text-xs">(You will use this to login)</span></label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className="bg-secondary/50 border-border/50"
          placeholder="Enter your email"
        />
      </div>
      
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">
          Which country are you based in? <span className="text-xs">*this will be verified</span>
          {formData.role === "account_manager" && (
            <span className="block text-xs text-primary mt-1">Account Managers: US, Canada, UK, France, or Germany only</span>
          )}
        </label>
        <Select value={formData.country} onValueChange={(value) => handleChange("country", value)}>
          <SelectTrigger className="bg-secondary/50 border-border/50">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-[200px]">
            {(formData.role === "account_manager" ? ACCOUNT_MANAGER_COUNTRIES : ALL_COUNTRIES).map((country) => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">What's your payment info on PayPal?</label>
        <Input
          value={formData.paypalInfo}
          onChange={(e) => handleChange("paypalInfo", e.target.value)}
          className="bg-secondary/50 border-border/50"
          placeholder="Enter your PayPal email"
        />
      </div>

      {/* Hide age/gender for Account Managers */}
      {formData.role !== "account_manager" && (
        <>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">What's your age range?</label>
            <Select value={formData.ageRange} onValueChange={(value) => handleChange("ageRange", value)}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue placeholder="Select your age range" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="18-24">18-24</SelectItem>
                <SelectItem value="25-30">25-30</SelectItem>
                <SelectItem value="31-40">31-40</SelectItem>
                <SelectItem value="40+">40+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">What's your gender? <span className="text-xs">(optional)</span></label>
            <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Non-binary">Non-binary</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Role selector hidden - Lastr only has Account Managers for now
          Keeping the code for future when other roles are enabled */}
      {false && (
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">What is your role?</label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleChange("role", value as Role)}
            disabled={!!searchParams.get("role")}
          >
            <SelectTrigger className="bg-secondary/50 border-border/50">
              <SelectValue placeholder="Drop down: Account manager, Influencer, UGC Creator" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="account_manager">Account Manager</SelectItem>
              <SelectItem value="influencer">Influencer</SelectItem>
              <SelectItem value="ugc_creator">UGC Creator</SelectItem>
            </SelectContent>
          </Select>
          {searchParams.get("role") && (
            <p className="text-xs text-muted-foreground mt-1">Role pre-selected from your landing page</p>
          )}
        </div>
      )}
    </div>
  );

  const renderStep2AccountManager = () => (
    <div className="space-y-4">
      {/* Account Manager Opportunity Button */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">Account Manager Contract Details</h4>
            <p className="text-xs text-muted-foreground">
              View full details about daily targets, weekly bonuses, and monthly earnings
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAMModal(true)}
            className="gap-2 flex-shrink-0"
          >
            <Info className="w-4 h-4" />
            View Details
          </Button>
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-2 block">
          How many TikTok/Instagram account pairs do you want to manage?
        </label>
        <Select value={formData.accountPairs} onValueChange={(value) => handleChange("accountPairs", value)}>
          <SelectTrigger className="bg-secondary/50 border-border/50">
            <SelectValue placeholder="Select number of account pairs" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="1">1 pair (1 TikTok + 1 Instagram) — $250/month</SelectItem>
            <SelectItem value="2">2 pairs (2 TikTok + 2 Instagram) — $500/month</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          5 slideshows/day per pair, 6 days/week (~15 min/day for 1 pair)
        </p>
      </div>

      <div className="bg-secondary/30 rounded-lg p-4 mt-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Note:</span> You'll add your TikTok and Instagram accounts
          later on the slideshow generator page. No need to have them ready now.
        </p>
      </div>
    </div>
  );

  const renderStep2Influencer = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">What's your TikTok handle?</label>
        <Input
          value={formData.tiktokHandle}
          onChange={(e) => handleChange("tiktokHandle", e.target.value)}
          className="bg-secondary/50 border-border/50"
          placeholder="@yourtiktok"
        />
      </div>
      
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">What's your Instagram handle?</label>
        <Input
          value={formData.igHandle}
          onChange={(e) => handleChange("igHandle", e.target.value)}
          className="bg-secondary/50 border-border/50"
          placeholder="@yourinstagram"
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-2 block">What's the minimum views agreed for your monthly contract? <span className="text-xs">*all will be verified</span></label>
        <Input
          type="number"
          value={formData.minViews}
          onChange={(e) => handleChange("minViews", e.target.value)}
          className="bg-secondary/50 border-border/50"
          placeholder="e.g. 500000"
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-2 block">What's the minimum posts agreed for your monthly contract? <span className="text-xs">*all will be verified</span></label>
        <Input
          type="number"
          value={formData.minPosts}
          onChange={(e) => handleChange("minPosts", e.target.value)}
          className="bg-secondary/50 border-border/50"
          placeholder="e.g. 12"
        />
      </div>
    </div>
  );

  const renderStep2UGCCreator = () => (
    <div className="space-y-4">
      {/* UGC Opportunity Button */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">Learn About the UGC Creator Opportunity</h4>
            <p className="text-xs text-muted-foreground">
              View full details about contract options, content format, earnings, and FAQs
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowUGCModal(true)}
            className="gap-2 flex-shrink-0"
          >
            <Info className="w-4 h-4" />
            View Details
          </Button>
        </div>
      </div>

      <div className="bg-secondary/20 rounded-lg p-4 border border-border/30">
        <p className="text-sm text-muted-foreground mb-3">
          <span className="font-medium text-foreground">Don't have dedicated accounts yet?</span> No problem! You can create new TikTok/Instagram accounts specifically for this. Leave these blank for now and add them later on the platform.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">TikTok handle <span className="text-xs">(optional)</span></label>
            <Input
              value={formData.tiktokHandle}
              onChange={(e) => handleChange("tiktokHandle", e.target.value)}
              className="bg-secondary/50 border-border/50"
              placeholder="@yourtiktok"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Instagram handle <span className="text-xs">(optional)</span></label>
            <Input
              value={formData.igHandle}
              onChange={(e) => handleChange("igHandle", e.target.value)}
              className="bg-secondary/50 border-border/50"
              placeholder="@yourinstagram"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Which of the 2 contract options did you choose?</label>
        <Select value={formData.contractOption} onValueChange={(value) => handleChange("contractOption", value)}>
          <SelectTrigger className="bg-secondary/50 border-border/50">
            <SelectValue placeholder="Select contract option" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="option1">Option 1: $300 Fixed monthly retainer + $1.5 capped at 5k monthly</SelectItem>
            <SelectItem value="option2" disabled className="opacity-50">
              Option 2: Fixed $500 monthly for 100 videos per month
              <span className="text-xs text-muted-foreground ml-2">(Currently unavailable)</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep2 = () => {
    switch (formData.role) {
      case "account_manager":
        return renderStep2AccountManager();
      case "influencer":
        return renderStep2Influencer();
      case "ugc_creator":
        return renderStep2UGCCreator();
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Please select a role in Step 1 to continue
          </div>
        );
    }
  };

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Login Email:</span> {formData.email}
        </p>
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Please choose a password <span className="text-xs">(min. 8 characters)</span></label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          className="bg-secondary/50 border-border/50"
          placeholder="Enter your password"
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Confirm your password</label>
        <Input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          className="bg-secondary/50 border-border/50"
          placeholder="Confirm your password"
        />
      </div>
    </div>
  );

  return (
    <>
      <UGCOpportunityModal open={showUGCModal} onOpenChange={setShowUGCModal} />
      <AccountManagerOpportunityModal open={showAMModal} onOpenChange={setShowAMModal} />

      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            {/* Title Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-3">Become an Account Manager</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Join the Lastr team and earn $250-$500/month<br />
                managing social media accounts with our<br />
                AI-powered slideshow generator.
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 md:gap-8 mb-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        currentStep >= step.number
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {step.number}
                    </div>
                    <span className={`text-xs mt-2 whitespace-nowrap ${
                      currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 md:w-12 h-0.5 mx-1 md:mx-2 mt-[-12px] ${
                      currentStep > step.number ? "bg-primary" : "bg-secondary"
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Form Container */}
            <div className="glass-card p-6">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-6">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Back
                  </Button>
                )}
                <Button
                  variant="submit"
                  onClick={handleNext}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {currentStep === 3 ? (isSubmitting ? "Creating Account..." : "Create Account") : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default OnboardingForm;
