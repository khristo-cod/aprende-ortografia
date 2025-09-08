// 🎯 REEMPLAZAR COMPLETAMENTE src/config/api.ts con esto:

import { Platform } from 'react-native';

// Función para detectar la URL correcta según el entorno
export const getApiUrl = (): string => {
  console.log('🔧 Platform.OS:', Platform.OS);
  // @ts-ignore
  console.log('🔧 __DEV__:', __DEV__);
  
  // @ts-ignore
  if (__DEV__) {
    let url = '';
    
    switch (Platform.OS) {
      case 'android':
        // 🎯 TU IP ESPECÍFICA para dispositivo físico
        url = 'http://192.168.1.8:3001/api';
        break;
      case 'ios':
        // iOS Simulator puede usar localhost
        url = 'http://localhost:3001/api';
        break;
      case 'web':
        // Web en desarrollo
        url = 'http://localhost:3001/api';
        break;
      default:
        url = 'http://localhost:3001/api';
        break;
    }
    
    console.log('🔧 API URL seleccionada:', url);
    return url;
  } else {
    // Producción
    const prodUrl = 'https://tu-backend-produccion.herokuapp.com/api';
    console.log('🔧 Modo producción, URL:', prodUrl);
    return prodUrl;
  }
};

// URL base para todas las llamadas API
export const API_BASE_URL = getApiUrl();

// Configuración de timeout y headers por defecto
export const API_CONFIG = {
  timeout: 50000, // 10 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Función para hacer requests con manejo de errores y debug completo
// También agregar retry automático en makeApiRequest
export const makeApiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {},
  retries: number = 2 // 🆕 Intentos automáticos
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    console.log(`🌐 === INICIO REQUEST (Intento ${attempt}/${retries + 1}) ===`);
    console.log('🌐 URL completa:', url);
    console.log('🌐 Método:', options.method || 'GET');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ TIMEOUT disparado después de ${API_CONFIG.timeout}ms en intento ${attempt}`);
        controller.abort();
      }, API_CONFIG.timeout);
      
      console.log('🚀 Enviando request...');
      const response = await fetch(url, {
        ...options,
        headers: {
          ...API_CONFIG.headers,
          ...options.headers,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('📡 Response recibido:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorText = 'Error desconocido';
        try {
          errorText = await response.text();
          console.log('❌ Error del servidor:', errorText);
        } catch (e) {
          console.log('❌ No se pudo leer error del servidor');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Data recibida exitosamente');
      console.log('🌐 === FIN REQUEST EXITOSO ===');
      return data;
      
    } catch (error: any) {
      console.log(`🚨 === ERROR EN REQUEST (Intento ${attempt}) ===`);
      console.log('🚨 Error name:', error?.name);
      console.log('🚨 Error message:', error?.message);
      
      // Si es el último intento, lanzar el error
      if (attempt === retries + 1) {
        console.log('🚨 === TODOS LOS INTENTOS FALLARON ===');
        
        if (error?.name === 'AbortError') {
          throw new Error(`Timeout después de ${retries + 1} intentos. El servidor está muy lento o no responde.`);
        }
        
        if (error?.message?.includes('Network request failed')) {
          throw new Error('Error de red: Verifica que el servidor esté corriendo y ambos dispositivos en la misma WiFi.');
        }
        
        throw error;
      }
      
      // Si no es el último intento, esperar un poco antes del siguiente
      console.log(`⏳ Esperando 2 segundos antes del intento ${attempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Esto nunca debería ejecutarse, pero TypeScript lo requiere
  throw new Error('Error inesperado en makeApiRequest');
};

// Función helper para debug - mostrar configuración actual
export const getApiConfig = () => {
  return {
    baseUrl: API_BASE_URL,
    platform: Platform.OS,
    // @ts-ignore
    isDev: __DEV__,
    config: API_CONFIG
  };
};