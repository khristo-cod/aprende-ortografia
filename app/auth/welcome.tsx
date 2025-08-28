// app/auth/welcome.tsx - Versión corregida para TypeScript
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Definir tipos para las props del componente ABCBlock
interface ABCBlockProps {
  letter: string;
  color: string;
  style?: object;
}

const WelcomeScreen = () => {
  const router = useRouter();

  // Componente ABCBlock con tipos correctos
  const ABCBlock: React.FC<ABCBlockProps> = ({ letter, color, style }) => (
    <View style={[styles.abcBlock, { backgroundColor: color }, style]}>
      <Text style={styles.abcText}>{letter}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#FFE082', '#FFD54F', '#FFC107']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Elementos decorativos */}
      <View style={styles.pencil}>
        <Image
          source={require('../../assets/images/edit-icon-cha.png')}
          style={styles.pencilImage}
          contentFit="contain"
        />
      </View>

      <View style={styles.notebook}>
        <Text style={styles.notebookEmoji}>📖</Text>
      </View>

      <ABCBlock letter="A" color="#98FB98" style={styles.blockA} />
      <ABCBlock letter="B" color="#87CEEB" style={styles.blockB} />
      <ABCBlock letter="C" color="#DDA0DD" style={styles.blockC} />

      {/* Contenido principal */}
      <View style={styles.mainContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Aprende</Text>
          <Text style={styles.subTitle}>Ortografía</Text>
          <Text style={styles.tagline}>¡Diviértete Jugando!</Text>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/auth/register' as any)} // Solución temporal para el tipo de ruta
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF5252']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.registerButtonText}>REGISTRO</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login' as any)} // Solución temporal para el tipo de ruta
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Indicadores de página */}
      <View style={styles.pageIndicators}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor: index <= 0 ? '#6366F1' : '#D1D5DB',
                width: index <= 0 ? 24 : 8,
              }
            ]}
          />
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  pencil: {
    position: 'absolute',
    top: 80,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  pencilImage: {
    width: 40,
    height: 40,
  },
  notebook: {
    position: 'absolute',
    top: 100,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 15,
    backgroundColor: '#4FC3F7',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  notebookEmoji: {
    fontSize: 24,
  },
  abcBlock: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  blockA: {
    top: 180,
    right: 80,
  },
  blockB: {
    top: 250,
    left: 40,
  },
  blockC: {
    bottom: 200,
    right: 50,
  },
  abcText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4FC3F7',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    transform: [{ rotate: '-5deg' }],
  },
  subTitle: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginTop: -8,
  },
  tagline: {
    fontSize: 18,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: 10,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  registerButton: {
    width: '70%',
    marginBottom: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  loginButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
});

export default WelcomeScreen;