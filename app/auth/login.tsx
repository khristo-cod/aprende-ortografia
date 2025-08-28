// app/auth/login.tsx
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

interface FormData {
  email: string;
  password: string;
}

interface ABCBlockProps {
  letter: string;
  color: string;
  style?: object;
}

const LoginScreen = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'El email es requerido');
      return false;
    }
    if (!formData.password.trim()) {
      Alert.alert('Error', 'La contraseña es requerida');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        Alert.alert(
          '¡Login Exitoso! 👋',
          `Bienvenido ${result.user?.name}`,
          [
            {
              text: 'Continuar', 
              onPress: () => {
                console.log('✅ Login exitoso, redirigiendo...');
                router.replace('/(tabs)/' as any);
              },
            },
          ]
        );
      } else {
        Alert.alert('❌ Error de Login', result.error || 'Error desconocido');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const ABCBlock: React.FC<ABCBlockProps> = ({ letter, color, style }) => (
    <View style={[styles.abcBlock, { backgroundColor: color }, style]}>
      <Text style={styles.abcText}>{letter}</Text>
    </View>
  );

  const DecorativeElement: React.FC<{ style?: object; children: React.ReactNode }> = ({ style, children }) => (
    <View style={[styles.decorativeElement, style]}>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#7986CB', '#5C6BC0', '#3F51B5']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Elementos decorativos */}
        <ABCBlock letter="A" color="#4CAF50" style={styles.blockA} />
        <ABCBlock letter="B" color="#FF9800" style={styles.blockB} />
        <ABCBlock letter="C" color="#E91E63" style={styles.blockC} />

        <DecorativeElement style={styles.gameController}>
          <Text style={styles.gameControllerEmoji}>🎮</Text>
        </DecorativeElement>

        <DecorativeElement style={styles.puzzlePiece1}>
          <Text style={styles.puzzleEmoji}>🧩</Text>
        </DecorativeElement>

        <DecorativeElement style={styles.puzzlePiece2}>
          <Text style={styles.puzzleEmoji}>🧩</Text>
        </DecorativeElement>

        <DecorativeElement style={styles.computer}>
          <Text style={styles.computerEmoji}>💻</Text>
        </DecorativeElement>

        {/* Estrellas decorativas */}
        <View style={styles.star1}>
          <Text style={styles.starEmoji}>⭐</Text>
        </View>
        <View style={styles.star2}>
          <Text style={styles.starEmoji}>⭐</Text>
        </View>
        <View style={styles.star3}>
          <Text style={styles.starEmoji}>⭐</Text>
        </View>
        <View style={styles.star4}>
          <Text style={styles.starEmoji}>⭐</Text>
        </View>
        <View style={styles.star5}>
          <Text style={styles.starEmoji}>⭐</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>Entra a tu Cuenta</Text>
              <Text style={styles.headerSubtitle}>
                INICIA SESIÓN PARA CONTINUAR
              </Text>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Campo Nombre/Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NOMBRE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="JOSE PÉREZ"
                placeholderTextColor="#E1BEE7"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text.toLowerCase())}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Campo Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONTRASEÑA</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  placeholder="**********"
                  placeholderTextColor="#E1BEE7"
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons 
                    name={showPassword ? 'visibility' : 'visibility-off'} 
                    size={24} 
                    color="#E1BEE7" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón de login */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#BDBDBD', '#9E9E9E'] : ['#9C27B0', '#673AB7']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>INGRESAR</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Link a registro */}
            <TouchableOpacity 
              style={styles.registerLink}
              onPress={() => router.push('/auth/register' as any)}
            >
              <Text style={styles.registerLinkText}>
                ¿No tienes cuenta? Regístrate aquí
              </Text>
            </TouchableOpacity>
          </View>

          {/* Indicadores de página */}
          <View style={styles.pageIndicators}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: index <= 1 ? '#6366F1' : '#E1E5E9',
                    width: index <= 1 ? 24 : 8,
                  }
                ]}
              />
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  decorativeElement: {
    position: 'absolute',
    zIndex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  blockA: {
    top: 150,
    right: 40,
  },
  blockB: {
    top: 250,
    left: 30,
  },
  blockC: {
    bottom: 200,
    right: 30,
  },
  abcText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  gameController: {
    top: 80,
    right: 80,
    width: 50,
    height: 50,
  },
  computer: {
    bottom: 120,
    left: 20,
    width: 60,
    height: 50,
  },
  puzzlePiece1: {
    top: 320,
    left: 20,
    width: 40,
    height: 40,
  },
  puzzlePiece2: {
    bottom: 280,
    right: 80,
    width: 35,
    height: 35,
  },
  gameControllerEmoji: {
    fontSize: 24,
  },
  computerEmoji: {
    fontSize: 28,
  },
  puzzleEmoji: {
    fontSize: 18,
  },
  star1: {
    position: 'absolute',
    top: 100,
    left: 50,
    opacity: 0.6,
  },
  star2: {
    position: 'absolute',
    top: 180,
    right: 100,
    opacity: 0.4,
  },
  star3: {
    position: 'absolute',
    top: 300,
    right: 50,
    opacity: 0.5,
  },
  star4: {
    position: 'absolute',
    bottom: 150,
    left: 80,
    opacity: 0.3,
  },
  star5: {
    position: 'absolute',
    bottom: 250,
    right: 120,
    opacity: 0.6,
  },
  starEmoji: {
    fontSize: 20,
    color: '#FFD700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 10,
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: '90%',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  formContainer: {
    zIndex: 10,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: '#9C27B0',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 16,
    padding: 5,
  },
  loginButton: {
    marginTop: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  loginButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  loginButtonGradient: {
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
  },
  registerLinkText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
});

export default LoginScreen;