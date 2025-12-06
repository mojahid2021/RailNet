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
import { Plus, Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchedules, useCreateSchedule } from "@/hooks/use-schedules";
import { ScheduleForm } from "@/components/schedules/schedule-form";
import { CreateScheduleRequest, Schedule } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ScheduleDetailsDialog } from "@/components/schedules/schedule-details-dialog";

export default function SchedulesPage() {
  const { data: schedules = [], isLoading, error } = useSchedules();
  const createScheduleMutation = useCreateSchedule();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleCreate = () => {
    setIsFormOpen(true);
  };

  const handleView = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    setIsDetailsOpen(true);
  };

  const handleFormSubmit = async (data: CreateScheduleRequest) => {
    try {
      await createScheduleMutation.mutateAsync(data);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Schedules</h1>
          <Button onClick={handleCreate} className="transition-all duration-200 hover:shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Add Schedule
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
            {error.message}
          </div>
        )}

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Train Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead>Train</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stops</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading schedules...
                    </TableCell>
                  </TableRow>
                ) : schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No schedules found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule) => (
                    <TableRow key={schedule.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-primary" />
                          {schedule.train?.name || "Unknown Train"}
                          <span className="ml-2 text-xs text-muted-foreground">({schedule.train?.number})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <MapPin className="mr-1 h-3 w-3 text-muted-foreground" />
                          {schedule.trainRoute?.name || "Unknown Route"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-3 w-3 text-muted-foreground" />
                          {schedule.date && schedule.time 
                            ? `${format(new Date(schedule.date), "PP")} ${schedule.time}`
                            : schedule.departureTime 
                            ? format(new Date(schedule.departureTime), "PPp")
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={schedule.status === "scheduled" ? "default" : "secondary"}>
                          {schedule.status || "Scheduled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{schedule.stationTimes?.length || 0} Stations</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleView(schedule.id.toString())}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <ScheduleForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          mode="create"
        />

        <ScheduleDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          scheduleId={selectedScheduleId}
        />
      </div>
    </AdminLayout>
  );
}
