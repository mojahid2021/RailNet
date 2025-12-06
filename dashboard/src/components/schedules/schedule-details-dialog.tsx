import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { MapPin, Clock, Calendar, Train as TrainIcon, Loader2 } from "lucide-react";
import { useSchedule } from "@/hooks/use-schedules";

interface ScheduleDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string | null;
}

export function ScheduleDetailsDialog({
  open,
  onOpenChange,
  scheduleId,
}: ScheduleDetailsDialogProps) {
  const { data: schedule, isLoading, error } = useSchedule(scheduleId || "");

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrainIcon className="h-5 w-5" />
            {isLoading ? "Loading..." : `${schedule?.train?.name} (${schedule?.train?.number})`}
          </DialogTitle>
          <DialogDescription>
            Schedule Details and Station Timings
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-destructive text-center py-8">
            Failed to load schedule details.
          </div>
        ) : schedule ? (
          <div className="grid gap-6 py-4">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date:</span>
                <span>
                  {schedule.date
                    ? format(new Date(schedule.date), "PPP")
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Time:</span>
                <span>
                  {schedule.time || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Route:</span>
                <span>{schedule.trainRoute?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={schedule.status === "scheduled" ? "default" : "secondary"}>
                  {schedule.status || "Scheduled"}
                </Badge>
              </div>
            </div>

            {/* Station Timeline */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium leading-none">Station Schedule</h4>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="relative space-y-6">
                  {schedule.stationTimes?.map((stop, index) => (
                    <div key={stop.id} className="relative pl-6">
                      {/* Timeline Line */}
                      {index < (schedule.stationTimes?.length || 0) - 1 && (
                        <div className="absolute left-[5px] top-2 h-full w-0.5 bg-border" />
                      )}
                      {/* Timeline Dot */}
                      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full border border-primary bg-background" />
                      
                      <div className="grid gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {stop.station?.name || "Unknown Station"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Stop {stop.sequence}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">Arr:</span>{" "}
                            {stop.arrivalTime
                              ? format(new Date(stop.arrivalTime), "p")
                              : "-"}
                          </div>
                          <div>
                            <span className="font-medium">Dep:</span>{" "}
                            {stop.departureTime
                              ? format(new Date(stop.departureTime), "p")
                              : "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
