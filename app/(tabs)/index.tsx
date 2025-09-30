// 🎨 NUEVO DISEÑO: app/(tabs)/index.tsx - HomeScreen con estilo dashboard moderno

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

const { width } = Dimensions.get('window');

// 🎮 Componente para tarjetas de juegos
interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
  isLocked?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ 
  title, 
  description, 
  icon, 
  color, 
  onPress, 
  isLocked = false 
}) => (
  <TouchableOpacity 
    style={[styles.gameCard, isLocked && styles.lockedCard]} 
    onPress={onPress}
    disabled={isLocked}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={isLocked ? ['#E0E0E0', '#BDBDBD'] : [color, `${color}CC`]}
      style={styles.gameCardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.gameCardContent}>
        <View style={styles.gameIconContainer}>
          <MaterialIcons 
            name={icon as any} 
            size={40} 
            color={isLocked ? '#999' : '#FFF'} 
          />
          {isLocked && (
            <View style={styles.lockOverlay}>
              <MaterialIcons name="lock" size={20} color="#666" />
            </View>
          )}
        </View>
        <Text style={[styles.gameTitle, isLocked && styles.lockedText]}>
          {title}
        </Text>
        <Text style={[styles.gameDescription, isLocked && styles.lockedText]}>
          {description}
        </Text>
        {!isLocked && (
          <View style={styles.playButton}>
            <MaterialIcons name="play-arrow" size={16} color="#FFF" />
            <Text style={styles.playButtonText}>JUGAR</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

// 🎯 Componente para tarjeta de funcionalidad especial
interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
  badge?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  title, 
  description, 
  icon, 
  color, 
  onPress,
  badge 
}) => (
  <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.featureIcon, { backgroundColor: color }]}>
      <MaterialIcons name={icon as any} size={24} color="#FFF" />
      {badge && (
        <View style={styles.featureBadge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
    <MaterialIcons name="chevron-right" size={20} color="#CCC" />
  </TouchableOpacity>
);

export default function HomeScreen() {
  const router = useRouter();
  const { 
    user, 
    logout, 
    isAuthenticated, 
    saveGameProgress, 
    checkStudentEnrollmentStatus,
    getStudentParents
  } = useAuth();

  // 🆕 NUEVO: Estado para información de representantes
  const [parentInfo, setParentInfo] = useState({
    hasParents: false,
    parentCount: 0,
    primaryParent: null as any,
    canViewProgress: false
  });

  // 🆕 Verificar inscripción del estudiante al cargar la pantalla
  useEffect(() => {
    if (user?.role === 'nino') {
      checkStudentEnrollment();
      loadParentInfo(); // 🆕 NUEVO
    }
  }, [user]);

  // 🆕 NUEVA FUNCIÓN: Cargar información de representantes
  const loadParentInfo = async () => {
    if (user?.role === 'nino' && user?.id) {
      try {
        const result = await getStudentParents(user.id);
        if (result.success && result.parents) {
          const primaryParent = result.parents.find(p => p.is_primary);
          setParentInfo({
            hasParents: result.parents.length > 0,
            parentCount: result.parents.length,
            primaryParent: primaryParent,
            canViewProgress: result.parents.some(p => p.can_view_progress)
          });
        }
      } catch (error) {
        console.log('Error cargando información de representantes:', error);
      }
    }
  };

  const checkStudentEnrollment = async () => {
    try {
      console.log('🔍 Verificando inscripción del estudiante...');
      const result = await checkStudentEnrollmentStatus();
      
      if (result.success && !result.isEnrolled) {
        console.log('📝 Estudiante no inscrito, mostrando opción de selección');
        setTimeout(() => {
          Alert.alert(
            'Seleccionar Aula 🏫',
            'Para acceder a todas las funciones, necesitas inscribirte en un aula.',
            [
              { text: 'Más tarde', style: 'cancel' },
              {
                text: 'Seleccionar Aula',
                onPress: () => {
                  console.log('🚀 Navegando a selección de aula');
                  router.push('/(tabs)/student-classroom-selection' as any);
                }
              }
            ]
          );
        }, 1000);
      } else if (result.success && result.isEnrolled) {
        console.log('✅ Estudiante ya inscrito en:', result.classroom?.name);
      }
    } catch (error) {
      console.log('🚨 Error al verificar inscripción:', error);
    }
  };
  
  const irAlJuego = async (gameType: string, route: string) => {
    if (isAuthenticated) {
      await saveGameProgress({
        game_type: gameType,
        score: 0,
        total_questions: 0,
        correct_answers: 0,
        incorrect_answers: 0,
        time_spent: 0,
        completed: false,
        session_data: { action: 'game_started', timestamp: Date.now() }
      });
    }
    router.push(route as any);
  };

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
                router.replace('/auth/welcome' as any);
              }
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión correctamente');
    }
  };

  const goToAuth = () => {
    router.push('/auth/welcome' as any);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'nino': return 'Estudiante';
      case 'docente': return 'Docente';
      case 'representante': return 'Representante';
      default: return 'Usuario';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'nino': return 'school';
      case 'docente': return 'person';
      case 'representante': return 'family-restroom';
      default: return 'person';
    }
  };

  return (
    <LinearGradient colors={['#4FC3F7', '#29B6F6', '#03A9F4']} style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.appTitle}>🎮 Aprende Ortografía</Text>
            <Text style={styles.appSubtitle}>Diversión y aprendizaje en cada juego</Text>
          </View>
          
          {isAuthenticated && (
            <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* User Card */}
        {isAuthenticated && user ? (
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <MaterialIcons 
                name={getRoleIcon(user.role) as any} 
                size={32} 
                color="#03A9F4" 
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>¡Hola, {user.name}! 👋</Text>
              <Text style={styles.userRole}>
                {getRoleDisplayName(user.role)}
              </Text>
            </View>
            <View style={styles.userBadge}>
              <Text style={styles.badgeText}>VIP</Text>
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <MaterialIcons name="person-add" size={48} color="#FFA726" />
            <Text style={styles.guestTitle}>¡Únete a la diversión!</Text>
            <Text style={styles.guestDescription}>
              Regístrate para guardar tu progreso y acceder a todas las funcionalidades
            </Text>
            <TouchableOpacity style={styles.authButton} onPress={goToAuth}>
              <Text style={styles.authButtonText}>Iniciar Sesión / Registrarse</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 🆕 NUEVO: Card de información familiar */}
        {isAuthenticated && user?.role === 'nino' && (
          <View style={styles.familyInfoCard}>
            <View style={styles.familyHeader}>
              <MaterialIcons name="family-restroom" size={24} color="#4CAF50" />
              <Text style={styles.familyTitle}>Mi Familia</Text>
            </View>
            
            {parentInfo.hasParents ? (
              <View style={styles.familyContent}>
                <Text style={styles.familyText}>
                  {parentInfo.parentCount} representante{parentInfo.parentCount > 1 ? 's' : ''} vinculado{parentInfo.parentCount > 1 ? 's' : ''}
                </Text>
                
                {parentInfo.primaryParent && (
                  <View style={styles.primaryParentInfo}>
                    <MaterialIcons name="star" size={16} color="#FFD700" />
                    <Text style={styles.primaryParentText}>
                      {parentInfo.primaryParent.name} (Principal)
                    </Text>
                  </View>
                )}
                
                <View style={styles.familyPermissions}>
                  <View style={styles.permissionItem}>
                    <MaterialIcons 
                      name={parentInfo.canViewProgress ? "visibility" : "visibility-off"} 
                      size={16} 
                      color={parentInfo.canViewProgress ? "#4CAF50" : "#CCC"} 
                    />
                    <Text style={[
                      styles.permissionText,
                      { color: parentInfo.canViewProgress ? "#4CAF50" : "#CCC" }
                    ]}>
                      {parentInfo.canViewProgress ? "Pueden ver tu progreso" : "Sin acceso al progreso"}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.familyEncouragement}>
                  ¡Tus representantes pueden seguir tu progreso! 🌟
                </Text>
              </View>
            ) : (
              <View style={styles.noFamilyContent}>
                <Text style={styles.noFamilyText}>
                  Aún no tienes representantes vinculados
                </Text>
                <Text style={styles.noFamilySubtext}>
                  Pídele a tu docente que vincule a tu familia para que puedan ver tu progreso
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Student Classroom Feature */}
        {user?.role === 'nino' && (
          <FeatureCard
            title="Mi Aula"
            description="Inscríbete en un aula para acceder a todas las funciones"
            icon="school"
            color="#4CAF50"
            badge="NUEVO"
            onPress={() => router.push('/(tabs)/student-classroom-selection' as any)}
          />
        )}

        {/* Games Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Juegos Disponibles</Text>
          
          <View style={styles.gamesGrid}>
            <GameCard
              title="Ortografía"
              description="Completa las palabras correctamente"
              icon="edit"
              color="#FF5722"
              onPress={() => irAlJuego('ortografia', '/(tabs)/JuegoDeOrtografia')}
            />
            
            <GameCard
              title="Explorar"
              description="Descubre reglas de ortografía"
              icon="explore"
              color="#FF9800"
              onPress={() => irAlJuego('reglas', '/(tabs)/explore')}
            />
            
            <GameCard
              title="Titanic"
              description="¡Salva el barco adivinando palabras!"
              icon="directions-boat"
              color="#2196F3"
              onPress={() => irAlJuego('titanic', '/(tabs)/titanic')}
            />
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 Características</Text>
          
          <FeatureCard
            title="Progreso Guardado"
            description={isAuthenticated 
              ? "Tu progreso se guarda automáticamente" 
              : "Regístrate para guardar tu progreso"
            }
            icon={isAuthenticated ? "trending-up" : "save"}
            color={isAuthenticated ? "#4CAF50" : "#FF9800"}
            onPress={() => {
              if (!isAuthenticated) {
                goToAuth();
              }
            }}
          />
          
          {/* 🆕 ACTUALIZADO: Característica de progreso familiar */}
          <FeatureCard
            title="Progreso Familiar"
            description={parentInfo.hasParents 
              ? `${parentInfo.parentCount} representante${parentInfo.parentCount > 1 ? 's' : ''} puede${parentInfo.parentCount > 1 ? 'n' : ''} ver tu progreso` 
              : "Pide a tu docente que vincule a tu familia"}
            icon={parentInfo.hasParents ? "family-restroom" : "person-add"}
            color={parentInfo.hasParents ? "#4CAF50" : "#FF9800"}
            onPress={() => {
              if (parentInfo.hasParents) {
                Alert.alert(
                  'Tu Familia 👨‍👩‍👧‍👦',
                  `Tienes ${parentInfo.parentCount} representante${parentInfo.parentCount > 1 ? 's' : ''} vinculado${parentInfo.parentCount > 1 ? 's' : ''}.\n\n${parentInfo.primaryParent ? `Representante principal: ${parentInfo.primaryParent.name}` : ''}\n\n${parentInfo.canViewProgress ? '✅ Pueden ver tu progreso' : '❌ No pueden ver tu progreso'}`,
                  [{ text: 'Entendido' }]
                );
              } else {
                Alert.alert(
                  'Sin Familia Vinculada',
                  'Aún no tienes representantes vinculados. Pídele a tu docente que agregue a tu familia para que puedan seguir tu progreso académico.',
                  [{ text: 'Entendido' }]
                );
              }
            }}
          />
          
          <FeatureCard
            title="Múltiples Niveles"
            description="Juegos adaptados a diferentes niveles de dificultad"
            icon="stars"
            color="#9C27B0"
            onPress={() => {}}
          />
          
          <FeatureCard
            title="Aprendizaje Divertido"
            description="Metodología basada en juegos educativos"
            icon="psychology"
            color="#00BCD4"
            onPress={() => {}}
          />
        </View>

        {/* 🆕 MOTIVACIÓN FAMILIAR */}
        {parentInfo.hasParents && user?.role === 'nino' && (
          <View style={styles.motivationSection}>
            <View style={styles.motivationCard}>
              <MaterialIcons name="favorite" size={32} color="#E91E63" />
              <Text style={styles.motivationTitle}>¡Tu familia te apoya!</Text>
              <Text style={styles.motivationText}>
                {parentInfo.primaryParent?.name} y {parentInfo.parentCount > 1 ? 'otros representantes' : 'tu familia'} pueden ver tu progreso. 
                ¡Sigue esforzándote para hacer que se sientan orgullosos!
              </Text>
            </View>
          </View>
        )}

        {/* 🆕 ACTUALIZADO: Stats Section for Authenticated Users */}
        {isAuthenticated && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>📊 Tu Progreso</Text>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <MaterialIcons name="games" size={24} color="#4CAF50" />
                <Text style={styles.statLabel}>Juegos Jugados</Text>
                <Text style={styles.statValue}>0</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="star" size={24} color="#FFC107" />
                <Text style={styles.statLabel}>Mejor Puntuación</Text>
                <Text style={styles.statValue}>0</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="trending-up" size={24} color="#2196F3" />
                <Text style={styles.statLabel}>Racha Actual</Text>
                <Text style={styles.statValue}>0</Text>
              </View>
              
              {/* 🆕 NUEVO: Estadística de familia */}
              {user?.role === 'nino' && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <MaterialIcons 
                      name="family-restroom" 
                      size={24} 
                      color={parentInfo.hasParents ? "#4CAF50" : "#CCC"} 
                    />
                    <Text style={styles.statLabel}>Familia</Text>
                    <Text style={styles.statValue}>{parentInfo.parentCount}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🎓 Aprende jugando • 🚀 Mejora tu ortografía • 🏆 Alcanza nuevos niveles
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  profileButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 25,
  },
  userCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  userBadge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  guestCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5722',
    marginTop: 16,
    marginBottom: 8,
  },
  guestDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  authButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  authButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // 🆕 NUEVOS ESTILOS PARA INFORMACIÓN FAMILIAR
  familyInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  familyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  familyContent: {
    gap: 8,
  },
  familyText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  primaryParentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  primaryParentText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
  familyPermissions: {
    marginTop: 4,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  permissionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  familyEncouragement: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 8,
  },
  noFamilyContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  noFamilyText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  noFamilySubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  motivationSection: {
    marginBottom: 30,
  },
  motivationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#E91E63',
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    marginTop: 12,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginHorizontal: 20,
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gamesGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  gameCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  lockedCard: {
    opacity: 0.6,
  },
  gameCardGradient: {
    padding: 20,
  },
  gameCardContent: {
    alignItems: 'center',
  },
  gameIconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  lockOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  lockedText: {
    color: '#999',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  playButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  featureBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  statsSection: {
    marginBottom: 30,
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  footer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
});