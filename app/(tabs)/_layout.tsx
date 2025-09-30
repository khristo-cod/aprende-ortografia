// app/(tabs)/_layout.tsx - LAYOUT CORREGIDO CON GESTIÓN DE REPRESENTANTES

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
        
        {/* =================== DASHBOARD ESPECÍFICO POR ROL =================== */}
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

        {/* =================== JUEGOS - Visibles para estudiantes y representantes =================== */}
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

        {/* =================== GESTIÓN DE AULAS - Solo para docentes =================== */}
        <Tabs.Screen
          name="classroom-management"
          options={{
            href: isDocente ? undefined : null, // SOLO VISIBLE PARA DOCENTES
            title: 'Mis Aulas',
            tabBarIcon: ({ color }) => <MaterialIcons name="school" size={28} color={color} />,
          }}
        />

        {/* =================== PANTALLAS OCULTAS - No aparecen en tabs pero son navegables =================== */}
        <Tabs.Screen
          name="teacher-reports"
          options={{
            href: null, // OCULTO del tab bar
          }}
        />
        
        <Tabs.Screen
          name="titanic-admin"
          options={{
            href: null, // OCULTO del tab bar
          }}
        />

        <Tabs.Screen
          name="student-classroom-selection"
          options={{
            href: null, // OCULTO del tab bar
          }}
        />

        <Tabs.Screen
          name="classroom-progress"
          options={{
            href: null, // OCULTO del tab bar
          }}
        />

        <Tabs.Screen
          name="child-progress"
          options={{
            href: null, // OCULTO del tab bar
          }}
        />

        {/* NUEVAS PANTALLAS PARA GESTIÓN DE REPRESENTANTES */}
        <Tabs.Screen
          name="student-parents-management"
          options={{
            href: null, // OCULTO del tab bar - Solo accesible desde classroom-management
            title: 'Gestión de Representantes',
          }}
        />

        <Tabs.Screen
          name="parent-link-child"
          options={{
            href: null, // OCULTO del tab bar - Solo accesible desde parent-dashboard
            title: 'Vincular Hijo/a',
          }}
        />

        {/* =================== OCULTAR PANTALLAS SEGÚN ROLES =================== */}
        
        {/* Ocultar index para docentes y representantes (tienen sus dashboards) */}
        {!isNino && (
          <Tabs.Screen
            name="index"
            options={{
              href: null, // OCULTO para no-estudiantes
            }}
          />
        )}

        {/* Ocultar dashboards de otros roles */}
        {!isDocente && (
          <Tabs.Screen
            name="teacher-dashboard"
            options={{
              href: null, // OCULTO para no-docentes
            }}
          />
        )}

        {!isRepresentante && (
          <Tabs.Screen
            name="parent-dashboard"
            options={{
              href: null, // OCULTO para no-representantes
            }}
          />
        )}

        {/* Ocultar juegos para docentes (pueden acceder por floating menu) */}
        {isDocente && (
          <>
            <Tabs.Screen
              name="JuegoDeOrtografia"
              options={{
                href: null, // OCULTO para docentes
              }}
            />
            <Tabs.Screen
              name="titanic"
              options={{
                href: null, // OCULTO para docentes
              }}
            />
            <Tabs.Screen
              name="explore"
              options={{
                href: null, // OCULTO para docentes
              }}
            />
          </>
        )}
      </Tabs>

      {/* FLOATING ACTION BUTTON SOLO PARA DOCENTES */}
      {isDocente && <TeacherFloatingMenu />}
    </>
  );
}