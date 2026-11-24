
import { Card, Statistic } from "antd";
import type { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: number;
  icon?: ReactNode;
  loading?: boolean;
};

export default function StatCard({
  title,
  value,
  icon,
  loading = false,
}: StatCardProps) {
  return (
    <Card loading={loading} className="h-full shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <Statistic title={title} value={value} />
        {icon && (
          <div className="text-2xl text-blue-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
