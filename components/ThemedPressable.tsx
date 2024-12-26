import React, { ReactNode } from "react";
import { Platform } from "react-native";
import { PlatformPressable } from "@react-navigation/elements";
import { ScaledSheet } from "react-native-size-matters";
import * as Haptics from "expo-haptics";

interface ThemedPressableProps {
  children: ReactNode;
  [key: string]: any;
}

export function ThemedPressable({
  children,
  style,
  ...props
}: ThemedPressableProps) {
  return (
    <PlatformPressable
      aria-label={props["aria-label"]}
      key={props["key"]}
      style={[styles.default, style]}
      tabIndex={props["tabIndex"]}
      {...props}
      onPressIn={(ev) => {
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    >
      {children}
    </PlatformPressable>
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
