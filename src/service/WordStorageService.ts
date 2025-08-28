// src/services/WordStorageService.ts - SERVICIO PARA GESTIONAR PALABRAS
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WordEntry {
  id: string;
  word: string;
  hint: string;
  category: string;
  difficulty: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const WORDS_STORAGE_KEY = '@titanic_words';

class WordStorageService {
  
  // Obtener todas las palabras
  async getWords(): Promise<WordEntry[]> {
    try {
      const wordsJson = await AsyncStorage.getItem(WORDS_STORAGE_KEY);
      if (wordsJson) {
        return JSON.parse(wordsJson);
      }
      
      // Si no hay palabras guardadas, devolver palabras por defecto
      const defaultWords = this.getDefaultWords();
      await this.saveWords(defaultWords);
      return defaultWords;
    } catch (error) {
      console.error('Error al obtener palabras:', error);
      return this.getDefaultWords();
    }
  }

  // Guardar todas las palabras
  async saveWords(words: WordEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(WORDS_STORAGE_KEY, JSON.stringify(words));
    } catch (error) {
      console.error('Error al guardar palabras:', error);
      throw error;
    }
  }

  // Agregar nueva palabra
  async addWord(wordData: Omit<WordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<WordEntry> {
    try {
      const words = await this.getWords();
      
      // Verificar si la palabra ya existe
      const wordExists = words.some(w => w.word.toUpperCase() === wordData.word.toUpperCase());
      if (wordExists) {
        throw new Error('Esta palabra ya existe');
      }

      const newWord: WordEntry = {
        ...wordData,
        id: Date.now().toString(),
        word: wordData.word.toUpperCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedWords = [newWord, ...words];
      await this.saveWords(updatedWords);
      
      return newWord;
    } catch (error) {
      console.error('Error al agregar palabra:', error);
      throw error;
    }
  }

  // Actualizar palabra existente
  async updateWord(id: string, wordData: Partial<WordEntry>): Promise<WordEntry> {
    try {
      const words = await this.getWords();
      const wordIndex = words.findIndex(w => w.id === id);
      
      if (wordIndex === -1) {
        throw new Error('Palabra no encontrada');
      }

      const updatedWord: WordEntry = {
        ...words[wordIndex],
        ...wordData,
        word: wordData.word ? wordData.word.toUpperCase() : words[wordIndex].word,
        updatedAt: new Date().toISOString(),
      };

      words[wordIndex] = updatedWord;
      await this.saveWords(words);
      
      return updatedWord;
    } catch (error) {
      console.error('Error al actualizar palabra:', error);
      throw error;
    }
  }

  // Eliminar palabra
  async deleteWord(id: string): Promise<void> {
    try {
      const words = await this.getWords();
      const filteredWords = words.filter(w => w.id !== id);
      await this.saveWords(filteredWords);
    } catch (error) {
      console.error('Error al eliminar palabra:', error);
      throw error;
    }
  }

  // Obtener palabras activas por dificultad
  async getActiveWordsByDifficulty(difficulty: number): Promise<WordEntry[]> {
    try {
      const words = await this.getWords();
      return words.filter(word => word.isActive && word.difficulty === difficulty);
    } catch (error) {
      console.error('Error al obtener palabras por dificultad:', error);
      return [];
    }
  }

  // Cambiar estado de palabra (activa/inactiva)
  async toggleWordStatus(id: string): Promise<WordEntry> {
    try {
      const words = await this.getWords();
      const word = words.find(w => w.id === id);
      
      if (!word) {
        throw new Error('Palabra no encontrada');
      }

      return await this.updateWord(id, { isActive: !word.isActive });
    } catch (error) {
      console.error('Error al cambiar estado de palabra:', error);
      throw error;
    }
  }

  // Obtener estadísticas
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byDifficulty: { [key: number]: number };
    byCategory: { [key: string]: number };
  }> {
    try {
      const words = await this.getWords();
      
      const stats = {
        total: words.length,
        active: words.filter(w => w.isActive).length,
        inactive: words.filter(w => !w.isActive).length,
        byDifficulty: {} as { [key: number]: number },
        byCategory: {} as { [key: string]: number },
      };

      // Estadísticas por dificultad
      words.forEach(word => {
        stats.byDifficulty[word.difficulty] = (stats.byDifficulty[word.difficulty] || 0) + 1;
        stats.byCategory[word.category] = (stats.byCategory[word.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byDifficulty: {},
        byCategory: {},
      };
    }
  }

  // Palabras por defecto
  private getDefaultWords(): WordEntry[] {
    return [
      // Nivel 1 - Fácil
      { 
        id: '1', 
        word: 'GATO', 
        hint: 'Animal doméstico que maúlla', 
        category: 'ANIMALES', 
        difficulty: 1, 
        isActive: true, 
        createdBy: 'Sistema', 
        createdAt: '2024-01-01', 
        updatedAt: '2024-01-01' 
      },
      { 
        id: '2', 
        word: 'SOL', 
        hint: 'Estrella que nos da luz y calor', 
        category: 'NATURALEZA', 
        difficulty: 1, 
        isActive: true, 
        createdBy: 'Sistema', 
        createdAt: '2024-01-02', 
        updatedAt: '2024-01-02' 
      },
      { 
        id: '3', 
        word: 'MAR', 
        hint: 'Gran masa de agua salada', 
        category: 'NATURALEZA', 
        difficulty: 1, 
        isActive: true, 
        createdBy: 'Sistema', 
        createdAt: '2024-01-03', 
        updatedAt: '2024-01-03' 
      },
      { 
        id: '4', 
        word: 'PAN', 
        hint: 'Alimento básico hecho de harina', 
        category: 'COMIDA', 
        difficulty: 1, 
        isActive: true, 
        createdBy: 'Sistema', 
        createdAt: '2024-01-04', 
        updatedAt: '2024-01-04' 
      },
      { 
        id: '5', 
        word: 'CASA', 
        hint: 'Lugar donde vivimos', 
        category: 'OBJETOS', 
        difficulty: 1, 
        isActive: true, 
        createdBy: 'Sistema', 
        createdAt: '2024-01-05', 
        updatedAt: '2024-01-05' 
      },
      
      // Nivel 2 - Medio  
      { 
        id: '6', 
        word: 'ELEFANTE', 
        hint: 'Animal grande con trompa', 
        category: 'ANIMALES', 
        difficulty: 2, 
        isActive: true, 
        createdBy: 'Sistema', 
        createdAt: '2024-01-06', 
        updatedAt: '2024-01-06' 
      },
      { 
        id: '7', 
        word: 'MANZANA', 
        hint: 'Fruta roja o verde muy común', 
        category: 'FRUTAS', 
        difficulty: 2, 
        isActive: true, 
        createdBy: 'Sistema', 
        createdAt: '2024-01-07', 
        updatedAt: '2024-01-07' 
      },
      { 
        id: '8', 
        word: 'ESCUELA', 
        hint: 'Lugar donde estudiamos', 
        category: 'LUGARES', 
        difficulty: 2, 
        isActive: true, 
        createdBy: 'Sistema', 
        createdAt: '2024-01-08', 
        updatedAt: '2024-01-08' 
      },
      { 
        id: '9', 
        word: 'BICICLETA', 
        hint: 'Vehículo de dos ruedas', 
        category: 'TRANSPORTE', 
        difficulty: 2, 
        isActive: true, 
        createdBy: 'Sistema', 
        createdAt: '2024-01-09', 
        updatedAt: '2024-01-09' 
      },
      
      // Nivel 3 - Difícil
      { 
        id: '10', 
        word: 'COMPUTADORA', 
        hint: 'Máquina para procesar información', 
        category: 'TECNOLOGIA', 
        difficulty: 3, 
        isActive: true, 
        createdBy: 'Sistema', 
        createdAt: '2024-01-10', 
        updatedAt: '2024-01-10' 
      },
      { 
        id: '11', 
        word: 'REFRIGERADOR', 
        hint: 'Electrodoméstico para enfriar alimentos', 
        category: 'ELECTRODOMESTICOS', 
        difficulty: 3, 
        isActive: true, 
        createdBy: 'Sistema', 
        createdAt: '2024-01-11', 
        updatedAt: '2024-01-11' 
      },
      { 
        id: '12', 
        word: 'ASTRONAUTA', 
        hint: 'Persona que viaja al espacio', 
        category: 'PROFESIONES', 
        difficulty: 3, 
        isActive: true, 
        createdBy: 'Sistema', 
        createdAt: '2024-01-12', 
        updatedAt: '2024-01-12' 
      },
    ];
  }

  // Limpiar todas las palabras (útil para testing)
  async clearAllWords(): Promise<void> {
    try {
      await AsyncStorage.removeItem(WORDS_STORAGE_KEY);
    } catch (error) {
      console.error('Error al limpiar palabras:', error);
      throw error;
    }
  }
}

export default new WordStorageService();