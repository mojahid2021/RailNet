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
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrainRoute, CreateTrainRouteRequest, UpdateTrainRouteRequest, CreateRouteStationRequest } from "@/types";
import { useStations } from "@/hooks/use-stations";
import { Plus, Trash2, ArrowDown } from "lucide-react";

interface TrainRouteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTrainRouteRequest | UpdateTrainRouteRequest) => Promise<boolean>;
  initialData?: TrainRoute | null;
  mode: "create" | "edit";
}

interface TempStation {
  stationId: string;
  distance: number; // Distance from previous station
}

export function TrainRouteForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: TrainRouteFormProps) {
  const { data: availableStations = [] } = useStations();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [routeStations, setRouteStations] = useState<TempStation[]>([]);

  useEffect(() => {
    if (initialData && mode === "edit") {
      setName(initialData.name);
      // Routes no longer have compartments - removed compartment loading
      // For edit, we need to map existing stations to temp structure
      // Note: Editing stations is complex and often discouraged, but we'll populate it for display
      // If the user wants to edit, they might need to recreate the sequence or we handle it carefully.
      // For now, let's populate it.
      setRouteStations(
        initialData.stations.map((s) => ({
          stationId: s.currentStationId,
          distance: s.distance,
        }))
      );
    } else {
      setName("");
      setRouteStations([{ stationId: "", distance: 0 }]); // Start with one empty station
    }
  }, [initialData, mode, open]);

  const handleAddStation = () => {
    setRouteStations([...routeStations, { stationId: "", distance: 0 }]);
  };

  const handleRemoveStation = (index: number) => {
    const newStations = [...routeStations];
    newStations.splice(index, 1);
    setRouteStations(newStations);
  };

  const handleStationChange = (index: number, field: keyof TempStation, value: string | number) => {
    const newStations = [...routeStations];
    newStations[index] = { ...newStations[index], [field]: value };
    setRouteStations(newStations);
  };

  const calculateTotalDistance = () => {
    return routeStations.reduce((acc, curr) => acc + (curr.distance || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (routeStations.length < 2) {
      alert("A route must have at least 2 stations.");
      setLoading(false);
      return;
    }
    if (routeStations.some((s) => !s.stationId)) {
      alert("All stations must be selected.");
      setLoading(false);
      return;
    }

    // Construct payload
    let payload: CreateTrainRouteRequest | UpdateTrainRouteRequest;

    if (mode === "create") {
      // Build station sequence
      let cumulativeDistance = 0;
      const stationsPayload: CreateRouteStationRequest[] = routeStations.map((s, index) => {
        cumulativeDistance += s.distance;
        return {
          currentStationId: s.stationId,
          beforeStationId: index === 0 ? null : routeStations[index - 1].stationId,
          nextStationId: index === routeStations.length - 1 ? null : routeStations[index + 1].stationId,
          distance: s.distance,
          distanceFromStart: cumulativeDistance,
        };
      });

      payload = {
        name,
        totalDistance: cumulativeDistance,
        startStationId: routeStations[0].stationId,
        endStationId: routeStations[routeStations.length - 1].stationId,
        // stations: stationsPayload, // Temporarily removed to debug API issue
      };
    } else {
      // Update mode - simplified for now, maybe just name and compartments?
      // The prompt said "Updating stations array requires more complex logic... Consider creating a new route".
      // So for edit, we might only allow updating name and compartments.
      // But let's send what we have. If the backend supports full update, great.
      // The prompt's Update Request Body example only showed name, distance, start/end, compartments.
      // It didn't show stations array. So let's stick to that for update.
      payload = {
        name,
        totalDistance: calculateTotalDistance(),
        startStationId: routeStations[0].stationId,
        endStationId: routeStations[routeStations.length - 1].stationId,
      };
    }

    const success = await onSubmit(payload);
    setLoading(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Train Route" : "Edit Train Route"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Define a new train route with stations and compartments."
              : "Update route details. Note: Changing stations might require recreating the route."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Basic Info */}
            <div className="grid gap-2">
              <Label htmlFor="name">Route Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Dhaka to Chittagong Express"
                required
              />
            </div>

            {/* Compartments - Only for Edit Mode */}
            {mode === "edit" && (
              <div className="grid gap-2">
                <Label>Compartments</Label>
                <div className="flex flex-wrap gap-2 border p-3 rounded-md min-h-[60px]">
                  <span className="text-sm text-muted-foreground">Compartments are assigned to trains, not routes.</span>
                </div>
              </div>
            )}

            {/* Stations Sequence */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Station Sequence</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddStation}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Station
                </Button>
              </div>
              
              <div className="space-y-2 border rounded-md p-4 bg-muted/10">
                {routeStations.map((station, index) => (
                  <div key={index} className="relative">
                    {index > 0 && (
                      <div className="flex justify-center py-2">
                        <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex items-end gap-3 bg-background p-3 rounded-md border shadow-sm">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          {index === 0 ? "Start Station" : index === routeStations.length - 1 ? "End Station" : `Station ${index + 1}`}
                        </Label>
                        <Select
                          value={station.stationId}
                          onValueChange={(value) => handleStationChange(index, "stationId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select station" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStations.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} ({s.city})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="w-24 space-y-1">
                        <Label className="text-xs text-muted-foreground">Dist. (km)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={station.distance}
                          onChange={(e) => handleStationChange(index, "distance", parseFloat(e.target.value) || 0)}
                          disabled={index === 0} // First station has 0 distance from previous
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveStation(index)}
                        disabled={routeStations.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right text-sm text-muted-foreground">
                Total Distance: <span className="font-medium text-foreground">{calculateTotalDistance().toFixed(1)} km</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Route"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
