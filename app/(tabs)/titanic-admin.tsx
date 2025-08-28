// app/(tabs)/titanic-admin.tsx - PANEL CORREGIDO CON TIPOS COMPATIBLES
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
import { TitanicStats, useAuth, WordEntry, WordInput } from '../../src/contexts/AuthContext';

export default function TitanicAdminPanel() {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated,
    getTitanicWords,
    getTitanicStats,
    createTitanicWord,
    updateTitanicWord,
    deleteTitanicWord,
    toggleTitanicWordStatus
  } = useAuth();

  // Estados principales
  const [words, setWords] = useState<WordEntry[]>([]);
  const [stats, setStats] = useState<TitanicStats>({
    total: 0,
    active: 0,
    inactive: 0,
    byDifficulty: {},
    byCategory: {},
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWord, setEditingWord] = useState<WordEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [submitting, setSubmitting] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState<WordInput>({
    word: '',
    hint: '',
    category: 'FRUTAS',
    difficulty: 1,
    is_active: true,
  });

  // Categorías predefinidas
  const categories = [
    'FRUTAS', 'ANIMALES', 'COLORES', 'OBJETOS', 'VERBOS', 
    'NATURALEZA', 'COMIDA', 'LUGARES', 'TRANSPORTE', 
    'TECNOLOGIA', 'ELECTRODOMESTICOS', 'PROFESIONES'
  ];

  // Verificar permisos de administrador
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'docente') {
      Alert.alert(
        'Acceso Denegado',
        'Esta sección es solo para docentes administradores.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }
    loadData();
  }, [isAuthenticated, user]);

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Cargar palabras y estadísticas en paralelo
      const [wordsResult, statsResult] = await Promise.all([
        getTitanicWords({ 
          search: searchQuery || undefined, 
          category: selectedCategory !== 'TODAS' ? selectedCategory : undefined 
        }),
        getTitanicStats()
      ]);

      if (wordsResult.success && wordsResult.words) {
        setWords(wordsResult.words);
      } else {
        console.error('Error cargando palabras:', wordsResult.error);
        if (wordsResult.error) {
          Alert.alert('Error', wordsResult.error);
        }
      }

      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      } else {
        console.error('Error cargando estadísticas:', statsResult.error);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filtrar palabras en tiempo real
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (!loading) {
        loadData();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, selectedCategory]);

  const openModal = (word?: WordEntry): void => {
    if (word) {
      setEditingWord(word);
      setFormData({
        word: word.word,
        hint: word.hint,
        category: word.category,
        difficulty: word.difficulty,
        is_active: word.is_active,
      });
    } else {
      setEditingWord(null);
      setFormData({
        word: '',
        hint: '',
        category: 'FRUTAS',
        difficulty: 1,
        is_active: true,
      });
    }
    setModalVisible(true);
  };

  const closeModal = (): void => {
    setModalVisible(false);
    setEditingWord(null);
    setSubmitting(false);
  };

  const validateForm = (): boolean => {
    if (!formData.word.trim()) {
      Alert.alert('Error', 'La palabra es obligatoria');
      return false;
    }
    if (!formData.hint.trim()) {
      Alert.alert('Error', 'La pista es obligatoria');
      return false;
    }
    if (formData.word.length < 3) {
      Alert.alert('Error', 'La palabra debe tener al menos 3 letras');
      return false;
    }
    if (!/^[A-ZÁÉÍÓÚÑ\s]+$/.test(formData.word.toUpperCase())) {
      Alert.alert('Error', 'La palabra solo debe contener letras');
      return false;
    }
    return true;
  };

  const saveWord = async (): Promise<void> => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      let result;
      
      if (editingWord) {
        // Actualizar palabra existente
        result = await updateTitanicWord(editingWord.id, formData);
      } else {
        // Crear nueva palabra
        result = await createTitanicWord(formData);
      }

      if (result.success) {
        Alert.alert(
          'Éxito', 
          editingWord ? 'Palabra actualizada correctamente' : 'Palabra agregada correctamente'
        );
        
        closeModal();
        await loadData(); // Recargar datos
      } else {
        Alert.alert('Error', result.error || 'No se pudo guardar la palabra');
      }
    } catch (error) {
      console.error('Error guardando palabra:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWord = (word: WordEntry): void => {
    Alert.alert(
      '🗑️ Eliminar Palabra',
      `¿Estás seguro de que quieres eliminar "${word.word}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteTitanicWord(word.id);
              if (result.success) {
                Alert.alert('✅ Eliminada', 'La palabra ha sido eliminada');
                await loadData();
              } else {
                Alert.alert('Error', result.error || 'No se pudo eliminar la palabra');
              }
            } catch (error) {
              console.error('Error eliminando palabra:', error);
              Alert.alert('Error', 'Ocurrió un error inesperado');
            }
          },
        },
      ]
    );
  };

  const handleToggleWordStatus = async (word: WordEntry): Promise<void> => {
    try {
      const result = await toggleTitanicWordStatus(word.id);
      if (result.success) {
        // Actualizar localmente para feedback inmediato
        setWords(prev => 
          prev.map(w => 
            w.id === word.id ? { ...w, is_active: !w.is_active } : w
          )
        );
        // Actualizar estadísticas
        const statsResult = await getTitanicStats();
        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats);
        }
      } else {
        Alert.alert('Error', result.error || 'No se pudo cambiar el estado');
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    }
  };

  const getDifficultyColor = (level: number): string => {
    switch (level) {
      case 1: return '#4CAF50';
      case 2: return '#FF9800';
      case 3: return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getDifficultyName = (level: number): string => {
    switch (level) {
      case 1: return 'Fácil';
      case 2: return 'Medio';
      case 3: return 'Difícil';
      default: return 'Desconocido';
    }
  };

  const getUniqueCategories = (): string[] => {
    const uniqueCategories = [...new Set(words.map(w => w.category))];
    return uniqueCategories.sort();
  };

  if (loading) {
    return (
      <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando panel de administración...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#E3F2FD', '#BBDEFB', '#90CAF9']} style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
            <Text style={styles.backText}>ATRÁS</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>🚢 Admin Titanic</Text>
          
          <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
            <MaterialIcons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Bienvenida */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>¡Bienvenido, {user?.name}! 👨‍🏫</Text>
          <Text style={styles.welcomeSubtext}>
            Gestiona las palabras del juego Titanic
          </Text>
        </View>

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.active}</Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.inactive}</Text>
            <Text style={styles.statLabel}>Inactivas</Text>
          </View>
        </View>

        {/* Controles de filtrado */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar palabras..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="clear" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilters}>
            <TouchableOpacity
              style={[styles.categoryFilter, selectedCategory === 'TODAS' && styles.categoryFilterActive]}
              onPress={() => setSelectedCategory('TODAS')}
            >
              <Text style={[styles.categoryFilterText, selectedCategory === 'TODAS' && styles.categoryFilterTextActive]}>
                TODAS
              </Text>
            </TouchableOpacity>
            {getUniqueCategories().map(category => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryFilter, selectedCategory === category && styles.categoryFilterActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.categoryFilterText, selectedCategory === category && styles.categoryFilterTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de palabras */}
        <View style={styles.wordsContainer}>
          {words.map((word) => (
            <View key={word.id} style={[styles.wordCard, !word.is_active && styles.wordCardInactive]}>
              <View style={styles.wordHeader}>
                <View style={styles.wordInfo}>
                  <Text style={styles.wordText}>{word.word}</Text>
                  <View style={styles.wordMeta}>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(word.difficulty) }]}>
                      <Text style={styles.difficultyText}>{getDifficultyName(word.difficulty)}</Text>
                    </View>
                    <Text style={styles.categoryBadge}>{word.category}</Text>
                  </View>
                </View>
                <View style={styles.wordActions}>
                  <Switch
                    value={word.is_active}
                    onValueChange={() => handleToggleWordStatus(word)}
                    thumbColor={word.is_active ? '#4CAF50' : '#f4f3f4'}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                  />
                </View>
              </View>
              
              <Text style={styles.hintText}>💡 {word.hint}</Text>
              
              <View style={styles.wordFooter}>
                <Text style={styles.authorText}>Por {word.creator_name}</Text>
                <View style={styles.wordButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openModal(word)}
                  >
                    <MaterialIcons name="edit" size={16} color="#2196F3" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteWord(word)}
                  >
                    <MaterialIcons name="delete" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          
          {words.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery || selectedCategory !== 'TODAS' 
                  ? 'No se encontraron palabras con los filtros aplicados'
                  : 'No hay palabras registradas. ¡Agrega la primera!'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de agregar/editar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingWord ? '✏️ Editar Palabra' : '➕ Agregar Palabra'}
              </Text>
              <TouchableOpacity onPress={closeModal} disabled={submitting}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Palabra */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Palabra *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.word}
                  onChangeText={(text) => setFormData({ ...formData, word: text.toUpperCase() })}
                  placeholder="Ej: MANZANA"
                  maxLength={20}
                  autoCapitalize="characters"
                  editable={!submitting}
                />
              </View>

              {/* Pista */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pista *</Text>
                <TextInput
                  style={[styles.textInput, styles.textInputMultiline]}
                  value={formData.hint}
                  onChangeText={(text) => setFormData({ ...formData, hint: text })}
                  placeholder="Ej: Fruta roja o verde muy común"
                  multiline
                  numberOfLines={3}
                  maxLength={100}
                  editable={!submitting}
                />
              </View>

              {/* Categoría */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelect}>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        formData.category === category && styles.categoryOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, category })}
                      disabled={submitting}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        formData.category === category && styles.categoryOptionTextSelected
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Dificultad */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nivel de Dificultad</Text>
                <View style={styles.difficultySelect}>
                  {[
                    { level: 1, name: 'Fácil', description: '3-5 letras' },
                    { level: 2, name: 'Medio', description: '6-8 letras' },
                    { level: 3, name: 'Difícil', description: '9+ letras' },
                  ].map(level => (
                    <TouchableOpacity
                      key={level.level}
                      style={[
                        styles.difficultyOption,
                        { borderColor: getDifficultyColor(level.level) },
                        formData.difficulty === level.level && { backgroundColor: getDifficultyColor(level.level) }
                      ]}
                      onPress={() => setFormData({ ...formData, difficulty: level.level })}
                      disabled={submitting}
                    >
                      <Text style={[
                        styles.difficultyOptionText,
                        { color: getDifficultyColor(level.level) },
                        formData.difficulty === level.level && { color: '#FFF' }
                      ]}>
                        {level.name}
                      </Text>
                      <Text style={[
                        styles.difficultyOptionDesc,
                        { color: getDifficultyColor(level.level) },
                        formData.difficulty === level.level && { color: '#FFF' }
                      ]}>
                        {level.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Estado */}
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={styles.inputLabel}>Palabra activa</Text>
                  <Switch
                    value={formData.is_active}
                    onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                    thumbColor={formData.is_active ? '#4CAF50' : '#f4f3f4'}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    disabled={submitting}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.cancelButton, submitting && styles.buttonDisabled]} 
                onPress={closeModal}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, submitting && styles.buttonDisabled]} 
                onPress={saveWord}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingWord ? 'Actualizar' : 'Guardar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
  welcomeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  filtersContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  categoryFilters: {
    flexDirection: 'row',
  },
  categoryFilter: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryFilterActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  categoryFilterTextActive: {
    color: '#FFF',
  },
  wordsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  wordCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wordCardInactive: {
    opacity: 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  wordInfo: {
    flex: 1,
  },
  wordText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  wordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  categoryBadge: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  wordActions: {
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20,
  },
  wordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  authorText: {
    fontSize: 12,
    color: '#999',
  },
  wordButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
  modalForm: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 20,
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
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  categorySelect: {
    flexDirection: 'row',
  },
  categoryOption: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryOptionSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  categoryOptionTextSelected: {
    color: '#FFF',
  },
  difficultySelect: {
    gap: 8,
  },
  difficultyOption: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  difficultyOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  difficultyOptionDesc: {
    fontSize: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});