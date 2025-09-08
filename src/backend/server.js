// src/backend/server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDatabase, runQuery, getQuery, allQuery } = require('./database/db');

const app = express();
const PORT = 3001; // Puerto diferente para no interferir
const JWT_SECRET = 'ortografia_app_secret_key_2025';

process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
  console.error('Stack:', err.stack);
  // No hacer process.exit() para ver exactamente dónde ocurre
});

// 🆕 OPTIMIZACIONES PARA DISPOSITIVOS MÓVILES
app.use(cors({
  origin: '*', // Permitir todos los orígenes en desarrollo
  credentials: true,
  optionsSuccessStatus: 200
}));

// 🆕 Aumentar límites para requests móviles
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🆕 Middleware para logging de requests móviles
app.use((req, res, next) => {
  const start = Date.now();
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`📱 ${req.method} ${req.url} - ${userAgent.includes('Expo') ? 'MÓVIL' : 'WEB'}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`⏱️  ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// Variable para controlar si el servidor ya está corriendo
let serverInstance = null;

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// =================== RUTAS DE AUTENTICACIÓN ===================

// 🆕 Endpoint específico para test de conectividad móvil
app.get('/api/mobile-test', (req, res) => {
  const userAgent = req.get('User-Agent') || 'Unknown';
  res.json({
    status: 'OK',
    message: 'Conectividad móvil exitosa',
    timestamp: new Date().toISOString(),
    userAgent: userAgent,
    ip: req.ip || req.connection.remoteAddress,
    isMobile: userAgent.includes('Expo') || userAgent.includes('React Native')
  });
});

// 🆕 OPTIMIZAR el endpoint de login para ser más rápido
app.post('/api/auth/login', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { email, password } = req.body;
    console.log(`🔐 Login attempt para: ${email}`);

    if (!email || !password) {
      console.log('❌ Login falló: campos faltantes');
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario - OPTIMIZADO con índice
    const user = await getQuery(
      'SELECT * FROM users WHERE email = ? OR name = ? LIMIT 1', 
      [email, email]
    );
    
    if (!user) {
      console.log('❌ Login falló: usuario no encontrado');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('❌ Login falló: contraseña incorrecta');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const duration = Date.now() - startTime;
    console.log(`✅ Login exitoso para ${user.name} en ${duration}ms`);

    res.json({
      success: true,
      message: 'Login exitoso',
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
      token
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`🚨 Error en login después de ${duration}ms:`, error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🆕 OPTIMIZAR el endpoint de registro
app.post('/api/auth/register', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { name, email, password, role } = req.body;
    console.log(`📝 Registro attempt para: ${email} como ${role}`);

    // Validaciones
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (!['docente', 'representante', 'nino'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Verificar si el email ya existe - OPTIMIZADO
    const existingUser = await getQuery('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingUser) {
      console.log('❌ Registro falló: email ya existe');
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const result = await runQuery(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    // Generar token
    const token = jwt.sign(
      { id: result.id, email, role, name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const duration = Date.now() - startTime;
    console.log(`✅ Registro exitoso para ${name} en ${duration}ms`);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: { id: result.id, name, email, role },
      token
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`🚨 Error en registro después de ${duration}ms:`, error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =================== RUTAS DE JUEGOS ===================

// Guardar progreso de juego (ADAPTADO PARA TUS JUEGOS ACTUALES)
app.post('/api/games/save-progress', authenticateToken, async (req, res) => {
  try {
    const { 
      game_type, 
      score, 
      total_questions, 
      correct_answers,
      incorrect_answers,
      time_spent, 
      completed,
      session_data 
    } = req.body;

    const result = await runQuery(`
      INSERT INTO game_sessions 
      (user_id, game_type, score, total_questions, correct_answers, incorrect_answers, time_spent, completed, session_data) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id, 
      game_type, 
      score || 0, 
      total_questions || 0, 
      correct_answers || 0,
      incorrect_answers || 0,
      time_spent || 0, 
      completed || false,
      JSON.stringify(session_data || {})
    ]);

    res.status(201).json({
      success: true,
      message: 'Progreso guardado exitosamente',
      session_id: result.id
    });
  } catch (error) {
    console.error('Error guardando progreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener progreso de un usuario
app.get('/api/games/progress/:userId?', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;
    
    // Verificar permisos
    if (req.user.role !== 'docente' && 
        req.user.role !== 'representante' && 
        req.user.id !== parseInt(targetUserId)) {
      return res.status(403).json({ error: 'No tienes permisos para ver este progreso' });
    }

    const progress = await allQuery(`
      SELECT 
        gs.*,
        u.name as user_name
      FROM game_sessions gs
      JOIN users u ON gs.user_id = u.id
      WHERE gs.user_id = ? 
      ORDER BY gs.created_at DESC
    `, [targetUserId]);

    // Calcular estadísticas
    const stats = {
      total_sessions: progress.length,
      games_completed: progress.filter(p => p.completed).length,
      total_score: progress.reduce((sum, p) => sum + p.score, 0),
      average_score: progress.length > 0 ? 
        (progress.reduce((sum, p) => sum + p.score, 0) / progress.length).toFixed(1) : 0,
      by_game_type: {}
    };

    // Estadísticas por tipo de juego
    ['ortografia', 'reglas', 'ahorcado', 'titanic'].forEach(gameType => {
      const gameProgress = progress.filter(p => p.game_type === gameType);
      stats.by_game_type[gameType] = {
        sessions: gameProgress.length,
        completed: gameProgress.filter(p => p.completed).length,
        best_score: gameProgress.length > 0 ? Math.max(...gameProgress.map(p => p.score)) : 0,
        average_score: gameProgress.length > 0 ? 
          (gameProgress.reduce((sum, p) => sum + p.score, 0) / gameProgress.length).toFixed(1) : 0
      };
    });

    res.json({
      success: true,
      progress,
      stats
    });
  } catch (error) {
    console.error('Error obteniendo progreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener configuración de juegos (para el Titanic personalizable)
app.get('/api/games/config/:gameType', async (req, res) => {
  try {
    const { gameType } = req.params;
    
    const configs = await allQuery(`
      SELECT gc.*, u.name as creator_name 
      FROM game_config gc 
      JOIN users u ON gc.created_by = u.id 
      WHERE gc.game_type = ? AND gc.active = TRUE
      ORDER BY gc.difficulty_level, gc.created_at DESC
    `, [gameType]);

    res.json({
      success: true,
      configs: configs.map(config => ({
        ...config,
        words: JSON.parse(config.words),
        hints: config.hints ? JSON.parse(config.hints) : {}
      }))
    });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    success: true,
    valid: true, 
    user: req.user 
  });
});

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor de Ortografía funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Función para iniciar el servidor (sin duplicar)
const startServer = async () => {
  try {
    if (serverInstance) {
      console.log('⚠️  El servidor ya está corriendo');
      return serverInstance;
    }

    await initDatabase();
    
    serverInstance = app.listen(PORT, () => {
      console.log(`\n🚀 ===== SERVIDOR ORTOGRAFÍA INICIADO =====`);
      console.log(`📱 API disponible en: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`⚡ Base de datos SQLite inicializada`);
      console.log(`🎮 Listo para integrar con tu app React Native`);
      console.log(`===============================================\n`);
    });

    return serverInstance;
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    throw error;
  }
};

// Solo iniciar si se ejecuta directamente
if (require.main === module) {
  startServer().catch(console.error);
}

// src/backend/server.js - AGREGAR ESTAS RUTAS AL ARCHIVO EXISTENTE

// =================== RUTAS CRUD PARA PALABRAS DEL TITANIC ===================

// Obtener todas las palabras (con filtros opcionales)
app.get('/api/titanic/words', authenticateToken, async (req, res) => {
  try {
    const { category, difficulty, active, search } = req.query;
    
    let query = `
      SELECT tw.*, u.name as creator_name 
      FROM titanic_words tw 
      JOIN users u ON tw.created_by = u.id 
      WHERE 1=1
    `;
    
    const params = [];
    
    if (category && category !== 'TODAS') {
      query += ` AND tw.category = ?`;
      params.push(category);
    }
    
    if (difficulty) {
      query += ` AND tw.difficulty = ?`;
      params.push(parseInt(difficulty));
    }
    
    if (active !== undefined) {
      query += ` AND tw.is_active = ?`;
      params.push(active === 'true');
    }
    
    if (search) {
      query += ` AND (tw.word LIKE ? OR tw.hint LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY tw.created_at DESC`;
    
    const words = await allQuery(query, params);
    
    res.json({
      success: true,
      words: words.map(word => ({
        ...word,
        is_active: Boolean(word.is_active)
      }))
    });
  } catch (error) {
    console.error('Error obteniendo palabras:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de palabras
app.get('/api/titanic/stats', authenticateToken, async (req, res) => {
  try {
    const totalWords = await getQuery('SELECT COUNT(*) as count FROM titanic_words');
    const activeWords = await getQuery('SELECT COUNT(*) as count FROM titanic_words WHERE is_active = 1');
    const wordsByDifficulty = await allQuery(`
      SELECT difficulty, COUNT(*) as count 
      FROM titanic_words 
      GROUP BY difficulty 
      ORDER BY difficulty
    `);
    const wordsByCategory = await allQuery(`
      SELECT category, COUNT(*) as count 
      FROM titanic_words 
      GROUP BY category 
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      stats: {
        total: totalWords?.count || 0,
        active: activeWords?.count || 0,
        inactive: (totalWords?.count || 0) - (activeWords?.count || 0),
        byDifficulty: wordsByDifficulty.reduce((acc, item) => {
          acc[item.difficulty] = item.count;
          return acc;
        }, {}),
        byCategory: wordsByCategory.reduce((acc, item) => {
          acc[item.category] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nueva palabra
app.post('/api/titanic/words', authenticateToken, async (req, res) => {
  try {
    const { word, hint, category, difficulty, is_active } = req.body;

    // Validaciones
    if (!word || !hint || !category) {
      return res.status(400).json({ error: 'Palabra, pista y categoría son requeridas' });
    }

    if (word.length < 3) {
      return res.status(400).json({ error: 'La palabra debe tener al menos 3 letras' });
    }

    if (!/^[A-ZÁÉÍÓÚÑ]+$/.test(word.toUpperCase())) {
      return res.status(400).json({ error: 'La palabra solo debe contener letras' });
    }

    if (![1, 2, 3].includes(difficulty)) {
      return res.status(400).json({ error: 'Dificultad debe ser 1, 2 o 3' });
    }

    // Verificar si la palabra ya existe
    const existingWord = await getQuery('SELECT id FROM titanic_words WHERE word = ?', [word.toUpperCase()]);
    if (existingWord) {
      return res.status(400).json({ error: 'Esta palabra ya existe' });
    }

    // Insertar palabra
    const result = await runQuery(`
      INSERT INTO titanic_words (word, hint, category, difficulty, is_active, created_by) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [word.toUpperCase(), hint, category, difficulty, is_active ? 1 : 0, req.user.id]);

    // Obtener la palabra creada con información del creador
    const newWord = await getQuery(`
      SELECT tw.*, u.name as creator_name 
      FROM titanic_words tw 
      JOIN users u ON tw.created_by = u.id 
      WHERE tw.id = ?
    `, [result.id]);

    res.status(201).json({
      success: true,
      message: 'Palabra creada exitosamente',
      word: {
        ...newWord,
        is_active: Boolean(newWord.is_active)
      }
    });
  } catch (error) {
    console.error('Error creando palabra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🔍 AGREGAR al src/backend/server.js
// Nuevo endpoint para buscar estudiantes por email

// Agregar después de las rutas existentes:

// =================== BÚSQUEDA DE ESTUDIANTES ===================

// Buscar estudiante por email (para inscripciones)
app.post('/api/users/search-student', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'docente') {
      return res.status(403).json({ error: 'Solo docentes pueden buscar estudiantes' });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // Buscar estudiante por email
    const student = await getQuery(`
      SELECT id, name, email, created_at 
      FROM users 
      WHERE email = ? AND role = 'nino' AND active = 1
    `, [email.trim().toLowerCase()]);

    if (!student) {
      return res.status(404).json({ 
        success: false,
        error: 'No se encontró un estudiante con ese email' 
      });
    }

    // Verificar si ya está inscrito en alguna aula del docente
    const existingEnrollment = await getQuery(`
      SELECT c.name as classroom_name 
      FROM student_enrollments se
      JOIN classrooms c ON se.classroom_id = c.id
      WHERE se.student_id = ? AND c.teacher_id = ? AND se.status = 'active'
    `, [student.id, req.user.id]);

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: `El estudiante ya está inscrito en: ${existingEnrollment.classroom_name}`
      });
    }

    res.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        created_at: student.created_at
      }
    });
  } catch (error) {
    console.error('Error buscando estudiante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =================== MEJORAR INSCRIPCIÓN DE ESTUDIANTES ===================

// Actualizar el endpoint existente de inscripción para mejor feedback
app.post('/api/classrooms/:classroomId/students', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'docente') {
      return res.status(403).json({ error: 'Solo docentes pueden inscribir estudiantes' });
    }

    const { classroomId } = req.params;
    const { student_id } = req.body;

    // Verificar que el aula pertenece al docente
    const classroom = await getQuery(`
      SELECT * FROM classrooms 
      WHERE id = ? AND teacher_id = ? AND active = 1
    `, [classroomId, req.user.id]);
    
    if (!classroom) {
      return res.status(404).json({ error: 'Aula no encontrada' });
    }

    // Verificar que el usuario es un estudiante
    const student = await getQuery(`
      SELECT * FROM users 
      WHERE id = ? AND role = 'nino' AND active = 1
    `, [student_id]);
    
    if (!student) {
      return res.status(400).json({ error: 'Estudiante no encontrado' });
    }

    // 🚨 NUEVA VALIDACIÓN: Verificar si ya está inscrito en CUALQUIER aula
    const existingEnrollment = await getQuery(`
      SELECT c.name as classroom_name, c.id as classroom_id,
             u.name as teacher_name
      FROM student_enrollments se
      JOIN classrooms c ON se.classroom_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE se.student_id = ? AND se.status = 'active' AND c.active = 1
    `, [student_id]);

    if (existingEnrollment) {
      return res.status(400).json({ 
        error: `${student.name} ya está inscrito en el aula "${existingEnrollment.classroom_name}" con ${existingEnrollment.teacher_name}. Un estudiante solo puede estar en una aula a la vez.`,
        details: {
          currentClassroom: existingEnrollment.classroom_name,
          currentTeacher: existingEnrollment.teacher_name,
          classroomId: existingEnrollment.classroom_id
        }
      });
    }

    // Verificar capacidad del aula
    const currentCount = await getQuery(`
      SELECT COUNT(*) as count 
      FROM student_enrollments 
      WHERE classroom_id = ? AND status = 'active'
    `, [classroomId]);

    if (currentCount.count >= classroom.max_students) {
      return res.status(400).json({ 
        error: `El aula está llena (${classroom.max_students}/${classroom.max_students})` 
      });
    }

    // Crear nueva inscripción
    await runQuery(`
      INSERT INTO student_enrollments (student_id, classroom_id, status, enrollment_date) 
      VALUES (?, ?, 'active', CURRENT_TIMESTAMP)
    `, [student_id, classroomId]);

    res.json({
      success: true,
      message: `${student.name} ha sido inscrito exitosamente en ${classroom.name}`
    });
  } catch (error) {
    console.error('Error inscribiendo estudiante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =================== ESTUDIANTE PUEDE VER AULAS DISPONIBLES ===================

// Obtener aulas disponibles para inscripción (para estudiantes)
app.get('/api/classrooms/available', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'nino') {
      return res.status(403).json({ error: 'Solo estudiantes pueden ver aulas disponibles' });
    }

    // Obtener aulas donde el estudiante NO está inscrito
    const availableClassrooms = await allQuery(`
      SELECT 
        c.id,
        c.name,
        c.grade_level,
        c.section,
        c.school_year,
        c.max_students,
        u.name as teacher_name,
        COUNT(se.student_id) as current_students
      FROM classrooms c
      JOIN users u ON c.teacher_id = u.id
      LEFT JOIN student_enrollments se ON c.id = se.classroom_id AND se.status = 'active'
      WHERE c.active = 1 
        AND c.id NOT IN (
          SELECT classroom_id 
          FROM student_enrollments 
          WHERE student_id = ? AND status = 'active'
        )
      GROUP BY c.id
      HAVING current_students < c.max_students
      ORDER BY c.school_year DESC, c.grade_level, c.section
    `, [req.user.id]);

    res.json({
      success: true,
      classrooms: availableClassrooms
    });
  } catch (error) {
    console.error('Error obteniendo aulas disponibles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Estudiante se inscribe en un aula
app.post('/api/student/enroll/:classroomId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'nino') {
      return res.status(403).json({ error: 'Solo estudiantes pueden inscribirse' });
    }

    const { classroomId } = req.params;

    // 🚨 NUEVA VALIDACIÓN: Verificar si ya está inscrito en alguna aula
    const existingEnrollment = await getQuery(`
      SELECT 
        se.id, se.enrollment_date,
        c.id as classroom_id, c.name as classroom_name,
        c.grade_level, c.section, c.school_year,
        u.name as teacher_name, u.email as teacher_email
      FROM student_enrollments se
      JOIN classrooms c ON se.classroom_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE se.student_id = ? AND se.status = 'active' AND c.active = 1
      LIMIT 1
    `, [req.user.id]);

    if (existingEnrollment) {
      return res.status(400).json({
        error: `Ya estás inscrito en el aula "${existingEnrollment.classroom_name}" con ${existingEnrollment.teacher_name}. Solo puedes estar en una aula a la vez.`,
        currentEnrollment: {
          classroomId: existingEnrollment.classroom_id,
          classroomName: existingEnrollment.classroom_name,
          teacherName: existingEnrollment.teacher_name,
          enrollmentDate: existingEnrollment.enrollment_date
        }
      });
    }

    // Verificar que el aula existe y tiene espacio
    const classroom = await getQuery(`
      SELECT c.*, u.name as teacher_name,
        COUNT(se.student_id) as current_students
      FROM classrooms c
      JOIN users u ON c.teacher_id = u.id
      LEFT JOIN student_enrollments se ON c.id = se.classroom_id AND se.status = 'active'
      WHERE c.id = ? AND c.active = 1
      GROUP BY c.id
    `, [classroomId]);

    if (!classroom) {
      return res.status(404).json({ error: 'Aula no encontrada' });
    }

    if (classroom.current_students >= classroom.max_students) {
      return res.status(400).json({ error: 'El aula está llena' });
    }

    // Inscribir al estudiante
    await runQuery(`
      INSERT INTO student_enrollments (student_id, classroom_id, status, enrollment_date) 
      VALUES (?, ?, 'active', CURRENT_TIMESTAMP)
    `, [req.user.id, classroomId]);

    res.json({
      success: true,
      message: `Te has inscrito exitosamente en ${classroom.name} con ${classroom.teacher_name}`
    });
  } catch (error) {
    console.error('Error en auto-inscripción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/students/:studentId/transfer/:newClassroomId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'docente') {
      return res.status(403).json({ error: 'Solo docentes pueden transferir estudiantes' });
    }

    const { studentId, newClassroomId } = req.params;
    const { reason } = req.body;

    // Verificar que la nueva aula pertenece al docente
    const newClassroom = await getQuery(`
      SELECT * FROM classrooms 
      WHERE id = ? AND teacher_id = ? AND active = 1
    `, [newClassroomId, req.user.id]);
    
    if (!newClassroom) {
      return res.status(404).json({ error: 'Nueva aula no encontrada' });
    }

    // Verificar estudiante y su inscripción actual
    const currentEnrollment = await getQuery(`
      SELECT se.*, c.name as current_classroom_name, u.name as student_name
      FROM student_enrollments se
      JOIN classrooms c ON se.classroom_id = c.id
      JOIN users u ON se.student_id = u.id
      WHERE se.student_id = ? AND se.status = 'active'
    `, [studentId]);

    if (!currentEnrollment) {
      return res.status(400).json({ error: 'El estudiante no está inscrito en ninguna aula activa' });
    }

    // Verificar capacidad de la nueva aula
    const currentCount = await getQuery(`
      SELECT COUNT(*) as count 
      FROM student_enrollments 
      WHERE classroom_id = ? AND status = 'active'
    `, [newClassroomId]);

    if (currentCount.count >= newClassroom.max_students) {
      return res.status(400).json({ 
        error: `La nueva aula está llena (${newClassroom.max_students}/${newClassroom.max_students})` 
      });
    }

    // Realizar transferencia
    await runQuery('BEGIN TRANSACTION');
    
    try {
      // Marcar inscripción actual como transferida
      await runQuery(`
        UPDATE student_enrollments 
        SET status = 'transferred', notes = ? 
        WHERE id = ?
      `, [reason || 'Transferido por docente', currentEnrollment.id]);

      // Crear nueva inscripción
      await runQuery(`
        INSERT INTO student_enrollments (student_id, classroom_id, status, enrollment_date, notes) 
        VALUES (?, ?, 'active', CURRENT_TIMESTAMP, ?)
      `, [studentId, newClassroomId, `Transferido desde ${currentEnrollment.current_classroom_name}`]);

      await runQuery('COMMIT');

      res.json({
        success: true,
        message: `${currentEnrollment.student_name} ha sido transferido exitosamente de "${currentEnrollment.current_classroom_name}" a "${newClassroom.name}"`
      });
    } catch (error) {
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error transfiriendo estudiante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =================== NUEVO ENDPOINT: DESINSCRIBIR ESTUDIANTE ===================
app.delete('/api/students/:studentId/unenroll', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'docente') {
      return res.status(403).json({ error: 'Solo docentes pueden desinscribir estudiantes' });
    }

    const { studentId } = req.params;
    const { reason } = req.body;

    // Verificar inscripción actual
    const enrollment = await getQuery(`
      SELECT se.*, c.name as classroom_name, u.name as student_name,
             c.teacher_id
      FROM student_enrollments se
      JOIN classrooms c ON se.classroom_id = c.id
      JOIN users u ON se.student_id = u.id
      WHERE se.student_id = ? AND se.status = 'active'
    `, [studentId]);

    if (!enrollment) {
      return res.status(400).json({ error: 'El estudiante no está inscrito en ninguna aula activa' });
    }

    // Verificar que el aula pertenece al docente
    if (enrollment.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Solo puedes desinscribir estudiantes de tus propias aulas' });
    }

    // Desinscribir estudiante
    await runQuery(`
      UPDATE student_enrollments 
      SET status = 'inactive', notes = ? 
      WHERE id = ?
    `, [reason || 'Desinscrito por docente', enrollment.id]);

    res.json({
      success: true,
      message: `${enrollment.student_name} ha sido desinscrito de "${enrollment.classroom_name}"`
    });
  } catch (error) {
    console.error('Error desinscribiendo estudiante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar palabra
app.put('/api/titanic/words/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { word, hint, category, difficulty, is_active } = req.body;

    // Verificar que la palabra existe
    const existingWord = await getQuery('SELECT * FROM titanic_words WHERE id = ?', [id]);
    if (!existingWord) {
      return res.status(404).json({ error: 'Palabra no encontrada' });
    }

    // Validaciones
    if (word && word.length < 3) {
      return res.status(400).json({ error: 'La palabra debe tener al menos 3 letras' });
    }

    if (word && !/^[A-ZÁÉÍÓÚÑ]+$/.test(word.toUpperCase())) {
      return res.status(400).json({ error: 'La palabra solo debe contener letras' });
    }

    if (difficulty && ![1, 2, 3].includes(difficulty)) {
      return res.status(400).json({ error: 'Dificultad debe ser 1, 2 o 3' });
    }

    // Si se está cambiando la palabra, verificar que no exista otra igual
    if (word && word.toUpperCase() !== existingWord.word) {
      const duplicateWord = await getQuery('SELECT id FROM titanic_words WHERE word = ? AND id != ?', [word.toUpperCase(), id]);
      if (duplicateWord) {
        return res.status(400).json({ error: 'Ya existe otra palabra con ese texto' });
      }
    }

    // Actualizar palabra
    await runQuery(`
      UPDATE titanic_words 
      SET word = ?, hint = ?, category = ?, difficulty = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [
      word ? word.toUpperCase() : existingWord.word,
      hint || existingWord.hint,
      category || existingWord.category,
      difficulty || existingWord.difficulty,
      is_active !== undefined ? (is_active ? 1 : 0) : existingWord.is_active,
      id
    ]);

    // Obtener la palabra actualizada
    const updatedWord = await getQuery(`
      SELECT tw.*, u.name as creator_name 
      FROM titanic_words tw 
      JOIN users u ON tw.created_by = u.id 
      WHERE tw.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Palabra actualizada exitosamente',
      word: {
        ...updatedWord,
        is_active: Boolean(updatedWord.is_active)
      }
    });
  } catch (error) {
    console.error('Error actualizando palabra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar palabra
app.delete('/api/titanic/words/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la palabra existe
    const existingWord = await getQuery('SELECT * FROM titanic_words WHERE id = ?', [id]);
    if (!existingWord) {
      return res.status(404).json({ error: 'Palabra no encontrada' });
    }

    // Eliminar palabra
    await runQuery('DELETE FROM titanic_words WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Palabra eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando palabra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cambiar estado de palabra (activar/desactivar)
app.patch('/api/titanic/words/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la palabra existe
    const existingWord = await getQuery('SELECT * FROM titanic_words WHERE id = ?', [id]);
    if (!existingWord) {
      return res.status(404).json({ error: 'Palabra no encontrada' });
    }

    // Cambiar estado
    const newStatus = !existingWord.is_active;
    await runQuery(`
      UPDATE titanic_words 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [newStatus ? 1 : 0, id]);

    // Obtener palabra actualizada
    const updatedWord = await getQuery(`
      SELECT tw.*, u.name as creator_name 
      FROM titanic_words tw 
      JOIN users u ON tw.created_by = u.id 
      WHERE tw.id = ?
    `, [id]);

    res.json({
      success: true,
      message: `Palabra ${newStatus ? 'activada' : 'desactivada'} exitosamente`,
      word: {
        ...updatedWord,
        is_active: Boolean(updatedWord.is_active)
      }
    });
  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener palabras activas por dificultad (para el juego)
app.get('/api/titanic/words/active/:difficulty', async (req, res) => {
  try {
    const { difficulty } = req.params;
    
    const words = await allQuery(`
      SELECT word, hint, category 
      FROM titanic_words 
      WHERE is_active = 1 AND difficulty = ? 
      ORDER BY RANDOM()
    `, [parseInt(difficulty)]);

    res.json({
      success: true,
      words
    });
  } catch (error) {
    console.error('Error obteniendo palabras activas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Rutas adicionales para el backend - Agregar al server.js existente

// =================== RUTAS DE GESTIÓN DE AULAS ===================

// Crear nueva aula
app.post('/api/classrooms', authenticateToken, async (req, res) => {
  try {
    // Solo docentes pueden crear aulas
    if (req.user.role !== 'docente') {
      return res.status(403).json({ error: 'Solo docentes pueden crear aulas' });
    }

    const { name, grade_level, section, school_year, max_students } = req.body;

    if (!name || !grade_level || !section || !school_year) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const result = await runQuery(`
      INSERT INTO classrooms (name, teacher_id, grade_level, section, school_year, max_students) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, req.user.id, grade_level, section, school_year, max_students || 50]);

    res.status(201).json({
      success: true,
      message: 'Aula creada exitosamente',
      classroom_id: result.id
    });
  } catch (error) {
    console.error('Error creando aula:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener aulas del docente
app.get('/api/classrooms/my-classrooms', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'docente') {
      return res.status(403).json({ error: 'Solo docentes pueden ver aulas' });
    }

    const classrooms = await allQuery(`
      SELECT 
        c.*,
        COUNT(se.student_id) as student_count
      FROM classrooms c
      LEFT JOIN student_enrollments se ON c.id = se.classroom_id AND se.status = 'active'
      WHERE c.teacher_id = ? AND c.active = 1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      classrooms
    });
  } catch (error) {
    console.error('Error obteniendo aulas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =================== RUTAS DE ESTUDIANTES ===================

// Inscribir estudiante en aula
app.post('/api/classrooms/:classroomId/students', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'docente') {
      return res.status(403).json({ error: 'Solo docentes pueden inscribir estudiantes' });
    }

    const { classroomId } = req.params;
    const { student_id } = req.body;

    // Verificar que el aula pertenece al docente
    const classroom = await getQuery('SELECT * FROM classrooms WHERE id = ? AND teacher_id = ?', 
      [classroomId, req.user.id]);
    
    if (!classroom) {
      return res.status(404).json({ error: 'Aula no encontrada' });
    }

    // Verificar que el usuario es un estudiante
    const student = await getQuery('SELECT * FROM users WHERE id = ? AND role = ?', 
      [student_id, 'nino']);
    
    if (!student) {
      return res.status(400).json({ error: 'Estudiante no encontrado' });
    }

    // Inscribir estudiante
    await runQuery(`
      INSERT OR REPLACE INTO student_enrollments (student_id, classroom_id, status) 
      VALUES (?, ?, 'active')
    `, [student_id, classroomId]);

    res.json({
      success: true,
      message: 'Estudiante inscrito exitosamente'
    });
  } catch (error) {
    console.error('Error inscribiendo estudiante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estudiantes de un aula
app.get('/api/classrooms/:classroomId/students', authenticateToken, async (req, res) => {
  try {
    const { classroomId } = req.params;

    // Verificar permisos según rol
    let authorized = false;
    
    if (req.user.role === 'docente') {
      const classroom = await getQuery('SELECT * FROM classrooms WHERE id = ? AND teacher_id = ?', 
        [classroomId, req.user.id]);
      authorized = !!classroom;
    } else if (req.user.role === 'representante') {
      // Verificar si tiene hijos en esta aula
      const childInClassroom = await getQuery(`
        SELECT 1 FROM parent_child_relationships pcr
        JOIN student_enrollments se ON pcr.child_id = se.student_id
        WHERE pcr.parent_id = ? AND se.classroom_id = ? AND se.status = 'active'
      `, [req.user.id, classroomId]);
      authorized = !!childInClassroom;
    }

    if (!authorized) {
      return res.status(403).json({ error: 'No tienes permisos para ver los estudiantes de esta aula' });
    }

    const students = await allQuery(`
      SELECT 
        u.id, u.name, u.email, u.created_at,
        se.enrollment_date, se.status,
        COUNT(gs.id) as total_games_played,
        AVG(gs.score) as average_score,
        MAX(gs.created_at) as last_activity
      FROM users u
      JOIN student_enrollments se ON u.id = se.student_id
      LEFT JOIN game_sessions gs ON u.id = gs.user_id
      WHERE se.classroom_id = ? AND se.status = 'active' AND u.role = 'nino'
      GROUP BY u.id, se.id
      ORDER BY u.name
    `, [classroomId]);

    res.json({
      success: true,
      students
    });
  } catch (error) {
    console.error('Error obteniendo estudiantes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =================== RUTAS DE REPRESENTANTES ===================

// Asociar representante con estudiante
app.post('/api/students/:studentId/parents', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'docente') {
      return res.status(403).json({ error: 'Solo docentes pueden asociar representantes' });
    }

    const { studentId } = req.params;
    const { parent_id, relationship_type, is_primary, phone } = req.body;

    // Verificar que el estudiante existe y está en una de las aulas del docente
    const studentInMyClassroom = await getQuery(`
      SELECT se.* FROM student_enrollments se
      JOIN classrooms c ON se.classroom_id = c.id
      WHERE se.student_id = ? AND c.teacher_id = ? AND se.status = 'active'
    `, [studentId, req.user.id]);

    if (!studentInMyClassroom) {
      return res.status(403).json({ error: 'Estudiante no encontrado en tus aulas' });
    }

    // Verificar que el representante existe
    const parent = await getQuery('SELECT * FROM users WHERE id = ? AND role = ?', 
      [parent_id, 'representante']);
    
    if (!parent) {
      return res.status(400).json({ error: 'Representante no encontrado' });
    }

    // Si es representante principal, quitar el flag de otros
    if (is_primary) {
      await runQuery(`
        UPDATE parent_child_relationships 
        SET is_primary = 0 
        WHERE child_id = ?
      `, [studentId]);
    }

    // Crear la relación
    await runQuery(`
      INSERT OR REPLACE INTO parent_child_relationships 
      (parent_id, child_id, relationship_type, is_primary, phone) 
      VALUES (?, ?, ?, ?, ?)
    `, [parent_id, studentId, relationship_type || 'representante', is_primary || false, phone]);

    res.json({
      success: true,
      message: 'Relación creada exitosamente'
    });
  } catch (error) {
    console.error('Error creando relación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener hijos de un representante
app.get('/api/parents/my-children', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'representante') {
      return res.status(403).json({ error: 'Solo representantes pueden ver sus hijos' });
    }

    const children = await allQuery(`
      SELECT 
        u.id, u.name, u.email,
        pcr.relationship_type, pcr.is_primary,
        c.name as classroom_name, c.grade_level, c.section,
        t.name as teacher_name, t.email as teacher_email,
        COUNT(gs.id) as total_games_played,
        AVG(gs.score) as average_score,
        MAX(gs.created_at) as last_activity
      FROM parent_child_relationships pcr
      JOIN users u ON pcr.child_id = u.id
      LEFT JOIN student_enrollments se ON u.id = se.student_id AND se.status = 'active'
      LEFT JOIN classrooms c ON se.classroom_id = c.id
      LEFT JOIN users t ON c.teacher_id = t.id
      LEFT JOIN game_sessions gs ON u.id = gs.user_id
      WHERE pcr.parent_id = ? AND u.role = 'nino'
      GROUP BY u.id, pcr.id, c.id
      ORDER BY u.name
    `, [req.user.id]);

    res.json({
      success: true,
      children
    });
  } catch (error) {
    console.error('Error obteniendo hijos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =================== RUTAS DE PALABRAS CON ALCANCE ===================

// Obtener palabras disponibles para un docente (propias + globales)
app.get('/api/titanic/words/available', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'docente') {
      return res.status(403).json({ error: 'Solo docentes pueden ver palabras disponibles' });
    }

    const { classroom_id } = req.query;

    let query = `
      SELECT tw.*, u.name as creator_name,
        CASE 
          WHEN tw.created_by = ? THEN 'own'
          WHEN tw.is_global = 1 THEN 'global'
          ELSE 'classroom'
        END as source_type
      FROM titanic_words tw 
      JOIN users u ON tw.created_by = u.id 
      WHERE tw.is_active = 1 AND (
        tw.created_by = ? OR 
        tw.is_global = 1 OR 
        (tw.classroom_id = ? AND ? IS NOT NULL)
      )
      ORDER BY source_type, tw.created_at DESC
    `;

    const words = await allQuery(query, [
      req.user.id, 
      req.user.id, 
      classroom_id, 
      classroom_id
    ]);

    res.json({
      success: true,
      words
    });
  } catch (error) {
    console.error('Error obteniendo palabras disponibles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear palabra con alcance específico
app.post('/api/titanic/words/scoped', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'docente') {
      return res.status(403).json({ error: 'Solo docentes pueden crear palabras' });
    }

    const { word, hint, category, difficulty, is_active, classroom_id, is_global } = req.body;

    // Validaciones básicas
    if (!word || !hint || !category) {
      return res.status(400).json({ error: 'Palabra, pista y categoría son requeridas' });
    }

    // Si es global, verificar permisos especiales (puedes implementar esto más tarde)
    if (is_global) {
      // Por ahora, solo permitir a docentes crear palabras globales
      // En el futuro podrías requerir aprobación
    }

    // Verificar que el aula pertenece al docente
    if (classroom_id) {
      const classroom = await getQuery('SELECT * FROM classrooms WHERE id = ? AND teacher_id = ?', 
        [classroom_id, req.user.id]);
      
      if (!classroom) {
        return res.status(403).json({ error: 'Aula no encontrada' });
      }
    }

    const result = await runQuery(`
      INSERT INTO titanic_words 
      (word, hint, category, difficulty, is_active, created_by, classroom_id, is_global) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      word.toUpperCase(), 
      hint, 
      category, 
      difficulty, 
      is_active ? 1 : 0, 
      req.user.id, 
      classroom_id, 
      is_global ? 1 : 0
    ]);

    res.status(201).json({
      success: true,
      message: 'Palabra creada exitosamente',
      word_id: result.id
    });
  } catch (error) {
    console.error('Error creando palabra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =================== RUTAS DE REPORTES ===================

// Reporte de progreso por aula
app.get('/api/reports/classroom/:classroomId/progress', authenticateToken, async (req, res) => {
  try {
    const { classroomId } = req.params;

    // Verificar permisos
    let authorized = false;
    
    if (req.user.role === 'docente') {
      const classroom = await getQuery('SELECT * FROM classrooms WHERE id = ? AND teacher_id = ?', 
        [classroomId, req.user.id]);
      authorized = !!classroom;
    }

    if (!authorized) {
      return res.status(403).json({ error: 'No tienes permisos para ver este reporte' });
    }

    const report = await allQuery(`
      SELECT 
        u.name as student_name,
        u.id as student_id,
        COUNT(gs.id) as total_sessions,
        COUNT(CASE WHEN gs.completed = 1 THEN 1 END) as completed_sessions,
        AVG(gs.score) as average_score,
        SUM(gs.time_spent) as total_time_spent,
        MAX(gs.created_at) as last_activity,
        COUNT(CASE WHEN gs.game_type = 'titanic' THEN 1 END) as titanic_sessions,
        COUNT(CASE WHEN gs.game_type = 'ortografia' THEN 1 END) as ortografia_sessions,
        COUNT(CASE WHEN gs.game_type = 'ahorcado' THEN 1 END) as ahorcado_sessions
      FROM student_enrollments se
      JOIN users u ON se.student_id = u.id
      LEFT JOIN game_sessions gs ON u.id = gs.user_id
      WHERE se.classroom_id = ? AND se.status = 'active'
      GROUP BY u.id
      ORDER BY average_score DESC NULLS LAST, u.name
    `, [classroomId]);

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Dashboard del docente
app.get('/api/dashboard/teacher', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'docente') {
      return res.status(403).json({ error: 'Solo docentes pueden ver este dashboard' });
    }

    // Obtener estadísticas generales
    const stats = await Promise.all([
      // Total de aulas
      getQuery('SELECT COUNT(*) as count FROM classrooms WHERE teacher_id = ? AND active = 1', [req.user.id]),
      
      // Total de estudiantes
      getQuery(`
        SELECT COUNT(DISTINCT se.student_id) as count 
        FROM classrooms c 
        JOIN student_enrollments se ON c.id = se.classroom_id 
        WHERE c.teacher_id = ? AND se.status = 'active'
      `, [req.user.id]),
      
      // Actividad reciente (últimos 7 días)
      getQuery(`
        SELECT COUNT(*) as count 
        FROM game_sessions gs
        JOIN student_enrollments se ON gs.user_id = se.student_id
        JOIN classrooms c ON se.classroom_id = c.id
        WHERE c.teacher_id = ? AND gs.created_at >= datetime('now', '-7 days')
      `, [req.user.id]),
      
      // Palabras creadas
      getQuery('SELECT COUNT(*) as count FROM titanic_words WHERE created_by = ?', [req.user.id])
    ]);

    res.json({
      success: true,
      dashboard: {
        total_classrooms: stats[0].count,
        total_students: stats[1].count,
        recent_activity: stats[2].count,
        words_created: stats[3].count
      }
    });
  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = { app, startServer };