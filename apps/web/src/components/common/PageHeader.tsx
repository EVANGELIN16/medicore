
import { Typography } from "antd";
import type { ReactNode } from "react";

const { Title, Text } = Typography;

type PageHeaderProps = {
  title: string;
  description?: string;
  extra?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  extra,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          {title}
        </Title>

        {description && (
          <Text type="secondary">{description}</Text>
        )}
      </div>

      {extra && <div>{extra}</div>}
    </div>
  );
}
