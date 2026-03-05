"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, description, trend, icon, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className={cn(
              "text-xs mt-1",
              trend === "up" ? "text-destructive" : trend === "down" ? "text-green-500" : "text-muted-foreground"
            )}>
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
