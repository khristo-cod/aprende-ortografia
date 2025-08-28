// app/(tabs)/classroom-management.tsx - Gestión de Aulas
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Classroom, Student, useAuth } from '../../src/contexts/AuthContext';

interface ClassroomCardProps {
  classroom: Classroom;
  onPress: () => void;
  onManageStudents: () => void;
}

const ClassroomCard: React.FC<ClassroomCardProps> = ({ classroom, onPress, onManageStudents }) => (
  <TouchableOpacity style={styles.classroomCard} onPress={onPress}>
    <View style={styles.cardHeader}>
      <View style={styles.cardTitle}>
        <Text style={styles.classroomName}>{classroom.name}</Text>
        <Text style={styles.classroomDetails}>
          {classroom.grade_level} - Sección {classroom.section}
        </Text>
        <Text style={styles.schoolYear}>{classroom.school_year}</Text>
      </View>
      <View style={styles.studentCount}>
        <MaterialIcons name="people" size={24} color="#2196F3" />
        <Text style={styles.countText}>{classroom.student_count}/{classroom.max_students}</Text>
      </View>
    </View>
    
    <View style={styles.cardActions}>
      <TouchableOpacity style={styles.actionButton} onPress={onManageStudents}>
        <MaterialIcons name="group-add" size={16} color="#4CAF50" />
        <Text style={styles.actionText}>Estudiantes</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <MaterialIcons name="bar-chart" size={16} color="#FF9800" />
        <Text style={styles.actionText}>Ver Progreso</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

export default function ClassroomManagement() {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    isDocente,
    getMyClassrooms, 
    createClassroom,
    getClassroomStudents,
    enrollStudent 
  } = useAuth();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal de nueva aula
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    grade_level: '',
    section: '',
    school_year: '2024-2025',
    max_students: '40'
  });
  const [creating, setCreating] = useState(false);

  // Modal de gestión de estudiantes
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [classroomStudents, setClassroomStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isDocente) {
      Alert.alert(
        'Acceso Denegado', 
        'Esta función es solo para docentes.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }
    loadClassrooms();
  }, [isAuthenticated, isDocente]);

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      const result = await getMyClassrooms();
      
      if (result.success && result.classrooms) {
        setClassrooms(result.classrooms);
      } else {
        console.error('Error cargando aulas:', result.error);
        if (result.error) {
          Alert.alert('Error', result.error);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudieron cargar las aulas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClassrooms();
    setRefreshing(false);
  };

  const handleCreateClassroom = async () => {
    if (!createForm.name.trim() || !createForm.grade_level.trim() || !createForm.section.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    setCreating(true);
    try {
      const result = await createClassroom({
        name: createForm.name.trim(),
        grade_level: createForm.grade_level.trim(),
        section: createForm.section.trim(),
        school_year: createForm.school_year.trim(),
        max_students: parseInt(createForm.max_students) || 40
      });

      if (result.success) {
        Alert.alert('Éxito', 'Aula creada correctamente');
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          grade_level: '',
          section: '',
          school_year: '2024-2025',
          max_students: '40'
        });
        await loadClassrooms();
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el aula');
      }
    } catch (error) {
      console.error('Error creando aula:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setCreating(false);
    }
  };

  const handleManageStudents = async (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setLoadingStudents(true);
    setShowStudentsModal(true);

    try {
      const result = await getClassroomStudents(classroom.id);
      
      if (result.success && result.students) {
        setClassroomStudents(result.students);
      } else {
        console.error('Error cargando estudiantes:', result.error);
        setClassroomStudents([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setClassroomStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleViewProgress = (classroom: Classroom) => {
    router.push(`/(tabs)/classroom-progress?id=${classroom.id}&name=${encodeURIComponent(classroom.name)}` as any);
  };

  const renderClassroomItem = ({ item }: { item: Classroom }) => (
    <ClassroomCard
      classroom={item}
      onPress={() => handleViewProgress(item)}
      onManageStudents={() => handleManageStudents(item)}
    />
  );

  const renderStudentItem = ({ item }: { item: Student }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentEmail}>{item.email}</Text>
        <Text style={styles.studentStats}>
          Juegos: {item.total_games_played} | Promedio: {Math.round(item.average_score || 0)}
        </Text>
      </View>
      <View style={styles.studentActions}>
        <TouchableOpacity 
          style={styles.miniActionButton}
          onPress={() => Alert.alert('Progreso', `Ver progreso detallado de ${item.name}`)}
        >
          <MaterialIcons name="trending-up" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando aulas...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#E3F2FD', '#BBDEFB', '#90CAF9']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          <Text style={styles.backText}>ATRÁS</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Mis Aulas</Text>
        
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
          <MaterialIcons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Información del usuario */}
      <View style={styles.userInfo}>
        <Text style={styles.welcomeText}>Bienvenido, Prof. {user?.name}</Text>
        <Text style={styles.statsText}>
          {classrooms.length} aulas | {classrooms.reduce((sum, c) => sum + c.student_count, 0)} estudiantes
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
            <Text style={styles.emptyText}>No tienes aulas creadas</Text>
            <TouchableOpacity style={styles.createFirstButton} onPress={() => setShowCreateModal(true)}>
              <Text style={styles.createFirstButtonText}>Crear mi primera aula</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Modal de crear aula */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Aula</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} disabled={creating}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del Aula</Text>
                <TextInput
                  style={styles.textInput}
                  value={createForm.name}
                  onChangeText={(text) => setCreateForm(prev => ({ ...prev, name: text }))}
                  placeholder="Ej: 3ro Grado A"
                  editable={!creating}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Grado</Text>
                  <TextInput
                    style={styles.textInput}
                    value={createForm.grade_level}
                    onChangeText={(text) => setCreateForm(prev => ({ ...prev, grade_level: text }))}
                    placeholder="3ro"
                    editable={!creating}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Sección</Text>
                  <TextInput
                    style={styles.textInput}
                    value={createForm.section}
                    onChangeText={(text) => setCreateForm(prev => ({ ...prev, section: text }))}
                    placeholder="A"
                    editable={!creating}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Año Escolar</Text>
                  <TextInput
                    style={styles.textInput}
                    value={createForm.school_year}
                    onChangeText={(text) => setCreateForm(prev => ({ ...prev, school_year: text }))}
                    placeholder="2024-2025"
                    editable={!creating}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Máx. Estudiantes</Text>
                  <TextInput
                    style={styles.textInput}
                    value={createForm.max_students}
                    onChangeText={(text) => setCreateForm(prev => ({ ...prev, max_students: text }))}
                    placeholder="40"
                    keyboardType="numeric"
                    editable={!creating}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.cancelButton, creating && styles.buttonDisabled]} 
                onPress={() => setShowCreateModal(false)}
                disabled={creating}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, creating && styles.buttonDisabled]} 
                onPress={handleCreateClassroom}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Crear Aula</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de estudiantes */}
      <Modal visible={showStudentsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedClassroom?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowStudentsModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {classroomStudents.length} estudiantes inscritos
            </Text>

            {loadingStudents ? (
              <View style={styles.loadingStudents}>
                <ActivityIndicator size="small" color="#2196F3" />
                <Text>Cargando estudiantes...</Text>
              </View>
            ) : (
              <FlatList
                data={classroomStudents}
                renderItem={renderStudentItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.studentsList}
                ListEmptyComponent={
                  <View style={styles.emptyStudents}>
                    <MaterialIcons name="people-outline" size={48} color="#CCC" />
                    <Text style={styles.emptyStudentsText}>No hay estudiantes inscritos</Text>
                  </View>
                }
              />
            )}

            <TouchableOpacity 
              style={styles.addStudentButton}
              onPress={() => Alert.alert('Funcionalidad', 'Próximamente: Agregar estudiantes')}
            >
              <MaterialIcons name="person-add" size={20} color="#FFF" />
              <Text style={styles.addStudentButtonText}>Inscribir Estudiante</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    color: '#2196F3',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  backText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  userInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
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
  schoolYear: {
    fontSize: 12,
    color: '#999',
  },
  studentCount: {
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingStudents: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  studentsList: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  studentStats: {
    fontSize: 11,
    color: '#999',
  },
  studentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  miniActionButton: {
    padding: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 6,
  },
  emptyStudents: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStudentsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  addStudentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addStudentButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});