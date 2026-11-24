
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "antd";
import EmptyState from "./EmptyState";

const meta = {
  title: "MediCore/EmptyState",
  component: EmptyState,
  args: {
    description: "No records found",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    description: "No patients available",
    children: <Button type="primary">Add Patient</Button>,
  },
};
