// src/components/dashboard/KpiCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: number;
    trendLabel?: string;
    trendType?: 'positive' | 'negative';
}

export function KpiCard({ title, value, icon: Icon, description, trend, trendLabel, trendType = 'positive' }: KpiCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend !== undefined && trendLabel && (
                    <div className="flex items-center gap-1 mt-1">
                        <Badge variant={trend >= 0 ? (trendType === 'positive' ? 'default' : 'destructive') : (trendType === 'positive' ? 'destructive' : 'default')} className="text-xs">
                            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">{trendLabel}</span>
                    </div>
                )}
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}