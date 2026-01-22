import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface DBSportEvent {
  id: string;
  event_name: string;
  sport: string;
  event_date: string;
  event_timestamp?: number;
  home_team: string;
  away_team: string;
  venue: string | null;
  venue_city: string | null;
}

interface SportEvent {
  date: string;
  dayName: string;
  fullDate: Date;
  sports: {
    name: string;
    icon: string;
    color: string;
  }[];
  events?: DBSportEvent[]; // Actual game details
}

const sportsConfig = {
  NFL: { icon: "🏈", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  NBA: { icon: "🏀", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  Soccer: { icon: "⚽", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  MMA: { icon: "🥊", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  MLB: { icon: "⚾", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

// Helper function to format event time with local timezone
const formatEventTime = (timestamp: number | undefined, venueCity: string | null): string => {
  if (!timestamp) return '';

  const date = new Date(timestamp * 1000);
  const timeString = format(date, 'h:mm a');

  // Get timezone abbreviation based on venue city
  let timezone = 'UTC';
  if (venueCity) {
    // US cities - approximate timezone based on common knowledge
    if (['New York', 'Boston', 'Philadelphia', 'Miami', 'Atlanta', 'Detroit', 'Cleveland', 'Indianapolis', 'Charlotte', 'Jacksonville', 'Washington', 'Baltimore'].includes(venueCity)) {
      timezone = 'ET';
    } else if (['Chicago', 'Dallas', 'Houston', 'San Antonio', 'Austin', 'Memphis', 'Nashville', 'New Orleans', 'Minneapolis', 'Milwaukee', 'Kansas City', 'St. Louis'].includes(venueCity)) {
      timezone = 'CT';
    } else if (['Denver', 'Phoenix', 'Salt Lake City'].includes(venueCity)) {
      timezone = 'MT';
    } else if (['Los Angeles', 'San Francisco', 'Seattle', 'Portland', 'Las Vegas', 'Sacramento', 'San Diego', 'Oakland'].includes(venueCity)) {
      timezone = 'PT';
    }
    // European cities
    else if (['London', 'Liverpool', 'Manchester', 'Newcastle', 'Southampton', 'Brighton', 'Leicester', 'Leeds', 'Everton', 'Wolverhampton', 'Burnley', 'Brentford', 'Crystal Palace', 'Fulham', 'Bournemouth', 'Nottingham', 'Sunderland'].includes(venueCity)) {
      timezone = 'GMT';
    } else if (['Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Bilbao', 'Vigo', 'Oviedo'].includes(venueCity)) {
      timezone = 'CET';
    } else if (['Munich', 'Berlin', 'Dortmund', 'Leipzig', 'Frankfurt', 'Stuttgart', 'Bremen', 'Leverkusen', 'Mönchengladbach', 'Wolfsburg', 'Freiburg', 'Augsburg', 'Mainz', 'Hoffenheim', 'Bochum', 'Cologne'].includes(venueCity)) {
      timezone = 'CET';
    } else if (['Milan', 'Rome', 'Turin', 'Naples', 'Bergamo', 'Florence', 'Verona', 'Bologna', 'Genoa', 'Monza'].includes(venueCity)) {
      timezone = 'CET';
    }
  }

  return `${timeString} ${timezone}`;
};

const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [allEvents, setAllEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userClickedDate, setUserClickedDate] = useState(false);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    // Only scroll to date when user explicitly clicks on the calendar, not on initial load
    if (userClickedDate && selectedDate && allEvents.length > 0) {
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      const eventIndex = allEvents.findIndex(event => {
        const eventDateStr = format(event.fullDate, 'yyyy-MM-dd');
        return eventDateStr === selectedDateStr;
      });

      if (eventIndex !== -1) {
        // Expand the row for the selected date
        setExpandedRow(eventIndex);
        // Scroll to the event (using setTimeout to ensure DOM is ready)
        setTimeout(() => {
          const element = document.getElementById(`event-row-${eventIndex}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
      // Reset the flag after handling
      setUserClickedDate(false);
    }
  }, [selectedDate, allEvents, userClickedDate]);

  async function fetchUpcomingEvents() {
    try {
      setLoading(true);

      // Fetch events from the next 14 days
      const today = new Date();
      const twoWeeksFromNow = new Date(today);
      twoWeeksFromNow.setDate(today.getDate() + 14);

      const { data, error } = await supabase
        .from('sports_events')
        .select('*')
        .gte('event_date', today.toISOString())
        .lte('event_date', twoWeeksFromNow.toISOString())
        .order('event_date', { ascending: true });

      if (error) throw error;

      // Group events by date
      const groupedByDate = (data || []).reduce((acc, event) => {
        const eventDate = new Date(event.event_date);
        const dateKey = format(eventDate, 'yyyy-MM-dd');

        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(event as DBSportEvent);
        return acc;
      }, {} as Record<string, DBSportEvent[]>);

      // Transform to SportEvent format
      const sportEvents: SportEvent[] = Object.entries(groupedByDate).map(([dateKey, dayEvents]) => {
        const date = new Date(dateKey);
        const uniqueSports = Array.from(new Set(dayEvents.map(e => e.sport)));

        return {
          date: format(date, 'dd MMM').toUpperCase(),
          dayName: format(date, 'EEE').toUpperCase(),
          fullDate: date,
          sports: uniqueSports
            .map(sport => {
              const config = sportsConfig[sport as keyof typeof sportsConfig];
              if (!config) return null;
              return {
                name: sport,
                icon: config.icon,
                color: config.color,
              };
            })
            .filter((s): s is { name: string; icon: string; color: string } => s !== null),
          events: dayEvents,
        };
      });

      setAllEvents(sportEvents);
      setEvents(sportEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-4 animate-fade-in-up">
        <div className="glass-card p-4 md:p-8 text-center">
          <p className="text-muted-foreground">Loading sports events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-4 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Panel - Calendar Picker */}
        <div className="glass-card p-3 md:p-4">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-foreground font-semibold text-sm md:text-base">Select Date</h3>
            <div className="flex gap-1">
              <button className="p-1 rounded hover:bg-muted transition-colors">
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-1 rounded hover:bg-muted transition-colors">
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setUserClickedDate(true);
            }}
            className="rounded-md border-0 pointer-events-auto w-full [&_table]:w-full"
          />
        </div>

        {/* Right Panel - Events List */}
        <div className="lg:col-span-2 glass-card p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 md:mb-6">
            <h3 className="text-foreground font-semibold text-sm md:text-base">Upcoming Events</h3>
            <span className="text-xs md:text-sm text-muted-foreground">
              {(() => {
                const today = new Date();
                const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
                const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
                return `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
              })()}
            </span>
          </div>

          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No upcoming events found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Run the fetch script to populate sports events
                </p>
              </div>
            ) : (
              events.map((event, index) => (
                <div
                  key={index}
                  id={`event-row-${index}`}
                  className={cn(
                    "rounded-lg border border-border/50 overflow-hidden transition-all",
                    expandedRow === index ? "bg-muted/30" : "bg-card/50 hover:bg-muted/20"
                  )}
                >
                  <button
                    onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                    className="w-full flex items-center justify-between p-2 md:p-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <div className="text-left min-w-[70px] md:min-w-[80px]">
                        <span className="text-foreground font-medium text-sm md:text-base">{event.date}</span>
                        <span className="text-muted-foreground text-xs md:text-sm ml-1">{event.dayName}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 md:gap-2">
                        {event.sports.map((sport, sportIndex) => (
                          <span
                            key={sportIndex}
                            className={cn(
                              "px-1.5 md:px-2 py-0.5 md:py-1 rounded-md text-xs font-medium border flex items-center gap-1",
                              sport.color
                            )}
                          >
                            <span>{sport.icon}</span>
                            <span className="hidden sm:inline">{sport.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
                        expandedRow === index && "rotate-180"
                      )}
                    />
                  </button>

                  {expandedRow === index && event.events && (
                    <div className="px-3 pb-3 pt-1 border-t border-border/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {event.events.map((game) => {
                          const sportConfig = sportsConfig[game.sport as keyof typeof sportsConfig];
                          return (
                            <div
                              key={game.id}
                              className="py-2 px-3 rounded bg-background/50 border border-border/30"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-foreground">
                                  {game.home_team} vs {game.away_team}
                                </span>
                                {sportConfig && (
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1 flex-shrink-0 ml-2",
                                      sportConfig.color
                                    )}
                                  >
                                    <span>{sportConfig.icon}</span>
                                    <span>{game.sport}</span>
                                  </span>
                                )}
                              </div>
                              <div className="space-y-0.5">
                                {game.event_timestamp && (
                                  <p className="text-xs text-muted-foreground">
                                    🕐 {formatEventTime(game.event_timestamp, game.venue_city)}
                                  </p>
                                )}
                                {game.venue && (
                                  <p className="text-xs text-muted-foreground">
                                    📍 {game.venue}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
