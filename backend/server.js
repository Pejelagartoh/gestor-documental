import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const { Pool } = pkg;

const app = express();
app.use(cors());

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

// Directorio de subidas (asegura su existencia)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Configuración de Multer para almacenamiento persistente
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'))
});
const upload = multer({ storage: storage });

// Configurar Archivos Estáticos
app.use('/files', express.static(uploadDir));

// --------------------------------------------------------------------------
// 1. CONFIGURACIÓN DE BASE DE DATOS Y CORREO
// --------------------------------------------------------------------------

// Conexión a PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'gestor_documental',
    password: '1234',
    port: 5432,
});

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'documentacion.applus@gmail.com',
        pass: 'mmiu fjuv dygf yvyq'
    },
    tls: {
        rejectUnauthorized: false
    }
});

// --------------------------------------------------------------------------
// 2. RUTAS PARA DOCUMENTOS DE ENTRADA (documentos_entrada)
// La ruta es /api/documentos para mantener la compatibilidad con el frontend.
// --------------------------------------------------------------------------

// Obtener todos los documentos de entrada
app.get('/api/documentos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id, tramo, tipo_documento AS "tipoDocumento", nro_documento AS "nroDocumento",
                fecha_documento AS "fechaDocumento", fecha_ingreso AS "fechaIngreso", remitente,
                cargo_remitente AS "cargoRemitente", destinatario, cargo_destinatario AS "cargoDestinatario",
                antecedentes_documento AS "antecedentesDocumento", materia_documento AS "materiaDocumento",
                area_responsable AS "areaResponsable", instruye_respuesta AS "instruyeRespuesta",
                registro_salida AS "registroSalida", tipo_respuesta AS "tipoRespuesta",
                fecha_respuesta AS "fechaRespuesta", remite, a, estado,
                archivo_url AS "archivo"
            FROM documentos_entrada
            ORDER BY id ASC;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error en GET /api/documentos:', error);
        res.status(500).json({ error: 'Error al obtener documentos de entrada' });
    }
});

// Crear un nuevo documento de entrada (Soporta archivo)
app.post('/api/documentos', upload.single('file'), async (req, res) => {
    const d = req.body;
    const file = req.file;
    let fileUrlToSave = null;

    if (file) {
        const baseUrl = `http://localhost:${PORT}`;
        fileUrlToSave = `${baseUrl}/files/${file.filename}`;
    } else if (d.archivo) {
        fileUrlToSave = d.archivo;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const query = `
            INSERT INTO documentos_entrada (
                tramo, tipo_documento, nro_documento, fecha_documento, fecha_ingreso, remitente, cargo_remitente,
                destinatario, cargo_destinatario, antecedentes_documento, materia_documento, area_responsable,
                instruye_respuesta, registro_salida, tipo_respuesta, fecha_respuesta, remite, a, estado, archivo_url,
                created_at, updated_at
            )
            VALUES (
                       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                       $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                       $21, $22
                   )
                RETURNING *;
        `;

        const values = [
            d.tramo || null, d.tipoDocumento || null, d.nroDocumento || null, d.fechaDocumento || null,
            d.fechaIngreso || null, d.remitente || null, d.cargoRemitente || null, d.destinatario || null,
            d.cargoDestinatario || null, d.antecedentesDocumento || null, d.materiaDocumento || null, d.areaResponsable || null,
            d.instruyeRespuesta === 'true', d.registroSalida || null, d.tipoRespuesta || null, d.fechaRespuesta || null,
            d.remite || null, d.a || null, d.estado || 'Pendiente', fileUrlToSave,
            new Date(), new Date()
        ];

        const result = await client.query(query, values);
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en POST /api/documentos:', error);

        if (file) fs.unlink(file.path, (e) => { if(e) console.error("Error al limpiar archivo:", e); });

        res.status(500).json({ error: 'Error al guardar documento de entrada' });
    } finally {
        client.release();
    }
});

