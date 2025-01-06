import Toast from "react-native-toast-message";

export interface ToastFunctionProps {
    type: "error" | "info" | "success" | "warning";
    text1: string;
    text2?: string;
}

export function popToast({ type, text1, text2 = "" }: ToastFunctionProps): void {
    const showToast = (): void => {
        Toast.show({
            type: type,
            text1: text1,
            text2: text2
        });
    };
    showToast();
}