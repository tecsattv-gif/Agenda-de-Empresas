import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppSplash } from "@/src/components/AppSplash";
import { TabletFrame } from "@/src/components/TabletFrame";
import { UndoBar } from "@/src/components/UndoBar";

SplashScreen.preventAutoHideAsync();

const DARK = { flex: 1, backgroundColor: "#121212" } as const;

export default function RootLayout() {
  const [loaded] = useFonts({
    BarlowCondensed: require("../assets/fonts/BarlowCondensed-Regular.ttf"),
    "BarlowCondensed-SemiBold": require("../assets/fonts/BarlowCondensed-SemiBold.ttf"),
    "BarlowCondensed-Bold": require("../assets/fonts/BarlowCondensed-Bold.ttf"),
    DMSans: require("../assets/fonts/DMSans.ttf"),
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return <View style={DARK} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <StatusBar style="light" />
          {showSplash ? (
            <AppSplash onFinish={() => setShowSplash(false)} />
          ) : (
            <TabletFrame>
              <Stack screenOptions={{ headerShown: false }} />
              <UndoBar />
            </TabletFrame>
          )}
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
