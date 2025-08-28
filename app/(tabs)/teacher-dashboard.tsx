// app/(tabs)/teacher-dashboard.tsx - Dashboard del Docente
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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
  type: 'game' | 'student_enrolled' | 'word_created';
  title: string;
  subtitle: string;
  timestamp: string;
  icon: string;
  color: string;
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
    getTeacherDashboard,
    getMyClassrooms
  } = useAuth();

  const [dashboard, setDashboard] = useState<TeacherDashboardType | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Actividad reciente simulada
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
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => Alert.alert('Perfil', 'Próximamente: Configuración de perfil')}
          >
            <MaterialIcons name="account-circle" size={40} color="#FFF" />
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
            <QuickActionCard
              title="Palabras Titanic"
              description="Administrar vocabulario del juego"
              icon="edit"
              color="#00BCD4"
              onPress={() => router.push('/(tabs)/titanic-admin' as any)}
            />
            <QuickActionCard
              title="Reportes"
              description="Ver progreso de estudiantes"
              icon="bar-chart"
              color="#4CAF50"
              onPress={() => Alert.alert('Reportes', 'Próximamente: Sistema de reportes')}
            />
            <QuickActionCard
              title="Configuración"
              description="Ajustes y preferencias"
              icon="settings"
              color="#FF9800"
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
});