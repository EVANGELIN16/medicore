
import type { Meta, StoryObj } from "@storybook/react-vite";
import StatusBadge from "./StatusBadge";

const meta = {
  title: "MediCore/StatusBadge",
  component: StatusBadge,
  args: {
    status: "Active",
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {};

export const Inactive: Story = {
  args: { status: "Inactive" },
};

export const Scheduled: Story = {
  args: { status: "Scheduled" },
};

export const Completed: Story = {
  args: { status: "Completed" },
};

export const Cancelled: Story = {
  args: { status: "Cancelled" },
};

export const Available: Story = {
  args: { status: "Available" },
};

export const Unavailable: Story = {
  args: { status: "Unavailable" },
};
