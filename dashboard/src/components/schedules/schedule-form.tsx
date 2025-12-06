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
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [selectedTrainId, setSelectedTrainId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<TrainRoute | null>(null);
  const [stationTimes, setStationTimes] = useState<{
    stationId: string;
    arrivalTime: string;
    departureTime: string;
  }[]>([]);

  useEffect(() => {
    if (open) {
      // Reset form
      setSelectedTrainId("");
      setDate("");
      setTime("");
      setSelectedRoute(null);
      setStationTimes([]);
      setRouteError(null);
    }
  }, [open]);

  const handleTrainChange = async (trainIdStr: string) => {
    setSelectedTrainId(trainIdStr);
    setRouteError(null);
    setSelectedRoute(null);
    setStationTimes([]);
    
    const trainId = parseInt(trainIdStr);
    const train = trains.find((t) => t.id === trainId);
    
    const routeId = train?.trainRouteId || train?.trainRoute?.id;

    if (routeId) {
      setRouteLoading(true);
      try {
        const route = await fetchTrainRoute(routeId.toString());
        if (route) {
          setSelectedRoute(route);
          // Initialize station times based on route stations
          const stationsData = route.stations || route.routeStations;
          const stations = Array.isArray(stationsData) ? stationsData : [];
          
          if (stations.length === 0) {
            setRouteError("Selected train's route has no stations assigned.");
          }

          const initialTimes = stations.map((s) => ({
            stationId: s.currentStation?.id || s.currentStationId,
            arrivalTime: "",
            departureTime: "",
          }));
          setStationTimes(initialTimes);
        } else {
          setRouteError("Failed to load route details. Please try again.");
        }
      } catch (error) {
        setRouteError("An error occurred while loading the route.");
      } finally {
        setRouteLoading(false);
      }
    } else {
      setRouteError("Selected train does not have a route assigned.");
    }
  };

  const handleStationTimeChange = (
    index: number,
    field: "arrivalTime" | "departureTime",
    value: string
  ) => {
    const newTimes = [...stationTimes];
    newTimes[index] = { ...newTimes[index], [field]: value };
    setStationTimes(newTimes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!selectedTrainId || !date || !time) {
      alert("Please select a train, date, and time.");
      setLoading(false);
      return;
    }

    if (stationTimes.length === 0) {
      alert("No stations found for this schedule.");
      setLoading(false);
      return;
    }

    // Validate all times are filled
    const allTimesFilled = stationTimes.every(st => st.arrivalTime && st.departureTime);
    if (!allTimesFilled) {
      alert("Please fill in arrival and departure times for all stations.");
      setLoading(false);
      return;
    }

    const payload: CreateScheduleRequest = {
      trainId: parseInt(selectedTrainId),
      date,
      time,
      stationTimes: stationTimes.map(st => ({
        ...st,
        stationId: parseInt(st.stationId)
      })),
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
                      <SelectItem key={train.id} value={train.id.toString()}>
                        {train.name} ({train.number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Base Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {routeLoading && (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Loading route details...
              </div>
            )}

            {routeError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {routeError}
              </div>
            )}

            {selectedRoute && !routeLoading && !routeError && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Station Schedule ({selectedRoute.name})</Label>
                </div>
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-6">
                    {(selectedRoute.stations || selectedRoute.routeStations || []).map((station, index) => (
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
                                {index === 0 ? "Start" : index === ((selectedRoute.stations || selectedRoute.routeStations || []).length - 1) ? "End" : "Stop"} • {station.distanceFromStart} km
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-muted-foreground">Arrival</Label>
                              <Input
                                type="time"
                                className="h-8 text-xs"
                                value={stationTimes[index]?.arrivalTime || ""}
                                onChange={(e) => handleStationTimeChange(index, "arrivalTime", e.target.value)}
                                required
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-muted-foreground">Departure</Label>
                              <Input
                                type="time"
                                className="h-8 text-xs"
                                value={stationTimes[index]?.departureTime || ""}
                                onChange={(e) => handleStationTimeChange(index, "departureTime", e.target.value)}
                                required
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
            <Button type="submit" disabled={loading || !!routeError || !selectedRoute}>
              {loading ? "Creating..." : "Create Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
