// =================== 3. PANTALLA PARA DOCENTES: GESTIONAR REPRESENTANTES ===================
// app/(tabs)/student-parents-management.tsx

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

interface ParentRelation {
  id: number;
  name: string;
  email: string;
  relationship_type: string;
  is_primary: boolean;
  phone?: string;
  can_view_progress: boolean;
  can_receive_notifications: boolean;
  emergency_contact: boolean;
  relationship_date: string;
}

const RELATIONSHIP_TYPES = [
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'representante', label: 'Representante' },
  { value: 'tutor', label: 'Tutor Legal' },
  { value: 'abuelo', label: 'Abuelo' },
  { value: 'abuela', label: 'Abuela' },
  { value: 'tio', label: 'Tío' },
  { value: 'tia', label: 'Tía' },
  { value: 'otro', label: 'Otro' },
];

export default function StudentParentsManagement() {
  const router = useRouter();
  const { studentId, studentName } = useLocalSearchParams();
  const { 
    user,
    isDocente,
    getStudentParents,
    searchParent,
    updateParentChildRelation,
    removeParentChildRelation,
    enrollStudent // Reutilizar para agregar representante
  } = useAuth();

  const [parents, setParents] = useState<ParentRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal de agregar representante
  const [showAddModal, setShowAddModal] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundParents, setFoundParents] = useState<any[]>([]);
  
  // Modal de editar relación
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingParent, setEditingParent] = useState<ParentRelation | null>(null);
  const [editForm, setEditForm] = useState({
    relationship_type: '',
    is_primary: false,
    phone: '',
    can_view_progress: true,
    can_receive_notifications: true,
    emergency_contact: false,
  });

  useEffect(() => {
    if (!isDocente) {
      Alert.alert('Acceso Denegado', 'Esta función es solo para docentes');
      router.back();
      return;
    }
    loadParents();
  }, [studentId]);

  const loadParents = async () => {
    try {
      setLoading(true);
      const result = await getStudentParents(parseInt(studentId as string));
      
      if (result.success && result.parents) {
        setParents(result.parents);
      } else {
        Alert.alert('Error', result.error || 'No se pudieron cargar los representantes');
      }
    } catch (error) {
      console.error('Error cargando representantes:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadParents();
    setRefreshing(false);
  };

  const handleSearchParent = async () => {
    if (!parentEmail.trim()) {
      Alert.alert('Error', 'Ingresa el email del representante');
      return;
    }

    setSearching(true);
    try {
      const result = await searchParent(parentEmail.trim());
      
      if (result.success && result.parents) {
        setFoundParents(result.parents);
      } else {
        Alert.alert('No encontrado', result.error || 'No se encontraron representantes');
        setFoundParents([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Error al buscar representante');
    } finally {
      setSearching(false);
    }
  };

  const handleAddParent = async (parent: any) => {
    try {
      if (parents.length >= 2) {
        Alert.alert('Límite alcanzado', 'Un estudiante puede tener máximo 2 representantes');
        return;
      }

      // Usar la función existente de enrollStudent adaptándola
      const result = await enrollStudent(parseInt(studentId as string), parent.id);
      
      if (result.success) {
        Alert.alert('Éxito', `${parent.name} ha sido vinculado como representante`);
        setShowAddModal(false);
        setParentEmail('');
        setFoundParents([]);
        await loadParents();
      } else {
        Alert.alert('Error', result.error || 'No se pudo vincular al representante');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const handleEditParent = (parent: ParentRelation) => {
    setEditingParent(parent);
    setEditForm({
      relationship_type: parent.relationship_type,
      is_primary: parent.is_primary,
      phone: parent.phone || '',
      can_view_progress: parent.can_view_progress,
      can_receive_notifications: parent.can_receive_notifications,
      emergency_contact: parent.emergency_contact,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingParent) return;

    try {
      const result = await updateParentChildRelation(
        parseInt(studentId as string),
        editingParent.id,
        editForm
      );

      if (result.success) {
        Alert.alert('Éxito', 'Relación actualizada correctamente');
        setShowEditModal(false);
        setEditingParent(null);
        await loadParents();
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar la relación');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const handleRemoveParent = (parent: ParentRelation) => {
    Alert.alert(
      'Eliminar Vinculación',
      `¿Estás seguro de que deseas eliminar la vinculación de ${parent.name} con ${studentName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeParentChildRelation(
                parseInt(studentId as string),
                parent.id
              );

              if (result.success) {
                Alert.alert('Éxito', result.message);
                await loadParents();
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Error de conexión');
            }
          }
        }
      ]
    );
  };

  const renderParentCard = (parent: ParentRelation) => (
    <View key={parent.id} style={styles.parentCard}>
      <View style={styles.parentHeader}>
        <View style={styles.parentInfo}>
          <Text style={styles.parentName}>{parent.name}</Text>
          <Text style={styles.parentEmail}>{parent.email}</Text>
          <View style={styles.parentMeta}>
            <Text style={styles.relationshipType}>
              {RELATIONSHIP_TYPES.find(r => r.value === parent.relationship_type)?.label || parent.relationship_type}
            </Text>
            {parent.is_primary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryText}>Principal</Text>
              </View>
            )}
            {parent.emergency_contact && (
              <View style={styles.emergencyBadge}>
                <Text style={styles.emergencyText}>Emergencia</Text>
              </View>
            )}
          </View>
          {parent.phone && (
            <Text style={styles.phoneText}>📞 {parent.phone}</Text>
          )}
        </View>
        
        <View style={styles.parentActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEditParent(parent)}
          >
            <MaterialIcons name="edit" size={20} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleRemoveParent(parent)}
          >
            <MaterialIcons name="delete" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.permissionsSection}>
        <Text style={styles.permissionsTitle}>Permisos:</Text>
        <View style={styles.permissionsList}>
          <Text style={[styles.permissionItem, parent.can_view_progress && styles.permissionActive]}>
            👁️ Ver progreso
          </Text>
          <Text style={[styles.permissionItem, parent.can_receive_notifications && styles.permissionActive]}>
            🔔 Recibir notificaciones
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#E8F5E8', '#C8E6C9']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Cargando representantes...</Text>
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
        
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Representantes</Text>
          <Text style={styles.subtitle}>{studentName}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowAddModal(true)}
          disabled={parents.length >= 2}
        >
          <MaterialIcons 
            name="person-add" 
            size={24} 
            color={parents.length >= 2 ? "#CCC" : "#FFF"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Información */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Gestión de Representantes</Text>
          <Text style={styles.infoText}>
            Un estudiante puede tener hasta 2 representantes. Uno debe ser marcado como principal.
          </Text>
          <Text style={styles.infoCount}>
            Representantes actuales: {parents.length}/2
          </Text>
        </View>

        {/* Lista de representantes */}
        {parents.length > 0 ? (
          <View style={styles.parentsSection}>
            {parents.map(renderParentCard)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="family-restroom" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No hay representantes vinculados</Text>
            <Text style={styles.emptySubtext}>
              Agrega hasta 2 representantes para este estudiante
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal para agregar representante */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Representante</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Buscar representante por email
              </Text>
              
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={parentEmail}
                  onChangeText={setParentEmail}
                  placeholder="email@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={handleSearchParent}
                  disabled={searching}
                >
                  {searching ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <MaterialIcons name="search" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Resultados de búsqueda */}
              {foundParents.length > 0 && (
                <View style={styles.searchResults}>
                  <Text style={styles.resultsTitle}>Representantes encontrados:</Text>
                  {foundParents.map((parent) => (
                    <TouchableOpacity
                      key={parent.id}
                      style={styles.parentResult}
                      onPress={() => handleAddParent(parent)}
                    >
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName}>{parent.name}</Text>
                        <Text style={styles.resultEmail}>{parent.email}</Text>
                      </View>
                      <MaterialIcons name="add-circle" size={24} color="#4CAF50" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar relación */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Relación</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editForm}>
              {/* Tipo de relación */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tipo de relación</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {RELATIONSHIP_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.relationshipOption,
                        editForm.relationship_type === type.value && styles.relationshipOptionSelected
                      ]}
                      onPress={() => setEditForm({...editForm, relationship_type: type.value})}
                    >
                      <Text style={[
                        styles.relationshipText,
                        editForm.relationship_type === type.value && styles.relationshipTextSelected
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Teléfono */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Teléfono</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm({...editForm, phone: text})}
                  placeholder="Número de teléfono"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Switches */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Configuración</Text>
                
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Representante principal</Text>
                  <Switch
                    value={editForm.is_primary}
                    onValueChange={(value) => setEditForm({...editForm, is_primary: value})}
                    thumbColor={editForm.is_primary ? '#4CAF50' : '#f4f3f4'}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                  />
                </View>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Puede ver progreso</Text>
                  <Switch
                    value={editForm.can_view_progress}
                    onValueChange={(value) => setEditForm({...editForm, can_view_progress: value})}
                    thumbColor={editForm.can_view_progress ? '#4CAF50' : '#f4f3f4'}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                  />
                </View>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Recibir notificaciones</Text>
                  <Switch
                    value={editForm.can_receive_notifications}
                    onValueChange={(value) => setEditForm({...editForm, can_receive_notifications: value})}
                    thumbColor={editForm.can_receive_notifications ? '#4CAF50' : '#f4f3f4'}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                  />
                </View>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Contacto de emergencia</Text>
                  <Switch
                    value={editForm.emergency_contact}
                    onValueChange={(value) => setEditForm({...editForm, emergency_contact: value})}
                    thumbColor={editForm.emergency_contact ? '#4CAF50' : '#f4f3f4'}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// =================== 5. ESTILOS PARA AMBAS PANTALLAS ===================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  infoCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  parentsSection: {
    marginBottom: 20,
  },
  parentCard: {
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
  parentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  parentInfo: {
    flex: 1,
  },
  parentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  parentEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  parentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  relationshipType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  primaryBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  emergencyBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emergencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  phoneText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  parentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  permissionsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  permissionsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  permissionsList: {
    flexDirection: 'row',
    gap: 16,
  },
  permissionItem: {
    fontSize: 12,
    color: '#CCC',
  },
  permissionActive: {
    color: '#4CAF50',
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
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResults: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  parentResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultEmail: {
    fontSize: 14,
    color: '#666',
  },
  editForm: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  formHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  relationshipOption: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  relationshipOptionSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  relationshipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  relationshipTextSelected: {
    color: '#FFF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
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
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  relationshipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    minWidth: 80,
  },
  relationshipCardSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  relationshipIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  relationshipLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  relationshipLabelSelected: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  linkButtonDisabled: {
    backgroundColor: '#CCC',
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  additionalInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  additionalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  additionalText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
});