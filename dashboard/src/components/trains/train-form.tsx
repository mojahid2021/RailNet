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
import { Checkbox } from "@/components/ui/checkbox";
import { Train, CreateTrainRequest, UpdateTrainRequest } from "@/types";
import { useTrainRoutes } from "@/hooks/use-train-routes";
import { useCompartments } from "@/hooks/use-compartments";

interface TrainFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTrainRequest | UpdateTrainRequest) => Promise<boolean>;
  initialData?: Train | null;
  mode: "create" | "edit";
}

const TRAIN_TYPES = [
  { value: "INTERCITY", label: "Intercity" },
  { value: "MAIL_EXPRESS", label: "Mail/Express" },
  { value: "LOCAL", label: "Local" },
  { value: "SPECIAL", label: "Special" },
  { value: "FREIGHT", label: "Freight" },
];

export function TrainForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: TrainFormProps) {
  const { trainRoutes: availableRoutes, fetchTrainRoutes: fetchRoutes } = useTrainRoutes();
  const { compartments: availableCompartments, fetchCompartments } = useCompartments();
  const [loading, setLoading] = useState(false);

  // Fetch dependencies on mount
  useEffect(() => {
    fetchRoutes();
    fetchCompartments();
  }, [fetchRoutes, fetchCompartments]);

  const [formData, setFormData] = useState<CreateTrainRequest>({
    name: "",
    number: "",
    type: "",
    trainRouteId: "",
    compartmentIds: [],
  });

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        name: initialData.name,
        number: initialData.number,
        type: initialData.type,
        trainRouteId: initialData.trainRouteId || "",
        compartmentIds: initialData.compartments.map((c) => c.compartment.id),
      });
    } else {
      setFormData({
        name: "",
        number: "",
        type: "",
        trainRouteId: "",
        compartmentIds: [],
      });
    }
  }, [initialData, mode, open]);

  const handleChange = (field: keyof CreateTrainRequest, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompartmentToggle = (compartmentId: string) => {
    setFormData((prev) => {
      const currentIds = prev.compartmentIds || [];
      const newIds = currentIds.includes(compartmentId)
        ? currentIds.filter((id) => id !== compartmentId)
        : [...currentIds, compartmentId];
      return { ...prev, compartmentIds: newIds };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await onSubmit(formData);
    setLoading(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Train" : "Edit Train"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new train to the system."
              : "Update the details of the existing train."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Train Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Suborno Express"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="number">Train Number</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => handleChange("number", e.target.value)}
                  placeholder="e.g., 701"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAIN_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="route">Route</Label>
                <Select
                  value={formData.trainRouteId}
                  onValueChange={(value) => handleChange("trainRouteId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoutes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Compartments</Label>
              <div className="flex flex-wrap gap-2 border p-3 rounded-md min-h-[60px]">
                {availableCompartments.length === 0 ? (
                  <span className="text-sm text-muted-foreground">Loading compartments...</span>
                ) : (
                  availableCompartments.map((compartment) => (
                    <div key={compartment.id} className="flex items-center space-x-2 bg-muted/50 px-3 py-1 rounded-full">
                      <Checkbox
                        id={`comp-${compartment.id}`}
                        checked={formData.compartmentIds?.includes(compartment.id)}
                        onCheckedChange={() => handleCompartmentToggle(compartment.id)}
                      />
                      <Label htmlFor={`comp-${compartment.id}`} className="cursor-pointer text-sm font-medium">
                        {compartment.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Train"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
