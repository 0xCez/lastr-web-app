import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, ExternalLink, Sparkles, Music, Image, Type, RefreshCw, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TabNav from "@/components/dashboard/TabNav";
import { useAMTeamAssignments } from "@/hooks/useAMTeamAssignments";
import { useUserRole } from "@/contexts/UserRoleContext";
import { NFL_TEAMS, NBA_TEAMS, SOCCER_TEAMS } from "@/constants/teams";

// Types for Target/Avoid format
interface TargetAvoidSlide {
  screenNumber: number;
  imagePath: string;
  textOverlay: string[];
  isHook?: boolean;
  isCTA?: boolean;
}

interface TargetAvoidData {
  slides: TargetAvoidSlide[];
  caption: string;
  tiktokAudioUrl: string;
  instagramAudioUrl: string;
  league: string;
  generatedAt: string;
}

// Types for FraudWatch format (same slide structure as Target/Avoid)
interface FraudWatchData {
  slides: TargetAvoidSlide[];
  caption: string;
  league: string;
  accountTeam: string;
  rivalTeams: string[];
  generatedAt: string;
}

// Types for Overbet format
interface OverbetData {
  slides: TargetAvoidSlide[];
  caption: string;
  league: string;
  accountTeam: string;
  rivalTeam: string;
  generatedAt: string;
}

// Types for Player Props format
interface PlayerPropsSlide extends TargetAvoidSlide {
  isProp?: boolean;
  propData?: {
    playerName: string;
    propType: string;
    line: number;
    matchup: string;
  };
}

interface PlayerPropsData {
  slides: PlayerPropsSlide[];
  caption: string;
  league: string;
  teamCode: string | null;
  propsCount: number;
  generatedAt: string;
}

// Types for Bet Apps format
interface BetAppsHook {
  text: string;
  image: string;
}

interface BetAppsSlide {
  categoryId: string;
  categoryLabel: string;
  appId: string;
  appName: string;
  image: string;
  overlayText: string;
}

interface BetAppsData {
  hook: BetAppsHook;
  slides: BetAppsSlide[];
  caption: string;
  sport?: string;
  generatedAt: string;
}

// Sports available for Bet Apps format
const BET_APPS_SPORTS = [
  { code: "NFL", name: "NFL Football" },
  { code: "NBA", name: "NBA Basketball" },
  { code: "MLB", name: "MLB Baseball" },
  { code: "UFC", name: "UFC / MMA" },
  { code: "SOCCER", name: "Soccer / Football" },
];

// Types for Lastr format (stamina/confidence content)
interface LastrSlide {
  screenNumber: number;
  imagePath: string;
  textOverlay: string[];
  isHook?: boolean;
  isCTA?: boolean;
}

interface LastrData {
  slides: LastrSlide[];
  caption: string;
  route: string;
  generatedAt: string;
}

// Route options for Lastr format
const LASTR_ROUTES = [
  { code: "tips", name: "Tips (Instructive)" },
  { code: "story", name: "Story (Emotional)" },
  { code: "reasons", name: "Reasons (Reflective)" },
  { code: "myth", name: "Myth Buster (Educational)" },
  { code: "killing", name: "Killing You (Wake-up)" },
  { code: "pov", name: "POV (Aspirational)" },
];

interface ProfileData {
  name: string;
  username: string;
  bio: string;
  profilePicUrl: string;
}


interface SlideshowGeneratorProps {
  embedded?: boolean;
}

