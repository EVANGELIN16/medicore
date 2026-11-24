
import type { Meta, StoryObj } from "@storybook/react-vite";
import LoadingState from "./LoadingState";

const meta = {
  title: "MediCore/LoadingState",
  component: LoadingState,
  args: {
    message: "Loading patients...",
  },
} satisfies Meta<typeof LoadingState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LoadingDoctors: Story = {
  args: {
    message: "Loading doctors...",
  },
};
