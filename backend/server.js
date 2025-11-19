import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',              // 👈 tu usuario
  host: 'localhost',
  database: 'gestor_documental', // 👈 tu base de datos
  password: '1234',              // 👈 tu contraseña
  port: 5432,
});

// 🔹 Obtener todos los documentos
app.get('/api/documentos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id, tipo_registro, tramo, tipo, numero_documento, registro_sgd,
        fecha_documento, fecha_ingreso, remitente, cargo_remitente, destinatario,
        cargo_destinatario, antecedentes, materia, area_responsable, instruye_respuesta,
        registro_entrada, registro_salida, fecha_recepcion, nro_loe, incluye,
        cuenta, plazo, fecha_vencimiento, alerta_dias, fecha_respuesta,
        archivo_url, estado, cons, seg, prev, hitos,
        created_at, updated_at
      FROM documentos
      ORDER BY id ASC;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error en GET /api/documentos:', error);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});

// 🔹 Crear un nuevo documento
app.post('/api/documentos', async (req, res) => {
  try {
    const d = req.body;

    const query = `
      INSERT INTO documentos (
        tipo_registro, tramo, tipo, numero_documento, registro_sgd,
        fecha_documento, fecha_ingreso, remitente, cargo_remitente, destinatario,
        cargo_destinatario, antecedentes, materia, area_responsable, instruye_respuesta,
        registro_entrada, registro_salida, fecha_recepcion, nro_loe, incluye,
        cuenta, plazo, fecha_vencimiento, alerta_dias, fecha_respuesta,
        archivo_url, estado, cons, seg, prev, hitos, created_at, updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,
        $16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,
        $26,$27,$28,$29,$30,$31,$32,$33
      )
      RETURNING *;
    `;

    const values = [
      d.tipo_registro || null,
      d.tramo || null,
      d.tipo || null,
      d.numero_documento || null,
      d.registro_sgd || null,
      d.fecha_documento || null,
      d.fecha_ingreso || null,
      d.remitente || null,
      d.cargo_remitente || null,
      d.destinatario || null,
      d.cargo_destinatario || null,
      d.antecedentes || null,
      d.materia || null,
      d.area_responsable || null,
      d.instruye_respuesta || null,
      d.registro_entrada || null,
      d.registro_salida || null,
      d.fecha_recepcion || null,
      d.nro_loe || null,
      d.incluye || null,
      d.cuenta || null,
      d.plazo || null,
      d.fecha_vencimiento || null,
      d.alerta_dias || null,
      d.fecha_respuesta || null,
      d.archivo_url || null,
      d.estado || 'Pendiente',
      d.cons || false,
      d.seg || false,
      d.prev || false,
      d.hitos || false,
      new Date(),
      new Date()
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error en POST /api/documentos:', error);
    res.status(500).json({ error: 'Error al guardar documento' });
  }
});

// 🔹 Actualizar un documento
app.put('/api/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const d = req.body;

    const query = `
      UPDATE documentos SET
        tipo_registro=$1, tramo=$2, tipo=$3, numero_documento=$4, registro_sgd=$5,
        fecha_documento=$6, fecha_ingreso=$7, remitente=$8, cargo_remitente=$9, destinatario=$10,
        cargo_destinatario=$11, antecedentes=$12, materia=$13, area_responsable=$14, instruye_respuesta=$15,
        registro_entrada=$16, registro_salida=$17, fecha_recepcion=$18, nro_loe=$19, incluye=$20,
        cuenta=$21, plazo=$22, fecha_vencimiento=$23, alerta_dias=$24, fecha_respuesta=$25,
        archivo_url=$26, estado=$27, cons=$28, seg=$29, prev=$30, hitos=$31,
        updated_at=NOW()
      WHERE id=$32
      RETURNING *;
    `;

    const values = [
      d.tipo_registro, d.tramo, d.tipo, d.numero_documento, d.registro_sgd,
      d.fecha_documento, d.fecha_ingreso, d.remitente, d.cargo_remitente, d.destinatario,
      d.cargo_destinatario, d.antecedentes, d.materia, d.area_responsable, d.instruye_respuesta,
      d.registro_entrada, d.registro_salida, d.fecha_recepcion, d.nro_loe, d.incluye,
      d.cuenta, d.plazo, d.fecha_vencimiento, d.alerta_dias, d.fecha_respuesta,
      d.archivo_url, d.estado, d.cons, d.seg, d.prev, d.hitos,
      id
    ];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error en PUT /api/documentos/:id:', error);
    res.status(500).json({ error: 'Error al actualizar documento' });
  }
});

// 🔹 Eliminar un documento
app.delete('/api/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM documentos WHERE id=$1', [id]);
    res.json({ message: 'Documento eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error en DELETE /api/documentos/:id:', error);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
});

// 🔹 Arranque del servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http:/localhost:${PORT}`));
