// src/config/api.ts - CONFIGURACIÓN CORREGIDA CON TU IP
import { Platform } from 'react-native';

// 🔧 TU IP LOCAL
const LOCAL_IP = '10.118.239.244';

export const getApiUrl = (): string => {
  console.log('🔧 Platform.OS:', Platform.OS);
  
  // @ts-ignore
  if (__DEV__) {
    let url = '';
    
    switch (Platform.OS) {
      case 'android':
        url = `http://${LOCAL_IP}:3001/api`;
        break;
      case 'ios':
        url = `http://${LOCAL_IP}:3001/api`;
        break;
      case 'web':
        url = 'http://localhost:3001/api';
        break;
      default:
        url = `http://${LOCAL_IP}:3001/api`;
        break;
    }
    
    console.log('🔧 API URL:', url);
    return url;
  } else {
    return 'https://tu-backend-produccion.herokuapp.com/api';
  }
};

export const API_BASE_URL = getApiUrl();

export const API_CONFIG = {
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export const makeApiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {},
  retries: number = 2
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`🌐 Request ${attempt}/${retries}: ${url}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...API_CONFIG.headers,
          ...options.headers,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('✅ Response:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
      
    } catch (error: any) {
      console.log(`❌ Intento ${attempt} falló:`, error.message);
      
      if (attempt === retries) {
        throw new Error(`Error después de ${retries} intentos: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Error inesperado');
};

export const testConnectivity = async (): Promise<{
  success: boolean;
  url: string;
  details: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: API_CONFIG.headers,
    });
    
    return {
      success: response.ok,
      url: API_BASE_URL,
      details: response.ok ? 'Conexión exitosa' : `Error HTTP ${response.status}`
    };
  } catch (error: any) {
    return {
      success: false,
      url: API_BASE_URL,
      details: error.message || 'Error de conexión'
    };
  }
};