import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppTabParamList, SessionsStackParamList, PatientsStackParamList } from '../types';
import { Colors } from '../constants/colors';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import SessionHistoryScreen from '../screens/sessions/SessionHistoryScreen';
import SessionDetailScreen from '../screens/sessions/SessionDetailScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

import PatientListScreen from '../screens/patients/PatientListScreen';
import PatientDetailScreen from '../screens/patients/PatientDetailScreen';
import RecordReportScreen from '../screens/patients/RecordReportScreen';
import ViewReportsScreen from '../screens/patients/ViewReportsScreen';

const Tab = createBottomTabNavigator<AppTabParamList>();
const SessionsStack = createNativeStackNavigator<SessionsStackParamList>();
const PatientsStack = createNativeStackNavigator<PatientsStackParamList>();

function PatientsNavigator() {
  return (
    <PatientsStack.Navigator>
      <PatientsStack.Screen
        name="PatientList"
        component={PatientListScreen}
        options={{ title: 'Patients' }}
      />
      <PatientsStack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={({ route }) => ({ title: route.params.patientName })}
      />
      <PatientsStack.Screen
        name="RecordReport"
        component={RecordReportScreen}
        options={{ title: 'Record Report' }}
      />
      <PatientsStack.Screen
        name="ViewReports"
        component={ViewReportsScreen}
        options={{ title: 'View Reports' }}
      />
    </PatientsStack.Navigator>
  );
}

function SessionsNavigator() {
  return (
    <SessionsStack.Navigator>
      <SessionsStack.Screen name="SessionHistory" component={SessionHistoryScreen} options={{ title: 'Sessions' }} />
      <SessionsStack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: 'Session Detail' }} />
    </SessionsStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Patients: 'people',
            Dashboard: 'home',
            Sessions: 'document-text',
            Settings: 'settings',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        headerShown: false,
        tabBarStyle: { borderTopColor: Colors.border },
      })}
    >
      <Tab.Screen name="Patients" component={PatientsNavigator} options={{ title: 'Patients' }} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home', headerShown: true }} />
      <Tab.Screen name="Sessions" component={SessionsNavigator} options={{ title: 'Sessions' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', headerShown: true }} />
    </Tab.Navigator>
  );
}

