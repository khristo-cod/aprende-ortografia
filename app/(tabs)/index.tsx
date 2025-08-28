// app/(tabs)/index.tsx - HOMESCREEN CON TITANIC CORREGIDO
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

function CardButton({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.cardButton}>
      <View>{children}</View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated, saveGameProgress } = useAuth();

  const irAlJuego = async () => {
    if (isAuthenticated) {
      await saveGameProgress({
        game_type: 'ortografia',
        score: 0,
        total_questions: 0,
        correct_answers: 0,
        incorrect_answers: 0,
        time_spent: 0,
        completed: false,
        session_data: { action: 'game_started', timestamp: Date.now() }
      });
    }
    router.push('/(tabs)/JuegoDeOrtografia' as any);
  };

  const irAExplorar = async () => {
    if (isAuthenticated) {
      await saveGameProgress({
        game_type: 'reglas',
        score: 0,
        total_questions: 0,
        correct_answers: 0,
        incorrect_answers: 0,
        time_spent: 0,
        completed: false,
        session_data: { action: 'game_started', timestamp: Date.now() }
      });
    }
    router.push('/(tabs)/explore' as any);
  };
  
  const irATitanic = async () => {
    if (isAuthenticated) {
      await saveGameProgress({
        game_type: 'titanic',
        score: 0,
        total_questions: 0,
        correct_answers: 0,
        incorrect_answers: 0,
        time_spent: 0,
        completed: false,
        session_data: { action: 'game_started', timestamp: Date.now() }
      });
    }
    router.push('/(tabs)/titanic' as any);
  };

  const irAHangman = async () => {
    if (isAuthenticated) {
      await saveGameProgress({
        game_type: 'ahorcado',
        score: 0,
        total_questions: 0,
        correct_answers: 0,
        incorrect_answers: 0,
        time_spent: 0,
        completed: false,
        session_data: { action: 'game_started', timestamp: Date.now() }
      });
    }
    router.push('/(tabs)/hangman' as any);
  };

  // FUNCIÓN DE LOGOUT COMPATIBLE WEB + MOBILE
  const handleLogout = async () => {
    try {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(
          `🚪 ¿Estás seguro que deseas cerrar sesión, ${user?.name}?`
        );
        
        if (confirmed) {
          console.log('🔄 Cerrando sesión...');
          await logout();
          console.log('✅ Sesión cerrada exitosamente');
          window.alert('👋 ¡Hasta luego! Sesión cerrada correctamente');
          router.replace('/auth/welcome' as any);
        }
      } else {
        Alert.alert(
          '🚪 Cerrar Sesión',
          `¿Estás seguro que deseas salir, ${user?.name}?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Salir', 
              style: 'destructive',
              onPress: async () => {
                console.log('🔄 Cerrando sesión...');
                await logout();
                console.log('✅ Sesión cerrada exitosamente');
                Alert.alert(
                  '👋 ¡Hasta luego!',
                  'Sesión cerrada correctamente',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.replace('/auth/welcome' as any)
                    }
                  ]
                );
              }
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      if (Platform.OS === 'web') {
        window.alert('❌ Error: No se pudo cerrar la sesión correctamente');
      } else {
        Alert.alert('Error', 'No se pudo cerrar la sesión correctamente');
      }
    }
  };

  const goToAuth = () => {
    router.push('/auth/welcome' as any);
  };

  const goToTitanicAdmin = async () => {
    if (isAuthenticated && user?.role === 'docente') {
      router.push('/(tabs)/titanic-admin' as any);
    } else {
      Alert.alert(
        '🔒 Acceso Denegado',
        'Esta función es solo para docentes administradores.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#1D3', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/edit-icon-cha.png')}
          style={styles.reactLogo}
        />
      }>
      
      {/* Información del usuario autenticado */}
      {isAuthenticated && user ? (
        <View style={styles.userInfoCard}>
          <View style={styles.userInfoContent}>
            <Text style={styles.welcomeText}>
              ¡Hola {user.name}! 👋
            </Text>
            <Text style={styles.roleText}>
              {user.role === 'nino' ? '🎮 Estudiante' : 
               user.role === 'docente' ? '👨‍🏫 Docente' : '👨‍👩‍👧‍👦 Representante'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪 Salir</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Invitación para usuarios no autenticados
        <View style={styles.guestCard}>
          <Text style={styles.guestText}>
            🔐 ¡Regístrate para guardar tu progreso y acceder a todas las funcionalidades!
          </Text>
          <TouchableOpacity style={styles.authButton} onPress={goToAuth}>
            <Text style={styles.authButtonText}>Iniciar Sesión / Registrarse</Text>
          </TouchableOpacity>
        </View>
      )}

      <CardButton onPress={irAlJuego}>
        <ThemedView style={styles.stepContainer}>
          <ThemedText style={styles.stepConta} type="subtitle">Jugar ahora</ThemedText>
          <Text style={styles.stepConta}>La ortografía es como un juego de pistas. ¿Listo para ganar? 🏆📚</Text>
        </ThemedView>
      </CardButton>

      <CardButton onPress={irAExplorar}>
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Explorar</ThemedText>
          <Text>"Domina el arte de escribir sin errores y sorprende a todos." 🎩✨</Text>
        </ThemedView>
      </CardButton>

      {/* NUEVO: Botón del Titanic */}
      <CardButton onPress={irATitanic}>
        <ThemedView style={[styles.stepContainer, styles.titanicContainer]}>
          <ThemedText type="subtitle" style={styles.titanicTitle}>🚢 Titanic</ThemedText>
          <Text style={styles.titanicDescription}>
            "¡Salva el barco adivinando palabras! ¿Podrás evitar que se hunda?" ⚓🌊
          </Text>
        </ThemedView>
      </CardButton>

      <CardButton onPress={irAHangman}>
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Ahorcado</ThemedText>
          <Text>"¡Adivina la palabra y salva al ahorcado! ¿Te atreves?" ⛓️🤔</Text>
        </ThemedView>
      </CardButton>

      {/* PANEL DE ADMINISTRACIÓN - Solo para docentes */}
      {isAuthenticated && user?.role === 'docente' && (
        <CardButton onPress={goToTitanicAdmin}>
          <ThemedView style={[styles.stepContainer, styles.adminContainer]}>
            <ThemedText type="subtitle" style={styles.adminTitle}>🛠️ Administrador</ThemedText>
            <Text style={styles.adminDescription}>
              "Gestiona palabras y configuraciones del Titanic" ⚙️📝
            </Text>
          </ThemedView>
        </CardButton>
      )}

      {/* Información adicional */}
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          {isAuthenticated 
            ? '✅ Tu progreso se guarda automáticamente'
            : '💡 Regístrate para guardar tu progreso'
          }
        </Text>
      </View>

      {/* Debug info - solo en desarrollo */}
      {__DEV__ && (
        <View style={styles.debugCard}>
          <Text style={styles.debugText}>
            🔧 Plataforma: {Platform.OS} | Usuario: {user?.name || 'No auth'}
          </Text>
        </View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepContainer: {
    gap: 4,
    marginBottom: 4,
  },
  stepConta: {
    backgroundColor: '#fffbe6',
  },
  reactLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardButton: {
    backgroundColor: '#fffbe6',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 24,
    paddingHorizontal: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  // NUEVO: Estilos para el Titanic
  titanicContainer: {
    backgroundColor: '#E3F2FD',
  },
  titanicTitle: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
  },
  titanicDescription: {
    backgroundColor: '#E3F2FD',
    color: '#1565C0',
  },
  // NUEVO: Estilos para el panel de administración
  adminContainer: {
    backgroundColor: '#FFF3E0',
  },
  adminTitle: {
    backgroundColor: '#FFF3E0',
    color: '#F57C00',
  },
  adminDescription: {
    backgroundColor: '#FFF3E0',
    color: '#EF6C00',
  },
  userInfoCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  userInfoContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 2,
  },
  roleText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  guestCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  guestText: {
    fontSize: 14,
    color: '#F57C00',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  authButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  authButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#7B1FA2',
    textAlign: 'center',
    fontWeight: '500',
  },
  debugCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
});