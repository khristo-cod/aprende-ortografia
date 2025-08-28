import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

const HangmanGame = () => {
  const words = [
    'CAMPESINO',
    'ENFERMERA',
    'TROMPETA',
    'CAMPANA',
    'BOMBA',
    'TIMBRE',
    'ENVASE',
    'COLUMPIO',
    'BOMBERO',
    'EMPEZAR',
    'IMPRESORA',
    'COMPÁS',
    'SOMBRERO',
    'LAMINA',
    'TEMPLO',
    'AMBAR',
    'EMBUDO',
    'IMPACTO',
    'AMBULANCIA',
    'EMBARAZO'
  ];
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const router = useRouter();

  const getRandomWord = (exclude: string = '') => {
    let filtered = words;
    if (exclude) {
      filtered = words.filter(w => w !== exclude);
    }
    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
  };

  const startNewGame = () => {
    setSelectedWord(getRandomWord(selectedWord));
    setGuessedLetters([]);
    setMistakes(0);
    setGameStarted(false);
  };

  const handleLetterPress = (letter: string) => {
    if (!selectedWord.includes(letter)) {
      setMistakes(prev => prev + 1);
    }
    setGuessedLetters(prev => [...prev, letter]);
    setGameStarted(true);
  };

  const getDisplayWord = () => {
    return selectedWord
      .split('')
      .map((letter) => (guessedLetters.includes(letter) ? letter : '_'))
      .join(' ');
  };

  const getAlphabet = () => {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  };

  const isGameOver = mistakes >= 6;
  const hasWon = selectedWord
    .split('')
    .every((letter) => guessedLetters.includes(letter));

  useEffect(() => {
    // Solo inicializa el juego si no hay palabra seleccionada
    if (!selectedWord) {
      setSelectedWord(getRandomWord());
      setGuessedLetters([]);
      setMistakes(0);
      setGameStarted(false);
    }
  }, [selectedWord]);

  useEffect(() => {
    if (!gameStarted) return;
    if (hasWon) {
      Alert.alert('¡Ganaste!', '¡Felicidades, adivinaste la palabra!', [
        { text: 'Jugar de nuevo', onPress: startNewGame },
      ]);
    } else if (isGameOver) {
      Alert.alert('¡Perdiste!', `La palabra era: ${selectedWord}`, [
        { text: 'Intentar de nuevo', onPress: startNewGame },
      ]);
    }
  }, [hasWon, isGameOver, gameStarted]);

  const handleEndGame = () => {
    Alert.alert(
      'Juego terminado',
      `¿Deseas reiniciar el juego?\nTu puntaje: ${selectedWord ? guessedLetters.filter(l => selectedWord.includes(l)).length : 0}/${selectedWord.length}`,
      [
        {
          text: 'Sí',
          onPress: () => {
            setSelectedWord(getRandomWord(selectedWord));
            setGuessedLetters([]);
            setMistakes(0);
            setGameStarted(false);
          },
        },
        {
          text: 'No',
          onPress: () => {
            router.replace('/(tabs)');
          },
          style: 'cancel',
        },
      ]
    );
  };

  const renderHangman = () => {
    return (
      <Svg height="200" width="200">
        {/* Base */}
        <Line x1="20" y1="180" x2="120" y2="180" stroke="black" strokeWidth="4" />
        {/* Poste vertical */}
        <Line x1="70" y1="180" x2="70" y2="40" stroke="black" strokeWidth="4" />
        {/* Travesaño superior */}
        <Line x1="70" y1="40" x2="140" y2="40" stroke="black" strokeWidth="4" />
        {/* Cuerda */}
        <Line x1="140" y1="40" x2="140" y2="70" stroke="black" strokeWidth="2" />
        
        {/* Cabeza */}
        {mistakes > 0 && <Circle cx="140" cy="90" r="20" stroke="black" strokeWidth="2" fill="none" />}
        {/* Cuerpo */}
        {mistakes > 1 && <Line x1="140" y1="110" x2="140" y2="150" stroke="black" strokeWidth="2" />}
        {/* Brazo izquierdo */}
        {mistakes > 2 && <Line x1="140" y1="120" x2="120" y2="130" stroke="black" strokeWidth="2" />}
        {/* Brazo derecho */}
        {mistakes > 3 && <Line x1="140" y1="120" x2="160" y2="130" stroke="black" strokeWidth="2" />}
        {/* Pierna izquierda */}
        {mistakes > 4 && <Line x1="140" y1="150" x2="120" y2="170" stroke="black" strokeWidth="2" />}
        {/* Pierna derecha */}
        {mistakes > 5 && <Line x1="140" y1="150" x2="160" y2="170" stroke="black" strokeWidth="2" />}
      </Svg>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Text style={styles.title}>Ahorcado</Text>
        
        {renderHangman()}
        
        <Text style={styles.word}>{getDisplayWord()}</Text>
        
        <View style={styles.keyboard}>
          {getAlphabet().map((letter) => (
            <TouchableOpacity
              key={letter}
              style={[
                styles.letterButton,
                guessedLetters.includes(letter) && styles.disabledButton
              ]}
              onPress={() => handleLetterPress(letter)}
              disabled={guessedLetters.includes(letter) || hasWon || isGameOver}
            >
              <Text style={styles.letterText}>{letter}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.resetButton} onPress={startNewGame}>
            <Text style={styles.resetButtonText}>Reiniciar juego</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.endButton} onPress={handleEndGame}>
            <Text style={styles.endButtonText}>Terminar juego</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.mistakes}>Errores: {mistakes}/6</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
    paddingTop: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
  },
  word: {
    fontSize: 24,
    letterSpacing: 10,
    marginVertical: 20,
    color: '#444',
  },
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 20,
  },
  letterButton: {
    width: 40,
    height: 40,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
  letterText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mistakes: {
    fontSize: 18,
    color: '#F44336',
    marginTop: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
    marginHorizontal: 20,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#FFA726',
    paddingVertical: 10,
    borderRadius: 8,
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

export default HangmanGame;