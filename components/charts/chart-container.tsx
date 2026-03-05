"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartContainerProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}

export function ChartContainer({
  title,
  description,
  isLoading,
  error,
  children,
  className,
}: ChartContainerProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : error ? (
          <div className="h-[200px] flex items-center justify-center text-sm text-destructive">
            {error}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
