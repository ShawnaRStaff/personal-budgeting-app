import { Pressable } from "react-native";
import { ReactNode } from "react";
import { ScaledSheet } from "react-native-size-matters";
interface ThemedPressableProps {
  children: ReactNode;
  [key: string]: any;
}

export function ThemedPressable({ children, style, ...props }: ThemedPressableProps) {
  return (
    <Pressable
      aria-label={props["aria-label"]}
      key={props["key"]}
      style={[styles.default, style]}
      tabIndex={props["tabIndex"]}
      {...props}
    >
      {children}
    </Pressable>
  );
}

const styles = ScaledSheet.create({
  default: {
    alignItems: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 7.5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    padding: "10@s",
    textAlign: "center",
  },
});
