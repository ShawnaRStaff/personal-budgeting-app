import React from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { ScaledSheet } from "react-native-size-matters";
import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextInputProps = TextInputProps & {
  ariaLabel?: string;
  darkColor?: string;
  icon?: React.ReactNode;
  lightColor?: string;
  tabIndex?: number;
};

export function ThemedTextInput({
  ariaLabel,
  darkColor,
  icon,
  lightColor,
  secureTextEntry,
  tabIndex,
  onChange,
  onBlur,
  onFocus,
  onEndEditing,
  value,
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

  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <View style={[styles.container, { backgroundColor },]}>
      <TextInput
        aria-label={ariaLabel}
        focusable={true}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onEndEditing={onEndEditing}
        placeholderTextColor={placeholderColor}
        secureTextEntry={secureTextEntry}
        style={[styles.input, { color }]}
        tabIndex={tabIndex}
        value={value}
        {...rest}
      />
      {icon && <View>{icon}</View>}
    </View>
  );
}

const styles = ScaledSheet.create({
  container: {
    alignItems: "center",
    borderColor: "#ccc",
    borderRadius: 7.5,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: "16@ms",
  },
  input: {
    flex: 1,
    fontSize: "16@s",
    lineHeight: "24@s",
    paddingVertical: "8@ms",
  },
});
