// components/TeacherFloatingMenu.tsx - FLOATING MENU PARA DOCENTES
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface FloatingActionProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

const FloatingAction: React.FC<FloatingActionProps> = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.floatingAction} onPress={onPress}>
    <View style={[styles.actionButton, { backgroundColor: color }]}>
      <MaterialIcons name={icon as any} size={20} color="#FFF" />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function TeacherFloatingMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    setIsOpen(!isOpen);
  };

  const showParentManagementGuide = () => {
    Alert.alert(
      'Guía: Gestión de Representantes 📚',
      `Como docente puedes:

• Vincular hasta 2 representantes por estudiante
• Configurar permisos específicos para cada uno
• Designar representante principal
• Gestionar contactos de emergencia

Pasos:
1. Ve a "Mis Aulas"
2. Selecciona estudiantes
3. Toca el ícono de familia
4. Busca y vincula representantes`,
      [
        { text: 'Entendido' },
        { 
          text: 'Ir a Aulas', 
          onPress: () => router.push('/(tabs)/classroom-management' as any) 
        }
      ]
    );
  };

  const handleAction = (action: string) => {
    toggleMenu(); // Cerrar el menú primero
    
    setTimeout(() => {
      switch (action) {
        case 'create-classroom':
          router.push('/(tabs)/classroom-management' as any);
          break;
        case 'titanic-admin':
          router.push('/(tabs)/titanic-admin' as any);
          break;
        case 'reports':
          router.push('/(tabs)/teacher-reports' as any);
          break;
        
        // 🆕 NUEVA ACCIÓN: Gestionar representantes
        case 'manage-parents':
          Alert.alert(
            'Gestionar Representantes 👨‍👩‍👧‍👦',
            'Selecciona cómo quieres gestionar las relaciones familiares:',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Ver mis Aulas',
                onPress: () => router.push('/(tabs)/classroom-management' as any)
              },
              {
                text: 'Guía Rápida',
                onPress: () => showParentManagementGuide()
              }
            ]
          );
          break;
          
        case 'settings':
          // Implementar configuración más adelante
          console.log('Abrir configuración');
          break;
        default:
          break;
      }
    }, 100);
  };

  const mainButtonRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'], // Rotar 135 grados para hacer una X
  });

  const actionScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const actionTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -70], // Separación vertical entre botones
  });

  return (
    <View style={styles.container}>
      {/* Overlay para cerrar el menú */}
      {isOpen && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={toggleMenu}
        />
      )}

      {/* Acciones flotantes */}
      <View style={styles.actionsContainer}>
        {/* Configuración */}
        <Animated.View
          style={[
            styles.actionContainer,
            {
              transform: [
                { scale: actionScale },
                { translateY: Animated.multiply(actionTranslateY, 5) }
              ],
            },
          ]}
        >
          <FloatingAction
            icon="settings"
            label="Configuración"
            color="#9E9E9E"
            onPress={() => handleAction('settings')}
          />
        </Animated.View>

        {/* Gestionar Representantes - NUEVO */}
        <Animated.View
          style={[
            styles.actionContainer,
            {
              transform: [
                { scale: actionScale },
                { translateY: Animated.multiply(actionTranslateY, 4) }
              ],
            },
          ]}
        >
          <FloatingAction
            icon="family-restroom"
            label="Representantes"
            color="#2196F3"
            onPress={() => handleAction('manage-parents')}
          />
        </Animated.View>

        {/* Reportes */}
        <Animated.View
          style={[
            styles.actionContainer,
            {
              transform: [
                { scale: actionScale },
                { translateY: Animated.multiply(actionTranslateY, 3) }
              ],
            },
          ]}
        >
          <FloatingAction
            icon="bar-chart"
            label="Reportes"
            color="#4CAF50"
            onPress={() => handleAction('reports')}
          />
        </Animated.View>

        {/* Admin Titanic */}
        <Animated.View
          style={[
            styles.actionContainer,
            {
              transform: [
                { scale: actionScale },
                { translateY: Animated.multiply(actionTranslateY, 2) }
              ],
            },
          ]}
        >
          <FloatingAction
            icon="edit"
            label="Admin Titanic"
            color="#00BCD4"
            onPress={() => handleAction('titanic-admin')}
          />
        </Animated.View>

        {/* Crear Aula */}
        <Animated.View
          style={[
            styles.actionContainer,
            {
              transform: [
                { scale: actionScale },
                { translateY: actionTranslateY }
              ],
            },
          ]}
        >
          <FloatingAction
            icon="school"
            label="Crear Aula"
            color="#2196F3"
            onPress={() => handleAction('create-classroom')}
          />
        </Animated.View>
      </View>

      {/* Botón principal */}
      <TouchableOpacity
        style={styles.mainButton}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.mainButtonInner,
            { transform: [{ rotate: mainButtonRotation }] }
          ]}
        >
          <MaterialIcons name="add" size={28} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Por encima del tab bar
    right: 20,
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'transparent',
  },
  actionsContainer: {
    alignItems: 'center',
  },
  actionContainer: {
    marginBottom: 10,
  },
  floatingAction: {
    alignItems: 'center',
    minWidth: 120,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  mainButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});