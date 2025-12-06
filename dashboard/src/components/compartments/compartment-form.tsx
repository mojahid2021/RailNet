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
import { Compartment, CreateCompartmentRequest, UpdateCompartmentRequest } from "@/types";

interface CompartmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCompartmentRequest | UpdateCompartmentRequest) => Promise<boolean>;
  initialData?: Compartment | null;
  mode: "create" | "edit";
}

const COMPARTMENT_TYPES = [
  { value: "AC_SLEEPER", label: "AC Sleeper" },
  { value: "AC_CHAIR", label: "AC Chair" },
  { value: "NON_AC_SLEEPER", label: "Non-AC Sleeper" },
  { value: "NON_AC_CHAIR", label: "Non-AC Chair" },
  { value: "FIRST_CLASS", label: "First Class" },
  { value: "ECONOMY", label: "Economy" },
];

export function CompartmentForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: CompartmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCompartmentRequest>({
    name: "",
    class: "",
    type: "",
    price: 0,
    totalSeats: 0,
  });

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        name: initialData.name,
        class: initialData.class,
        type: initialData.type,
        price: initialData.price,
        totalSeats: initialData.totalSeats,
      });
    } else {
      setFormData({
        name: "",
        class: "",
        type: "",
        price: 0,
        totalSeats: 0,
      });
    }
  }, [initialData, mode, open]);

  const handleChange = (field: keyof CreateCompartmentRequest, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Compartment" : "Edit Compartment"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new compartment type to the system."
              : "Update the details of the existing compartment."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., AC Sleeper"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="class">Class</Label>
              <Input
                id="class"
                value={formData.class}
                onChange={(e) => handleChange("class", e.target.value)}
                placeholder="e.g., First, Second"
                required
              />
            </div>
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
                  {COMPARTMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="totalSeats">Total Seats</Label>
                <Input
                  id="totalSeats"
                  type="number"
                  min="0"
                  value={formData.totalSeats}
                  onChange={(e) => handleChange("totalSeats", parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Compartment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