const SlideshowGenerator = ({ embedded = false }: SlideshowGeneratorProps) => {
  const navigate = useNavigate();
  const { isAccountManager } = useUserRole();
  const { assignments: teamAssignments } = useAMTeamAssignments();

  // Filter state
  const [format, setFormat] = useState("lastr");
  const [league, setLeague] = useState("");
  const [team, setTeam] = useState("");
  const [betAppsSport, setBetAppsSport] = useState("");
  const [lastrRoute, setLastrRoute] = useState("");

  // Output state
  const [targetAvoidData, setTargetAvoidData] = useState<TargetAvoidData | null>(null);
  const [betAppsData, setBetAppsData] = useState<BetAppsData | null>(null);
  const [fraudWatchData, setFraudWatchData] = useState<FraudWatchData | null>(null);
  const [overbetData, setOverbetData] = useState<OverbetData | null>(null);
  const [playerPropsData, setPlayerPropsData] = useState<PlayerPropsData | null>(null);
  const [lastrData, setLastrData] = useState<LastrData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);

  // Get all teams for a league
  const getAllTeamsForLeague = (leagueCode: string) => {
    if (leagueCode === "NFL") return NFL_TEAMS;
    if (leagueCode === "NBA") return NBA_TEAMS;
    if (leagueCode === "SOCCER") return SOCCER_TEAMS;
    return [];
  };

  // Get available leagues based on AM's team assignments
  const availableLeagues = useMemo(() => {
    const allLeagues = [
      { code: "NFL", name: "NFL Football" },
      { code: "NBA", name: "NBA Basketball" },
      { code: "SOCCER", name: "Soccer / Football" },
    ];

    // If not an AM or no assignments, show all leagues
    if (!isAccountManager || teamAssignments.length === 0) {
      return allLeagues;
    }

    // Filter to only show leagues the AM has teams assigned in
    const assignedLeagues = [...new Set(teamAssignments.map((a) => a.league))];
    return allLeagues.filter((l) => assignedLeagues.includes(l.code));
  }, [isAccountManager, teamAssignments]);

  // Get teams based on selected league - filter by assignments for AMs
  const availableTeams = useMemo(() => {
    const allTeams = getAllTeamsForLeague(league);

    // If not an AM or no assignments, show all teams
    if (!isAccountManager || teamAssignments.length === 0) {
      return allTeams;
    }

    // Filter to only show assigned teams for this league
    const assignedCodes = teamAssignments
      .filter((a) => a.league === league)
      .map((a) => a.team_code);

    return allTeams.filter((t) => assignedCodes.includes(t.code));
  }, [league, isAccountManager, teamAssignments]);

  // Reset team when league changes
  const handleLeagueChange = (value: string) => {
    setLeague(value);
    setTeam("");
  };

  // Reset filters when format changes
  const handleFormatChange = (value: string) => {
    setFormat(value);
    setLeague("");
    setTeam("");
    setBetAppsSport("");
    setLastrRoute("");
  };

  // Check if generate button should be enabled
  // FraudWatch and Overbet require both league AND team
  // Player Props requires league (team is optional)
  // Lastr works without any selection (route is optional)
  const canGenerate = format === "bet-apps" ||
    format === "lastr" ||
    (format === "target-avoid" && league) ||
    (format === "fraudwatch" && league && team) ||
    (format === "overbet" && league && team) ||
    (format === "player-props" && league);

  const handleGeneratePost = async () => {
    if (format === "target-avoid" && !league) {
      toast.error("Please select a league");
      return;
    }
    if (format === "fraudwatch" && (!league || !team)) {
      toast.error("Please select a sport and team for FraudWatch");
      return;
    }
    if (format === "overbet" && (!league || !team)) {
      toast.error("Please select a sport and team for Overbet");
      return;
    }
    if (format === "player-props" && !league) {
      toast.error("Please select a sport for Player Props");
      return;
    }

    setIsGeneratingPost(true);
    setProfileData(null);
    setTargetAvoidData(null);
    setBetAppsData(null);
    setFraudWatchData(null);
    setOverbetData(null);
    setPlayerPropsData(null);
    setLastrData(null);

    try {
      if (format === "target-avoid") {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-slideshow`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ format, league, team: team || undefined, playerCount: 6 }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate slideshow');
        }

        const data = await response.json();
        setTargetAvoidData(data);
      } else if (format === "bet-apps") {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-bet-apps`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ sport: betAppsSport || undefined }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate slideshow');
        }

        const data = await response.json();
        setBetAppsData(data);
      } else if (format === "fraudwatch") {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-fraudwatch`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ league, team }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate FraudWatch');
        }

        const data = await response.json();
        setFraudWatchData(data);
      } else if (format === "overbet") {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-overbet`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ league, team }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate Overbet');
        }

        const data = await response.json();
        setOverbetData(data);
      } else if (format === "player-props") {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-player-props`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ league, teamCode: team || undefined }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate Player Props');
        }

        const data = await response.json();
        setPlayerPropsData(data);
      } else if (format === "lastr") {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lastr-slideshow`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ route: lastrRoute || undefined }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate Lastr slideshow');
        }

        const data = await response.json();
        setLastrData(data);
      }

      toast.success("Slideshow generated successfully!");
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || "Failed to generate slideshow");
    } finally {
      setIsGeneratingPost(false);
    }
  };

  const handleGenerateProfile = async () => {
    setIsGeneratingProfile(true);
    setTargetAvoidData(null);
    setBetAppsData(null);
    setFraudWatchData(null);
    setOverbetData(null);
    setPlayerPropsData(null);
    setLastrData(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate profile');
      }

      const data = await response.json();
      setProfileData(data);
      toast.success("Profile generated successfully!");
    } catch (error: any) {
      console.error('Profile generation error:', error);
      toast.error(error.message || "Failed to generate profile");
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleDownloadImage = async (imageUrl: string, label: string) => {
    try {
      toast.success(`Downloading ${label}...`);

      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${label.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab if download fails
      window.open(imageUrl, "_blank");
      toast.error("Couldn't download directly. Opening in new tab.");
    }
  };

  const handleDownloadProfilePic = async () => {
    if (profileData?.profilePicUrl) {
      await handleDownloadImage(profileData.profilePicUrl, "profile_picture");
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === "Overview") {
      navigate("/dashboard");
    } else if (tab === "Calendar") {
      navigate("/dashboard/calendar");
    } else if (tab === "Account") {
      navigate("/dashboard/account");
    }
  };

  // Get description based on format
  const formatDescription = format === "bet-apps"
    ? betAppsSport
      ? `1 hook + 4 app slides + ${betAppsSport} app — sport-specific content ready to post`
      : "1 hook + 5 app slides with overlay text and caption — ready to post"
    : format === "fraudwatch"
    ? "1 hook + 5-6 'fraud' player slides from rival teams + CTA — ragebait content"
    : format === "overbet"
    ? "1 hook + 6 'overbet' players (your team + rivals) + CTA — betting ragebait"
    : format === "player-props"
    ? "1 hook + 4 player prop lines (O/U quiz) + CTA — engaging prop content"
    : format === "lastr"
    ? lastrRoute === "tips"
      ? "1 hook + 5 instructive slides + CTA — actionable stamina tips"
      : lastrRoute === "story"
      ? "1 hook + 5 emotional slides + CTA — relatable confidence journey"
      : "1 hook + 5 AI-generated slides + CTA — stamina/confidence content"
    : "1 hook + 6 player slides with text overlays and caption — ready to post";

  const content = (
    <div className={embedded ? "" : "animate-fade-in-up px-4 md:px-6 py-6 max-w-7xl mx-auto"}>
      {!embedded && (
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Slideshow Generator
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Generate ready-to-post slideshows for TikTok & Instagram in seconds
          </p>
        </div>
      )}

        <div className="glass-card p-6 md:p-8 mb-4">
          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Select value={format} onValueChange={handleFormatChange}>
              <SelectTrigger className="w-44 bg-secondary/50 border-border/50">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {/* Bet.AI formats - commented out but kept for reference
                <SelectItem value="target-avoid">Target/Avoid</SelectItem>
                <SelectItem value="bet-apps">Best Betting Apps</SelectItem>
                <SelectItem value="fraudwatch">FraudWatch</SelectItem>
                <SelectItem value="overbet">Most Overbet</SelectItem>
                <SelectItem value="player-props">Player Props</SelectItem>
                */}
                <SelectItem value="lastr">Lastr (Stamina)</SelectItem>
              </SelectContent>
            </Select>

            {/* Bet.AI format filters - commented out but kept for reference
            {format === "target-avoid" && (
              <>
                <Select value={league} onValueChange={handleLeagueChange}>
                  <SelectTrigger className="w-48 bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {availableLeagues.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={team} onValueChange={setTeam} disabled={!league}>
                  <SelectTrigger className="w-48 bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Team (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {availableTeams.map((t) => (
                      <SelectItem key={t.code} value={t.code}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {format === "bet-apps" && (
              <Select value={betAppsSport} onValueChange={setBetAppsSport}>
                <SelectTrigger className="w-48 bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Sport (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {BET_APPS_SPORTS.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {format === "fraudwatch" && (
              <>
                <Select value={league} onValueChange={handleLeagueChange}>
                  <SelectTrigger className="w-48 bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {availableLeagues.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={team} onValueChange={setTeam} disabled={!league}>
                  <SelectTrigger className="w-48 bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Your Team (required)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {availableTeams.map((t) => (
                      <SelectItem key={t.code} value={t.code}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {format === "overbet" && (
              <>
                <Select value={league} onValueChange={handleLeagueChange}>
                  <SelectTrigger className="w-48 bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {availableLeagues.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={team} onValueChange={setTeam} disabled={!league}>
                  <SelectTrigger className="w-48 bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Your Team (required)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {availableTeams.map((t) => (
                      <SelectItem key={t.code} value={t.code}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {format === "player-props" && (
              <>
                <Select value={league} onValueChange={handleLeagueChange}>
                  <SelectTrigger className="w-48 bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="NBA">NBA Basketball</SelectItem>
                    <SelectItem value="NFL">NFL Football</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={team} onValueChange={setTeam} disabled={!league}>
                  <SelectTrigger className="w-48 bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Team (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {availableTeams.map((t) => (
                      <SelectItem key={t.code} value={t.code}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            */}

            {format === "lastr" && (
              <Select value={lastrRoute} onValueChange={setLastrRoute}>
                <SelectTrigger className="w-48 bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Route (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {LASTR_ROUTES.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-6 text-center border border-primary/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI-Powered Generation</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDescription}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="w-full sm:w-auto min-w-[200px] gap-2 bg-primary hover:bg-primary/90"
              onClick={handleGeneratePost}
              disabled={isGeneratingPost || !canGenerate}
            >
              {isGeneratingPost ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Post
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto min-w-[200px] gap-2"
              onClick={handleGenerateProfile}
              disabled={isGeneratingProfile}
            >
              {isGeneratingProfile ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <UserCircle className="w-4 h-4" />
                  Generate Profile
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Bet.AI Output Sections - disabled but kept for reference */}
        {false && targetAvoidData && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Audio Links Card */}
            {(targetAvoidData.tiktokAudioUrl || targetAvoidData.instagramAudioUrl) && (
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Music className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Audio Tracks</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {targetAvoidData.tiktokAudioUrl && (
                    <a
                      href={targetAvoidData.tiktokAudioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors group"
                    >
                      <span className="text-sm text-foreground">TikTok Audio</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  )}
                  {targetAvoidData.instagramAudioUrl && (
                    <a
                      href={targetAvoidData.instagramAudioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors group"
                    >
                      <span className="text-sm text-foreground">Instagram Audio</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Slides Grid */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Slides ({targetAvoidData.slides.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {targetAvoidData.slides.map((slide) => (
                  <div key={slide.screenNumber} className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        slide.isHook ? 'bg-primary/20 text-primary' :
                        slide.isCTA ? 'bg-blue-500/20 text-blue-400' :
                        slide.textOverlay[0] === 'TARGET' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {slide.isHook ? "Hook" : slide.isCTA ? "CTA" : slide.textOverlay[0]}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                        onClick={() => copyToClipboard(slide.isCTA ? slide.textOverlay[1] : slide.textOverlay.join("\n"), "Text")}
                      >
                        <Copy className="w-3 h-3" />
                        Copy Text
                      </Button>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={slide.imagePath}
                          alt={slide.isCTA ? "Bet.AI" : "Player"}
                          className="w-56 h-72 object-cover rounded-lg bg-secondary/50"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full mt-2 h-7 text-xs gap-1"
                          onClick={() => handleDownloadImage(slide.imagePath, `Screen ${slide.screenNumber}`)}
                          disabled={!slide.imagePath || (!slide.isCTA && slide.imagePath.startsWith('/slides/'))}
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                      </div>

                      <div className="flex-1 flex flex-col justify-center space-y-1">
                        {slide.isHook ? (
                          <p className="text-foreground font-semibold text-base">{slide.textOverlay[0]}</p>
                        ) : slide.isCTA ? (
                          <p className="text-foreground font-semibold text-base">{slide.textOverlay[1]}</p>
                        ) : (
                          <>
                            <p className="text-foreground font-semibold text-base">{slide.textOverlay[1]}</p>
                            {slide.textOverlay.slice(2).map((text, idx) => (
                              <p key={idx} className="text-sm text-muted-foreground">• {text}</p>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caption Card */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Caption</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                  onClick={() => copyToClipboard(targetAvoidData.caption, "Caption")}
                >
                  <Copy className="w-3 h-3" />
                  Copy Caption
                </Button>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                <p className="text-foreground whitespace-pre-line text-sm">{targetAvoidData.caption}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bet Apps Output */}
        {false && betAppsData && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Hook + Slides Grid */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Slides (1 hook + {betAppsData.slides.length} apps)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Hook Slide */}
                <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2 py-1 rounded font-medium bg-primary/20 text-primary">
                      Hook
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                      onClick={() => copyToClipboard(betAppsData.hook.text, "Hook text")}
                    >
                      <Copy className="w-3 h-3" />
                      Copy Text
                    </Button>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={betAppsData.hook.image}
                        alt="Hook"
                        className="w-56 h-72 object-cover rounded-lg bg-secondary/50"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full mt-2 h-7 text-xs gap-1"
                        onClick={() => handleDownloadImage(betAppsData.hook.image, "Hook")}
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-foreground font-semibold text-base">{betAppsData.hook.text}</p>
                    </div>
                  </div>
                </div>

                {/* App Slides */}
                {betAppsData.slides.map((slide) => (
                  <div key={slide.appId} className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${slide.appId === 'betai' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {slide.categoryLabel}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                        onClick={() => copyToClipboard(slide.overlayText, "Slide text")}
                      >
                        <Copy className="w-3 h-3" />
                        Copy Text
                      </Button>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={slide.image}
                          alt={slide.appName}
                          className="w-56 h-72 object-cover rounded-lg bg-secondary/50"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full mt-2 h-7 text-xs gap-1"
                          onClick={() => handleDownloadImage(slide.image, slide.appName)}
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                      </div>

                      <div className="flex-1 flex flex-col justify-center">
                        <p className="text-foreground font-semibold text-base">{slide.overlayText}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caption Card */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Caption</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                  onClick={() => copyToClipboard(betAppsData.caption, "Caption")}
                >
                  <Copy className="w-3 h-3" />
                  Copy Caption
                </Button>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                <p className="text-foreground whitespace-pre-line text-sm">{betAppsData.caption}</p>
              </div>
            </div>
          </div>
        )}

        {/* FraudWatch Output */}
        {false && fraudWatchData && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Slides Grid */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">FraudWatch Slides ({fraudWatchData.slides.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {fraudWatchData.slides.map((slide) => (
                  <div key={slide.screenNumber} className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        slide.isHook ? 'bg-primary/20 text-primary' :
                        slide.isCTA ? 'bg-blue-500/20 text-blue-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {slide.isHook ? "Hook" : slide.isCTA ? "CTA" : "FRAUD"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                        onClick={() => copyToClipboard(slide.isCTA ? slide.textOverlay[1] : slide.textOverlay.slice(2).join("\n"), "Text")}
                      >
                        <Copy className="w-3 h-3" />
                        Copy Text
                      </Button>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={slide.imagePath}
                          alt={slide.isCTA ? "Bet.AI" : "Player"}
                          className="w-56 h-72 object-cover rounded-lg bg-secondary/50"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full mt-2 h-7 text-xs gap-1"
                          onClick={() => handleDownloadImage(slide.imagePath, `Screen ${slide.screenNumber}`)}
                          disabled={!slide.imagePath || (!slide.isCTA && slide.imagePath.startsWith('/slides/'))}
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                      </div>

                      <div className="flex-1 flex flex-col justify-center space-y-1">
                        {slide.isHook ? (
                          <p className="text-foreground font-semibold text-base">{slide.textOverlay[0]}</p>
                        ) : slide.isCTA ? (
                          <p className="text-foreground font-semibold text-base">{slide.textOverlay[1]}</p>
                        ) : (
                          <>
                            <p className="text-foreground font-semibold text-base">{slide.textOverlay[1]}</p>
                            {slide.textOverlay.slice(2).map((text, idx) => (
                              <p key={idx} className="text-sm text-muted-foreground">• {text}</p>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caption Card */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Caption</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                  onClick={() => copyToClipboard(fraudWatchData.caption, "Caption")}
                >
                  <Copy className="w-3 h-3" />
                  Copy Caption
                </Button>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                <p className="text-foreground whitespace-pre-line text-sm">{fraudWatchData.caption}</p>
              </div>
            </div>
          </div>
        )}

        {/* Overbet Output */}
        {false && overbetData && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Slides Grid */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Overbet Slides ({overbetData.slides.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {overbetData.slides.map((slide) => (
                  <div key={slide.screenNumber} className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        slide.isHook ? 'bg-primary/20 text-primary' :
                        slide.isCTA ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {slide.isHook ? "Hook" : slide.isCTA ? "CTA" : "OVERBET"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                        onClick={() => copyToClipboard(slide.isCTA ? slide.textOverlay[1] : slide.textOverlay.slice(2).join("\n"), "Text")}
                      >
                        <Copy className="w-3 h-3" />
                        Copy Text
                      </Button>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={slide.imagePath}
                          alt={slide.isCTA ? "Bet.AI" : "Player"}
                          className="w-56 h-72 object-cover rounded-lg bg-secondary/50"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full mt-2 h-7 text-xs gap-1"
                          onClick={() => handleDownloadImage(slide.imagePath, `Screen ${slide.screenNumber}`)}
                          disabled={!slide.imagePath || (!slide.isCTA && slide.imagePath.startsWith('/slides/'))}
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                      </div>

                      <div className="flex-1 flex flex-col justify-center space-y-1">
                        {slide.isHook ? (
                          <p className="text-foreground font-semibold text-base">{slide.textOverlay[0]}</p>
                        ) : slide.isCTA ? (
                          <p className="text-foreground font-semibold text-base">{slide.textOverlay[1]}</p>
                        ) : (
                          <>
                            <p className="text-foreground font-semibold text-base">{slide.textOverlay[1]}</p>
                            {slide.textOverlay.slice(2).map((text, idx) => (
                              <p key={idx} className="text-sm text-muted-foreground">• {text}</p>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caption Card */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Caption</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                  onClick={() => copyToClipboard(overbetData.caption, "Caption")}
                >
                  <Copy className="w-3 h-3" />
                  Copy Caption
                </Button>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                <p className="text-foreground whitespace-pre-line text-sm">{overbetData.caption}</p>
              </div>
            </div>
          </div>
        )}

        {/* Player Props Output */}
        {false && playerPropsData && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Slides Grid */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Player Props Slides ({playerPropsData.slides.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {playerPropsData.slides.map((slide) => (
                  <div key={slide.screenNumber} className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        slide.isHook ? 'bg-primary/20 text-primary' :
                        slide.isCTA ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {slide.isHook ? "Hook" : slide.isCTA ? "CTA" : "PROP"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                        onClick={() => copyToClipboard(slide.textOverlay.join("\n"), "Text")}
                      >
                        <Copy className="w-3 h-3" />
                        Copy Text
                      </Button>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={slide.imagePath}
                          alt={slide.isCTA ? "Bet.AI" : slide.isHook ? "Hook" : "Player"}
                          className="w-56 h-72 object-cover rounded-lg bg-secondary/50"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full mt-2 h-7 text-xs gap-1"
                          onClick={() => handleDownloadImage(slide.imagePath, `Screen ${slide.screenNumber}`)}
                          disabled={!slide.imagePath || (!slide.isCTA && !slide.isHook && slide.imagePath.startsWith('/images/nba-players/'))}
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                      </div>

                      <div className="flex-1 flex flex-col justify-center space-y-1">
                        {slide.isHook ? (
                          <p className="text-foreground font-semibold text-base">{slide.textOverlay[0]}</p>
                        ) : slide.isCTA ? (
                          <p className="text-foreground font-semibold text-base">{slide.textOverlay[0]}</p>
                        ) : slide.propData ? (
                          <>
                            <p className="text-foreground font-semibold text-lg">{slide.propData.playerName}</p>
                            <p className="text-xl font-bold text-green-400">{slide.propData.propType}: O/U {slide.propData.line}</p>
                            <p className="text-sm text-muted-foreground">{slide.propData.matchup}</p>
                          </>
                        ) : (
                          slide.textOverlay.map((text, idx) => (
                            <p key={idx} className={idx === 0 ? "text-foreground font-semibold text-base" : "text-sm text-muted-foreground"}>
                              {text}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caption Card */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Caption</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                  onClick={() => copyToClipboard(playerPropsData.caption, "Caption")}
                >
                  <Copy className="w-3 h-3" />
                  Copy Caption
                </Button>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                <p className="text-foreground whitespace-pre-line text-sm">{playerPropsData.caption}</p>
              </div>
            </div>
          </div>
        )}
        {/* Lastr Output */}
        {lastrData && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Route Badge */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-center gap-2">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                  lastrData.route === 'tips' ? 'bg-blue-500/20 text-blue-400' :
                  lastrData.route === 'reasons' ? 'bg-amber-500/20 text-amber-400' :
                  lastrData.route === 'myth' ? 'bg-green-500/20 text-green-400' :
                  lastrData.route === 'killing' ? 'bg-red-500/20 text-red-400' :
                  lastrData.route === 'pov' ? 'bg-cyan-500/20 text-cyan-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {lastrData.route === 'tips' ? '📝 Tips Mode' :
                   lastrData.route === 'reasons' ? '💡 Reasons Mode' :
                   lastrData.route === 'myth' ? '🧠 Myth Buster Mode' :
                   lastrData.route === 'killing' ? '⚠️ Killing You Mode' :
                   lastrData.route === 'pov' ? '✨ POV Mode' :
                   '💭 Story Mode'}
                </span>
              </div>
            </div>

            {/* Slides Grid */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Slides ({lastrData.slides.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {lastrData.slides.map((slide) => (
                  <div key={slide.screenNumber} className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        slide.isHook ? 'bg-primary/20 text-primary' :
                        slide.isCTA ? 'bg-green-500/20 text-green-400' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {slide.isHook ? "Hook" : slide.isCTA ? "CTA" : `Slide ${slide.screenNumber}`}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                        onClick={() => copyToClipboard(slide.textOverlay.join("\n"), "Text")}
                      >
                        <Copy className="w-3 h-3" />
                        Copy Text
                      </Button>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={slide.imagePath}
                          alt={slide.isCTA ? "Lastr App" : slide.isHook ? "Hook" : `Slide ${slide.screenNumber}`}
                          className="w-56 h-72 object-cover rounded-lg bg-secondary/50"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full mt-2 h-7 text-xs gap-1"
                          onClick={() => handleDownloadImage(slide.imagePath, `Screen ${slide.screenNumber}`)}
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                      </div>

                      <div className="flex-1 flex flex-col justify-center space-y-1">
                        {slide.isCTA ? (
                          <div className="text-sm text-muted-foreground whitespace-pre-line max-h-48 overflow-y-auto">
                            {slide.textOverlay.join("\n")}
                          </div>
                        ) : (
                          slide.textOverlay.map((text, idx) => (
                            <p key={idx} className={idx === 0 ? "text-foreground font-semibold text-base" : "text-sm text-muted-foreground"}>
                              {text}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caption Card */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Caption</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                  onClick={() => copyToClipboard(lastrData.caption, "Caption")}
                >
                  <Copy className="w-3 h-3" />
                  Copy Caption
                </Button>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                <p className="text-foreground whitespace-pre-line text-sm">{lastrData.caption}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Output */}
        {profileData && (
          <div className="glass-card p-6 md:p-8 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-6">
              <UserCircle className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Generated Profile</h3>
            </div>

            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-24 h-24 mb-4 border-2 border-primary/20">
                <AvatarImage src={profileData.profilePicUrl} />
                <AvatarFallback className="bg-secondary text-2xl">
                  {profileData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={handleDownloadProfilePic}
              >
                <Download className="w-4 h-4" />
                Download Picture
              </Button>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Name</span>
                    <span className="text-foreground font-medium">{profileData.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => copyToClipboard(profileData.name, "Name")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Username</span>
                    <span className="text-foreground font-medium">{profileData.username}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => copyToClipboard(profileData.username, "Username")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <span className="text-xs text-muted-foreground block mb-1">Bio</span>
                    <span className="text-foreground font-medium">{profileData.bio}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary flex-shrink-0"
                    onClick={() => copyToClipboard(profileData.bio, "Bio")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-center text-muted-foreground text-sm pt-2">
                If this username is taken, simply generate a new one
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!lastrData && !profileData && (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">Ready to Create</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Select a route (optional), then click Generate Post
            </p>
          </div>
        )}
    </div>
  );

  // When embedded, just return the content without the full page wrapper
  if (embedded) {
    return content;
  }

  // Full page with navigation
  return (
    <div className="min-h-screen bg-background">
      <TabNav
        activeTab=""
        onTabChange={handleTabChange}
        onChecklistClick={() => {}}
        onContentGuideClick={() => {}}
        onSubmitPostClick={() => {}}
      />
      <main>
        {content}
      </main>
    </div>
  );
};

export default SlideshowGenerator;
