
import { Spin, Typography } from "antd";

const { Text } = Typography;

type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3">
      <Spin size="large" />
      <Text type="secondary">{message}</Text>
    </div>
  );
}
