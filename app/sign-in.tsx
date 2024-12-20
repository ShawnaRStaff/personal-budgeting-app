import { router } from "expo-router";
import { Text, View } from "react-native";

import { useSession } from "@/store/auth-context";
import { ThemedView } from "@/components/ThemedView";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedText } from "@/components/ThemedText";

export default function SignIn() {
  const { signIn } = useSession();
  return (
    <ThemedView
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <View
        style={{
          width: "80%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <ThemedTextInput placeholder="email" />
        <ThemedTextInput placeholder="password" />
        <ThemedTextInput placeholder="confirm password" />
        <ThemedText>button</ThemedText>
        <ThemedText>button</ThemedText>
        <ThemedText>button</ThemedText>
      </View>
    </ThemedView>
    // <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    //   <Text
    //     onPress={() => {
    //       signIn();
    //       // Navigate after signing in. You may want to tweak this to ensure sign-in is
    //       // successful before navigating.
    //       router.replace('/');
    //     }}>
    //     Sign In
    //   </Text>
    // </View>
  );
}
