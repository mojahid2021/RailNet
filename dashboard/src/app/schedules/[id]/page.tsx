"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSchedules } from "@/hooks/use-schedules";
import { Schedule } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Train, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/admin-layout";

export default function ScheduleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getSchedule, loading, error } = useSchedules();
  const [schedule, setSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      const data = await getSchedule(id);
      if (data) {
        setSchedule(data);
      }
    };
    fetchSchedule();
  }, [id, getSchedule]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!schedule) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Schedule Details</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Train Information</CardTitle>
              <Train className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schedule.train?.name}</div>
              <p className="text-xs text-muted-foreground">
                {schedule.train?.number} ({schedule.train?.type})
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Route Information</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schedule.route?.name}</div>
              <p className="text-xs text-muted-foreground">
                {schedule.route?.startStation?.name} → {schedule.route?.endStation?.name}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departure Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schedule.departureTime}</div>
              <p className="text-xs text-muted-foreground capitalize">
                Status: {schedule.status}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Station Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>Arrival</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.stationSchedules?.map((stationSchedule) => (
                  <TableRow key={stationSchedule.id}>
                    <TableCell className="font-medium">
                      {stationSchedule.station?.name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(stationSchedule.estimatedArrival), "HH:mm")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(stationSchedule.estimatedDeparture), "HH:mm")}
                    </TableCell>
                    <TableCell>{stationSchedule.platformNumber || "-"}</TableCell>
                    <TableCell className="capitalize">
                      {stationSchedule.status}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
