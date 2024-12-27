import { AuthFormProps, AuthInputValueKey } from "@/types/auth-types";
import React, { Dispatch, SetStateAction } from "react";

const displayNameRegex = /^[a-zA-Z0-9]{2,25}$/;
const emailRegex = /^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const passwordRegex =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;


export const handleValidateInputItem = (
    inputValue: AuthFormProps,
    key: AuthInputValueKey,
    setErrors: Dispatch<SetStateAction<AuthFormProps>>
): boolean => {
    let hasError = false;
    const item = inputValue[key];

    switch (key) {
        case "email":
            if (!item) {
                break;
            }
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
            if (!item) {
                break;
            }
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
            if (!item) {
                break;
            }
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
            if (!item) {
                break;
            }
            if (inputValue?.password !== item) {
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
    return hasError;
};