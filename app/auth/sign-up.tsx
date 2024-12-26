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
import { useSession } from "@/store/auth/auth-context";

export default function SignUp() {
  const { signIn } = useSession();
  const windowHeight = useWindowDimensions().height;
  const width = useWindowDimensions().width;

  const [inputValue, setInputValue] = useState({
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

  const [errorIndicator, setErrorIndicator] = useState({
    email: false,
    displayName: false,
    password: false,
    confirmPassword: false,
  });

  const [canSubmit, setCanSubmit] = useState(false);
  const [securePasswordEntry, setSecurePasswordEntry] = useState(true);

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
      gap: 15,
      width: "80%",
    },
  });

  type InputValueKey = keyof typeof inputValue;

  const handleValidateInputItem = (key: InputValueKey): boolean => {
    let hasError = false;
    const item = inputValue[key];

    const displayNameRegex = /^[a-zA-Z0-9]{2,25}$/;
    const emailRegex = /^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

    switch (key) {
      case "email":
        if (!emailRegex.test(item)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            email: "Please enter a valid email",
          }));
          hasError = true;
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            email: "",
          }));
        }
        break;
      case "displayName":
        if (!displayNameRegex.test(item)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            displayName: "Invalid display name",
          }));
          hasError = true;
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            displayName: "",
          }));
        }
        break;
      case "password":
        if (!passwordRegex.test(item)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            password: "Invalid password",
          }));
          hasError = true;
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            password: "",
          }));
        }
        break;
      case "confirmPassword":
        if (inputValue.password !== item) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            confirmPassword: "Passwords do not match",
          }));
          hasError = true;
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            confirmPassword: "",
          }));
        }
        break;
    }
    setErrorIndicator((prev) => ({
      ...prev,
      [key]: hasError,
    }));
    return hasError;
  };

  useEffect(() => {
    const hasErrors = Object.values(errors).some((error) => error !== "");
    const allFieldsFilled = Object.values(inputValue).every((v) => v !== "");
    setCanSubmit(!hasErrors && allFieldsFilled);
  }, [errors, inputValue]);

  const handleSubmit = () => {
    let isValid = true;
    for (let key in inputValue) {
      const hasError = handleValidateInputItem(key as InputValueKey);
      if (hasError) isValid = false;
    }
    if (isValid) {
      signIn();
      router.push("/");
    }
  };

  return (
    <ScrollView>
      <ThemedView style={styles.wrapper}>
        <ThemedView style={styles["input-container"]}>
          <ThemedView style={{ paddingBottom: 20 }}>
            <ThemedText type="title">Personal Budget</ThemedText>
          </ThemedView>
          {["email", "displayName", "password", "confirmPassword"].map(
            (field, index) => (
              <ThemedTextInput
                key={index}
                placeholder={field}
                value={inputValue[field as InputValueKey]}
                onChange={(e) =>
                  setInputValue({
                    ...inputValue,
                    [field]: e.nativeEvent.text,
                  })
                }
                onBlur={() => handleValidateInputItem(field as InputValueKey)}
                onFocus={() => {
                  setErrors((prevErrors) => ({
                    ...prevErrors,
                    [field]: "",
                  }));
                  setErrorIndicator((prev) => ({
                    ...prev,
                    [field]: false,
                  }));
                }}
                validationError={errorIndicator[field as InputValueKey]}
                validationErrorMessage={errors[field as InputValueKey]}
                secureTextEntry={
                  field === "password" || field === "confirmPassword"
                    ? securePasswordEntry
                    : false
                }
                icon={
                  field === "password" || field === "confirmPassword" ? (
                    securePasswordEntry ? (
                      <AntDesign
                        name="eyeo"
                        onPress={() =>
                          setSecurePasswordEntry(!securePasswordEntry)
                        }
                        size={32}
                        color="#ccc"
                      />
                    ) : (
                      <Feather
                        name="eye-off"
                        onPress={() =>
                          setSecurePasswordEntry(!securePasswordEntry)
                        }
                        size={32}
                        color="#ccc"
                      />
                    )
                  ) : undefined
                }
              />
            )
          )}
          <ThemedPressable
            disabled={!canSubmit}
            onPress={handleSubmit}
            style={!canSubmit ? { backgroundColor: "#ccc" } : {}}
          >
            <ThemedText>Signup</ThemedText>
          </ThemedPressable>
          <ThemedText
            onPress={() => router.push("./sign-in")}
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