// Actualizar un documento de entrada
app.put('/api/documentos/:id', express.json(), async (req, res) => {
    try {
        const { id } = req.params;
        const d = req.body;

        const query = `
            UPDATE documentos_entrada SET
                tramo=$1, tipo_documento=$2, nro_documento=$3, fecha_documento=$4, fecha_ingreso=$5, remitente=$6, cargo_remitente=$7, destinatario=$8,
                cargo_destinatario=$9, antecedentes_documento=$10, materia_documento=$11, area_responsable=$12,
                instruye_respuesta=$13, registro_salida=$14, tipo_respuesta=$15, fecha_respuesta=$16,
                remite=$17, a=$18, estado=$19, archivo_url=$20,
                updated_at=NOW()
            WHERE id=$21
            RETURNING *;
        `;

        const values = [
            d.tramo, d.tipoDocumento, d.nroDocumento, d.fechaDocumento, d.fechaIngreso, d.remitente, d.cargoRemitente, d.destinatario,
            d.cargoDestinatario, d.antecedentesDocumento, d.materiaDocumento, d.areaResponsable,
            d.instruyeRespuesta, d.registroSalida, d.tipoRespuesta, d.fechaRespuesta,
            d.remite, d.a, d.estado, d.archivo,
            id
        ];

        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Documento de entrada no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error en PUT /api/documentos/:id:', error);
        res.status(500).json({ error: 'Error al actualizar documento de entrada' });
    }
});

// Eliminar un documento de entrada
app.delete('/api/documentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM documentos_entrada WHERE id=$1', [id]);
        res.json({ message: 'Documento de entrada eliminado correctamente' });
    } catch (error) {
        console.error('❌ Error en DELETE /api/documentos/:id:', error);
        res.status(500).json({ error: 'Error al eliminar documento de entrada' });
    }
});

// --------------------------------------------------------------------------
// 3. RUTAS PARA DOCUMENTOS DE SALIDA (documentos_salida)
// --------------------------------------------------------------------------

// Obtener todos los documentos de salida
app.get('/api/documentos-salida', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id, tramo, tipo_documento AS "tipoDocumento", nro_documento AS "nroDocumento",
                fecha_documento AS "fechaDocumento", remitente, destinatario, materia,
                nro_loe AS "nroLoe", area_responsable AS "areaResponsable",
                incluye, registro_entrada AS "registroEntrada",
                fecha_de_recepcion AS "fechaDeRecepcion", plazo,
                fecha_de_vencimiento AS "fechaDeVencimiento", fecha_de_respuesta AS "fechaDeRespuesta",
                archivo_url AS "archivo", estado
            FROM documentos_salida
            ORDER BY id ASC;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error en GET /api/documentos-salida:', error);
        res.status(500).json({ error: 'Error al obtener documentos de salida' });
    }
});

// Crear un nuevo documento de salida (Soporta archivo)
app.post('/api/documentos-salida', upload.single('file'), async (req, res) => {
    const d = req.body;
    const file = req.file;
    let fileUrlToSave = null;

    if (file) {
        const baseUrl = `http://localhost:${PORT}`;
        fileUrlToSave = `${baseUrl}/files/${file.filename}`;
    } else if (d.archivo) {
        fileUrlToSave = d.archivo;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const query = `
            INSERT INTO documentos_salida (
                tramo, tipo_documento, nro_documento, fecha_documento, remitente,
                destinatario, materia, nro_loe, area_responsable, incluye,
                registro_entrada, fecha_de_recepcion, plazo, fecha_de_vencimiento,
                fecha_de_respuesta, archivo_url, estado,
                created_at, updated_at
            )
            VALUES (
                       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                       $11,$12,$13,$14,$15,$16,$17, $18, $19
                   )
                RETURNING *;
        `;

        const values = [
            d.tramo || null, d.tipoDocumento || null, d.nroDocumento || null, d.fechaDocumento || null,
            d.remitente || null, d.destinatario || null, d.materia || null, d.nroLoe || null,
            d.areaResponsable || null, d.incluye || null, d.registroEntrada || null, d.fechaDeRecepcion || null,
            d.plazo || null, d.fechaDeVencimiento || null, d.fechaDeRespuesta || null, fileUrlToSave,
            d.estado || 'Enviado',
            new Date(), new Date()
        ];

        const result = await client.query(query, values);
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en POST /api/documentos-salida:', error);

        if (file) fs.unlink(file.path, (e) => { if(e) console.error("Error al limpiar archivo:", e); });

        res.status(500).json({ error: 'Error al guardar documento de salida' });
    } finally {
        client.release();
    }
});

