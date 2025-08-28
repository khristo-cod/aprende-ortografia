// app/(tabs)/_layout.tsx - SISTEMA SIMPLIFICADO CON FAB
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import TeacherFloatingMenu from '../../components/TeacherFloatingMenu';
import { useAuth } from '../../src/contexts/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, isDocente, isRepresentante, isNino } = useAuth();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        
        {/* PANTALLA PRINCIPAL - Para todos los roles */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />

        {/* DASHBOARD ESPECÍFICO POR ROL */}
        {isDocente && (
          <Tabs.Screen
            name="teacher-dashboard"
            options={{
              title: 'Mi Dashboard',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
            }}
          />
        )}

        {isRepresentante && (
          <Tabs.Screen
            name="parent-dashboard"
            options={{
              title: 'Mis Hijos',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="figure.2.and.child.holdinghands" color={color} />,
            }}
          />
        )}

        {/* JUEGOS PRINCIPALES - Máximo 3 para mantenerlo limpio */}
        <Tabs.Screen
          name="titanic"
          options={{
            title: 'Titanic',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="sailboat.fill" color={color} />,
          }}
        />
        
        <Tabs.Screen
          name="JuegoDeOrtografia"
          options={{
            title: 'Ortografía',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="textformat.abc" color={color} />,
          }}
        />
        
        <Tabs.Screen
          name="hangman"
          options={{
            title: 'Ahorcado',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          }}
        />

        {/* PANTALLAS OCULTAS - No aparecen en tabs pero son navegables */}
        <Tabs.Screen
          name="explore"
          options={{
            href: null, // Oculta del tab bar
          }}
        />
        
        <Tabs.Screen
          name="classroom-management"
          options={{
            href: null, // Oculta del tab bar
          }}
        />
        
        <Tabs.Screen
          name="titanic-admin"
          options={{
            href: null, // Oculta del tab bar
          }}
        />
        
        <Tabs.Screen
          name="teacher-reports"
          options={{
            href: null, // Oculta del tab bar
          }}
        />
      </Tabs>

      {/* FLOATING ACTION BUTTON SOLO PARA DOCENTES */}
      {isDocente && <TeacherFloatingMenu />}
    </>
  );
}