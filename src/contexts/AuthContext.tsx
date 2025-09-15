// src/contexts/AuthContext.tsx - VERSIÓN CORREGIDA
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { initializeApiUrl, makeApiRequest } from '../config/api';

// Tipos base existentes (mantener todos los tipos que ya tienes)
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

interface TeacherDashboard {
  total_classrooms: number;
  total_students: number;
  recent_activity: number;
  words_created: number;
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
  API_BASE_URL: string;
  
  // Métodos de autenticación
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (name: string, email: string, password: string, role: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;

  // Gestión de estudiantes
  transferStudent: (studentId: number, newClassroomId: number, reason?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  unenrollStudent: (studentId: number, reason?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  
  // Métodos de juegos
  saveGameProgress: (gameData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  getGameProgress: (userId?: number) => Promise<{ success: boolean; progress?: any[]; stats?: any; error?: string }>;
  getGameConfig: (gameType: string) => Promise<{ success: boolean; configs?: any[]; error?: string }>;
  
  // Inscripción de estudiantes
  searchStudent: (email: string) => Promise<{ success: boolean; student?: any; error?: string }>;
  getAvailableClassrooms: () => Promise<{ success: boolean; classrooms?: any[]; error?: string }>;
  studentSelfEnroll: (classroomId: number) => Promise<{ success: boolean; message?: string; error?: string }>;
  checkStudentEnrollmentStatus: () => Promise<{ success: boolean; isEnrolled?: boolean; classroom?: any; error?: string }>;
  
  // CRUD Titanic
  getTitanicWords: (filters?: WordFilters) => Promise<{ success: boolean; words?: WordEntry[]; error?: string }>;
  getTitanicStats: () => Promise<{ success: boolean; stats?: TitanicStats; error?: string }>;
  createTitanicWord: (wordData: WordInput) => Promise<{ success: boolean; word?: WordEntry; error?: string }>;
  updateTitanicWord: (id: string, wordData: Partial<WordInput>) => Promise<{ success: boolean; word?: WordEntry; error?: string }>;
  deleteTitanicWord: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleTitanicWordStatus: (id: string) => Promise<{ success: boolean; word?: WordEntry; error?: string }>;
  getActiveTitanicWords: (difficulty: number) => Promise<{ success: boolean; words?: { word: string; hint: string; category: string; }[]; error?: string }>;
  
  // Gestión de aulas
  createClassroom: (classroomData: {
    name: string;
    grade_level: string;
    section: string;
    school_year: string;
    max_students?: number;
  }) => Promise<{ success: boolean; classroom_id?: number; error?: string }>;
  
  getMyClassrooms: () => Promise<{ success: boolean; classrooms?: Classroom[]; error?: string }>;
  enrollStudent: (classroomId: number, studentId: number) => Promise<{ success: boolean; error?: string }>;
  getClassroomStudents: (classroomId: number) => Promise<{ success: boolean; students?: Student[]; error?: string }>;
  getMyChildren: () => Promise<{ success: boolean; children?: Student[]; error?: string }>;
  getTeacherDashboard: () => Promise<{ success: boolean; dashboard?: TeacherDashboard; error?: string }>;
  
  // 🆕 NUEVA FUNCIÓN PARA DEBUG
  testBackendConnection: () => Promise<{ success: boolean; data?: any; error?: string }>;
  
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [API_BASE_URL, setApiBaseUrl] = useState<string>('http://localhost:3001/api');

useEffect(() => {
    initializeApi();
  }, []);

  const initializeApi = async () => {
    try {
      const url = await initializeApiUrl();
      setApiBaseUrl(url);
      console.log('🔧 API URL inicializada:', url);
    } catch (error) {
      console.error('🚨 Error inicializando API:', error);
    }
  };

  // Verificar token al iniciar la app
  useEffect(() => {
    checkAuthState();
  }, []);

  // Implementar los métodos en el AuthProvider:
  const transferStudent = async (studentId: number, newClassroomId: number, reason?: string) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const data = await makeApiRequest<{
        success: boolean;
        message?: string;
        error?: string;
      }>(`/students/${studentId}/transfer/${newClassroomId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      // ✅ AHORA TypeScript sabe que data tiene message
      return { 
        success: data.success, 
        message: data.message,
        error: data.error 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  };

  const checkAuthState = async (): Promise<void> => {
    try {
      console.log('🔍 Verificando estado de autenticación...');
      const savedToken = await AsyncStorage.getItem('auth_token');
      
      if (savedToken) {
        console.log('🔑 Token encontrado, verificando con servidor...');
        
        const data = await makeApiRequest<{ success: boolean; user: User }>('/auth/verify', {
          headers: {
            'Authorization': `Bearer ${savedToken}`,
          },
        });

        if (data.success) {
          console.log('✅ Token válido, usuario autenticado');
          setToken(savedToken);
          setUser(data.user);
        } else {
          console.log('❌ Token inválido, limpiando storage');
          await AsyncStorage.removeItem('auth_token');
        }
      } else {
        console.log('📭 No hay token guardado');
      }
    } catch (error) {
      console.error('🚨 Error verificando autenticación:', error);
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 LOGIN MEJORADO
  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Intentando login para:', email);
      
      const data = await makeApiRequest<{
        success: boolean;
        user?: User;
        token?: string;
        error?: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.success && data.token && data.user) {
        console.log('✅ Login exitoso para:', data.user.name);
        await AsyncStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        console.log('❌ Login falló:', data.error);
        return { success: false, error: data.error || 'Error desconocido' };
      }
    } catch (error) {
      console.error('🚨 Error en login:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  };

  // 🆕 REGISTER MEJORADO
  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      console.log('📝 Intentando registro para:', email, 'como', role);
      
      const data = await makeApiRequest<{
        success: boolean;
        user?: User;
        token?: string;
        error?: string;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });

      if (data.success && data.token && data.user) {
        console.log('✅ Registro exitoso para:', data.user.name);
        await AsyncStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        console.log('❌ Registro falló:', data.error);
        return { success: false, error: data.error || 'Error desconocido' };
      }
    } catch (error) {
      console.error('🚨 Error en registro:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Cerrando sesión...');
      await AsyncStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      console.log('✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('🚨 Error en logout:', error);
    }
  };

  // 🆕 NUEVOS MÉTODOS PARA INSCRIPCIÓN

  // Verificar estado de inscripción del estudiante
    const checkStudentEnrollmentStatus = async () => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      console.log('🔍 Verificando estado de inscripción...');
      
      const data = await makeApiRequest<{
        success: boolean;
        isEnrolled?: boolean;
        classroom?: any;
        error?: string;
      }>('/student/enrollment-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📊 Resultado de inscripción:', data);
      return data;
    } catch (error) {
      console.error('🚨 Error verificando inscripción:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  };

  // Buscar estudiante por email (para docentes)
  const searchStudent = async (email: string) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const data = await makeApiRequest<{
        success: boolean;
        student?: any;
        error?: string;
      }>('/users/search-student', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      return data;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  };

  // Obtener aulas disponibles (para estudiantes)
  const getAvailableClassrooms = async () => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const data = await makeApiRequest<{
        success: boolean;
        classrooms?: any[];
        error?: string;
      }>('/classrooms/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return data;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  };

  // Estudiante se inscribe en aula
  const studentSelfEnroll = async (classroomId: number) => {
  if (!token) return { success: false, error: 'No autenticado' };

  try {
    const data = await makeApiRequest<{
      success: boolean;
      message?: string;
      error?: string;
    }>(`/student/enroll/${classroomId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return {
      success: data.success,
      message: data.message,
      error: data.error
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error de conexión' 
    };
  }
};
  // 🆕 SAVE GAME PROGRESS MEJORADO
  const saveGameProgress = async (gameData: any) => {
  if (!token || !user) return { success: false, error: 'No autenticado' };

  try {
    console.log('💾 Guardando progreso del juego:', gameData.game_type);
    
    const data = await makeApiRequest<{
      success: boolean;
      session_id?: number;
      message?: string;
      error?: string;
    }>('/games/save-progress', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ ...gameData, user_id: user.id }),
    });

    console.log('✅ Progreso guardado exitosamente');
    return { 
      success: data.success, 
      data: data,
      session_id: data.session_id,
      error: data.error 
    };
  } catch (error) {
    console.error('🚨 Error guardando progreso:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error de conexión' 
    };
  }
};

  const getGameProgress = async (userId?: number) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const targetUserId = userId || user?.id;
      const endpoint = userId ? `/games/progress/${targetUserId}` : `/games/progress`;
      
      const data = await makeApiRequest(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getGameConfig = async (gameType: string) => {
    try {
      const data = await makeApiRequest<{
        success: boolean;
        configs?: any[];
        error?: string;
      }>(`/games/config/${gameType}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });

      return {
        success: true,
        configs: data.configs
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión'
      };
    }
  };

  // Métodos CRUD Titanic (mantener los existentes)
  const getTitanicWords = async (filters?: WordFilters) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const queryParams = new URLSearchParams();
      if (filters?.category && filters.category !== 'TODAS') queryParams.append('category', filters.category);
      if (filters?.difficulty) queryParams.append('difficulty', filters.difficulty.toString());
      if (filters?.active !== undefined) queryParams.append('active', filters.active.toString());
      if (filters?.search) queryParams.append('search', filters.search);

      const endpoint = `/titanic/words${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const data = await makeApiRequest<{ success: boolean; words: WordEntry[]; error?: string }>(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      return { success: true, words: data.words };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getTitanicStats = async () => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const data = await makeApiRequest<{ success: boolean; stats: TitanicStats; error?: string }>('/titanic/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      return { success: true, stats: data.stats };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

const createTitanicWord = async (wordData: WordInput) => {
  if (!token) return { success: false, error: 'No autenticado' };

  try {
    const data = await makeApiRequest<{ 
      success: boolean; 
      word?: WordEntry; 
      message?: string;
      error?: string 
    }>('/titanic/words', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(wordData),
    });

    return { 
      success: data.success, 
      word: data.word,
      message: data.message,
      error: data.error 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error de conexión' 
    };
  }
};

// 8. CORREGIR updateTitanicWord
const updateTitanicWord = async (id: string, wordData: Partial<WordInput>) => {
  if (!token) return { success: false, error: 'No autenticado' };

  try {
    const data = await makeApiRequest<{ 
      success: boolean; 
      word?: WordEntry; 
      message?: string;
      error?: string 
    }>(`/titanic/words/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(wordData),
    });

    return { 
      success: data.success, 
      word: data.word,
      message: data.message,
      error: data.error 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error de conexión' 
    };
  }
};

// 9. CORREGIR deleteTitanicWord
const deleteTitanicWord = async (id: string) => {
  if (!token) return { success: false, error: 'No autenticado' };

  try {
    const data = await makeApiRequest<{
      success: boolean;
      message?: string;
      error?: string;
    }>(`/titanic/words/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    return { 
      success: data.success,
      message: data.message,
      error: data.error 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error de conexión' 
    };
  }
};

// 10. CORREGIR toggleTitanicWordStatus
const toggleTitanicWordStatus = async (id: string) => {
  if (!token) return { success: false, error: 'No autenticado' };

  try {
    const data = await makeApiRequest<{ 
      success: boolean; 
      word?: WordEntry; 
      message?: string;
      error?: string 
    }>(`/titanic/words/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    return { 
      success: data.success, 
      word: data.word,
      message: data.message,
      error: data.error 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error de conexión' 
    };
  }
};

  const getActiveTitanicWords = async (difficulty: number) => {
    try {
      console.log('🎮 Obteniendo palabras del Titanic, dificultad:', difficulty);
      
      const data = await makeApiRequest<{
        success: boolean;
        words?: { word: string; hint: string; category: string; }[];
        error?: string;
      }>(`/titanic/words/active/${difficulty}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });

      if (data.success) {
        console.log(`✅ ${data.words?.length || 0} palabras obtenidas`);
        return { success: true, words: data.words || [] };
      } else {
        return { success: false, error: data.error || 'Error obteniendo palabras' };
      }
    } catch (error) {
      console.error('🚨 Error obteniendo palabras:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  };

  // Métodos de gestión de aulas (mantener los existentes)
  const createClassroom = async (classroomData: {
    name: string;
    grade_level: string;
    section: string;
    school_year: string;
    max_students?: number;
  }) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const data = await makeApiRequest<{ 
        success: boolean; 
        classroom_id?: number; 
        message?: string;
        error?: string 
      }>('/classrooms', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(classroomData),
      });

      return { 
        success: data.success, 
        classroom_id: data.classroom_id,
        message: data.message,
        error: data.error 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  };

  const getMyClassrooms = async () => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const data = await makeApiRequest<{ success: boolean; classrooms: Classroom[]; error?: string }>('/classrooms/my-classrooms', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      return { success: true, classrooms: data.classrooms };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const enrollStudent = async (classroomId: number, studentId: number) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const data = await makeApiRequest<{
        success: boolean;
        message?: string;
        error?: string;
      }>(`/classrooms/${classroomId}/students`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ student_id: studentId }),
      });

      return { 
        success: data.success,
        message: data.message,
        error: data.error 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  };

  const getClassroomStudents = async (classroomId: number) => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const data = await makeApiRequest<{ success: boolean; students: Student[]; error?: string }>(`/classrooms/${classroomId}/students`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      return { success: true, students: data.students };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getMyChildren = async () => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const data = await makeApiRequest<{ success: boolean; children: Student[]; error?: string }>('/parents/my-children', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      return { success: true, children: data.children };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const getTeacherDashboard = async () => {
    if (!token) return { success: false, error: 'No autenticado' };

    try {
      const data = await makeApiRequest<{ success: boolean; dashboard: TeacherDashboard; error?: string }>('/dashboard/teacher', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      return { success: true, dashboard: data.dashboard };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const unenrollStudent = async (studentId: number, reason?: string) => {
  if (!token) return { success: false, error: 'No autenticado' };

  try {
    const data = await makeApiRequest<{
      success: boolean;
      message?: string;
      error?: string;
    }>(`/students/${studentId}/unenroll`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });

    // ✅ AHORA TypeScript sabe que data tiene message
    return { 
      success: data.success, 
      message: data.message,
      error: data.error 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error de conexión' 
    };
  }
};

    const value: AuthContextType = {
      user,
      token,
      loading,
      API_BASE_URL, // Ahora es dinámico
      login,
      register,
      logout,
      saveGameProgress,
      getGameProgress,
      getGameConfig,
      transferStudent,
      unenrollStudent, // 🔧 CORREGIDO - ahora una sola función


      // Métodos de inscripción
      searchStudent,
      getAvailableClassrooms,
      studentSelfEnroll,
      checkStudentEnrollmentStatus, // 🔧 CORREGIDO


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
      getMyChildren,
      getTeacherDashboard,

      // 🆕 NUEVA FUNCIÓN PARA DEBUG
      // Estados útiles
      isAuthenticated: !!user,
      isDocente: user?.role === 'docente',
      isRepresentante: user?.role === 'representante',
      isNino: user?.role === 'nino',
      userName: user?.name || 'Usuario',
      userRole: user?.role || 'nino',
      testBackendConnection: function (): Promise<{ success: boolean; data?: any; error?: string; }> {
        throw new Error('Function not implemented.');
      }
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
  Classroom, Student, TeacherDashboard, TitanicStats, User,
  WordEntry, WordFilters, WordInput
};

