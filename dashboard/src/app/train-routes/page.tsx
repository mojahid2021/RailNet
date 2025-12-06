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
import { Edit, Trash2, Plus, Route as RouteIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrainRoutes, useCreateTrainRoute, useUpdateTrainRoute, useDeleteTrainRoute } from "@/hooks/use-train-routes";
import { TrainRouteForm } from "@/components/train-routes/train-route-form";
import { TrainRoute, CreateTrainRouteRequest, UpdateTrainRouteRequest } from "@/types";
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
import { Badge } from "@/components/ui/badge";

export default function TrainRoutesPage() {
  const { data: trainRoutes = [], isLoading, error } = useTrainRoutes();
  const createTrainRouteMutation = useCreateTrainRoute();
  const updateTrainRouteMutation = useUpdateTrainRoute();
  const deleteTrainRouteMutation = useDeleteTrainRoute();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TrainRoute | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingRoute(null);
    setIsFormOpen(true);
  };

  const handleEdit = (route: TrainRoute) => {
    setEditingRoute(route);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingRouteId(id);
  };

  const handleConfirmDelete = async () => {
    if (deletingRouteId) {
      await deleteTrainRouteMutation.mutateAsync(deletingRouteId);
      setDeletingRouteId(null);
    }
  };

  const handleFormSubmit = async (data: CreateTrainRouteRequest | UpdateTrainRouteRequest) => {
    try {
      if (editingRoute) {
        await updateTrainRouteMutation.mutateAsync({ id: editingRoute.id, data: data as UpdateTrainRouteRequest });
        return true;
      } else {
        await createTrainRouteMutation.mutateAsync(data as CreateTrainRouteRequest);
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
          <h1 className="text-3xl font-bold tracking-tight">Train Routes</h1>
          <Button onClick={handleCreate} className="transition-all duration-200 hover:shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Create Route
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
            {error.message}
          </div>
        )}

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Route Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead>Route Name</TableHead>
                  <TableHead>Start Station</TableHead>
                  <TableHead>End Station</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Compartments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && trainRoutes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading routes...
                    </TableCell>
                  </TableRow>
                ) : trainRoutes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No train routes found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  trainRoutes.map((route) => (
                    <TableRow key={route.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <RouteIcon className="mr-2 h-4 w-4 text-primary" />
                          {route.name}
                        </div>
                      </TableCell>
                      <TableCell>{route.startStation?.name || "Unknown"}</TableCell>
                      <TableCell>{route.endStation?.name || "Unknown"}</TableCell>
                      <TableCell>
                        {(
                          route.routeStations?.reduce((acc, curr) => acc + (curr.distance || 0), 0) || 0
                        ).toFixed(1)}{" "}
                        km
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {/* Routes no longer have compartments - they are assigned to trains */}
                          <span className="text-muted-foreground italic text-xs">Assigned to trains</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-primary transition-colors"
                            onClick={() => handleEdit(route)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-destructive transition-colors"
                            onClick={() => handleDeleteClick(route.id)}
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

        <TrainRouteForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingRoute}
          mode={editingRoute ? "edit" : "create"}
        />

        <AlertDialog open={!!deletingRouteId} onOpenChange={(open) => !open && setDeletingRouteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the train route.
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
