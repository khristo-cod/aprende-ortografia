// app/(tabs)/teacher-dashboard.tsx - Dashboard del Docente
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Classroom, TeacherDashboard as TeacherDashboardType, useAuth } from '../../src/contexts/AuthContext';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  subtitle?: string;
}

interface RecentActivityItem {
  id: string;
  type: 'game' | 'student_enrolled' | 'word_created' | 'parent_linked';
  title: string;
  subtitle: string;
  timestamp: string;
  icon: string;
  color: string;
}

interface ParentStats {
  totalParents: number;
  studentsWithParents: number;
  studentsWithoutParents: number;
  averageParentsPerStudent: number;
}

const { width } = Dimensions.get('window');

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statIcon}>
      <MaterialIcons name={icon as any} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
}> = ({ title, description, icon, color, onPress }) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: color }]}>
      <MaterialIcons name={icon as any} size={24} color="#FFF" />
    </View>
    <View style={styles.actionContent}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription}>{description}</Text>
    </View>
    <MaterialIcons name="chevron-right" size={20} color="#CCC" />
  </TouchableOpacity>
);

const RecentActivityCard: React.FC<{ activity: RecentActivityItem }> = ({ activity }) => (
  <View style={styles.activityCard}>
    <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
      <MaterialIcons name={activity.icon as any} size={16} color="#FFF" />
    </View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{activity.title}</Text>
      <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
      <Text style={styles.activityTime}>{activity.timestamp}</Text>
    </View>
  </View>
);