// Actualizar un documento de salida
app.put('/api/documentos-salida/:id', express.json(), async (req, res) => {
    try {
        const { id } = req.params;
        const d = req.body;

        const query = `
            UPDATE documentos_salida SET
                tramo=$1, tipo_documento=$2, nro_documento=$3, fecha_documento=$4, remitente=$5,
                destinatario=$6, materia=$7, nro_loe=$8, area_responsable=$9, incluye=$10,
                registro_entrada=$11, fecha_de_recepcion=$12, plazo=$13, fecha_de_vencimiento=$14,
                fecha_de_respuesta=$15, archivo_url=$16, estado=$17,
                updated_at=NOW()
            WHERE id=$18
            RETURNING *;
        `;

        const values = [
            d.tramo, d.tipoDocumento, d.nroDocumento, d.fechaDocumento, d.remitente,
            d.destinatario, d.materia, d.nroLoe, d.areaResponsable, d.incluye,
            d.registroEntrada, d.fechaDeRecepcion, d.plazo, d.fechaDeVencimiento,
            d.fechaDeRespuesta, d.archivo, d.estado,
            id
        ];

        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Documento de salida no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error en PUT /api/documentos-salida/:id:', error);
        res.status(500).json({ error: 'Error al actualizar documento de salida' });
    }
});

// Eliminar un documento de salida
app.delete('/api/documentos-salida/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM documentos_salida WHERE id=$1', [id]);
        res.json({ message: 'Documento de salida eliminado correctamente' });
    } catch (error) {
        console.error('❌ Error en DELETE /api/documentos-salida/:id:', error);
        res.status(500).json({ error: 'Error al eliminar documento de salida' });
    }
});

// --------------------------------------------------------------------------
// 4. RUTA PARA ENVÍO DE CORREO ELECTRÓNICO
// --------------------------------------------------------------------------
app.post('/api/send-email', express.json(), async (req, res) => {
    const { documentId, recipient, subject, body } = req.body;

    if (!documentId || !recipient) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos: documentId y recipient.' });
    }

    try {
        // Obtener los detalles del documento de la DB (se asume de entrada para el envío)
        const result = await pool.query(`
            SELECT
                tramo, nro_documento AS "nroDocumento", archivo_url AS "archivo"
            FROM documentos_entrada
            WHERE id = $1;
        `, [documentId]);

        const doc = result.rows[0];

        if (!doc) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        const documentUrl = doc.archivo || 'N/A';
        const emailBody = `
            Hola,

            Se ha registrado y compartido un nuevo documento de entrada en el Gestor Documental.

            Detalles del Documento:
            - Tramo: ${doc.tramo}
            - N° Documento: ${doc.nroDocumento}

            ${body ? `Mensaje del Remitente: ${body}\n\n` : ''}

            Puede acceder al documento directamente a través del siguiente enlace:
            ${documentUrl}

            Saludos,
            El equipo de Gestión Documental.
        `;

        const info = await transporter.sendMail({
            from: '"Gestor Documental" <documentacion.applus@gmail.com>',
            to: recipient,
            subject: subject || `[ALTA] Documento ${doc.nroDocumento} registrado`,
            text: emailBody,
            html: emailBody.replace(/\n/g, '<br>'),
        });

        res.status(200).json({ message: 'Correo enviado correctamente', info: info });

    } catch (error) {
        console.error('❌ Error en POST /api/send-email:', error);
        res.status(500).json({ error: 'Error al enviar el correo electrónico', details: error.message });
    }
});

// --------------------------------------------------------------------------
// 5. INICIO DEL SERVIDOR
// --------------------------------------------------------------------------
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));