import { useThemeColor } from "@/hooks/useThemeColor";
import { TextInput, type TextInputProps } from "react-native";
import { ScaledSheet, ms, s, vs } from 'react-native-size-matters';

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedTextInput({
  style,
  lightColor,
  darkColor,
  ...rest
}: ThemedTextInputProps) {

  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  const placeholderColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "tabIconDefault"
  );
  
  const color = useThemeColor(
    { light: lightColor, dark: darkColor },
    "text"
  );
  return (
    <TextInput
      style={[styles.default, { backgroundColor, color}, style]}
      placeholderTextColor={placeholderColor}
      {...rest}
    />
  );
}

const styles = ScaledSheet.create({
  default: {
    borderColor: "#ccc",
    borderRadius: 8,
    borderWidth: 1,
    fontSize: s(16),
    lineHeight: ms(24),
    paddingHorizontal: ms(12),
    paddingVertical: ms(8),
  }
});
