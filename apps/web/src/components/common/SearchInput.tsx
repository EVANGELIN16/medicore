
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

type SearchInputProps = {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
};

export default function SearchInput({
  value,
  placeholder = "Search...",
  onChange,
}: SearchInputProps) {
  return (
    <Input
      value={value}
      placeholder={placeholder}
      prefix={<SearchOutlined />}
      allowClear
      onChange={(event) => onChange?.(event.target.value)}
      style={{ maxWidth: 320 }}
    />
  );
}
