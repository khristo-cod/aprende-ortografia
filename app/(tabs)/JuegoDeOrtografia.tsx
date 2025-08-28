import words from '@/data/words.json';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const imageMap: Record<string, any> = {
  'casa.png': require('@/assets/images/casa.png'),
  'perro.png': require('@/assets/images/perro.png'),
  'gato.png': require('@/assets/images/gato.png'),
  'flor.png': require('@/assets/images/flor.png'),
  'mesa.png': require('@/assets/images/mesa.png'),
  'silla.png': require('@/assets/images/silla.png'),
  'sol.png': require('@/assets/images/sol.png'),
  'zapato.png': require('@/assets/images/zapato.png'),
  'manzana.png': require('@/assets/images/manzana.png'),
  'nube.png': require('@/assets/images/nube.png'),
  
};

export default function JuegoDeOrtografia() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correcto, setCorrecto] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [successSoundObject, setSuccessSoundObject] = useState<Audio.Sound | null>(null);
  const [errorSoundObject, setErrorSoundObject] = useState<Audio.Sound | null>(null);
  const router = useRouter();

  const palabra = words.palabras[index];

  useEffect(() => {
    let successSoundInstance: Audio.Sound;
    let errorSoundInstance: Audio.Sound;

    async function loadSounds() {
      const { sound: loadedSuccessSound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/success.mp3')
      );
      const { sound: loadedErrorSound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/error.mp3')
      );
      setSuccessSoundObject(loadedSuccessSound);
      setErrorSoundObject(loadedErrorSound);
      successSoundInstance = loadedSuccessSound;
      errorSoundInstance = loadedErrorSound;
    }

    loadSounds();

    return () => {
      if (successSoundInstance) successSoundInstance.unloadAsync();
      if (errorSoundInstance) errorSoundInstance.unloadAsync();
    };
  }, []);

  // Decir la palabra automáticamente al iniciar cada ronda
  useEffect(() => {
    if (palabra?.word) {
      Speech.speak(palabra.word, {
        language: 'es-ES',
        rate: 0.8,
        pitch: 1.1,
      });
    }
  }, [index]);

  const handleSelect = async (opcion: string) => {
    const letraCorrecta = palabra.word[palabra.incomplete.indexOf('_')];
    const esCorrecto = opcion === letraCorrecta;
    const missingLetterIndex = palabra.incomplete.indexOf('_');
  

    setSelected(opcion);
    setCorrecto(esCorrecto);
    setFeedback(esCorrecto ? '¡Correcto! 🎉' : '¡Incorrecto! ❌');
    if (esCorrecto) {
      if (successSoundObject) await successSoundObject.replayAsync();
    } else {
      if (errorSoundObject) await errorSoundObject.replayAsync();
    }
    if (esCorrecto) setScore((prev) => prev + 1);

    setTimeout(() => {
      if (index + 1 < words.palabras.length) {
        setIndex((prev) => prev + 1);
      } else {
        Alert.alert('¡Juego terminado!', `Tu puntaje: ${score + (esCorrecto ? 1 : 0)}/${words.palabras.length}`);
        // reiniciar juego si deseas:
        setIndex(0);
        setScore(0);
      }
      setSelected(null);
      setCorrecto(false);
      setFeedback(null);
    }, 1000);
  };

  const handleSpeak = () => {
    Speech.speak(palabra.word, {
      language: 'es-ES',
      rate: 0.8,
      pitch: 1.1,
    });
  };

  const handleEndGame = () => {
    Alert.alert(
      'Juego terminado',
      `Tu puntaje: ${score}/${words.palabras.length}\n¿Deseas reiniciar el juego?`,
      [
        {
          text: 'Sí',
          onPress: () => {
            setIndex(0);
            setScore(0);
            setSelected(null);
            setCorrecto(false);
            setFeedback(null);
          },
        },
        {
          text: 'No',
          onPress: () => {
            // Redirige a la raíz de las tabs, que es index.tsx
            router.replace('/(tabs)');
          },
          style: 'cancel',
        },
      ]
    );
  };

  // Puedes personalizar los colores del gradiente según la imagen si lo deseas.
  // Aquí se usa un gradiente genérico claro a oscuro.
  const gradientColors = ['#fffbe6', '#ffe082', '#ffb300'] as const;

  return (
    <View style={styles.container}>
      <Text style={styles.score}>Puntaje: {score}</Text>
      <View style={styles.card}>
        <LinearGradient
          colors={gradientColors}
          style={styles.gradientBackground}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1 }}
        >
          <Image source={imageMap[palabra.image]} style={styles.image} resizeMode="contain" />
          <TouchableOpacity style={styles.speakIcon} onPress={handleSpeak}>
            <MaterialIcons name="volume-up" size={32} color="#FFA726" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
      <Text style={styles.incomplete}>{palabra.incomplete}</Text>

      <View style={styles.options}>
        {palabra.options.map((letra, i) => {
          let backgroundColor = '#87CEFA';
          if (selected === letra) backgroundColor = correcto ? 'green' : 'red';

          return (
            <TouchableOpacity
              key={i}
              style={[styles.button, { backgroundColor }]}
              onPress={() => handleSelect(letra)}
              disabled={selected !== null}
            >
              <Text style={styles.buttonText}>{letra}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {feedback && <Text style={correcto ? styles.correctText : styles.incorrectText}>{feedback}</Text>}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            setIndex(0);
            setScore(0);
            setSelected(null);
            setCorrecto(false);
            setFeedback(null);
          }}
        >
          <Text style={styles.resetButtonText}>Reiniciar juego</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndGame}
        >
          <Text style={styles.endButtonText}>Terminar juego</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  score: { fontSize: 22, fontWeight: 'bold', marginTop:20, marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    position: 'relative',
  },
  gradientBackground: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: { width: 200, height: 200 },
  incomplete: { fontSize: 36, marginBottom: 20 },
  options: { flexDirection: 'row', gap: 10 },
  button: {
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  buttonText: { fontSize: 24, color: '#fff' },
  correctText: { marginTop: 20, fontSize: 20, color: 'green' },
  incorrectText: { marginTop: 20, fontSize: 20, color: 'red' },
  speakIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#fffbe6',
    borderRadius: 20,
    padding: 6,
    elevation: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 18,
    marginHorizontal: 20,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#FFA726',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 0,
    marginLeft: 2,
    marginRight: 2,
    alignItems: 'center',
    maxWidth: '40%',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    
  },
  endButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 2,
    marginRight: 2,
    alignItems: 'center',
    maxWidth: '40%',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
