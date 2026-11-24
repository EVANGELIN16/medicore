
import type { Meta, StoryObj } from "@storybook/react-vite";
import { UserOutlined } from "@ant-design/icons";
import StatCard from "./StatCard";

const meta = {
  title: "MediCore/StatCard",
  component: StatCard,
  args: {
    title: "Total Patients",
    value: 120,
  },
} satisfies Meta<typeof StatCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: {
    title: "Total Patients",
    value: 120,
    icon: <UserOutlined />,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};
