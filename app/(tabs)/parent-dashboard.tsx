// app/(tabs)/parent-dashboard.tsx - Dashboard de Representantes
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Student, useAuth } from '../../src/contexts/AuthContext';

interface ChildCardProps {
  child: Student;
  onViewProgress: () => void;
}

interface ProgressSummary {
  totalGames: number;
  averageScore: number;
  lastActivity: string;
  favoriteGame: string;
  improvement: 'up' | 'down' | 'stable';
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onViewProgress }) => {
  const getProgressColor = (score: number): string => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays - 1} días`;
    return date.toLocaleDateString('es-ES');
  };

  return (
    <View style={styles.childCard}>
      <View style={styles.childHeader}>
        <View style={styles.childAvatar}>
          <MaterialIcons name="child-care" size={32} color="#2196F3" />
        </View>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child.name}</Text>
          <Text style={styles.childClass}>
            {child.classroom_name} - Prof. {child.teacher_name}
          </Text>
          <Text style={styles.lastActivity}>
            Última actividad: {formatDate(child.last_activity)}
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{child.total_games_played}</Text>
            <Text style={styles.statLabel}>Juegos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: getProgressColor(child.average_score || 0) }]}>
              {Math.round(child.average_score || 0)}
            </Text>
            <Text style={styles.statLabel}>Promedio</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons 
              name="trending-up" 
              size={20} 
              color={getProgressColor(child.average_score || 0)} 
            />
            <Text style={styles.statLabel}>Progreso</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.viewProgressButton} onPress={onViewProgress}>
          <Text style={styles.viewProgressText}>Ver Progreso Detallado</Text>
          <MaterialIcons name="chevron-right" size={20} color="#2196F3" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const QuickTipCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  color: string;
}> = ({ title, description, icon, color }) => (
  <View style={styles.tipCard}>
    <View style={[styles.tipIcon, { backgroundColor: color }]}>
      <MaterialIcons name={icon as any} size={20} color="#FFF" />
    </View>
    <View style={styles.tipContent}>
      <Text style={styles.tipTitle}>{title}</Text>
      <Text style={styles.tipDescription}>{description}</Text>
    </View>
  </View>
);

export default function ParentDashboard() {
  const router = useRouter();
  const { 
    user, 
    logout,
    isAuthenticated, 
    isRepresentante,
    getMyChildren 
  } = useAuth();

  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const parentingTips = [
    {
      title: "Tiempo de juego",
      description: "15-20 minutos diarios de práctica son más efectivos que sesiones largas",
      icon: "schedule",
      color: "#4CAF50"
    },
    {
      title: "Refuerzo positivo",
      description: "Celebra los pequeños logros y el esfuerzo, no solo los resultados",
      icon: "star",
      color: "#FF9800"
    },
    {
      title: "Crear rutina",
      description: "Un horario fijo para las actividades educativas mejora el aprendizaje",
      icon: "event",
      color: "#2196F3"
    },
    {
      title: "Ambiente tranquilo",
      description: "Un espacio sin distracciones ayuda a mantener la concentración",
      icon: "home",
      color: "#9C27B0"
    }
  ];

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
          router.replace('/auth/login' as any);
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
                router.replace('/auth/login' as any);
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

  useEffect(() => {
    if (!isAuthenticated || !isRepresentante) {
      Alert.alert(
        'Acceso Denegado', 
        'Esta función es solo para representantes.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }
    loadChildren();
  }, [isAuthenticated, isRepresentante]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const result = await getMyChildren();
      
      if (result.success && result.children) {
        setChildren(result.children);
      } else {
        console.error('Error cargando hijos:', result.error);
        if (result.error) {
          Alert.alert('Error', result.error);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChildren();
    setRefreshing(false);
  };

  const handleViewChildProgress = (child: Student) => {
    router.push(`/(tabs)/child-progress?id=${child.id}&name=${encodeURIComponent(child.name)}` as any);
  };

  const getOverallProgress = (): {
    totalGames: number;
    averageScore: number;
    activeChildren: number;
  } => {
    const totalGames = children.reduce((sum, child) => sum + (child.total_games_played || 0), 0);
    const averageScore = children.length > 0 
      ? children.reduce((sum, child) => sum + (child.average_score || 0), 0) / children.length 
      : 0;
    const activeChildren = children.filter(child => 
      child.last_activity && new Date(child.last_activity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      totalGames: Math.round(totalGames),
      averageScore: Math.round(averageScore),
      activeChildren
    };
  };

  if (loading) {
    return (
      <LinearGradient colors={['#FFF3E0', '#FFE0B2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </LinearGradient>
    );
  }

  const overallProgress = getOverallProgress();

  return (
    <LinearGradient colors={['#FFF3E0', '#FFE0B2', '#FFCC02']} style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.welcomeText}>Hola, {user?.name}</Text>
            <Text style={styles.roleText}>Seguimiento del Progreso</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => Alert.alert('Notificaciones', 'Próximamente: Centro de notificaciones')}
          >
            <MaterialIcons name="notifications" size={24} color="#FF9800" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>2</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Mis hijos */}
        <View style={styles.childrenSection}>
          <Text style={styles.sectionTitle}>Mis Hijos</Text>
          {children.length > 0 ? (
            children.map(child => (
              <ChildCard
                key={child.id}
                child={child}
                onViewProgress={() => handleViewChildProgress(child)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="family-restroom" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No hay niños asociados a tu cuenta</Text>
              <Text style={styles.emptySubtext}>
                Contacta al docente para asociar a tus hijos
              </Text>
            </View>
          )}
        </View>

        {/* Consejos para padres */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Consejos para el Aprendizaje</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScroll}>
            {parentingTips.map((tip, index) => (
              <QuickTipCard
                key={index}
                title={tip.title}
                description={tip.description}
                icon={tip.icon}
                color={tip.color}
              />
            ))}
          </ScrollView>
        </View>

        {/* Enlaces útiles para padres */}
        <View style={styles.linksSection}>
          <Text style={styles.sectionTitle}>Recursos Útiles</Text>
          <View style={styles.linksList}>
            <TouchableOpacity 
              style={styles.linkCard}
              onPress={() => Alert.alert('Comunicación', 'Próximamente: Chat con docentes')}
            >
              <MaterialIcons name="chat" size={20} color="#4CAF50" />
              <Text style={styles.linkText}>Comunicación con Docentes</Text>
              <MaterialIcons name="chevron-right" size={16} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkCard}
              onPress={() => Alert.alert('Calendario', 'Próximamente: Calendario académico')}
            >
              <MaterialIcons name="event" size={20} color="#2196F3" />
              <Text style={styles.linkText}>Calendario Académico</Text>
              <MaterialIcons name="chevron-right" size={16} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkCard}
              onPress={() => Alert.alert('Recursos', 'Próximamente: Guías de apoyo')}
            >
              <MaterialIcons name="library-books" size={20} color="#FF9800" />
              <Text style={styles.linkText}>Guías de Apoyo</Text>
              <MaterialIcons name="chevron-right" size={16} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkCard}
              onPress={() => router.push('/(tabs)/index' as any)}
            >
              <MaterialIcons name="games" size={20} color="#9C27B0" />
              <Text style={styles.linkText}>Jugar con mis Hijos</Text>
              <MaterialIcons name="chevron-right" size={16} color="#CCC" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recordatorios */}
        <View style={styles.remindersSection}>
          <Text style={styles.sectionTitle}>Recordatorios</Text>
          <View style={styles.remindersList}>
            <View style={styles.reminderCard}>
              <MaterialIcons name="info" size={20} color="#2196F3" />
              <Text style={styles.reminderText}>
                Motiva a tus hijos a jugar 15 minutos diarios para mejores resultados
              </Text>
            </View>
            <View style={styles.reminderCard}>
              <MaterialIcons name="schedule" size={20} color="#FF9800" />
              <Text style={styles.reminderText}>
                Los mejores horarios de aprendizaje son por la mañana y tarde temprano
              </Text>
            </View>
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
    color: '#FF9800',
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
    color: '#E65100',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#FF9800',
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F44336',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  summarySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  summaryCard: {
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
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  childrenSection: {
    marginBottom: 20,
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
  childCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  childClass: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  lastActivity: {
    fontSize: 12,
    color: '#999',
  },
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  viewProgressButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  viewProgressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2196F3',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
    lineHeight: 20,
  },
  tipsSection: {
    marginBottom: 20,
  },
  tipsScroll: {
    paddingHorizontal: 20,
  },
  tipCard: {
    width: 200,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tipDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  linksSection: {
    marginBottom: 20,
  },
  linksList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  remindersSection: {
    marginBottom: 40,
  },
  remindersList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  reminderText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
});