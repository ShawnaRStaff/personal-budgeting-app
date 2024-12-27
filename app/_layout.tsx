import "react-native-reanimated";
import { useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { IconComponentProvider, IconProps } from "@react-native-material/core";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as SplashScreen from "expo-splash-screen";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { SessionProvider } from "@/store/auth/auth-context";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SessionProvider>
      <IconComponentProvider
        IconComponent={MaterialCommunityIcons as React.ComponentType<IconProps>}
      />
      <SafeAreaProvider>
        <SafeAreaView
          style={{
            flex: 1,
          }}
          edges={["top", "bottom"]}
        >
          <Slot />
        </SafeAreaView>
      </SafeAreaProvider>
      <StatusBar style="dark" />
    </SessionProvider>
  );
}
