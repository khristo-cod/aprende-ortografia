// src/contexts/AuthContext.tsx - Sistema multi-docente
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Tipos base
interface User {
  id: number;
  name: string;
  email: string;
  role: 'docente' | 'representante' | 'nino';
  grade_level?: string;
  section?: string;
  school_id?: string;
}

interface Classroom {
  id: number;
  name: string;
  teacher_id: number;
  grade_level: string;
  section: string;
  school_year: string;
  max_students: number;
  active: boolean;
  student_count: number;
  created_at: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  enrollment_date: string;
  status: string;
  total_games_played: number;
  average_score: number;
  last_activity: string;
  classroom_name?: string;
  teacher_name?: string;
}

interface ParentChildRelation {
  parent_id: number;
  child_id: number;
  relationship_type: string;
  is_primary: boolean;
  phone?: string;
}

interface TeacherDashboard {
  total_classrooms: number;
  total_students: number;
  recent_activity: number;
  words_created: number;
}

// Interfaces existentes
interface WordEntry {
  id: string;
  word: string;
  hint: string;
  category: string;
  difficulty: number;
  is_active: boolean;
  created_by: number;
  creator_name: string;
  classroom_id?: number;
  is_global?: boolean;
  source_type?: 'own' | 'global' | 'classroom';
  created_at: string;
  updated_at: string;
}

interface WordInput {
  word: string;
  hint: string;
  category: string;
  difficulty: number;
  is_active: boolean;
  classroom_id?: number;
  is_global?: boolean;
}

interface TitanicStats {
  total: number;
  active: number;
  inactive: number;
  byDifficulty: { [key: number]: number };
  byCategory: { [key: string]: number };
}

interface WordFilters {
  category?: string;
  difficulty?: number;
  active?: boolean;
  search?: string;
  classroom_id?: number;
}

interface AuthContextType {
  // Estados básicos
  user: User | null;
  token: string | null;
  loading: boolean;
  
