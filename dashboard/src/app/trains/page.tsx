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
import { Edit, Trash2, Plus, Train as TrainIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrains } from "@/hooks/use-trains";
import { TrainForm } from "@/components/trains/train-form";
import { Train, CreateTrainRequest, UpdateTrainRequest } from "@/types";
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

export default function TrainsPage() {
  const { trains, loading, error, fetchTrains, createTrain, updateTrain, deleteTrain } = useTrains();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrain, setEditingTrain] = useState<Train | null>(null);
  const [deletingTrainId, setDeletingTrainId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrains();
  }, [fetchTrains]);

  const handleCreate = () => {
    setEditingTrain(null);
    setIsFormOpen(true);
  };

  const handleEdit = (train: Train) => {
    setEditingTrain(train);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingTrainId(id);
  };

  const handleConfirmDelete = async () => {
    if (deletingTrainId) {
      await deleteTrain(deletingTrainId);
      setDeletingTrainId(null);
    }
  };

  const handleFormSubmit = async (data: CreateTrainRequest | UpdateTrainRequest) => {
    if (editingTrain) {
      return await updateTrain(editingTrain.id, data);
    } else {
      return await createTrain(data as CreateTrainRequest);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Trains</h1>
          <Button onClick={handleCreate} className="transition-all duration-200 hover:shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Add Train
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
            {error}
          </div>
        )}

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Train Fleet</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Compartments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && trains.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading trains...
                    </TableCell>
                  </TableRow>
                ) : trains.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No trains found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  trains.map((train) => (
                    <TableRow key={train.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <TrainIcon className="mr-2 h-4 w-4 text-primary" />
                          {train.name}
                        </div>
                      </TableCell>
                      <TableCell>{train.number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{train.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {train.trainRoute ? train.trainRoute.name : <span className="text-muted-foreground italic">Unassigned</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {train.compartments.length > 0 ? (
                            train.compartments.map((tc) => (
                              <Badge key={tc.id} variant="secondary" className="text-xs">
                                {tc.compartment.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground italic text-xs">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-primary transition-colors"
                            onClick={() => handleEdit(train)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-destructive transition-colors"
                            onClick={() => handleDeleteClick(train.id)}
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

        <TrainForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingTrain}
          mode={editingTrain ? "edit" : "create"}
        />

        <AlertDialog open={!!deletingTrainId} onOpenChange={(open) => !open && setDeletingTrainId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the train and its assignments.
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
