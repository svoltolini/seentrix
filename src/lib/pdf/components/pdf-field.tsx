import { View, Text } from "@react-pdf/renderer";
import { baseStyles } from "../styles";

export function PdfField({
  label,
  value,
}: {
  label: string;
  value: string | undefined | null;
}) {
  return (
    <View>
      <Text style={baseStyles.label}>{label}</Text>
      <Text style={baseStyles.value}>{value || "—"}</Text>
    </View>
  );
}
