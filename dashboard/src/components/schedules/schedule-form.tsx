"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateScheduleRequest, CreateStationScheduleRequest, Train, TrainRoute } from "@/types";
import { useTrains } from "@/hooks/use-trains";
import { fetchTrainRoute } from "@/hooks/use-train-routes";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDown, Clock } from "lucide-react";

interface ScheduleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateScheduleRequest) => Promise<boolean>;
  mode: "create" | "edit"; // Currently only create is fully supported
}

export function ScheduleForm({
  open,
  onOpenChange,
  onSubmit,
  mode,
}: ScheduleFormProps) {
  const { data: trains = [] } = useTrains();
  const [loading, setLoading] = useState(false);

  const [selectedTrainId, setSelectedTrainId] = useState<string>("");
  const [departureTime, setDepartureTime] = useState<string>(""); // New field for API
  const [selectedRoute, setSelectedRoute] = useState<TrainRoute | null>(null);
  const [stationSchedules, setStationSchedules] = useState<CreateStationScheduleRequest[]>([]);

  useEffect(() => {
    if (open) {
      // Reset form
      setSelectedTrainId("");
      setDepartureTime("");
      setSelectedRoute(null);
      setStationSchedules([]);
    }
  }, [open]);

  const handleTrainChange = async (trainId: string) => {
    setSelectedTrainId(trainId);
    const train = trains.find((t) => t.id === trainId);
    if (train && train.trainRouteId) {
      const route = await fetchTrainRoute(train.trainRouteId);
      if (route) {
        setSelectedRoute(route);
        // Initialize station schedules based on route stations
        const initialSchedules: CreateStationScheduleRequest[] = route.stations.map((s) => ({
          stationId: s.currentStation?.id || s.currentStationId,
          estimatedArrival: "",
          estimatedDeparture: "",
          platformNumber: "",
          remarks: "",
        }));
        setStationSchedules(initialSchedules);
      } else {
        setSelectedRoute(null);
        setStationSchedules([]);
      }
    } else {
      setSelectedRoute(null);
      setStationSchedules([]);
    }
  };

  const handleStationScheduleChange = (
    index: number,
    field: keyof CreateStationScheduleRequest,
    value: string
  ) => {
    const newSchedules = [...stationSchedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setStationSchedules(newSchedules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!selectedTrainId || !departureTime) {
      alert("Please select a train and time.");
      setLoading(false);
      return;
    }

    // Ensure dates are in ISO format if they are just time strings or local dates
    // The backend expects ISO strings. The inputs might be datetime-local.
    // We need to make sure they are properly formatted.
    
    // For simplicity, assuming inputs are datetime-local which return "YYYY-MM-DDTHH:mm"
    // We can append ":00.000Z" or convert to ISO string.
    // Let's assume the user picks a valid date/time.

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const formattedSchedules = stationSchedules.map(s => ({
      ...s,
      estimatedArrival: s.estimatedArrival ? new Date(`${today}T${s.estimatedArrival}`).toISOString() : new Date(`${today}T${departureTime}`).toISOString(),
      estimatedDeparture: s.estimatedDeparture ? new Date(`${today}T${s.estimatedDeparture}`).toISOString() : new Date(`${today}T${departureTime}`).toISOString(),
    }));

    const payload: CreateScheduleRequest = {
      trainId: selectedTrainId,
      departureTime: departureTime,
      stationSchedules: formattedSchedules,
    };

    const success = await onSubmit(payload);
    setLoading(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Schedule</DialogTitle>
          <DialogDescription>
            Set the schedule for a train including arrival and departure times for each station.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="train">Train</Label>
                <Select value={selectedTrainId} onValueChange={handleTrainChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select train" />
                  </SelectTrigger>
                  <SelectContent>
                    {trains.map((train) => (
                      <SelectItem key={train.id} value={train.id}>
                        {train.name} ({train.number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="departureTime">Departure Time</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {selectedRoute && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Station Schedule ({selectedRoute.name})</Label>
                </div>
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-6">
                    {selectedRoute.stations.map((station, index) => (
                      <div key={station.id} className="relative">
                        {index > 0 && (
                          <div className="absolute left-4 -top-6 h-6 w-0.5 bg-border" />
                        )}
                        <div className="bg-muted/30 p-3 rounded-md border">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{station.currentStation?.name || "Unknown Station"}</div>
                              <div className="text-xs text-muted-foreground">
                                {index === 0 ? "Start" : index === selectedRoute.stations.length - 1 ? "End" : "Stop"} • {station.distanceFromStart} km
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-muted-foreground">Arrival</Label>
                              <Input
                                type="time"
                                className="h-8 text-xs"
                                value={stationSchedules[index]?.estimatedArrival || ""}
                                onChange={(e) => handleStationScheduleChange(index, "estimatedArrival", e.target.value)}
                                required
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-muted-foreground">Departure</Label>
                              <Input
                                type="time"
                                className="h-8 text-xs"
                                value={stationSchedules[index]?.estimatedDeparture || ""}
                                onChange={(e) => handleStationScheduleChange(index, "estimatedDeparture", e.target.value)}
                                required
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-muted-foreground">Platform</Label>
                              <Input
                                className="h-8 text-xs"
                                placeholder="e.g. 1"
                                value={stationSchedules[index]?.platformNumber || ""}
                                onChange={(e) => handleStationScheduleChange(index, "platformNumber", e.target.value)}
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-muted-foreground">Remarks</Label>
                              <Input
                                className="h-8 text-xs"
                                placeholder="Optional"
                                value={stationSchedules[index]?.remarks || ""}
                                onChange={(e) => handleStationScheduleChange(index, "remarks", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
