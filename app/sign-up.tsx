import React, { useEffect, useState } from "react";
import { ScrollView, useWindowDimensions } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { ScaledSheet } from "react-native-size-matters";
import { ThemedPressable } from "@/components/ThemedPressable";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useSession } from "@/store/auth-context";

export default function SignUp() {
  const { signIn } = useSession();
  const windowHeight = useWindowDimensions().height;
  const width = useWindowDimensions().width;
  const [value, setValue] = useState({
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });

  const [canSubmit, setCanSubmit] = useState(false);
  const [securePasswordEntry, setSecurePasswordEntry] = useState(true);
  const [secureConfirmPasswordEntry, setSecureConfirmPasswordEntry] =
    useState(true);

  const styles = ScaledSheet.create({
    wrapper: {
      alignItems: "center",
      display: "flex",
      flex: 1,
      flexDirection: "column",
      justifyContent: "center",
      margin: 0,
      padding: 0,
      minHeight: "100%",
      height: Math.round(windowHeight),
      minWidth: "100%",
      maxWidth: Math.round(width),
    },
    "input-container": {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      justifyContent: "center",
      gap: 20,
      width: "80%",
    },
  });

  type ValueKey = keyof typeof value;

  const handleSubmit = () => {
    for (let key in value) {
      handleValidateInputItem(key as ValueKey);
    }
    if (Object.values(errors).every((error) => error === "")) {
      signIn();
      router.push("/");
    }
    return null; //#TODO: pop toast with error message
  };

  const handleValidateInputItem = (key: ValueKey) => {
    let item = value[key];
    switch (key) {
      case "email":
        const emailRegex = /^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(item)) {
          setErrors({ ...errors, email: "Invalid email" });
        }
        break;
      case "displayName":
        const displayNameRegex = /^[a-zA-Z0-9]{2,25}$/;
        if (!displayNameRegex.test(item)) {
          setErrors({ ...errors, displayName: "Invalid display name" });
        }
        break;
      case "password":
        const passwordRegex =
          /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
        if (!passwordRegex.test(item)) {
          setErrors({ ...errors, password: "Invalid password" });
        }
        break;
      case "confirmPassword":
        if (value.password !== item) {
          setErrors({ ...errors, confirmPassword: "Passwords do not match" });
        }
        break;
    }
  };

  useEffect(() => {
    !Object.values(errors).every((error) => error !== "") &&
    Object.values(value).every((v) => v !== "")
      ? setCanSubmit(true)
      : setCanSubmit(false);
  }, [errors, value]);

  return (
    <ScrollView>
      <ThemedView style={styles.wrapper}>
        <ThemedView style={styles["input-container"]}>
          <ThemedView style={{ paddingBottom: 20 }}>
            <ThemedText type="title">Personal Budget</ThemedText>
            {/** Logo? */}
          </ThemedView>
          <ThemedTextInput
            aria-label="Sign up email text input"
            keyboardType="email-address"
            onChange={(e) => {
              setValue({ ...value, email: e.nativeEvent.text });
            }}
            onEndEditing={() => {
              handleValidateInputItem("email");
            }}
            onFocus={() => {
              setErrors({ ...errors, email: "" });
            }}
            placeholder="email"
            secureTextEntry={false}
            tabIndex={0}
            value={value.email}
          />
          <ThemedTextInput
            aria-label="Sign up display name text input"
            keyboardType="email-address"
            onChange={(e) => {
              setValue({ ...value, displayName: e.nativeEvent.text });
            }}
            onEndEditing={() => {
              handleValidateInputItem("displayName");
            }}
            onFocus={() => {
              setErrors({ ...errors, displayName: "" });
            }}
            placeholder="display name"
            secureTextEntry={false}
            tabIndex={0}
            value={value.displayName}
          />
          <ThemedTextInput
            aria-label="Sign up password text input"
            icon={
              securePasswordEntry ? (
                <AntDesign
                  name="eyeo"
                  onPress={() => setSecurePasswordEntry(!securePasswordEntry)}
                  size={32}
                  color="#ccc"
                />
              ) : (
                <Feather
                  name="eye-off"
                  onPress={() => setSecurePasswordEntry(!securePasswordEntry)}
                  size={32}
                  color="#ccc"
                />
              )
            }
            keyboardType="default"
            onChange={(e) => {
              setValue({ ...value, password: e.nativeEvent.text });
            }}
            onEndEditing={() => {
              handleValidateInputItem("password");
            }}
            onFocus={() => {
              setErrors({ ...errors, password: "" });
            }}
            placeholder="password"
            secureTextEntry={securePasswordEntry}
            tabIndex={0}
            value={value.password}
          />
          <ThemedTextInput
            aria-label="Sign up confirm password text input"
            icon={
              secureConfirmPasswordEntry ? (
                <AntDesign
                  name="eyeo"
                  onPress={() =>
                    setSecureConfirmPasswordEntry(!secureConfirmPasswordEntry)
                  }
                  size={32}
                  color="#ccc"
                />
              ) : (
                <Feather
                  name="eye-off"
                  onPress={() =>
                    setSecureConfirmPasswordEntry(!secureConfirmPasswordEntry)
                  }
                  size={32}
                  color="#ccc"
                />
              )
            }
            keyboardType="default"
            onChange={(e) => {
              setValue({ ...value, confirmPassword: e.nativeEvent.text });
            }}
            onEndEditing={() => {
              handleValidateInputItem("confirmPassword");
            }}
            onFocus={() => {
              setErrors({ ...errors, confirmPassword: "" });
            }}
            placeholder="confirm password"
            secureTextEntry={secureConfirmPasswordEntry}
            tabIndex={0}
            value={value.confirmPassword}
          />
          <ThemedPressable
            aria-label="Sign up button"
            disabled={!canSubmit}
            onPress={handleSubmit}
            tabIndex={0}
          >
            <ThemedText>Signup</ThemedText>
          </ThemedPressable>

          <ThemedText
            onPress={() => {
              router.push("./sign-in");
            }}
            style={{ color: "#4CAF50", textAlign: "center" }}
            type="link"
          >
            Already have an account? Login
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}
