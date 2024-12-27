import React, { useEffect, useState } from "react";
import { ScrollView, useWindowDimensions } from "react-native";
import { ScaledSheet, ms } from "react-native-size-matters";
import { router } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { ThemedPressable } from "@/components/ThemedPressable";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { useSession } from "@/store/auth/auth-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthInputValueKey, AuthFormProps } from "@/types/auth-types";
import { handleValidateInputItem } from "@/utilities/validation-utilities";
import { Colors } from "@/constants/Colors";

export default function AuthForm() {
  const { signIn, signUp } = useSession();
  const colorScheme = useColorScheme();
  const windowHeight = useWindowDimensions().height;
  const width = useWindowDimensions().width;

  const [errors, setErrors] = useState<AuthFormProps>({
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });

  const [inputValue, setInputValue] = useState<AuthFormProps>({
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });

  const [canSubmit, setCanSubmit] = useState<boolean>(false);
  const [mode, setMode] = useState("signIn");
  const [securePasswordEntry, setSecurePasswordEntry] = useState<boolean>(true);

  const isSignUp = mode === "signUp";

  const styles = ScaledSheet.create({
    "centered-text": {
      textAlign: "center",
    },
    "form-container": {
      paddingBottom: "20@ms",
    },
    "input-container": {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      justifyContent: "center",
      gap: "15@ms",
      width: "90%",
    },
    wrapper: {
      alignItems: "center",
      display: "flex",
      flex: 1,
      flexDirection: "column",
      justifyContent: "center",
      margin: 0,
      padding: 0,

      minHeight: Math.max(windowHeight),
      width: Math.max(width),
    },
  });

  const placeholders: Record<AuthInputValueKey, string> = {
    email: "Email Address",
    displayName: isSignUp ? "Display Name" : "",
    password: "Password",
    confirmPassword: isSignUp ? "Confirm Password" : "",
  };

  useEffect(() => {
    const hasErrors = Object.values(errors).some((error) => error !== "");
    const allFieldsFilled = Object.keys(inputValue)
      .filter((field) => placeholders[field as AuthInputValueKey])
      .every((key) => inputValue[key as AuthInputValueKey] !== "");
    setCanSubmit(!hasErrors && allFieldsFilled);
  }, [errors, inputValue]);

  const handleSubmit = () => {
    let isValid = true;
    Object.keys(inputValue).forEach((key) => {
      if (placeholders[key as AuthInputValueKey]) {
        const hasError = handleValidateInputItem(
          inputValue,
          key as AuthInputValueKey,
          setErrors
        );
        if (hasError) {
          isValid = false;
          setErrors((prevErrors) => ({
            ...prevErrors,
            [key]:
              "Please enter a valid " + placeholders[key as AuthInputValueKey],
          }));
        }
      }
    });
    if (isValid) {
      if (isSignUp) {
        signUp(inputValue);
      } else {
        signIn(inputValue);
      }
      router.push("/");
    }
  };

  return (
    <ScrollView>
      <ThemedView style={styles.wrapper}>
        <ThemedView style={styles["input-container"]}>
          <ThemedView style={styles["form-container"]}>
            <ThemedText style={styles["centered-text"]} type="title">
              Personal Budget
            </ThemedText>
          </ThemedView>
          {Object.keys(inputValue).map((field, index) => {
            if (!placeholders[field as AuthInputValueKey]) return null;
            return (
              <ThemedTextInput
                key={index}
                placeholder={placeholders[field as AuthInputValueKey]}
                value={inputValue[field as AuthInputValueKey]}
                onChange={(e) =>
                  setInputValue({
                    ...inputValue,
                    [field]: e.nativeEvent.text,
                  })
                }
                onBlur={() =>
                  handleValidateInputItem(
                    inputValue,
                    field as AuthInputValueKey,
                    setErrors
                  )
                }
                onFocus={() => {
                  setErrors((prevErrors) => ({
                    ...prevErrors,
                    [field]: "",
                  }));
                }}
                validationError={!!errors[field as AuthInputValueKey]}
                validationErrorMessage={errors[field as AuthInputValueKey]}
                secureTextEntry={
                  field === "password" || field === "confirmPassword"
                    ? securePasswordEntry
                    : false
                }
                icon={
                  field === "password" ? (
                    securePasswordEntry ? (
                      <AntDesign
                        name="eyeo"
                        onPress={() =>
                          setSecurePasswordEntry(!securePasswordEntry)
                        }
                        size={ms(24)}
                        color={
                          Colors[colorScheme ?? "light"].icon ??
                          Colors[colorScheme ?? "dark"].icon
                        }
                      />
                    ) : (
                      <Feather
                        name="eye-off"
                        onPress={() =>
                          setSecurePasswordEntry(!securePasswordEntry)
                        }
                        size={ms(24)}
                        color={
                          Colors[colorScheme ?? "light"].icon ??
                          Colors[colorScheme ?? "dark"].icon
                        }
                      />
                    )
                  ) : undefined
                }
              />
            );
          })}
          <ThemedPressable
            disabled={!canSubmit}
            onPress={handleSubmit}
            style={
              !canSubmit && {
                backgroundColor:
                  Colors[colorScheme ?? "light"].icon ??
                  Colors[colorScheme ?? "dark"].icon,
              }
            }
          >
            <ThemedText>{isSignUp ? "Sign Up" : "Sign In"}</ThemedText>
          </ThemedPressable>
          <ThemedText
            onPress={() => {
              setMode(isSignUp ? "signIn" : "signUp");
              setErrors({
                email: "",
                displayName: "",
                password: "",
                confirmPassword: "",
              });
              setInputValue({
                email: "",
                displayName: "",
                password: "",
                confirmPassword: "",
              });
            }}
            style={styles["centered-text"]}
            type="link"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}
