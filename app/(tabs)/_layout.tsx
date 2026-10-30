import { Tabs } from "expo-router";
import { Buildings, GasPump, Gauge } from "phosphor-react-native";
import { Platform } from "react-native";

import { useTheme } from "@/src/theme";

// Abas de baixo, igual ao Controle de Viagens: Resumo · Empresas · Park/Posto.
export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontFamily: "DMSans", fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Resumo",
          tabBarIcon: ({ color, focused }) => (
            <Gauge size={26} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="empresas"
        options={{
          title: "Empresas",
          tabBarIcon: ({ color, focused }) => (
            <Buildings size={26} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="locais"
        options={{
          title: "Park/Posto",
          tabBarIcon: ({ color, focused }) => (
            <GasPump size={26} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
    </Tabs>
  );
}
