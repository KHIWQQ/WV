"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyUserData {
  month: string;
  count: number;
}

interface AdminGrowthChartProps {
  data: MonthlyUserData[];
  title: string;
  usersLabel: string;
}

export function AdminGrowthChart({ data, title, usersLabel }: AdminGrowthChartProps) {
  return (
    <Card variant="glass" className="h-[300px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[240px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                labelStyle={{ fontWeight: 600, color: '#fff', marginBottom: '4px' }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(12, 31, 63, 0.95)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  padding: '8px 12px',
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar
                dataKey="count"
                name={usersLabel}
                fill="#D4A843"
                radius={[6, 6, 0, 0]}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

interface SubscriptionData {
  name: string;
  value: number;
}

interface AdminSubscriptionChartProps {
  data: SubscriptionData[];
  title: string;
}

const COLORS = ["hsl(var(--muted-foreground))", "#D4A843"];

export function AdminSubscriptionChart({ data, title }: AdminSubscriptionChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card variant="glass" className="h-[300px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[240px]">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                animationDuration={1500}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(12, 31, 63, 0.95)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  padding: '8px 12px',
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
