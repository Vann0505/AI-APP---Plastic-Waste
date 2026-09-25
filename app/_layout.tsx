import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SystemBars } from "react-native-edge-to-edge";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
type Style = "auto" | "inverted" | "light" | "dark";

type SystemBarsProps = {
  style?: Style | { statusBar?: Style; navigationBar?: Style };
  hidden?: boolean | { statusBar?: boolean; navigationBar?: boolean };
};

export const unstable_settings = {
  anchor: "(tabs)",
};
const queryClient = new QueryClient();
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <QueryClientProvider client={queryClient}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
            </Stack>
            <SystemBars style={{ statusBar: colorScheme === "dark" ? "light" : "dark", navigationBar: colorScheme === "dark" ? "dark" : "light"}} />
            {/* <StatusBar style={colorScheme === "dark" ? "dark" : "light"} /> */}
          </QueryClientProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
