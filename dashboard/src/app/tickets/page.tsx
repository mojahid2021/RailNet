"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTickets } from "@/hooks/use-tickets";
import { TicketStatus, TicketPaymentStatus } from "@/types";
import { format } from "date-fns";
import { Ticket as TicketIcon, User, Calendar, Filter, ChevronLeft, ChevronRight, Train, Search, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TicketsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<TicketStatus | "ALL">("ALL");
  const [paymentStatus, setPaymentStatus] = useState<TicketPaymentStatus | "ALL">("ALL");
  const [userId, setUserId] = useState("");
  const [trainId, setTrainId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [passengerName, setPassengerName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelStartDate, setTravelStartDate] = useState("");
  const [travelEndDate, setTravelEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Build query params
  const queryParams = {
    page,
    limit,
    ...(status !== "ALL" && { status }),
    ...(paymentStatus !== "ALL" && { paymentStatus }),
    ...(userId && { userId: parseInt(userId) }),
    ...(trainId && { trainId: parseInt(trainId) }),
    ...(ticketId && { ticketId }),
    ...(passengerName && { passengerName }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    ...(travelStartDate && { travelStartDate }),
    ...(travelEndDate && { travelEndDate }),
  };

  const { data, isLoading, error } = useTickets(queryParams);

  const handleResetFilters = () => {
    setStatus("ALL");
    setPaymentStatus("ALL");
    setUserId("");
    setTrainId("");
    setTicketId("");
    setPassengerName("");
    setStartDate("");
    setEndDate("");
    setTravelStartDate("");
    setTravelEndDate("");
    setPage(1);
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500 hover:bg-green-600";
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "cancelled":
        return "bg-red-500 hover:bg-red-600";
      case "expired":
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "";
    }
  };

  const getPaymentStatusColor = (status: TicketPaymentStatus) => {
    switch (status) {
      case "paid":
        return "bg-green-500 hover:bg-green-600";
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "failed":
        return "bg-red-500 hover:bg-red-600";
      case "refunded":
        return "bg-blue-500 hover:bg-blue-600";
      case "expired":
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "";
    }
  };

  const totalPages = data?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Sold Tickets</h1>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="transition-all duration-200 hover:shadow-md"
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
            {error.message}
          </div>
        )}

        {/* Filters Section */}
        {showFilters && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Filter Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label htmlFor="status">Ticket Status</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as TicketStatus | "ALL")}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Status Filter */}
                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as TicketPaymentStatus | "ALL")}>
                    <SelectTrigger id="paymentStatus">
                      <SelectValue placeholder="All Payment Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Payment Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User ID Filter */}
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    type="number"
                    placeholder="Enter user ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>

                {/* Train ID Filter */}
                <div className="space-y-2">
                  <Label htmlFor="trainId">Train ID</Label>
                  <Input
                    id="trainId"
                    type="number"
                    placeholder="Enter train ID"
                    value={trainId}
                    onChange={(e) => setTrainId(e.target.value)}
                  />
                </div>

                {/* Ticket ID Search */}
                <div className="space-y-2">
                  <Label htmlFor="ticketId">Ticket ID</Label>
                  <Input
                    id="ticketId"
                    type="text"
                    placeholder="Search ticket ID"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                  />
                </div>

                {/* Passenger Name Search */}
                <div className="space-y-2">
                  <Label htmlFor="passengerName">Passenger Name</Label>
                  <Input
                    id="passengerName"
                    type="text"
                    placeholder="Search passenger name"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                  />
                </div>

                {/* Booking Date Range */}
                <div className="space-y-2">
                  <Label htmlFor="startDate">Booking Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Booking End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {/* Travel Date Range */}
                <div className="space-y-2">
                  <Label htmlFor="travelStartDate">Travel Start Date</Label>
                  <Input
                    id="travelStartDate"
                    type="date"
                    value={travelStartDate}
                    onChange={(e) => setTravelStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="travelEndDate">Travel End Date</Label>
                  <Input
                    id="travelEndDate"
                    type="date"
                    value={travelEndDate}
                    onChange={(e) => setTravelEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline" onClick={handleResetFilters}>
                  Reset Filters
                </Button>
                <Button onClick={() => setPage(1)}>
                  <Search className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tickets</p>
                    <p className="text-2xl font-bold">{data.total || 0}</p>
                  </div>
                  <TicketIcon className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Page</p>
                    <p className="text-2xl font-bold">
                      {page} / {totalPages}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Showing</p>
                    <p className="text-2xl font-bold">{data.tickets?.length || 0} items</p>
                  </div>
                  <TicketIcon className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      {data.tickets?.reduce((sum, ticket) => sum + ticket.price, 0).toFixed(2) || "0.00"} BDT
                    </p>
                  </div>
                  <TicketIcon className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tickets Table */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>All Sold Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Train & Route</TableHead>
                  <TableHead>Seat</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Travel Date</TableHead>
                  <TableHead>Booked On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (!data || data.tickets.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Loading tickets...
                    </TableCell>
                  </TableRow>
                ) : !data || data.tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No tickets found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <TicketIcon className="mr-2 h-4 w-4 text-primary" />
                          <span className="text-sm">{ticket.ticketId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start">
                          <User className="mr-2 h-3 w-3 text-muted-foreground mt-1" />
                          <div>
                            <div className="font-medium text-sm">{ticket.passengerName}</div>
                            <div className="text-xs text-muted-foreground">
                              {ticket.passengerAge} yrs, {ticket.passengerGender}
                            </div>
                            <div className="text-xs text-muted-foreground">{ticket.user.email}</div>
                            <div className="text-xs text-muted-foreground">{ticket.user.phone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center">
                            <Train className="mr-2 h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-sm">{ticket.trainSchedule.train.name}</div>
                              <div className="text-xs text-muted-foreground">#{ticket.trainSchedule.train.number}</div>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground ml-6">
                            <MapPin className="mr-1 h-3 w-3" />
                            {ticket.fromStation.name} → {ticket.toStation.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{ticket.seat.seatNumber}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {ticket.seat.trainCompartment.compartment.name}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {ticket.seat.trainCompartment.compartment.type.replace(/_/g, " ")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {ticket.price.toFixed(2)} BDT
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className={getStatusColor(ticket.status)}>
                          {ticket.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className={getPaymentStatusColor(ticket.paymentStatus)}>
                          {ticket.paymentStatus.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                          {format(new Date(ticket.trainSchedule.date), "PP")}
                        </div>
                        <div className="text-xs text-muted-foreground ml-4">
                          {ticket.trainSchedule.time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(ticket.createdAt), "PP")}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {data && data.tickets.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.total || 0)} of{" "}
                  {data.total || 0} tickets
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
