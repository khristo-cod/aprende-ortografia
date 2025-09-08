// app/(tabs)/_layout.tsx - ACTUALIZADO CON NUEVA PANTALLA

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
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
        
        {/* DASHBOARD ESPECÍFICO POR ROL - PANTALLA PRINCIPAL */}
        {isDocente && (
          <Tabs.Screen
            name="teacher-dashboard"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }) => <MaterialIcons name="analytics" size={28} color={color} />,
            }}
          />
        )}

        {isRepresentante && (
          <Tabs.Screen
            name="parent-dashboard"
            options={{
              title: 'Mi Panel',
              tabBarIcon: ({ color }) => <MaterialIcons name="family-restroom" size={28} color={color} />,
            }}
          />
        )}

        {isNino && (
          <Tabs.Screen
            name="index"
            options={{
              title: 'Juegos',
              tabBarIcon: ({ color }) => <MaterialIcons name="games" size={28} color={color} />,
            }}
          />
        )}

        {/* JUEGOS - Solo visibles para niños y representantes */}
        {(isNino || isRepresentante) && (
          <>
            <Tabs.Screen
              name="JuegoDeOrtografia"
              options={{
                title: 'Ortografía',
                tabBarIcon: ({ color }) => <MaterialIcons name="edit" size={28} color={color} />,
              }}
            />
            
            <Tabs.Screen
              name="titanic"
              options={{
                title: 'Titanic',
                tabBarIcon: ({ color }) => <MaterialIcons name="directions-boat" size={28} color={color} />,
              }}
            />
            
            <Tabs.Screen
              name="explore"
              options={{
                title: 'Explorar',
                tabBarIcon: ({ color }) => <MaterialIcons name="explore" size={28} color={color} />,
              }}
            />
          </>
        )}

        {/* DOCENTES: Solo navegación esencial */}
        {isDocente && (
          <Tabs.Screen
            name="classroom-management"
            options={{
              title: 'Mis Aulas',
              tabBarIcon: ({ color }) => <MaterialIcons name="school" size={28} color={color} />,
            }}
          />
        )}

        {/* PANTALLAS OCULTAS - No aparecen en tabs pero son navegables */}
        <Tabs.Screen
          name="teacher-reports"
          options={{
            href: null,
          }}
        />
        
        <Tabs.Screen
          name="titanic-admin"
          options={{
            href: null,
          }}
        />

        {/* 🆕 NUEVA PANTALLA PARA ESTUDIANTES */}
        <Tabs.Screen
          name="student-classroom-selection"
          options={{
            href: null, // Oculta del tab bar, accesible por navegación
          }}
        />

        <Tabs.Screen
          name="classroom-progress"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="child-progress"
          options={{
            href: null,
          }}
        />

        {/* SOLO PARA NIÑOS: Mantener index como pantalla de juegos */}
        {!isNino && (
          <Tabs.Screen
            name="index"
            options={{
              href: null,
            }}
          />
        )}

        {/* OCULTAR DASHBOARDS DE OTROS ROLES */}
        {!isDocente && (
          <Tabs.Screen
            name="teacher-dashboard"
            options={{
              href: null,
            }}
          />
        )}

        {!isRepresentante && (
          <Tabs.Screen
            name="parent-dashboard"
            options={{
              href: null,
            }}
          />
        )}

        {/* OCULTAR EXPLORE PARA DOCENTES */}
        {isDocente && (
          <Tabs.Screen
            name="explore"
            options={{
              href: null,
            }}
          />
        )}
      </Tabs>

      {/* FLOATING ACTION BUTTON SOLO PARA DOCENTES */}
      {isDocente && <TeacherFloatingMenu />}
    </>
  );
}