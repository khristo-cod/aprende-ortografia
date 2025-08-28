// app/index.tsx - PANTALLA PRINCIPAL CON AUTENTICACIÓN COMPLETA
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function IndexScreen() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // Usuario autenticado - ir a la app principal
        console.log(`✅ Usuario autenticado: ${user.name} (${user.role})`);
        router.replace('/(tabs)/' as any);
      } else {
        // No autenticado - ir a pantallas de auth
        console.log('❌ Usuario no autenticado - redirigir a welcome');
        router.replace('/auth/welcome' as any);
      }
    }
  }, [loading, isAuthenticated, user]);

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
        
        <Text style={styles.subtitle}>
          Sistema de autenticación inicializado
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
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
  },
});