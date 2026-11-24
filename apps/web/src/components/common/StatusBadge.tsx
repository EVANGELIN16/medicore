
import { Tag } from "antd";

export type Status =
  | "Active"
  | "Inactive"
  | "Available"
  | "Unavailable"
  | "Scheduled"
  | "Completed"
  | "Cancelled";

type StatusBadgeProps = {
  status: Status;
};

const statusColors: Record<Status, string> = {
  Active: "green",
  Inactive: "red",
  Available: "green",
  Unavailable: "orange",
  Scheduled: "blue",
  Completed: "green",
  Cancelled: "red",
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <Tag color={statusColors[status]}>
      {status}
    </Tag>
  );
}
