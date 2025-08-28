// src/backend/database/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Base de datos en la raíz del proyecto
const dbPath = path.join(__dirname, '../../../ortografia_app.db');
const db = new sqlite3.Database(dbPath);

// src/backend/database/db.js - FUNCIÓN initDatabase() ACTUALIZADA

// src/backend/database/db.js - FUNCIÓN initDatabase() CON MIGRACIÓN CORRECTA

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      
      // Primero, verificar la estructura existente de game_sessions
      db.get("PRAGMA table_info(game_sessions)", (err, info) => {
        if (err) {
          console.log('Tabla game_sessions no existe, se creará nueva');
        }
      });

      // Crear tabla de usuarios con nuevos campos
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('docente', 'representante', 'nino')),
          grade_level TEXT,
          section TEXT,
          school_id TEXT,
          active BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Crear tabla de aulas ANTES de game_sessions (para foreign key)
      db.run(`
        CREATE TABLE IF NOT EXISTS classrooms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          teacher_id INTEGER NOT NULL,
          grade_level TEXT NOT NULL,
          section TEXT NOT NULL,
          school_year TEXT NOT NULL,
          max_students INTEGER DEFAULT 50,
          active BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (teacher_id) REFERENCES users (id),
          UNIQUE(teacher_id, school_year, section)
        )
      `);

      // MIGRACIÓN DE game_sessions - Verificar si necesita agregar columna
      db.get("PRAGMA table_info(game_sessions)", (err, row) => {
        if (!err && row) {
          // La tabla existe, verificar si tiene la columna classroom_id
          db.all("PRAGMA table_info(game_sessions)", (err, columns) => {
            if (!err) {
              const hasClassroomId = columns.some(col => col.name === 'classroom_id');
              
              if (!hasClassroomId) {
                // Agregar la columna classroom_id si no existe
                db.run(`ALTER TABLE game_sessions ADD COLUMN classroom_id INTEGER REFERENCES classrooms(id)`, (err) => {
                  if (err) {
                    console.log('Advertencia: No se pudo agregar classroom_id:', err.message);
                  } else {
                    console.log('✅ Columna classroom_id agregada a game_sessions');
                  }
                });
              }
            }
          });
        } else {
          // La tabla no existe, crearla completa
          db.run(`
            CREATE TABLE IF NOT EXISTS game_sessions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              classroom_id INTEGER,
              game_type TEXT NOT NULL CHECK (game_type IN ('ortografia', 'reglas', 'ahorcado', 'titanic')),
              score INTEGER DEFAULT 0,
              total_questions INTEGER DEFAULT 0,
              correct_answers INTEGER DEFAULT 0,
              incorrect_answers INTEGER DEFAULT 0,
              time_spent INTEGER DEFAULT 0,
              completed BOOLEAN DEFAULT FALSE,
              session_data TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users (id),
              FOREIGN KEY (classroom_id) REFERENCES classrooms (id)
            )
          `);
        }
      });

      // Crear el resto de las tablas nuevas
      db.run(`
        CREATE TABLE IF NOT EXISTS student_enrollments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          classroom_id INTEGER NOT NULL,
          enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
          notes TEXT,
          FOREIGN KEY (student_id) REFERENCES users (id),
          FOREIGN KEY (classroom_id) REFERENCES classrooms (id),
          UNIQUE(student_id, classroom_id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS parent_child_relationships (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          parent_id INTEGER NOT NULL,
          child_id INTEGER NOT NULL,
          relationship_type TEXT NOT NULL DEFAULT 'representante' CHECK (relationship_type IN ('padre', 'madre', 'representante', 'tutor', 'abuelo', 'abuela', 'tio', 'tia', 'otro')),
          is_primary BOOLEAN DEFAULT FALSE,
          can_view_progress BOOLEAN DEFAULT TRUE,
          can_receive_notifications BOOLEAN DEFAULT TRUE,
          emergency_contact BOOLEAN DEFAULT FALSE,
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_id) REFERENCES users (id),
          FOREIGN KEY (child_id) REFERENCES users (id),
          UNIQUE(parent_id, child_id)
        )
      `);

      // Migrar tabla titanic_words si existe la antigua game_config
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='game_config'", (err, row) => {
        if (!err && row) {
          // Migrar datos de game_config a titanic_words si no se ha hecho
          db.run(`
            INSERT OR IGNORE INTO titanic_words (word, hint, category, difficulty, is_active, created_by, is_global)
            SELECT 
              json_extract(words, '$[0]') as word,
              'Palabra migrada desde configuración anterior' as hint,
              category,
              difficulty_level,
              active,
              created_by,
              1 as is_global
            FROM game_config 
            WHERE game_type = 'titanic'
          `, (err) => {
            if (err) {
              console.log('Info: No se pudieron migrar datos de game_config:', err.message);
            }
          });
        }
      });

      // Crear tabla titanic_words (nueva o actualizada)
      db.run(`
        CREATE TABLE IF NOT EXISTS titanic_words (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word TEXT NOT NULL,
          hint TEXT NOT NULL,
          category TEXT NOT NULL,
          difficulty INTEGER NOT NULL CHECK (difficulty IN (1, 2, 3)),
          is_active BOOLEAN DEFAULT TRUE,
          created_by INTEGER NOT NULL,
          classroom_id INTEGER,
          is_global BOOLEAN DEFAULT FALSE,
          approved_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id),
          FOREIGN KEY (classroom_id) REFERENCES classrooms (id),
          FOREIGN KEY (approved_by) REFERENCES users (id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS teacher_permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          teacher_id INTEGER NOT NULL,
          permission_type TEXT NOT NULL,
          resource_type TEXT NOT NULL,
          granted_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (teacher_id) REFERENCES users (id),
          FOREIGN KEY (granted_by) REFERENCES users (id),
          UNIQUE(teacher_id, permission_type, resource_type)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          recipient_id INTEGER NOT NULL,
          sender_id INTEGER,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('progress_report', 'achievement', 'system', 'reminder')),
          related_student_id INTEGER,
          is_read BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (recipient_id) REFERENCES users (id),
          FOREIGN KEY (sender_id) REFERENCES users (id),
          FOREIGN KEY (related_student_id) REFERENCES users (id)
        )
      `);

      // Crear índices
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON classrooms(teacher_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_game_sessions_classroom ON game_sessions(classroom_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_titanic_words_created_by ON titanic_words(created_by)`);

      // Insertar palabras de ejemplo si no existen
      db.get("SELECT COUNT(*) as count FROM titanic_words", (err, row) => {
        if (!err && row && row.count === 0) {
          const defaultWords = [
            ['GATO', 'Animal doméstico que maúlla', 'ANIMALES', 1, 1, 1, null, 1],
            ['SOL', 'Estrella que nos da luz y calor', 'NATURALEZA', 1, 1, 1, null, 1],
            ['MANZANA', 'Fruta roja o verde muy común', 'FRUTAS', 2, 1, 1, null, 1],
            ['COMPUTADORA', 'Máquina para procesar información', 'TECNOLOGIA', 3, 1, 1, null, 1],
          ];

          const insertWordStmt = db.prepare(`
            INSERT INTO titanic_words (word, hint, category, difficulty, is_active, created_by, classroom_id, is_global) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);

          defaultWords.forEach(wordData => {
            insertWordStmt.run(wordData);
          });

          insertWordStmt.finalize();
          console.log('✅ Palabras de ejemplo insertadas');
        }
      });

      console.log('✅ Migración de base de datos completada correctamente');
      resolve();
    });
  });
};


// Funciones helper
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  db,
  initDatabase,
  runQuery,
  getQuery,
  allQuery
};