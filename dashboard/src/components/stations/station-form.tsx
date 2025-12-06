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
import { Station, CreateStationRequest, UpdateStationRequest } from "@/types";

interface StationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateStationRequest | UpdateStationRequest) => Promise<boolean>;
  initialData?: Station | null;
  mode: "create" | "edit";
}

export function StationForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: StationFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateStationRequest>({
    name: "",
    city: "",
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        name: initialData.name,
        city: initialData.city,
        latitude: initialData.latitude,
        longitude: initialData.longitude,
      });
    } else {
      setFormData({
        name: "",
        city: "",
        latitude: 0,
        longitude: 0,
      });
    }
  }, [initialData, mode, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "latitude" || name === "longitude" ? parseFloat(value) || 0 : value,
    }));
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
          <DialogTitle>{mode === "create" ? "Create Station" : "Edit Station"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new railway station to the system."
              : "Update the details of the existing station."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                City
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="latitude" className="text-right">
                Latitude
              </Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="longitude" className="text-right">
                Longitude
              </Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
