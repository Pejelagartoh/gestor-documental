import { query } from '../db.js';
export async function listDocuments(req, res) {
  try {
    const result = await query('SELECT * FROM documentos ORDER BY id DESC LIMIT 200');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
export async function createDocument(req, res) {
  try {
    const d = req.body;
    const sql = `
      INSERT INTO documentos(tipo, numero_documento, registro_sgd, fecha_documento, fecha_ingreso, remitente, destinatario, asunto, area_responsable, estado)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;
    const params = [d.tipo, d.numero_documento, d.registro_sgd, d.fecha_documento, d.fecha_ingreso, d.remitente, d.destinatario, d.asunto, d.area_responsable, d.estado];
    const result = await query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
