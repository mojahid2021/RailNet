"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStations, useCreateStation, useUpdateStation, useDeleteStation } from "@/hooks/use-stations";
import { StationForm } from "@/components/stations/station-form";
import { Station, CreateStationRequest, UpdateStationRequest } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function StationsPage() {
  const { data: stations = [], isLoading, error } = useStations();
  const createStationMutation = useCreateStation();
  const updateStationMutation = useUpdateStation();
  const deleteStationMutation = useDeleteStation();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [deletingStationId, setDeletingStationId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingStation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (station: Station) => {
    setEditingStation(station);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingStationId(id);
  };

  const handleConfirmDelete = async () => {
    if (deletingStationId) {
      await deleteStationMutation.mutateAsync(deletingStationId);
      setDeletingStationId(null);
    }
  };

  const handleFormSubmit = async (data: CreateStationRequest | UpdateStationRequest) => {
    try {
      if (editingStation) {
        await updateStationMutation.mutateAsync({ id: editingStation.id, data: data as UpdateStationRequest });
        return true;
      } else {
        await createStationMutation.mutateAsync(data as CreateStationRequest);
        return true;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Stations</h1>
          <Button onClick={handleCreate} className="transition-all duration-200 hover:shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Add Station
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
            {error.message}
          </div>
        )}

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Station Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && stations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Loading stations...
                    </TableCell>
                  </TableRow>
                ) : stations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No stations found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  stations.map((station) => (
                    <TableRow key={station.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-primary" />
                          {station.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {station.city}, {station.district}, {station.division}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-primary transition-colors"
                            onClick={() => handleEdit(station)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-destructive transition-colors"
                            onClick={() => handleDeleteClick(station.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <StationForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingStation}
          mode={editingStation ? "edit" : "create"}
        />

        <AlertDialog open={!!deletingStationId} onOpenChange={(open) => !open && setDeletingStationId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the station.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
