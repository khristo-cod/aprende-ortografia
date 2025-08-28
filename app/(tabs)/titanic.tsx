// app/(tabs)/titanic.tsx - JUEGO TITANIC RESTRUCTURADO
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

// TIPOS E INTERFACES
interface GameWordEntry {
  word: string;
  hint: string;
  category: string;
}

interface GameState {
  selectedWord: string;
  guessedLetters: string[];
  mistakes: number;
  gameStarted: boolean;
  gameOver: boolean;
  won: boolean;
  category: string;
  hint: string;
  startTime: number;
}

interface GameStats {
  score: number;
  streak: number;
  totalWords: number;
  correctWords: number;
  experiencePoints: number;
  currentLevel: number;
}

interface LevelInfo {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  description: string;
  color: string;
  reward: string;
}

// CONSTANTES
const MAX_ATTEMPTS = 5;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Marinero', minXP: 0, maxXP: 99, description: 'Comenzando la aventura', color: '#4CAF50', reward: 'Palabras fáciles' },
  { level: 2, name: 'Grumete', minXP: 100, maxXP: 249, description: 'Aprendiendo a navegar', color: '#2196F3', reward: 'Categorías adicionales' },
  { level: 3, name: 'Oficial', minXP: 250, maxXP: 499, description: 'Navegante experimentado', color: '#FF9800', reward: 'Palabras medianas' },
  { level: 4, name: 'Capitán', minXP: 500, maxXP: 999, description: 'Comandante del mar', color: '#9C27B0', reward: 'Todas las categorías' },
  { level: 5, name: 'Almirante', minXP: 1000, maxXP: 9999, description: 'Maestro de los océanos', color: '#F44336', reward: 'Palabras difíciles' },
];

const DIFFICULTY_NAMES = {
  1: 'Fácil',
  2: 'Medio',
  3: 'Difícil',
} as const;

