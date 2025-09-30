
// =================== 4. PANTALLA PARA REPRESENTANTES: AUTO-VINCULACIÓN ===================
// app/(tabs)/parent-link-child.tsx

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

const RELATIONSHIP_TYPES_PARENT = [
  { value: 'padre', label: 'Padre', icon: '👨' },
  { value: 'madre', label: 'Madre', icon: '👩' },
  { value: 'representante', label: 'Representante', icon: '👤' },
  { value: 'tutor', label: 'Tutor Legal', icon: '⚖️' },
  { value: 'abuelo', label: 'Abuelo', icon: '👴' },
  { value: 'abuela', label: 'Abuela', icon: '👵' },
  { value: 'tio', label: 'Tío', icon: '👨‍🦳' },
  { value: 'tia', label: 'Tía', icon: '👩‍🦳' },
  { value: 'otro', label: 'Otro', icon: '👥' },
];

export default function ParentLinkChild() {
  const router = useRouter();
  const { user, isRepresentante, parentLinkWithChild } = useAuth();
  
  const [formData, setFormData] = useState({
    studentEmail: '',
    relationshipType: 'representante',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleLinkChild = async () => {
    if (!formData.studentEmail.trim()) {
      Alert.alert('Error', 'Ingresa el email del estudiante');
      return;
    }

    if (!formData.relationshipType) {
      Alert.alert('Error', 'Selecciona el tipo de relación');
      return;
    }

    setLoading(true);
    try {
      const result = await parentLinkWithChild(
        formData.studentEmail,
        formData.relationshipType,
        formData.phone
      );

      if (result.success) {
        Alert.alert(
          '¡Vinculación Exitosa! 🎉',
          result.message,
          [
            {
              text: 'Ver mi Panel',
              onPress: () => router.replace('/(tabs)/parent-dashboard' as any)
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (!isRepresentante) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Esta función es solo para representantes</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={['#FFF3E0', '#FFE0B2', '#FFCC02']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Vincular Hijo/a</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <MaterialIcons name="family-restroom" size={48} color="#FF9800" />
            <Text style={styles.infoTitle}>Conecta con tu hijo/a</Text>
            <Text style={styles.infoText}>
              Ingresa el email del estudiante para establecer la conexión familiar
              y poder ver su progreso académico.
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formCard}>
            {/* Email del estudiante */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email del Estudiante *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.studentEmail}
                onChangeText={(text) => setFormData({...formData, studentEmail: text})}
                placeholder="estudiante@escuela.edu"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              <Text style={styles.formHint}>
                El email que usa tu hijo/a para acceder a la aplicación
              </Text>
            </View>

            {/* Tipo de relación */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Eres su... *</Text>
              <View style={styles.relationshipGrid}>
                {RELATIONSHIP_TYPES_PARENT.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.relationshipCard,
                      formData.relationshipType === type.value && styles.relationshipCardSelected
                    ]}
                    onPress={() => setFormData({...formData, relationshipType: type.value})}
                    disabled={loading}
                  >
                    <Text style={styles.relationshipIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.relationshipLabel,
                      formData.relationshipType === type.value && styles.relationshipLabelSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Teléfono */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Teléfono (opcional)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                placeholder="+58 412-123-4567"
                keyboardType="phone-pad"
                editable={!loading}
              />
              <Text style={styles.formHint}>
                Para contacto de emergencia y notificaciones
              </Text>
            </View>

            {/* Botón de vinculación */}
            <TouchableOpacity
              style={[styles.linkButton, loading && styles.linkButtonDisabled]}
              onPress={handleLinkChild}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialIcons name="link" size={20} color="#FFF" />
                  <Text style={styles.linkButtonText}>Establecer Vinculación</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Información adicional */}
          <View style={styles.additionalInfo}>
            <Text style={styles.additionalTitle}>ℹ️ Información importante</Text>
            <Text style={styles.additionalText}>
              • Un estudiante puede tener máximo 2 representantes{'\n'}
              • El primer representante se marca automáticamente como principal{'\n'}
              • Podrás ver el progreso académico y recibir notificaciones{'\n'}
              • La vinculación es inmediata una vez confirmada
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
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