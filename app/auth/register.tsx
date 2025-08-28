// app/auth/register.tsx
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
  name: string;
  email: string;
  password: string;
  role: string;
}

interface Role {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface ABCBlockProps {
  letter: string;
  color: string;
  style?: object;
}

const RegisterScreen = () => {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const roles: Role[] = [
    { id: 'docente', label: 'DOCENTES', icon: '👩‍🏫', color: '#9C27B0' },
    { id: 'representante', label: 'REPRESENTANTES', icon: '👨‍👩‍👧‍👦', color: '#673AB7' },
    { id: 'nino', label: 'NIÑOS', icon: '👶👧', color: '#3F51B5' },
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleSelect = (roleId: string) => {
    setFormData(prev => ({ ...prev, role: roleId }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'El email es requerido');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Ingresa un email válido');
      return false;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (!formData.role) {
      Alert.alert('Error', 'Selecciona un perfil de registro');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );

      if (result.success) {
        Alert.alert(
          '¡Registro Exitoso! 🎉',
          `Bienvenido ${result.user?.name}`,
          [
            {
              text: 'Continuar',
              onPress: () => {
                console.log('✅ Registro exitoso, redirigiendo...');
                router.replace('/(tabs)/' as any);
              },
            },
          ]
        );
      } else {
        Alert.alert('❌ Error de Registro', result.error || 'Error desconocido');
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
        colors={['#4FC3F7', '#29B6F6', '#03A9F4']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Elementos decorativos */}
        <ABCBlock letter="A" color="#4CAF50" style={styles.blockA} />
        <ABCBlock letter="B" color="#9C27B0" style={styles.blockB} />
        <ABCBlock letter="C" color="#FF9800" style={styles.blockC} />

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

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>Crea una cuenta nueva.</Text>
              <Text style={styles.headerSubtitle}>
                ¿YA ESTÁS REGISTRADO ? INICIA SESIÓN ACÁ.
              </Text>
              <TouchableOpacity 
                onPress={() => router.push('/auth/login' as any)}
                style={styles.loginLink}
              >
                <Text style={styles.loginLinkText}>Iniciar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Campo Nombre */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NOMBRE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="JOSE PÉREZ"
                placeholderTextColor="#E1BEE7"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                autoCapitalize="words"
              />
            </View>

            {/* Campo Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-MAIL</Text>
              <TextInput
                style={styles.textInput}
                placeholder="JOSEPEREZ@GMAIL.COM"
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

            {/* Selector de Perfil */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PERFIL DE REGISTRO</Text>
              <Text style={styles.roleSubtitle}>SELECCIONAR</Text>
              
              <View style={styles.rolesContainer}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.roleButton,
                      { backgroundColor: role.color },
                      formData.role === role.id && styles.roleButtonSelected
                    ]}
                    onPress={() => handleRoleSelect(role.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.roleIcon}>{role.icon}</Text>
                    <Text style={styles.roleText}>{role.label}</Text>
                    {formData.role === role.id && (
                      <View style={styles.selectedIndicator}>
                        <MaterialIcons name="check" size={16} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Botón de registro */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#BDBDBD', '#9E9E9E'] : ['#9C27B0', '#673AB7']}
                style={styles.registerButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.registerButtonText}>REGISTRAR</Text>
                )}
              </LinearGradient>
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
    top: 120,
    right: 40,
  },
  blockB: {
    top: 200,
    left: 30,
  },
  blockC: {
    bottom: 180,
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
    top: 300,
    right: 20,
    width: 40,
    height: 40,
  },
  puzzlePiece2: {
    bottom: 250,
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    zIndex: 10,
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: '90%',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  loginLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loginLinkText: {
    color: '#2196F3',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  formContainer: {
    zIndex: 10,
  },
  inputGroup: {
    marginBottom: 20,
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
    paddingVertical: 15,
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
    top: 15,
    padding: 5,
  },
  roleSubtitle: {
    fontSize: 12,
    color: '#333',
    marginBottom: 15,
    marginLeft: 4,
  },
  rolesContainer: {
    gap: 12,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    position: 'relative',
  },
  roleButtonSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  roleIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  roleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    right: 15,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButton: {
    marginTop: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  registerButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  registerButtonGradient: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
});

export default RegisterScreen;