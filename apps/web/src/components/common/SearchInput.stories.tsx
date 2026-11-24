
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import SearchInput from "./SearchInput";

const meta = {
  title: "MediCore/SearchInput",
  component: SearchInput,
  args: {
    placeholder: "Search patients...",
    onChange: fn(),
  },
} satisfies Meta<typeof SearchInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    value: "John",
  },
};
