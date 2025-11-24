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

// 🔹 Obtener todos los documentos (CORREGIDO Y SIMPLIFICADO)
app.get('/api/documentos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                -- Campos esenciales renombrados a camelCase para Angular
                id,
                tramo,
                tipo_documento AS "tipoDocumento",
                nro_documento AS "nroDocumento",
                fecha_documento AS "fechaDocumento",
                fecha_ingreso AS "fechaIngreso",
                remitente,
                cargo_remitente AS "cargoRemitente",
                destinatario,
                cargo_destinatario AS "cargoDestinatario",
                antecedentes_documento AS "antecedentesDocumento",
                materia_documento AS "materiaDocumento",
                area_responsable AS "areaResponsable",
                instruye_respuesta AS "instruyeRespuesta",
                registro_salida AS "registroSalida",
                tipo_respuesta AS "tipoRespuesta",
                fecha_respuesta AS "fechaRespuesta",
                remite,
                a,
                estado,
                archivo_url AS "archivo"
            FROM documentos_entrada -- 👈 Nombre de tabla corregido
            ORDER BY id ASC;
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error en GET /api/documentos:', error);
        res.status(500).json({ error: 'Error al obtener documentos' });
    }
});

// 🔹 Crear un nuevo documento (CORREGIDO Y SIMPLIFICADO)
app.post('/api/documentos', async (req, res) => {
    try {
        const d = req.body;

        const query = `
            INSERT INTO documentos_entrada ( -- 👈 Nombre de tabla corregido
                tramo, tipo_documento, nro_documento,
                fecha_documento, fecha_ingreso, remitente, cargo_remitente, destinatario,
                cargo_destinatario, antecedentes_documento, materia_documento, area_responsable,
                instruye_respuesta, registro_salida, tipo_respuesta, fecha_respuesta,
                remite, a, estado, archivo_url,
                created_at, updated_at
            )
            VALUES (
                       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                       $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                       $21, $22
                   )
                RETURNING *;
        `;

        // Se esperan los datos en camelCase desde Angular
        const values = [
            d.tramo || null,
            d.tipoDocumento || null,
            d.nroDocumento || null,
            d.fechaDocumento || null,
            d.fechaIngreso || null,
            d.remitente || null,
            d.cargoRemitente || null,
            d.destinatario || null,
            d.cargoDestinatario || null,
            d.antecedentesDocumento || null,
            d.materiaDocumento || null,
            d.areaResponsable || null,
            d.instruyeRespuesta || false,
            d.registroSalida || null,
            d.tipoRespuesta || null,
            d.fechaRespuesta || null,
            d.remite || null,
            d.a || null,
            d.estado || 'Pendiente',
            d.archivo || null,
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

// 🔹 Actualizar un documento (CORREGIDO Y SIMPLIFICADO)
app.put('/api/documentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const d = req.body;

        const query = `
            UPDATE documentos_entrada SET
                                          tramo=$1, tipo_documento=$2, nro_documento=$3,
                                          fecha_documento=$4, fecha_ingreso=$5, remitente=$6, cargo_remitente=$7, destinatario=$8,
                                          cargo_destinatario=$9, antecedentes_documento=$10, materia_documento=$11, area_responsable=$12,
                                          instruye_respuesta=$13, registro_salida=$14, tipo_respuesta=$15, fecha_respuesta=$16,
                                          remite=$17, a=$18, estado=$19, archivo_url=$20,
                                          updated_at=NOW()
            WHERE id=$21
                RETURNING *;
        `;

        // Se esperan los datos en camelCase desde Angular
        const values = [
            d.tramo, d.tipoDocumento, d.nroDocumento,
            d.fechaDocumento, d.fechaIngreso, d.remitente, d.cargoRemitente, d.destinatario,
            d.cargoDestinatario, d.antecedentesDocumento, d.materiaDocumento, d.areaResponsable,
            d.instruyeRespuesta, d.registroSalida, d.tipoRespuesta, d.fechaRespuesta,
            d.remite, d.a, d.estado, d.archivo,
            id
        ];

        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error en PUT /api/documentos/:id:', error);
        res.status(500).json({ error: 'Error al actualizar documento' });
    }
});

// 🔹 Eliminar un documento (CORREGIDO)
app.delete('/api/documentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM documentos_entrada WHERE id=$1', [id]); // 👈 Nombre de tabla corregido
        res.json({ message: 'Documento eliminado correctamente' });
    } catch (error) {
        console.error('❌ Error en DELETE /api/documentos/:id:', error);
        res.status(500).json({ error: 'Error al eliminar documento' });
    }
});

// 🔹 Arranque del servidor
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http:/localhost:${PORT}`));