// 🚨 REEMPLAZAR COMPLETAMENTE src/config/api.ts
import { Platform } from 'react-native';

// 🚨 IMPORTANTE: Cambiar por tu IP real de WiFi
const getLocalIPAddress = (): string => {
  // 🔍 Para encontrar tu IP ejecuta en terminal:
  // Windows: ipconfig | findstr "IPv4"
  // Mac: ipconfig getifaddr en0
  // Linux: hostname -I | awk '{print $1}'
  
  return '192.168.1.8'; // 🚨 CAMBIAR POR TU IP REAL
};

export const getApiUrl = (): string => {
  console.log('🔧 Platform.OS:', Platform.OS);
  // @ts-ignore
  console.log('🔧 __DEV__:', __DEV__);
  
  // @ts-ignore
  if (__DEV__) {
    const localIP = getLocalIPAddress();
    let url = '';
    
    switch (Platform.OS) {
      case 'android':
        // 🎯 Para Android físico, usar IP de la red WiFi
        url = `http://${localIP}:3001/api`;
        break;
      case 'ios':
        // 🎯 Para iOS, también usar IP de red si es dispositivo físico
        url = `http://${localIP}:3001/api`;
        break;
      case 'web':
        // 🎯 Para web, localhost funciona
        url = 'http://localhost:3001/api';
        break;
      default:
        url = `http://${localIP}:3001/api`;
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

export const API_BASE_URL = getApiUrl();

export const API_CONFIG = {
  timeout: 15000, // 🔧 Reducir timeout para debug
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// 🆕 Función mejorada con mejor logging y retry
export const makeApiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {},
  retries: number = 3
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`🌐 === INICIO REQUEST (Intento ${attempt}/${retries}) ===`);
    console.log('🌐 URL completa:', url);
    console.log('🌐 Método:', options.method || 'GET');
    console.log('🌐 Headers:', JSON.stringify(options.headers, null, 2));
    
    if (options.body) {
      console.log('🌐 Body:', typeof options.body === 'string' ? options.body : 'FormData/Binary');
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ TIMEOUT después de ${API_CONFIG.timeout}ms (intento ${attempt})`);
        controller.abort();
      }, API_CONFIG.timeout);
      
      console.log(`🚀 Enviando request (intento ${attempt})...`);
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
          const errorData = await response.text();
          console.log('❌ Error del servidor:', errorData);
          errorText = errorData;
        } catch (e) {
          console.log('❌ No se pudo leer error del servidor');
        }
        
        // Si es 500 y no es el último intento, reintentar
        if (response.status >= 500 && attempt < retries) {
          console.log('🔄 Error 500, reintentando...');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Data recibida exitosamente');
      console.log('🌐 === FIN REQUEST EXITOSO ===');
      return data;
      
    } catch (error: any) {
      console.log(`🚨 === ERROR EN REQUEST (Intento ${attempt}) ===`);
      console.log('🚨 Error name:', error?.name);
      console.log('🚨 Error message:', error?.message);
      console.log('🚨 Error stack:', error?.stack);
      
      // Si es el último intento, lanzar el error
      if (attempt === retries) {
        console.log('🚨 === TODOS LOS INTENTOS FALLARON ===');
        
        if (error?.name === 'AbortError') {
          throw new Error(`Timeout: El servidor no responde después de ${retries} intentos. 
Verifica:
1. Que el servidor esté corriendo en http://${getLocalIPAddress()}:3001
2. Que ambos dispositivos estén en la misma WiFi
3. Que no haya firewall bloqueando el puerto 3001`);
        }
        
        if (error?.message?.includes('Network request failed') || 
            error?.message?.includes('fetch')) {
          throw new Error(`Error de red: No se puede conectar al servidor.
Verifica:
1. IP correcta: ${getLocalIPAddress()}
2. Servidor corriendo: http://${getLocalIPAddress()}:3001/api/health
3. Misma red WiFi
4. Firewall/antivirus no bloquee el puerto`);
        }
        
        throw error;
      }
      
      // Esperar antes del siguiente intento
      console.log(`⏳ Esperando ${attempt * 1000}ms antes del intento ${attempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Error inesperado en makeApiRequest');
};

// 🔧 Función para testing de conectividad
export const testConnectivity = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing conectividad...');
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: API_CONFIG.headers,
    });
    
    console.log('🧪 Test result:', response.status);
    return response.ok;
  } catch (error) {
    console.log('🧪 Test falló:', error);
    return false;
  }
};

export const getApiConfig = () => {
  return {
    baseUrl: API_BASE_URL,
    localIP: getLocalIPAddress(),
    platform: Platform.OS,
    // @ts-ignore
    isDev: __DEV__,
    config: API_CONFIG
  };
};