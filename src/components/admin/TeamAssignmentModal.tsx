import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Building2, Trash2, Plus } from "lucide-react";
import { LEAGUES, TEAMS_BY_LEAGUE, type Team, type League } from "@/constants/teams";
import { useAMTeamAssignments, type TeamAssignment } from "@/hooks/useAMTeamAssignments";

interface TeamAssignmentModalProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned?: () => void;
}

const TeamAssignmentModal = ({
  userId,
  userName,
  open,
  onOpenChange,
  onAssigned,
}: TeamAssignmentModalProps) => {
  const [league, setLeague] = useState<string>("");
  const [teamCode, setTeamCode] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { assignments, loading, refetch } = useAMTeamAssignments(userId);

  // Refresh assignments when modal opens
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const availableTeams: Team[] = league ? (TEAMS_BY_LEAGUE[league as League] || []) : [];
  const selectedTeam = availableTeams.find((t) => t.code === teamCode);

  // Filter out already assigned teams
  const unassignedTeams = availableTeams.filter(
    (t) => !assignments.some((a) => a.team_code === t.code && a.league === league)
  );

  const handleAssign = async () => {
    if (!league || !teamCode || !selectedTeam) {
      toast.error("Please select a league and team");
      return;
    }

    setIsAssigning(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("am_team_assignments").insert({
        user_id: userId,
        team_name: selectedTeam.name,
        team_code: teamCode,
        league: league,
        assigned_by: user?.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("This team is already assigned to this user");
        } else {
          throw error;
        }
        return;
      }

      toast.success(`Assigned ${selectedTeam.name} to ${userName}`);
      await refetch();
      onAssigned?.();

      // Reset form
      setLeague("");
      setTeamCode("");
    } catch (error) {
      console.error("Error assigning team:", error);
      toast.error("Failed to assign team");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDelete = async (assignmentId: string, teamName: string) => {
    setIsDeleting(assignmentId);
    try {
      const { error } = await supabase
        .from("am_team_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success(`Removed ${teamName} assignment`);
      await refetch();
      onAssigned?.();
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast.error("Failed to remove assignment");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            Team Assignments for {userName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Assignments */}
          {assignments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Current Teams ({assignments.length})
              </h4>
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div>
                      <p className="font-medium text-sm">{assignment.team_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.league}
                        {assignment.tiktok_handle && (
                          <span className="ml-2">TT: @{assignment.tiktok_handle}</span>
                        )}
                        {assignment.instagram_handle && (
                          <span className="ml-2">IG: @{assignment.instagram_handle}</span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(assignment.id, assignment.team_name)}
                      disabled={isDeleting === assignment.id}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Assignment */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Team
            </h4>

            <Select
              value={league}
              onValueChange={(v) => {
                setLeague(v);
                setTeamCode("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select League" />
              </SelectTrigger>
              <SelectContent>
                {LEAGUES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={teamCode} onValueChange={setTeamCode} disabled={!league}>
              <SelectTrigger>
                <SelectValue placeholder="Select Team" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {unassignedTeams.length === 0 ? (
                  <SelectItem value="none" disabled>
                    {league ? "All teams assigned" : "Select a league first"}
                  </SelectItem>
                ) : (
                  unassignedTeams.map((t) => (
                    <SelectItem key={t.code} value={t.code}>
                      {t.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button
              onClick={handleAssign}
              disabled={isAssigning || !league || !teamCode}
              className="w-full"
            >
              {isAssigning ? "Assigning..." : "Assign Team"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamAssignmentModal;