export default function TitanicGame() {
  const router = useRouter();
  const { isAuthenticated, saveGameProgress, getActiveTitanicWords } = useAuth();

  // Estados principales
  const [gameState, setGameState] = useState<GameState>({
    selectedWord: '',
    guessedLetters: [],
    mistakes: 0,
    gameStarted: false,
    gameOver: false,
    won: false,
    category: '',
    hint: '',
    startTime: 0,
  });

  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    streak: 0,
    totalWords: 0,
    correctWords: 0,
    experiencePoints: 0,
    currentLevel: 1,
  });

  const [availableWords, setAvailableWords] = useState<GameWordEntry[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingWords, setLoadingWords] = useState(false);
  
  // Estados de audio
  const [sounds, setSounds] = useState<{
    success: Audio.Sound | null;
    error: Audio.Sound | null;
  }>({ success: null, error: null });

  // FUNCIONES UTILITARIAS
  const getCurrentLevel = useCallback((): LevelInfo => {
    return LEVELS.find(level => 
      gameStats.experiencePoints >= level.minXP && 
      gameStats.experiencePoints <= level.maxXP
    ) || LEVELS[0];
  }, [gameStats.experiencePoints]);

  const getNextLevel = useCallback((): LevelInfo | null => {
    const currentLevel = getCurrentLevel();
    return LEVELS.find(level => level.level === currentLevel.level + 1) || null;
  }, [getCurrentLevel]);

  const getProgressToNextLevel = useCallback((): number => {
    const currentLevel = getCurrentLevel();
    const nextLevel = getNextLevel();
    
    if (!nextLevel) return 100;
    
    const currentLevelXP = gameStats.experiencePoints - currentLevel.minXP;
    const requiredXP = nextLevel.minXP - currentLevel.minXP;
    
    return Math.min(100, (currentLevelXP / requiredXP) * 100);
  }, [getCurrentLevel, getNextLevel, gameStats.experiencePoints]);

  const getDifficultyName = (level: number): string => {
    return DIFFICULTY_NAMES[level as keyof typeof DIFFICULTY_NAMES] || 'Desconocido';
  };

  const getDisplayWord = (): string => {
    return gameState.selectedWord
      .split('')
      .map(letter => gameState.guessedLetters.includes(letter) ? letter : '_')
      .join(' ');
  };

  // FUNCIONES DE INICIALIZACIÓN
  const loadSounds = async (): Promise<void> => {
    try {
      const [successSound, errorSound] = await Promise.all([
        Audio.Sound.createAsync(require('@/assets/sounds/success.mp3')),
        Audio.Sound.createAsync(require('@/assets/sounds/error.mp3'))
      ]);

      setSounds({
        success: successSound.sound,
        error: errorSound.sound,
      });
    } catch (error) {
      console.log('Error cargando sonidos:', error);
    }
  };

  const loadWordsForDifficulty = async (difficulty: number): Promise<void> => {
    try {
      setLoadingWords(true);
      const result = await getActiveTitanicWords(difficulty);
      
      if (result.success && result.words) {
        setAvailableWords(result.words);
        
        if (result.words.length === 0) {
          Alert.alert(
            'Sin palabras disponibles',
            `No hay palabras activas para el nivel ${getDifficultyName(difficulty)}.\n\nContacta al administrador para agregar más palabras.`
          );
        }
      } else {
        console.error('Error cargando palabras:', result.error);
        Alert.alert('Error', result.error || 'No se pudieron cargar las palabras');
        setAvailableWords([]);
      }
    } catch (error) {
      console.error('Error cargando palabras:', error);
      setAvailableWords([]);
    } finally {
      setLoadingWords(false);
    }
  };

  const initializeGame = async (): Promise<void> => {
    try {
      setLoading(true);
      await Promise.all([
        loadSounds(),
        loadWordsForDifficulty(selectedDifficulty)
      ]);
    } catch (error) {
      console.error('Error inicializando juego:', error);
      Alert.alert('Error', 'No se pudo inicializar el juego');
    } finally {
      setLoading(false);
    }
  };

  // FUNCIONES DE JUEGO
  const startNewGame = useCallback((): void => {
    if (availableWords.length === 0) {
      Alert.alert(
        'Sin palabras disponibles',
        `No hay palabras activas para el nivel ${getDifficultyName(selectedDifficulty)}.\n\nNivel actual: ${getCurrentLevel().name}\n\nIntenta con otro nivel de dificultad o contacta al administrador.`
      );
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const selectedWordEntry = availableWords[randomIndex];

    setGameState({
      selectedWord: selectedWordEntry.word,
      guessedLetters: [],
      mistakes: 0,
      gameStarted: true,
      gameOver: false,
      won: false,
      category: selectedWordEntry.category,
      hint: selectedWordEntry.hint,
      startTime: Date.now(),
    });
  }, [availableWords, selectedDifficulty, getCurrentLevel]);

  const playSound = async (soundType: 'success' | 'error'): Promise<void> => {
    try {
      const sound = sounds[soundType];
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log(`Error reproduciendo sonido ${soundType}:`, error);
    }
  };

  const handleLetterPress = useCallback(async (letter: string): Promise<void> => {
    if (gameState.guessedLetters.includes(letter) || gameState.gameOver) return;

    const newGuessedLetters = [...gameState.guessedLetters, letter];
    const isCorrectLetter = gameState.selectedWord.includes(letter);
    
    setGameState(prev => ({
      ...prev,
      guessedLetters: newGuessedLetters,
      mistakes: isCorrectLetter ? prev.mistakes : prev.mistakes + 1,
    }));

    // Actualizar puntuación
    setGameStats(prev => ({
      ...prev,
      score: isCorrectLetter 
        ? prev.score + 10 
        : Math.max(0, prev.score - 5)
    }));

    // Reproducir sonido
    await playSound(isCorrectLetter ? 'success' : 'error');
  }, [gameState.guessedLetters, gameState.gameOver, gameState.selectedWord]);

  const calculateFinalScore = (): number => {
    const timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000);
    const wordBonus = 50;
    const speedBonus = Math.max(0, 30 - timeSpent) * 2;
    const efficiencyBonus = (MAX_ATTEMPTS - gameState.mistakes) * 15;
    const streakBonus = gameStats.streak * 5;
    const difficultyBonus = selectedDifficulty * 20;
    
    return gameStats.score + wordBonus + speedBonus + efficiencyBonus + streakBonus + difficultyBonus;
  };

  const calculateExperienceGain = (): number => {
    const timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000);
    const baseXP = 10;
    const difficultyXP = selectedDifficulty * 15;
    const efficiencyXP = (MAX_ATTEMPTS - gameState.mistakes) * 5;
    const speedXP = Math.max(0, (60 - timeSpent) / 2);
    
    return baseXP + difficultyXP + efficiencyXP + Math.floor(speedXP);
  };

  const endGame = useCallback(async (won: boolean): Promise<void> => {
    let finalScore = gameStats.score;
    let newStreak = gameStats.streak;
    let newCorrectWords = gameStats.correctWords;
    let newExperiencePoints = gameStats.experiencePoints;

    if (won) {
      finalScore = calculateFinalScore();
      newStreak += 1;
      newCorrectWords += 1;
      newExperiencePoints += calculateExperienceGain();
    } else {
      newStreak = 0;
      newExperiencePoints += 2; // XP por intentar
    }

    const newGameStats: GameStats = {
      score: finalScore,
      streak: newStreak,
      totalWords: gameStats.totalWords + 1,
      correctWords: newCorrectWords,
      experiencePoints: newExperiencePoints,
      currentLevel: gameStats.currentLevel,
    };

    setGameStats(newGameStats);
    setGameState(prev => ({ ...prev, gameOver: true, won }));

    // Guardar progreso si está autenticado
    if (isAuthenticated) {
      const timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000);
      await saveGameProgress({
        game_type: 'titanic',
        score: finalScore,
        total_questions: newGameStats.totalWords,
        correct_answers: newCorrectWords,
        incorrect_answers: newGameStats.totalWords - newCorrectWords,
        time_spent: timeSpent,
        completed: true,
        session_data: {
          word: gameState.selectedWord,
          category: gameState.category,
          mistakes: gameState.mistakes,
          max_attempts: MAX_ATTEMPTS,
          streak: newStreak,
          finalScore: finalScore,
          experiencePoints: newExperiencePoints,
          level: getCurrentLevel().level,
          difficulty: selectedDifficulty,
        }
      });
    }

    // Mostrar resultado después de un breve delay
    setTimeout(() => showGameResult(won, newGameStats), 1000);
  }, [gameStats, gameState, selectedDifficulty, isAuthenticated, getCurrentLevel]);

  const showGameResult = (won: boolean, stats: GameStats): void => {
    const accuracy = stats.totalWords > 0 ? Math.round((stats.correctWords / stats.totalWords) * 100) : 0;
    const currentLevel = getCurrentLevel();
    
    Alert.alert(
      won ? 'Titanic Salvado!' : 'Titanic Hundido!',
      won 
        ? `Excelente! Salvaste el Titanic adivinando "${gameState.selectedWord}"\n\n` +
          `Puntuación: ${stats.score}\n` +
          `XP Ganada: +${stats.experiencePoints - gameStats.experiencePoints}\n` +
          `Nivel: ${currentLevel.name} (${stats.experiencePoints} XP)\n` +
          `Racha: ${stats.streak}\n` +
          `Precisión: ${accuracy}%\n` +
          `Tiempo: ${Math.floor((Date.now() - gameState.startTime) / 1000)}s\n` +
          `Dificultad: ${getDifficultyName(selectedDifficulty)}`
        : `El Titanic se hundió. La palabra era "${gameState.selectedWord}"\n\n` +
          `Puntuación: ${stats.score}\n` +
          `XP: +2 por intentar\n` +
          `Nivel: ${currentLevel.name}\n` +
          `Palabras completadas: ${stats.correctWords}/${stats.totalWords}`,
      [
        { text: 'Continuar jugando', onPress: startNewGame },
        { text: 'Ver estadísticas', onPress: showStats },
        { text: 'Cambiar nivel', onPress: showDifficultySelector },
        { text: 'Salir', onPress: () => router.back() },
      ]
    );
  };

  const checkLevelUp = useCallback((): void => {
    const currentLevel = getCurrentLevel();
    if (currentLevel.level > gameStats.currentLevel) {
      setGameStats(prev => ({ ...prev, currentLevel: currentLevel.level }));
      
      Alert.alert(
        'NIVEL AUMENTADO!',
        `Felicidades! Ahora eres ${currentLevel.name}\n\n` +
        `${currentLevel.description}\n\n` +
        `Recompensa: ${currentLevel.reward}`,
        [{ text: 'Genial!', onPress: updateAvailableDifficulty }]
      );
    }
  }, [getCurrentLevel, gameStats.currentLevel]);

  const updateAvailableDifficulty = (): void => {
    const currentLevel = getCurrentLevel();
    if (currentLevel.level >= 3 && selectedDifficulty < 2) {
      setSelectedDifficulty(2);
      loadWordsForDifficulty(2);
    } else if (currentLevel.level >= 5 && selectedDifficulty < 3) {
      setSelectedDifficulty(3);
      loadWordsForDifficulty(3);
    }
  };

  const showStats = (): void => {
    const currentLevel = getCurrentLevel();
    const nextLevel = getNextLevel();
    const progressToNext = getProgressToNextLevel();
    
    Alert.alert(
      'Estadísticas del Titanic',
      `Puntuación Total: ${gameStats.score}\n` +
      `Experiencia: ${gameStats.experiencePoints} XP\n` +
      `Nivel Actual: ${currentLevel.name} (${currentLevel.level})\n` +
      `Progreso: ${Math.round(progressToNext)}%${nextLevel ? ` hacia ${nextLevel.name}` : ' (Nivel Máximo)'}\n` +
      `Racha Actual: ${gameStats.streak}\n` +
      `Palabras Completadas: ${gameStats.correctWords}\n` +
      `Total de Palabras: ${gameStats.totalWords}\n` +
      `Precisión: ${gameStats.totalWords > 0 ? Math.round((gameStats.correctWords / gameStats.totalWords) * 100) : 0}%\n` +
      `Dificultad Actual: ${getDifficultyName(selectedDifficulty)}\n\n` +
      `Sigue salvando el Titanic!`,
      [
        { text: 'Nueva partida', onPress: startNewGame },
        { text: 'Cambiar dificultad', onPress: showDifficultySelector },
        { text: 'Cerrar', style: 'cancel' }
      ]
    );
  };

  const showDifficultySelector = (): void => {
  const currentLevel = getCurrentLevel();
  let availableLevels = [1];
  
  if (currentLevel.level >= 3) availableLevels.push(2);
  if (currentLevel.level >= 5) availableLevels.push(3);
  
  const options: Array<{ text: string; onPress: () => void; style?: 'cancel' | 'default' | 'destructive' }> = availableLevels.map(level => ({
    text: `${getDifficultyName(level)} ${level === selectedDifficulty ? '✓' : ''}`,
    onPress: async () => {
      setSelectedDifficulty(level);
      await loadWordsForDifficulty(level);
      Alert.alert('Dificultad Cambiada', `Ahora jugarás en nivel ${getDifficultyName(level)}`);
    }
  }));
  
  // Agregar opciones bloqueadas
  if (currentLevel.level < 3) {
    options.push({
      text: 'Medio (Desbloquea en Nivel 3)',
      onPress: () => Alert.alert('Bloqueado', 'Alcanza el nivel 3 (Oficial) para desbloquear este nivel')
    });
  }
  
  if (currentLevel.level < 5) {
    options.push({
      text: 'Difícil (Desbloquea en Nivel 5)', 
      onPress: () => Alert.alert('Bloqueado', 'Alcanza el nivel 5 (Almirante) para desbloquear este nivel')
    });
  }
  
  options.push({ 
    text: 'Cancelar', 
    onPress: () => {},
    style: 'cancel'
  });
  
  Alert.alert(
    'Seleccionar Dificultad',
    `Nivel actual: ${currentLevel.name}\n\nElige la dificultad de las palabras:`,
    options
  );
};

  // EFECTOS
  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver) {
      const allLettersGuessed = gameState.selectedWord
        .split('')
        .every(letter => gameState.guessedLetters.includes(letter));

      const shouldEndGame = gameState.mistakes >= MAX_ATTEMPTS || allLettersGuessed;
      
      if (shouldEndGame) {
        const won = allLettersGuessed && gameState.mistakes < MAX_ATTEMPTS;
        endGame(won);
      }
    }
  }, [gameState.guessedLetters, gameState.mistakes, gameState.gameStarted, gameState.gameOver]);

  useEffect(() => {
    checkLevelUp();
  }, [gameStats.experiencePoints, checkLevelUp]);

  // COMPONENTES DE RENDER
  const renderTitanic = () => {
    const sinkLevel = (gameState.mistakes / MAX_ATTEMPTS) * 100;
    
    const statusMessages = [
      'Titanic navegando tranquilo',
      'Primera fuga detectada!',
      'El barco se está ladeando!',
      'Agua entrando rápidamente!',
      'EMERGENCIA! Una más y se hunde',
      'TITANIC HUNDIDO!'
    ];

    return (
      <View style={styles.titanicContainer}>
        <View style={styles.oceanContainer}>
          <LinearGradient
            colors={['#87CEEB', '#4169E1', '#191970']}
            style={styles.ocean}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          
          <View style={[styles.titanic, { 
            transform: [
              { translateY: sinkLevel * 1.5 },
              { rotate: `${sinkLevel * 0.3}deg` }
            ] 
          }]}>
            <Text style={styles.titanicEmoji}>🚢</Text>
          </View>

          {gameState.mistakes > 0 && (
            <View style={styles.bubblesContainer}>
              {[...Array(Math.min(gameState.mistakes, 3))].map((_, index) => (
                <Text key={index} style={[styles.bubble, { 
                  left: (index - 1) * 10, 
                  top: -index * 8 
                }]}>💧</Text>
              ))}
            </View>
          )}

          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {statusMessages[Math.min(gameState.mistakes, statusMessages.length - 1)]}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderKeyboard = () => (
    <View style={styles.keyboard}>
      {ALPHABET.map((letter: string) => {
        const isGuessed = gameState.guessedLetters.includes(letter);
        const isCorrect = isGuessed && gameState.selectedWord.includes(letter);
        const isWrong = isGuessed && !gameState.selectedWord.includes(letter);

        return (
          <TouchableOpacity
            key={letter}
            style={[
              styles.letterButton,
              isCorrect && styles.correctLetter,
              isWrong && styles.wrongLetter,
              isGuessed && styles.disabledLetter
            ]}
            onPress={() => handleLetterPress(letter)}
            disabled={isGuessed || gameState.gameOver}
          >
            <Text style={styles.letterText}>{letter}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // RENDER PRINCIPAL
  if (loading) {
    return (
      <LinearGradient colors={['#E1F5FE', '#B3E5FC']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Cargando Titanic...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#E1F5FE', '#B3E5FC', '#81D4FA']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
            <Text style={styles.backText}>ATRÁS</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>TITANIC</Text>
          
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{getCurrentLevel().name}</Text>
          </View>
        </View>

        {!gameState.gameStarted ? (
          // Pantalla de inicio
          <View style={styles.startContainer}>
            <View style={styles.gameCard}>
              <Text style={styles.gameTitle}>Salva el Titanic!</Text>
              <Text style={styles.gameDescription}>
                Adivina la palabra antes de que el barco se hunda.
                Tienes {MAX_ATTEMPTS} intentos.
              </Text>
              
              {loadingWords ? (
                <View style={styles.loadingWordsContainer}>
                  <ActivityIndicator size="small" color="#2196F3" />
                  <Text style={styles.loadingWordsText}>Cargando palabras...</Text>
                </View>
              ) : (
                <View style={styles.categoryContainer}>
                  <Text style={styles.categoryLabel}>PALABRAS DISPONIBLES:</Text>
                  <Text style={styles.categoryValue}>
                    {availableWords.length} palabras desde la base de datos
                  </Text>
                  <Text style={styles.levelLabel}>
                    Nivel: {getCurrentLevel().name} | Dificultad: {getDifficultyName(selectedDifficulty)}
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.startButton, (availableWords.length === 0 || loadingWords) && styles.startButtonDisabled]} 
                onPress={startNewGame}
                disabled={availableWords.length === 0 || loadingWords}
              >
                <LinearGradient
                  colors={availableWords.length === 0 ? ['#BDBDBD', '#9E9E9E'] : ['#4CAF50', '#45a049']}
                  style={styles.startButtonGradient}
                >
                  <Text style={styles.startButtonText}>
                    {availableWords.length === 0 ? 'SIN PALABRAS' : 'ZARPAR'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Pantalla de juego
          <View style={styles.gameContainer}>
            {/* Información del juego */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.categoryText}>PISTA: {gameState.category}</Text>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreValue}>{gameStats.score}</Text>
                </View>
              </View>
              
              <View style={styles.levelInfo}>
                <View style={styles.levelContainer}>
                  <Text style={styles.levelInfoText}>
                    {getCurrentLevel().name} ({getCurrentLevel().level}) - {gameStats.experiencePoints} XP
                  </Text>
                </View>
                
                {getNextLevel() && (
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[styles.progressFill, { 
                          width: `${getProgressToNextLevel()}%`,
                          backgroundColor: getCurrentLevel().color
                        }]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {Math.round(getProgressToNextLevel())}% hacia {getNextLevel()?.name}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.hintText}>{gameState.hint}</Text>
              
              <View style={styles.statsRow}>
                <Text style={styles.attemptsText}>
                  Intentos: {MAX_ATTEMPTS - gameState.mistakes}
                </Text>
                <Text style={styles.difficultyText}>
                  {getDifficultyName(selectedDifficulty)}
                </Text>
                <Text style={styles.streakText}>
                  Racha: {gameStats.streak}
                </Text>
                <Text style={styles.wordsText}>
                  {gameStats.correctWords}/{gameStats.totalWords}
                </Text>
              </View>
            </View>

            {/* Titanic animado */}
            {renderTitanic()}

            {/* Palabra a adivinar */}
            <View style={styles.wordContainer}>
              <Text style={styles.word}>{getDisplayWord()}</Text>
            </View>

            {/* Teclado */}
            {renderKeyboard()}

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.newGameButton} onPress={startNewGame}>
                <Text style={styles.actionButtonText}>Nueva Palabra</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.difficultyButton} onPress={showDifficultySelector}>
                <Text style={styles.actionButtonText}>Nivel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.endButton} onPress={() => router.back()}>
                <Text style={styles.actionButtonText}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#4CAF50',
    marginTop: 16,
    fontWeight: 'bold',
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
  levelBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  gameCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  gameTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 16,
    textAlign: 'center',
  },
  gameDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  loadingWordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  loadingWordsText: {
    fontSize: 14,
    color: '#2196F3',
  },
  categoryContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 8,
  },
  levelLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  startButton: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  startButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  startButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  scoreContainer: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  levelInfo: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  levelContainer: {
    marginBottom: 8,
  },
  levelInfoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  hintText: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attemptsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F44336',
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9C27B0',
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  streakText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  wordsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  titanicContainer: {
    height: 200,
    marginVertical: 20,
  },
  oceanContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  ocean: {
    flex: 1,
  },
  titanic: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    marginLeft: -30,
    marginTop: -15,
  },
  titanicEmoji: {
    fontSize: 60,
  },
  bubblesContainer: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -20,
  },
  bubble: {
    fontSize: 16,
    position: 'absolute',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  wordContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    letterSpacing: 8,
    textAlign: 'center',
  },
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 6,
  },
  letterButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    margin: 1,
  },
  correctLetter: {
    backgroundColor: '#4CAF50',
  },
  wrongLetter: {
    backgroundColor: '#F44336',
  },
  disabledLetter: {
    opacity: 0.5,
  },
  letterText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    gap: 8,
  },
  newGameButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: '#9C27B0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  endButton: {
    flex: 1,
    backgroundColor: '#9E9E9E',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});