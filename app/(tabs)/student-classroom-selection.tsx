// app/(tabs)/student-classroom-selection.tsx - CORREGIDO

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

interface AvailableClassroom {
  id: number;
  name: string;
  grade_level: string;
  section: string;
  school_year: string;
  max_students: number;
  teacher_name: string;
  current_students: number;
}

export default function StudentClassroomSelection() {
  const router = useRouter();
  const { user, isNino, getAvailableClassrooms, studentSelfEnroll } = useAuth();
  const [classrooms, setClassrooms] = useState<AvailableClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrolling, setEnrolling] = useState<number | null>(null);

  useEffect(() => {
    if (!isNino) {
      Alert.alert('Acceso Denegado', 'Esta pantalla es solo para estudiantes');
      router.back();
      return;
    }
    loadAvailableClassrooms();
  }, []);

  const loadAvailableClassrooms = async () => {
    try {
      setLoading(true);
      const result = await getAvailableClassrooms();
      
      if (result.success && result.classrooms) {
        setClassrooms(result.classrooms);
      } else {
        Alert.alert('Error', result.error || 'No se pudieron cargar las aulas');
      }
    } catch (error) {
      console.error('Error cargando aulas:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAvailableClassrooms();
    setRefreshing(false);
  };

  const handleEnrollInClassroom = async (classroom: AvailableClassroom) => {
    Alert.alert(
      'Confirmar Inscripción',
      `¿Deseas inscribirte en:\n\n${classroom.name}\n${classroom.grade_level} - Sección ${classroom.section}\nProfesor: ${classroom.teacher_name}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Inscribirme',
          onPress: async () => {
            setEnrolling(classroom.id);
            try {
              const result = await studentSelfEnroll(classroom.id);
              
              if (result.success) {
                Alert.alert(
                  '¡Inscripción Exitosa! 🎉',
                  result.message || 'Te has inscrito correctamente',
                  [
                    {
                      text: 'Continuar',
                      onPress: () => {
                        router.replace('/(tabs)/' as any); // Ir a juegos
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Error', result.error || 'No se pudo completar la inscripción');
              }
            } catch (error) {
              console.error('Error en inscripción:', error);
              Alert.alert('Error', 'Error de conexión');
            } finally {
              setEnrolling(null);
            }
          }
        }
      ]
    );
  };

  const renderClassroomItem = ({ item }: { item: AvailableClassroom }) => (
    <View style={styles.classroomCard}>
      <View style={styles.cardHeader}>
        <View style={styles.classroomInfo}>
          <Text style={styles.classroomName}>{item.name}</Text>
          <Text style={styles.classroomDetails}>
            {item.grade_level} - Sección {item.section}
          </Text>
          <Text style={styles.teacherName}>Profesor: {item.teacher_name}</Text>
          <Text style={styles.schoolYear}>{item.school_year}</Text>
        </View>
        
        <View style={styles.enrollmentInfo}>
          <View style={styles.capacityIndicator}>
            <MaterialIcons name="people" size={20} color="#2196F3" />
            <Text style={styles.capacityText}>
              {item.current_students}/{item.max_students}
            </Text>
          </View>
          
          <View style={[
            styles.availabilityBadge,
            { backgroundColor: item.current_students < item.max_students ? '#4CAF50' : '#FF5722' }
          ]}>
            <Text style={styles.availabilityText}>
              {item.current_students < item.max_students ? 'Disponible' : 'Llena'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.enrollButton,
          (enrolling === item.id || item.current_students >= item.max_students) && styles.enrollButtonDisabled
        ]}
        onPress={() => handleEnrollInClassroom(item)}
        disabled={enrolling === item.id || item.current_students >= item.max_students}
      >
        {enrolling === item.id ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name="how-to-reg" size={20} color="#FFF" />
            <Text style={styles.enrollButtonText}>
              {item.current_students >= item.max_students ? 'Aula Llena' : 'Inscribirme'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#E8F5E8', '#C8E6C9']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Cargando aulas disponibles...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#E8F5E8', '#C8E6C9', '#A5D6A7']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Seleccionar Aula</Text>
        
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <MaterialIcons name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Info del estudiante */}
      <View style={styles.studentInfo}>
        <Text style={styles.welcomeText}>¡Hola {user?.name}! 👋</Text>
        <Text style={styles.instructionText}>
          Selecciona el aula en la que quieres estudiar
        </Text>
      </View>

      {/* Lista de aulas */}
      <FlatList
        data={classrooms}
        renderItem={renderClassroomItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="school" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No hay aulas disponibles</Text>
            <Text style={styles.emptySubtext}>
              Contacta a tu profesor para que te inscriba
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  refreshButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 20,
  },
  studentInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  classroomCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  classroomInfo: {
    flex: 1,
  },
  classroomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  classroomDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 2,
  },
  schoolYear: {
    fontSize: 12,
    color: '#999',
  },
  enrollmentInfo: {
    alignItems: 'flex-end',
    gap: 8,
  },
  capacityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  capacityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  enrollButtonDisabled: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  enrollButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
    lineHeight: 20,
  },
});