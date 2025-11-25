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
import { Edit, Trash2, Plus, Armchair } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompartments } from "@/hooks/use-compartments";
import { CompartmentForm } from "@/components/compartments/compartment-form";
import { Compartment, CreateCompartmentRequest, UpdateCompartmentRequest } from "@/types";
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

export default function CompartmentsPage() {
  const { compartments, loading, error, fetchCompartments, createCompartment, updateCompartment, deleteCompartment } = useCompartments();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompartment, setEditingCompartment] = useState<Compartment | null>(null);
  const [deletingCompartmentId, setDeletingCompartmentId] = useState<string | null>(null);

  useEffect(() => {
    fetchCompartments();
  }, [fetchCompartments]);

  const handleCreate = () => {
    setEditingCompartment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (compartment: Compartment) => {
    setEditingCompartment(compartment);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingCompartmentId(id);
  };

  const handleConfirmDelete = async () => {
    if (deletingCompartmentId) {
      await deleteCompartment(deletingCompartmentId);
      setDeletingCompartmentId(null);
    }
  };

  const handleFormSubmit = async (data: CreateCompartmentRequest | UpdateCompartmentRequest) => {
    if (editingCompartment) {
      return await updateCompartment(editingCompartment.id, data);
    } else {
      return await createCompartment(data as CreateCompartmentRequest);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Compartments</h1>
          <Button onClick={handleCreate} className="transition-all duration-200 hover:shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Add Compartment
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
            {error}
          </div>
        )}

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Compartment Types</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total Seats</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && compartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading compartments...
                    </TableCell>
                  </TableRow>
                ) : compartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No compartments found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  compartments.map((compartment) => (
                    <TableRow key={compartment.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Armchair className="mr-2 h-4 w-4 text-primary" />
                          {compartment.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{compartment.type}</Badge>
                      </TableCell>
                      <TableCell>৳{compartment.price.toFixed(2)}</TableCell>
                      <TableCell>{compartment.totalSeat}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-primary transition-colors"
                            onClick={() => handleEdit(compartment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-destructive transition-colors"
                            onClick={() => handleDeleteClick(compartment.id)}
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

        <CompartmentForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingCompartment}
          mode={editingCompartment ? "edit" : "create"}
        />

        <AlertDialog open={!!deletingCompartmentId} onOpenChange={(open) => !open && setDeletingCompartmentId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the compartment type.
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
