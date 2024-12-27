import { Text, type TextProps } from "react-native";
import { ScaledSheet } from "react-native-size-matters";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Colors } from "@/constants/Colors";

export type ThemedTextProps = TextProps & {
  darkColor?: string;
  lightColor?: string;
  type?: "default" | "defaultSemiBold" | "link" | "subtitle" | "title";
};

export function ThemedText({
  darkColor,
  lightColor,
  style,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "link" ? styles.link : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "title" ? styles.title : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = ScaledSheet.create({
  default: {
    fontSize: "16@s",
    lineHeight: "24@ms",
  },
  defaultSemiBold: {
    fontSize: "16@s",
    fontWeight: "600",
    lineHeight: "24@ms",
  },
  title: {
    fontSize: "32@s",
    fontWeight: "bold",
    lineHeight: "32@s",
  },
  subtitle: {
    fontSize: "20@s",
    fontWeight: "bold",
  },
  link: {
    color: Colors["light"].primary || Colors["dark"].primary,
    fontSize: "16@s",
    lineHeight: "24@ms",
  },
});
