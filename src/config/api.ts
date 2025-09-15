// 🔧 ARCHIVO CORREGIDO: src/config/api.ts
import * as Network from 'expo-network';
import { Platform } from 'react-native';

// 🆕 DETECTAR IP AUTOMÁTICAMENTE
const getLocalIPAddress = async (): Promise<string> => {
  try {
    // Intentar obtener IP automáticamente
    const networkInfo = await Network.getIpAddressAsync();
    if (networkInfo && networkInfo !== '127.0.0.1') {
      console.log('🔍 IP detectada automáticamente:', networkInfo);
      return networkInfo;
    }
  } catch (error) {
    console.log('⚠️ No se pudo detectar IP automáticamente');
  }

  // IPs comunes como fallback
  const commonIPs = [
    '192.168.1.8',   // Tu IP actual
    '192.168.1.105', // IP común
    '192.168.0.105', // IP común
    '10.0.2.2',      // Android emulator
  ];

  console.log('🔄 Usando IP fallback:', commonIPs[0]);
  return commonIPs[0];
};

export const getApiUrl = async (): Promise<string> => {
  console.log('🔧 Platform.OS:', Platform.OS);
  
  // @ts-ignore
  if (__DEV__) {
    const localIP = await getLocalIPAddress();
    let url = '';
    
    switch (Platform.OS) {
      case 'android':
        url = `http://${localIP}:3001/api`;
        break;
      case 'ios':
        url = `http://${localIP}:3001/api`;
        break;
      case 'web':
        url = 'http://localhost:3001/api';
        break;
      default:
        url = `http://${localIP}:3001/api`;
        break;
    }
    
    console.log('🔧 API URL seleccionada:', url);
    return url;
  } else {
    const prodUrl = 'https://tu-backend-produccion.herokuapp.com/api';
    console.log('🔧 Modo producción, URL:', prodUrl);
    return prodUrl;
  }
};

// 🆕 INICIALIZAR API_BASE_URL DE FORMA ASÍNCRONA
let API_BASE_URL = 'http://localhost:3001/api'; // Fallback inicial

export const initializeApiUrl = async (): Promise<string> => {
  try {
    API_BASE_URL = await getApiUrl();
    return API_BASE_URL;
  } catch (error) {
    console.error('🚨 Error inicializando API URL:', error);
    return API_BASE_URL;
  }
};

export { API_BASE_URL };

export const API_CONFIG = {
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// 🆕 FUNCIÓN MEJORADA CON DETECCIÓN DE PROBLEMAS DE RED
export const makeApiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {},
  retries: number = 3
): Promise<T> => {
  // Asegurar que tenemos la URL correcta
  const currentUrl = await initializeApiUrl();
  const url = `${currentUrl}${endpoint}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`🌐 === INICIO REQUEST (Intento ${attempt}/${retries}) ===`);
    console.log('🌐 URL completa:', url);
    console.log('🌐 Método:', options.method || 'GET');
    
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
      
      if (attempt === retries) {
        console.log('🚨 === TODOS LOS INTENTOS FALLARON ===');
        
        if (error?.name === 'AbortError') {
          throw new Error(`Timeout: El servidor no responde después de ${retries} intentos. 
Verifica:
1. Que el servidor esté corriendo: node src/backend/server.js
2. Que ambos dispositivos estén en la misma WiFi
3. Que no haya firewall bloqueando el puerto 3001
4. Tu IP actual: ${await getLocalIPAddress()}`);
        }
        
        if (error?.message?.includes('Network request failed') || 
            error?.message?.includes('fetch')) {
          throw new Error(`Error de red: No se puede conectar al servidor.
Verifica:
1. IP correcta: ${await getLocalIPAddress()}
2. Servidor corriendo: http://${await getLocalIPAddress()}:3001/api/health
3. Misma red WiFi
4. Firewall/antivirus no bloquee el puerto`);
        }
        
        throw error;
      }
      
      console.log(`⏳ Esperando ${attempt * 1000}ms antes del intento ${attempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Error inesperado en makeApiRequest');
};

// 🔧 FUNCIÓN PARA TESTING DE CONECTIVIDAD MEJORADA
export const testConnectivity = async (): Promise<{
  success: boolean;
  url: string;
  ip: string;
  details: string;
}> => {
  try {
    console.log('🧪 Testing conectividad...');
    const currentUrl = await initializeApiUrl();
    const currentIP = await getLocalIPAddress();
    
    const response = await fetch(`${currentUrl}/health`, {
      method: 'GET',
      headers: API_CONFIG.headers,
    });
    
    console.log('🧪 Test result:', response.status);
    return {
      success: response.ok,
      url: currentUrl,
      ip: currentIP,
      details: response.ok ? 'Conexión exitosa' : `Error HTTP ${response.status}`
    };
  } catch (error: any) {
    console.log('🧪 Test falló:', error);
    const currentIP = await getLocalIPAddress();
    return {
      success: false,
      url: API_BASE_URL,
      ip: currentIP,
      details: error.message || 'Error de conexión'
    };
  }
};

export const getApiConfig = async () => {
  const currentUrl = await initializeApiUrl();
  const currentIP = await getLocalIPAddress();
  
  return {
    baseUrl: currentUrl,
    localIP: currentIP,
    platform: Platform.OS,
    // @ts-ignore
    isDev: __DEV__,
    config: API_CONFIG
  };
};