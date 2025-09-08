// 🔄 ACTUALIZAR app/index.tsx
// Para que navegue al dashboard correcto según el rol:

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function IndexScreen() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('🔍 Index: verificando estado de auth...');
    console.log('🔍 Loading:', loading, 'isAuthenticated:', isAuthenticated, 'User:', user?.name, 'Role:', user?.role);
    
    if (!loading) {
      if (isAuthenticated && user) {
        console.log(`✅ Usuario autenticado: ${user.name} (${user.role})`);
        
        // 🚀 NAVEGACIÓN BASADA EN ROL
        switch (user.role) {
          case 'docente':
            console.log('👨‍🏫 Navegando a teacher-dashboard');
            router.replace('/(tabs)/teacher-dashboard' as any);
            break;
          case 'representante':
            console.log('👨‍👩‍👧‍👦 Navegando a parent-dashboard');
            router.replace('/(tabs)/parent-dashboard' as any);
            break;
          case 'nino':
            console.log('🧒 Navegando a pantalla de juegos');
            router.replace('/(tabs)/' as any); // index para niños
            break;
          default:
            console.log('🤷 Rol desconocido, navegando a welcome');
            router.replace('/auth/welcome' as any);
            break;
        }
      } else {
        console.log('❌ Usuario no autenticado - redirigir a welcome');
        router.replace('/auth/welcome' as any);
      }
    }
  }, [loading, isAuthenticated, user, router]);

  return (
    <LinearGradient
      colors={['#FFE082', '#FFD54F', '#FFC107']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>🎮 Aprende Ortografía</Text>
        
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
        
        <Text style={styles.loadingText}>
          {loading ? 'Verificando sesión...' : 'Redirigiendo...'}
        </Text>
        
        {user && (
          <Text style={styles.userInfo}>
            {user.name} ({user.role})
          </Text>
        )}
        
        <Text style={styles.subtitle}>
          Sistema de autenticación con roles
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  userInfo: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
  },
});