export default function TeacherDashboard() {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    isDocente,
    logout,
    getTeacherDashboard,
    getMyClassrooms
  } = useAuth();

  const [dashboard, setDashboard] = useState<TeacherDashboardType | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [parentStats, setParentStats] = useState<ParentStats>({
    totalParents: 0,
    studentsWithParents: 0,
    studentsWithoutParents: 0,
    averageParentsPerStudent: 0
  });

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
          router.replace('/auth/login' as any); // 🚀 Ir directo a login
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
                router.replace('/auth/login' as any); // 🚀 Ir directo a login
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
  
  // Actividad reciente actualizada con nuevos tipos
  const [recentActivity] = useState<RecentActivityItem[]>([
    {
      id: '1',
      type: 'game',
      title: 'Juego completado',
      subtitle: 'Ana García terminó el Titanic',
      timestamp: 'Hace 15 minutos',
      icon: 'games',
      color: '#4CAF50'
    },
    {
      id: '2',
      type: 'student_enrolled',
      title: 'Nuevo estudiante',
      subtitle: 'Carlos Pérez se inscribió en 3ro A',
      timestamp: 'Hace 2 horas',
      icon: 'person-add',
      color: '#2196F3'
    },
    {
      id: '3',
      type: 'parent_linked',
      title: 'Representante vinculado',
      subtitle: 'María López se vinculó con Ana García',
      timestamp: 'Hace 4 horas',
      icon: 'family-restroom',
      color: '#2196F3'
    },
    {
      id: '4',
      type: 'word_created',
      title: 'Palabra agregada',
      subtitle: 'Creaste "COMPUTADORA" para Titanic',
      timestamp: 'Hace 1 día',
      icon: 'create',
      color: '#FF9800'
    }
  ]);

  useEffect(() => {
    if (!isAuthenticated || !isDocente) {
      Alert.alert(
        'Acceso Denegado', 
        'Esta función es solo para docentes.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, isDocente]);

  const loadParentStatistics = async () => {
    try {
      // Por ahora simulamos los datos - luego se conectará con el backend
      setParentStats({
        totalParents: 45,
        studentsWithParents: 28,
        studentsWithoutParents: 7,
        averageParentsPerStudent: 1.6
      });
    } catch (error) {
      console.log('Error cargando estadísticas de representantes:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [dashboardResult, classroomsResult] = await Promise.all([
        getTeacherDashboard(),
        getMyClassrooms()
      ]);
      
      if (dashboardResult.success && dashboardResult.dashboard) {
        setDashboard(dashboardResult.dashboard);
      }
      
      if (classroomsResult.success && classroomsResult.classrooms) {
        setClassrooms(classroomsResult.classrooms.slice(0, 3)); // Mostrar solo 3
      }

      // 🆕 NUEVO: Cargar estadísticas de representantes
      await loadParentStatistics();
      
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <LinearGradient colors={['#E8F5E8', '#C8E6C9']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Cargando dashboard...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#E8F5E8', '#C8E6C9', '#A5D6A7']} style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.welcomeText}>Bienvenido, Prof. {user?.name}</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          {/* 🆕 BOTÓN DE LOGOUT */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Estadísticas principales */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Aulas"
              value={dashboard?.total_classrooms || 0}
              icon="school"
              color="#2196F3"
              subtitle="activas"
            />
            <StatCard
              title="Estudiantes"
              value={dashboard?.total_students || 0}
              icon="people"
              color="#4CAF50"
              subtitle="inscritos"
            />
            <StatCard
              title="Actividad"
              value={dashboard?.recent_activity || 0}
              icon="trending-up"
              color="#FF9800"
              subtitle="última semana"
            />
            <StatCard
              title="Palabras"
              value={dashboard?.words_created || 0}
              icon="create"
              color="#9C27B0"
              subtitle="creadas"
            />
          </View>
        </View>

        {/* 🆕 NUEVO: Estadísticas de familias */}
        <View style={styles.familyStatsSection}>
          <Text style={styles.sectionTitle}>Estadísticas Familiares</Text>
          <View style={styles.familyStatsCard}>
            <View style={styles.familyStatsGrid}>
              <View style={styles.familyStatItem}>
                <MaterialIcons name="family-restroom" size={24} color="#2196F3" />
                <Text style={styles.familyStatValue}>{parentStats.totalParents}</Text>
                <Text style={styles.familyStatLabel}>Representantes</Text>
              </View>
              
              <View style={styles.familyStatItem}>
                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                <Text style={styles.familyStatValue}>{parentStats.studentsWithParents}</Text>
                <Text style={styles.familyStatLabel}>Con familia</Text>
              </View>
              
              <View style={styles.familyStatItem}>
                <MaterialIcons name="warning" size={24} color="#FF9800" />
                <Text style={styles.familyStatValue}>{parentStats.studentsWithoutParents}</Text>
                <Text style={styles.familyStatLabel}>Sin familia</Text>
              </View>
              
              <View style={styles.familyStatItem}>
                <MaterialIcons name="timeline" size={24} color="#9C27B0" />
                <Text style={styles.familyStatValue}>{parentStats.averageParentsPerStudent.toFixed(1)}</Text>
                <Text style={styles.familyStatLabel}>Promedio</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.manageFamiliesButton}
              onPress={() => router.push('/(tabs)/classroom-management' as any)}
            >
              <MaterialIcons name="family-restroom" size={20} color="#FFF" />
              <Text style={styles.manageFamiliesText}>Gestionar Familias</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Acciones rápidas */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              title="Gestionar Aulas"
              description="Ver y administrar tus aulas"
              icon="school"
              color="#2196F3"
              onPress={() => router.push('/(tabs)/classroom-management' as any)}
            />
            
            {/* 🆕 NUEVA ACCIÓN: GESTIÓN DE REPRESENTANTES */}
            <QuickActionCard
              title="Gestionar Familias"
              description="Vincular representantes con estudiantes"
              icon="family-restroom"
              color="#2196F3"
              onPress={() => router.push('/(tabs)/classroom-management' as any)}
            />
            
            {/* 🎮 SECCIÓN: ADMINISTRACIÓN DE JUEGOS */}
            <QuickActionCard
              title="Admin Titanic"
              description="Gestionar palabras del Titanic"
              icon="directions-boat"
              color="#00BCD4"
              onPress={() => router.push('/(tabs)/titanic-admin' as any)}
            />
            
            <QuickActionCard
              title="Admin Ortografía"
              description="Gestionar palabras de ortografía"
              icon="spellcheck"
              color="#4CAF50"
              onPress={() => Alert.alert('Próximamente', 'Panel de administración de Ortografía en desarrollo')}
            />
            
            <QuickActionCard
              title="Admin Explorar"
              description="Gestionar reglas y ejemplos"
              icon="explore"
              color="#FF9800"
              onPress={() => Alert.alert('Próximamente', 'Panel de administración de Explorar en desarrollo')}
            />
            
            <QuickActionCard
              title="Reportes"
              description="Ver progreso de estudiantes"
              icon="bar-chart"
              color="#9C27B0"
              onPress={() => Alert.alert('Reportes', 'Próximamente: Sistema de reportes avanzado')}
            />
            
            <QuickActionCard
              title="Configuración"
              description="Ajustes y preferencias"
              icon="settings"
              color="#607D8B"
              onPress={() => Alert.alert('Configuración', 'Próximamente: Panel de configuración')}
            />
          </View>
        </View>

        {/* Mis Aulas */}
        <View style={styles.classroomsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Aulas</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/classroom-management' as any)}
            >
              <Text style={styles.seeAllText}>Ver todas</Text>
              <MaterialIcons name="chevron-right" size={16} color="#2196F3" />
            </TouchableOpacity>
          </View>

          {classrooms.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classroomsScroll}>
              {classrooms.map(classroom => (
                <TouchableOpacity 
                  key={classroom.id} 
                  style={styles.classroomMiniCard}
                  onPress={() => router.push(`/(tabs)/classroom-progress?id=${classroom.id}` as any)}
                >
                  <View style={styles.classroomHeader}>
                    <MaterialIcons name="class" size={24} color="#2196F3" />
                    <Text style={styles.studentCountBadge}>
                      {classroom.student_count}/{classroom.max_students}
                    </Text>
                  </View>
                  <Text style={styles.classroomMiniName}>{classroom.name}</Text>
                  <Text style={styles.classroomMiniDetail}>
                    {classroom.grade_level} - {classroom.section}
                  </Text>
                  <Text style={styles.classroomYear}>{classroom.school_year}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyClassrooms}>
              <MaterialIcons name="school" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No tienes aulas creadas</Text>
              <TouchableOpacity 
                style={styles.createClassroomButton}
                onPress={() => router.push('/(tabs)/classroom-management' as any)}
              >
                <Text style={styles.createClassroomText}>Crear mi primera aula</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 🆕 ACTUALIZADO: Administración del Sistema */}
        <View style={styles.gamesAdminSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Administración del Sistema</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => Alert.alert('Funcionalidades', 'Panel completo de administración')}
            >
              <Text style={styles.seeAllText}>Ver todo</Text>
              <MaterialIcons name="chevron-right" size={16} color="#2196F3" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gamesScroll}>
            {/* TITANIC - YA DISPONIBLE */}
            <TouchableOpacity 
              style={[styles.gameAdminCard, { borderLeftColor: '#00BCD4' }]}
              onPress={() => router.push('/(tabs)/titanic-admin' as any)}
            >
              <View style={styles.gameCardHeader}>
                <MaterialIcons name="directions-boat" size={32} color="#00BCD4" />
                <View style={styles.gameStatus}>
                  <Text style={[styles.statusText, { color: '#4CAF50' }]}>Activo</Text>
                </View>
              </View>
              <Text style={styles.gameCardTitle}>Titanic</Text>
              <Text style={styles.gameCardDescription}>Gestionar palabras y categorías</Text>
              <View style={styles.gameCardStats}>
                <Text style={styles.statItem}>📝 {dashboard?.words_created || 0} palabras</Text>
                <Text style={styles.statItem}>🎯 CRUD completo</Text>
              </View>
            </TouchableOpacity>

            {/* 🆕 NUEVO: GESTIÓN DE REPRESENTANTES */}
            <TouchableOpacity 
              style={[styles.gameAdminCard, { borderLeftColor: '#2196F3' }]}
              onPress={() => router.push('/(tabs)/classroom-management' as any)}
            >
              <View style={styles.gameCardHeader}>
                <MaterialIcons name="family-restroom" size={32} color="#2196F3" />
                <View style={styles.gameStatus}>
                  <Text style={[styles.statusText, { color: '#4CAF50' }]}>Activo</Text>
                </View>
              </View>
              <Text style={styles.gameCardTitle}>Representantes</Text>
              <Text style={styles.gameCardDescription}>Gestionar vínculos familiares</Text>
              <View style={styles.gameCardStats}>
                <Text style={styles.statItem}>👨‍👩‍👧‍👦 Hasta 2 por estudiante</Text>
                <Text style={styles.statItem}>🔧 Gestión completa</Text>
              </View>
            </TouchableOpacity>

            {/* ORTOGRAFÍA - EN DESARROLLO */}
            <TouchableOpacity 
              style={[styles.gameAdminCard, { borderLeftColor: '#4CAF50', opacity: 0.7 }]}
              onPress={() => Alert.alert('Próximamente', 'Panel de administración de Ortografía en desarrollo')}
            >
              <View style={styles.gameCardHeader}>
                <MaterialIcons name="spellcheck" size={32} color="#4CAF50" />
                <View style={styles.gameStatus}>
                  <Text style={[styles.statusText, { color: '#FF9800' }]}>Desarrollo</Text>
                </View>
              </View>
              <Text style={styles.gameCardTitle}>Ortografía</Text>
              <Text style={styles.gameCardDescription}>Próximamente: Gestión de palabras</Text>
              <View style={styles.gameCardStats}>
                <Text style={styles.statItem}>🚧 En desarrollo</Text>
                <Text style={styles.statItem}>🎯 Próxima versión</Text>
              </View>
            </TouchableOpacity>

            {/* EXPLORAR - EN DESARROLLO */}
            <TouchableOpacity 
              style={[styles.gameAdminCard, { borderLeftColor: '#FF9800', opacity: 0.7 }]}
              onPress={() => Alert.alert('Próximamente', 'Panel de administración de Explorar en desarrollo')}
            >
              <View style={styles.gameCardHeader}>
                <MaterialIcons name="explore" size={32} color="#FF9800" />
                <View style={styles.gameStatus}>
                  <Text style={[styles.statusText, { color: '#FF9800' }]}>Desarrollo</Text>
                </View>
              </View>
              <Text style={styles.gameCardTitle}>Explorar</Text>
              <Text style={styles.gameCardDescription}>Próximamente: Gestión de reglas</Text>
              <View style={styles.gameCardStats}>
                <Text style={styles.statItem}>🚧 En desarrollo</Text>
                <Text style={styles.statItem}>🎯 Próxima versión</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Actividad reciente */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          <View style={styles.activityList}>
            {recentActivity.map(activity => (
              <RecentActivityCard key={activity.id} activity={activity} />
            ))}
          </View>
        </View>

        {/* Enlaces útiles */}
        <View style={styles.linksSection}>
          <Text style={styles.sectionTitle}>Enlaces Útiles</Text>
          <View style={styles.linksGrid}>
            <TouchableOpacity 
              style={styles.linkCard}
              onPress={() => router.push('/(tabs)/index' as any)}
            >
              <MaterialIcons name="home" size={20} color="#4CAF50" />
              <Text style={styles.linkText}>Inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkCard}
              onPress={() => router.push('/(tabs)/titanic' as any)}
            >
              <MaterialIcons name="games" size={20} color="#2196F3" />
              <Text style={styles.linkText}>Jugar Titanic</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkCard}
              onPress={() => Alert.alert('Ayuda', 'Próximamente: Centro de ayuda')}
            >
              <MaterialIcons name="help" size={20} color="#FF9800" />
              <Text style={styles.linkText}>Ayuda</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 16,
    fontWeight: '500',
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
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#4CAF50',
    textTransform: 'capitalize',
  },
  profileButton: {
    padding: 4,
  },
  statsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: {
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
  },
  // 🆕 NUEVOS ESTILOS PARA ESTADÍSTICAS FAMILIARES
  familyStatsSection: {
    marginBottom: 20,
  },
  familyStatsCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  familyStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  familyStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  familyStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    marginBottom: 2,
  },
  familyStatLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  manageFamiliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  manageFamiliesText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    paddingHorizontal: 20,
    gap: 8,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
  },
  classroomsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  classroomsScroll: {
    paddingHorizontal: 20,
  },
  classroomMiniCard: {
    width: 140,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  classroomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentCountBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2196F3',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  classroomMiniName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  classroomMiniDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  classroomYear: {
    fontSize: 10,
    color: '#999',
  },
  emptyClassrooms: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 20,
  },
  createClassroomButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createClassroomText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activitySection: {
    marginBottom: 20,
  },
  activityList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 10,
    color: '#999',
  },
  linksSection: {
    marginBottom: 40,
  },
  linksGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  linkCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  linkText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  gamesAdminSection: {
    marginBottom: 20,
  },
  gamesScroll: {
    paddingHorizontal: 20,
  },
  gameAdminCard: {
    width: 200,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameStatus: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  gameCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  gameCardDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  gameCardStats: {
    gap: 4,
  },
  statItem: {
    fontSize: 10,
    color: '#999',
  },
});