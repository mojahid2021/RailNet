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

export function TrainForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: TrainFormProps) {
  const { data: availableRoutes = [] } = useTrainRoutes();
  const { data: availableCompartments = [] } = useCompartments();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateTrainRequest>({
    name: "",
    number: "",
    trainRouteId: 0,
    compartments: [],
  });

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        name: initialData.name,
        number: initialData.number,
        trainRouteId: initialData.trainRouteId || 0,
        compartments: initialData.compartments.map((c) => ({
          compartmentId: parseInt(c.compartment.id),
          quantity: c.quantity || 1, // Assuming quantity might be available in future or default to 1
        })),
      });
    } else {
      setFormData({
        name: "",
        number: "",
        trainRouteId: 0,
        compartments: [],
      });
    }
  }, [initialData, mode, open]);

  const handleChange = (field: keyof CreateTrainRequest, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompartmentToggle = (compartmentIdStr: string) => {
    const compartmentId = parseInt(compartmentIdStr);
    setFormData((prev) => {
      const currentCompartments = prev.compartments || [];
      const exists = currentCompartments.some((c) => c.compartmentId === compartmentId);
      
      let newCompartments;
      if (exists) {
        newCompartments = currentCompartments.filter((c) => c.compartmentId !== compartmentId);
      } else {
        newCompartments = [...currentCompartments, { compartmentId, quantity: 1 }];
      }
      return { ...prev, compartments: newCompartments };
    });
  };

  const handleQuantityChange = (compartmentIdStr: string, quantity: number) => {
    const compartmentId = parseInt(compartmentIdStr);
    setFormData((prev) => {
      const currentCompartments = prev.compartments || [];
      const newCompartments = currentCompartments.map((c) => 
        c.compartmentId === compartmentId ? { ...c, quantity } : c
      );
      return { ...prev, compartments: newCompartments };
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
                <Label htmlFor="route">Route</Label>
                <Select
                  value={formData.trainRouteId ? formData.trainRouteId.toString() : ""}
                  onValueChange={(value) => handleChange("trainRouteId", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoutes.map((route) => (
                      <SelectItem key={route.id} value={route.id.toString()}>
                        {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Compartments</Label>
              <div className="space-y-3 border p-3 rounded-md min-h-[60px]">
                {availableCompartments.length === 0 ? (
                  <span className="text-sm text-muted-foreground">Loading compartments...</span>
                ) : (
                  availableCompartments.map((compartment) => {
                    const isSelected = formData.compartments?.some(c => c.compartmentId === parseInt(compartment.id));
                    const currentQty = formData.compartments?.find(c => c.compartmentId === parseInt(compartment.id))?.quantity || 1;

                    return (
                      <div key={compartment.id} className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`comp-${compartment.id}`}
                            checked={isSelected}
                            onCheckedChange={() => handleCompartmentToggle(compartment.id)}
                          />
                          <Label htmlFor={`comp-${compartment.id}`} className="cursor-pointer text-sm font-medium">
                            {compartment.name} ({compartment.class})
                          </Label>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`qty-${compartment.id}`} className="text-xs text-muted-foreground">Qty:</Label>
                            <Input 
                              id={`qty-${compartment.id}`}
                              type="number" 
                              min="1" 
                              className="w-16 h-8"
                              value={currentQty}
                              onChange={(e) => handleQuantityChange(compartment.id, parseInt(e.target.value) || 1)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
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
