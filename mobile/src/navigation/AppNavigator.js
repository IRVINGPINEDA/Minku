import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { CoursesScreen } from "../screens/CoursesScreen";
import { CourseDetailScreen } from "../screens/CourseDetailScreen";
import { MyCoursesScreen } from "../screens/MyCoursesScreen";
import { LessonViewScreen } from "../screens/LessonViewScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { CertificateScreen } from "../screens/CertificateScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused, color }) => (
    <Text style={{ fontSize: focused ? 22 : 20, color }}>{name}</Text>
);

const MainTabs = () => {
    const { colors } = useTheme();
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarStyle: { backgroundColor: colors.navBg, borderTopColor: colors.border },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                headerStyle: { backgroundColor: colors.navBg },
                headerTintColor: "#fff",
                headerTitleStyle: { fontWeight: "700" },
            }}
        >
            <Tab.Screen
                name="Explorar"
                component={CoursesScreen}
                options={{ tabBarIcon: ({ focused, color }) => <TabIcon name="🔍" focused={focused} color={color} />, title: "Catálogo" }}
            />
            <Tab.Screen
                name="MiAprendizaje"
                component={MyCoursesScreen}
                options={{ tabBarIcon: ({ focused, color }) => <TabIcon name="📚" focused={focused} color={color} />, title: "Mi aprendizaje" }}
            />
            <Tab.Screen
                name="Perfil"
                component={ProfileScreen}
                options={{ tabBarIcon: ({ focused, color }) => <TabIcon name="👤" focused={focused} color={color} />, title: "Mi perfil" }}
            />
        </Tab.Navigator>
    );
};

const AuthStack = () => {
    const { colors } = useTheme();
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.navBg },
                headerTintColor: "#fff",
                headerTitleStyle: { fontWeight: "700" },
                contentStyle: { backgroundColor: colors.bg },
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Crear cuenta" }} />
        </Stack.Navigator>
    );
};

const AppStack = () => {
    const { colors } = useTheme();
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.navBg },
                headerTintColor: "#fff",
                headerTitleStyle: { fontWeight: "700" },
                contentStyle: { backgroundColor: colors.bg },
            }}
        >
            <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: "Detalle del curso" }} />
            <Stack.Screen name="LessonView" component={LessonViewScreen} options={{ title: "Lecciones" }} />
            <Stack.Screen name="Certificate" component={CertificateScreen} options={{ title: "Mi certificado" }} />
        </Stack.Navigator>
    );
};

export const AppNavigator = () => {
    const { user, loading } = useAuth();
    const { colors } = useTheme();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
    );
};
