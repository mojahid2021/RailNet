"use client";

import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientOnly } from "@/components/client-only";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { TRAFFIC_DATA, REVENUE_DATA, PUNCTUALITY_DATA, CHART_COLORS } from "@/lib/constants";

// Force dynamic rendering to avoid SSR issues with charts
export const dynamic = 'force-dynamic';

// Convert CHART_COLORS object to array for Pie Chart cells
const COLORS = Object.values(CHART_COLORS);

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Passenger Traffic Trend */}
          <Card className="hover:shadow-md transition-all duration-200 border-border/50">
            <CardHeader>
              <CardTitle>Weekly Passenger Traffic</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ClientOnly fallback={<div className="h-full w-full bg-muted animate-pulse rounded" />}>
                <ResponsiveContainer width="100%" height="100%" aspect={2}>
                  <LineChart data={TRAFFIC_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="passengers"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "var(--background)", strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ClientOnly>
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <Card className="hover:shadow-md transition-all duration-200 border-border/50">
            <CardHeader>
              <CardTitle>Revenue Sources</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ClientOnly fallback={<div className="h-full w-full bg-muted animate-pulse rounded" />}>
                <ResponsiveContainer width="100%" height="100%" aspect={1}>
                  <PieChart>
                    <Pie
                      data={REVENUE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {REVENUE_DATA.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="var(--background)"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ClientOnly>
            </CardContent>
          </Card>

          {/* Train Punctuality */}
          <Card className="lg:col-span-2 hover:shadow-md transition-all duration-200 border-border/50">
            <CardHeader>
              <CardTitle>Train Punctuality by Line (%)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ClientOnly fallback={<div className="h-full w-full bg-muted animate-pulse rounded" />}>
                <ResponsiveContainer width="100%" height="100%" aspect={3}>
                  <BarChart data={PUNCTUALITY_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Legend />
                    <Bar dataKey="onTime" stackId="a" fill="var(--chart-2)" name="On Time" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="delayed" stackId="a" fill="var(--destructive)" name="Delayed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ClientOnly>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
