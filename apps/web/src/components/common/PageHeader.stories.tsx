
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "antd";
import PageHeader from "./PageHeader";

const meta = {
  title: "MediCore/PageHeader",
  component: PageHeader,
  args: {
    title: "Patients",
    description: "Manage hospital patient records.",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    extra: <Button type="primary">Add Patient</Button>,
  },
};
