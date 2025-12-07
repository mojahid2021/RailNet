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
import { useTransactions } from "@/hooks/use-transactions";
import { PaymentStatus } from "@/types";
import { format } from "date-fns";
import { CreditCard, User, Calendar, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<PaymentStatus | "ALL">("ALL");
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Build query params
  const queryParams = {
    page,
    limit,
    ...(status !== "ALL" && { status }),
    ...(userId && { userId: parseInt(userId) }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  };

  const { data, isLoading, error } = useTransactions(queryParams);

  const handleResetFilters = () => {
    setStatus("ALL");
    setUserId("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500 hover:bg-green-600";
      case "INITIATED":
        return "bg-blue-500 hover:bg-blue-600";
      case "FAILED":
        return "bg-red-500 hover:bg-red-600";
      case "CANCELLED":
        return "bg-gray-500 hover:bg-gray-600";
      case "EXPIRED":
        return "bg-orange-500 hover:bg-orange-600";
      default:
        return "";
    }
  };

  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
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
              <CardTitle className="text-lg">Filter Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as PaymentStatus | "ALL")}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="INITIATED">Initiated</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline" onClick={handleResetFilters}>
                  Reset Filters
                </Button>
                <Button onClick={() => setPage(1)}>Apply Filters</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold">{data.pagination?.total || 0}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-primary" />
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
                    <p className="text-2xl font-bold">{data.transactions?.length || 0} items</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transactions Table */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Payment Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Card Type</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : !data || !data.transactions || data.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No transactions found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <CreditCard className="mr-2 h-4 w-4 text-primary" />
                            <span className="text-xs">{transaction.transactionId}</span>
                          </div>
                          {transaction.bankTransactionId && (
                            <span className="text-xs text-muted-foreground ml-6">
                              Bank: {transaction.bankTransactionId}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{transaction.ticket.ticketId}</span>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {transaction.ticket.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {transaction.ticket.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start">
                          <User className="mr-2 h-3 w-3 text-muted-foreground mt-1" />
                          <div>
                            <div className="font-medium text-sm">{transaction.ticket.passengerName}</div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.ticket.user.firstName} {transaction.ticket.user.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{transaction.ticket.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {transaction.amount.toFixed(2)} <span className="text-xs text-muted-foreground">{transaction.currency}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{transaction.paymentMethod}</span>
                      </TableCell>
                      <TableCell>
                        {transaction.cardType ? (
                          <span className="text-sm">{transaction.cardType}</span>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                            {format(new Date(transaction.createdAt), "PP")}
                          </div>
                          <span className="text-xs text-muted-foreground ml-4">
                            {format(new Date(transaction.createdAt), "p")}
                          </span>
                          {transaction.completedAt && (
                            <span className="text-xs text-muted-foreground ml-4">
                              Completed: {format(new Date(transaction.completedAt), "p")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {data && data.transactions.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.pagination?.total || 0)} of{" "}
                  {data.pagination?.total || 0} transactions
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
