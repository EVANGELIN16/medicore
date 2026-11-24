
import { Empty } from "antd";
import type { ReactNode } from "react";

type EmptyStateProps = {
  description?: string;
  children?: ReactNode;
};

export default function EmptyState({
  description = "No records found",
  children,
}: EmptyStateProps) {
  return (
    <Empty description={description}>
      {children}
    </Empty>
  );
}