  // Autenticación
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (name: string, email: string, password: string, role: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  
  // Juegos existentes
  saveGameProgress: (gameData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  getGameProgress: (userId?: number) => Promise<{ success: boolean; progress?: any[]; stats?: any; error?: string }>;
  getGameConfig: (gameType: string) => Promise<{ success: boolean; configs?: any[]; error?: string }>;
  
  // CRUD Titanic básico
  getTitanicWords: (filters?: WordFilters) => Promise<{ success: boolean; words?: WordEntry[]; error?: string }>;
  getTitanicStats: () => Promise<{ success: boolean; stats?: TitanicStats; error?: string }>;
  createTitanicWord: (wordData: WordInput) => Promise<{ success: boolean; word?: WordEntry; error?: string }>;
  updateTitanicWord: (id: string, wordData: Partial<WordInput>) => Promise<{ success: boolean; word?: WordEntry; error?: string }>;
  deleteTitanicWord: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleTitanicWordStatus: (id: string) => Promise<{ success: boolean; word?: WordEntry; error?: string }>;
  getActiveTitanicWords: (difficulty: number) => Promise<{ success: boolean; words?: { word: string; hint: string; category: string; }[]; error?: string }>;
  
  // NUEVOS MÉTODOS PARA SISTEMA MULTI-DOCENTE
  
  // Gestión de aulas
  createClassroom: (classroomData: {
    name: string;
    grade_level: string;
    section: string;
    school_year: string;
    max_students?: number;
  }) => Promise<{ success: boolean; classroom_id?: number; error?: string }>;
  
  getMyClassrooms: () => Promise<{ success: boolean; classrooms?: Classroom[]; error?: string }>;
  
  // Gestión de estudiantes
  enrollStudent: (classroomId: number, studentId: number) => Promise<{ success: boolean; error?: string }>;
  getClassroomStudents: (classroomId: number) => Promise<{ success: boolean; students?: Student[]; error?: string }>;
  
  // Gestión de representantes
  createParentChildRelation: (
    studentId: number, 
    parentId: number, 
    relationData: {
      relationship_type?: string;
      is_primary?: boolean;
      phone?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  
  getMyChildren: () => Promise<{ success: boolean; children?: Student[]; error?: string }>;
  
  // Palabras con alcance
  getAvailableWords: (classroomId?: number) => Promise<{ success: boolean; words?: WordEntry[]; error?: string }>;
  createScopedWord: (wordData: WordInput) => Promise<{ success: boolean; word_id?: number; error?: string }>;
  
  // Reportes
  getClassroomProgressReport: (classroomId: number) => Promise<{ success: boolean; report?: any[]; error?: string }>;
  getTeacherDashboard: () => Promise<{ success: boolean; dashboard?: TeacherDashboard; error?: string }>;
  
  // Estados útiles
  isAuthenticated: boolean;
  isDocente: boolean;
  isRepresentante: boolean;
  isNino: boolean;
  userName: string;
  userRole: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://192.168.1.4:3001/api';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);

  // Verificar token al iniciar la app
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async (): Promise<void> => {
    try {
      const savedToken = await AsyncStorage.getItem('auth_token');
      if (savedToken) {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${savedToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setToken(savedToken);
          setUser(data.user);
        } else {
          await AsyncStorage.removeItem('auth_token');
        }
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  // Métodos de autenticación existentes
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión. ¿Está el servidor corriendo?' };
    }
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión. ¿Está el servidor corriendo?' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  // Métodos de juegos existentes (mantenidos igual)
  const saveGameProgress = async (gameData: any) => {
    if (!token || !user) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/games/save-progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...gameData, user_id: user.id }),
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getGameProgress = async (userId?: number) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const targetUserId = userId || user?.id;
      const url = userId ? 
        `${API_BASE_URL}/games/progress/${targetUserId}` : 
        `${API_BASE_URL}/games/progress`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return response.ok ? { success: true, ...data } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getGameConfig = async (gameType: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/games/config/${gameType}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return response.ok ? { success: true, ...data } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Métodos CRUD Titanic básicos (mantenidos)
  const getTitanicWords = async (filters?: WordFilters) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const queryParams = new URLSearchParams();
      if (filters?.category && filters.category !== 'TODAS') queryParams.append('category', filters.category);
      if (filters?.difficulty) queryParams.append('difficulty', filters.difficulty.toString());
      if (filters?.active !== undefined) queryParams.append('active', filters.active.toString());
      if (filters?.search) queryParams.append('search', filters.search);

      const url = `${API_BASE_URL}/titanic/words${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      return response.ok ? { success: true, words: data.words } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getTitanicStats = async () => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/titanic/stats`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      return response.ok ? { success: true, stats: data.stats } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const createTitanicWord = async (wordData: WordInput) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/titanic/words`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(wordData),
      });

      const data = await response.json();
      return response.ok ? { success: true, word: data.word } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const updateTitanicWord = async (id: string, wordData: Partial<WordInput>) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/titanic/words/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(wordData),
      });

      const data = await response.json();
      return response.ok ? { success: true, word: data.word } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const deleteTitanicWord = async (id: string) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/titanic/words/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      return response.ok ? { success: true } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const toggleTitanicWordStatus = async (id: string) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/titanic/words/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      return response.ok ? { success: true, word: data.word } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getActiveTitanicWords = async (difficulty: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/titanic/words/active/${difficulty}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return response.ok ? { success: true, words: data.words } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  // NUEVOS MÉTODOS PARA SISTEMA MULTI-DOCENTE

  const createClassroom = async (classroomData: {
    name: string;
    grade_level: string;
    section: string;
    school_year: string;
    max_students?: number;
  }) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/classrooms`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(classroomData),
      });

      const data = await response.json();
      return response.ok ? { success: true, classroom_id: data.classroom_id } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getMyClassrooms = async () => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/classrooms/my-classrooms`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      return response.ok ? { success: true, classrooms: data.classrooms } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const enrollStudent = async (classroomId: number, studentId: number) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/students`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });

      const data = await response.json();
      return response.ok ? { success: true } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getClassroomStudents = async (classroomId: number) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/students`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      return response.ok ? { success: true, students: data.students } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const createParentChildRelation = async (
    studentId: number, 
    parentId: number, 
    relationData: { relationship_type?: string; is_primary?: boolean; phone?: string; }
  ) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/parents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: parentId, ...relationData }),
      });

      const data = await response.json();
      return response.ok ? { success: true } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getMyChildren = async () => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/parents/my-children`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      return response.ok ? { success: true, children: data.children } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getAvailableWords = async (classroomId?: number) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const queryParams = classroomId ? `?classroom_id=${classroomId}` : '';
      const response = await fetch(`${API_BASE_URL}/titanic/words/available${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      return response.ok ? { success: true, words: data.words } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const createScopedWord = async (wordData: WordInput) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/titanic/words/scoped`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(wordData),
      });

      const data = await response.json();
      return response.ok ? { success: true, word_id: data.word_id } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getClassroomProgressReport = async (classroomId: number) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/reports/classroom/${classroomId}/progress`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      return response.ok ? { success: true, report: data.report } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getTeacherDashboard = async () => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/teacher`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      return response.ok ? { success: true, dashboard: data.dashboard } : { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    saveGameProgress,
    getGameProgress,
    getGameConfig,
    
    // CRUD Titanic
    getTitanicWords,
    getTitanicStats,
    createTitanicWord,
    updateTitanicWord,
    deleteTitanicWord,
    toggleTitanicWordStatus,
    getActiveTitanicWords,
    
    // Sistema multi-docente
    createClassroom,
    getMyClassrooms,
    enrollStudent,
    getClassroomStudents,
    createParentChildRelation,
    getMyChildren,
    getAvailableWords,
    createScopedWord,
    getClassroomProgressReport,
    getTeacherDashboard,
    
    // Estados útiles
    isAuthenticated: !!user,
    isDocente: user?.role === 'docente',
    isRepresentante: user?.role === 'representante',
    isNino: user?.role === 'nino',
    userName: user?.name || 'Usuario',
    userRole: user?.role || 'nino',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export type {
  Classroom, ParentChildRelation, Student, TeacherDashboard, TitanicStats, User,
  WordEntry, WordFilters, WordInput
};
