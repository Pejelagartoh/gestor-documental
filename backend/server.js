import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import multer from 'multer'; // 1. Importar Multer para manejar subidas
import path from 'path';    // 2. Importar Path para manejar rutas de archivos
import fs from 'fs';      // 3. Importar File System para crear la carpeta de subidas
import { fileURLToPath } from 'url'; // 4. Utilidad para módulos ES
import nodemailer from 'nodemailer'; // 5. Importar Nodemailer

const { Pool } = pkg;

const app = express();
app.use(cors());

// NOTA IMPORTANTE: Se ha eliminado 'app.use(express.json())' global.
// Lo aplicamos solo en las rutas PUT y POST /api/send-email que esperan JSON, ya que la ruta POST /api/documentos usa Multer/FormData.

// --------------------------------------------------------------------------
// 5. CONFIGURACIÓN DE ARCHIVOS
// --------------------------------------------------------------------------

// Configuración para obtener __dirname en módulos ES (necesario para Multer)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Directorio de subidas (se crea si no existe)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
    console.log(`Carpeta 'uploads' creada en: ${uploadDir}`);
}

// Configuración de Multer para almacenamiento PERSISTENTE
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Indica a Multer que guarde en la carpeta 'uploads'
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Genera un nombre de archivo único
        cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
    }
});

const upload = multer({ storage: storage });

// Configurar Archivos Estáticos (Hacer la carpeta 'uploads' pública)
// Los archivos serán accesibles en http://localhost:3000/files/...
app.use('/files', express.static(uploadDir));
console.log('Ruta pública de archivos configurada en /files');

// --------------------------------------------------------------------------
// 6. CONEXIÓN Y CONFIGURACIÓN DE CORREO
// --------------------------------------------------------------------------

// 🔹 Conexión a PostgreSQL
const pool = new Pool({
    user: 'postgres',              // 👈 tu usuario
    host: 'localhost',
    database: 'gestor_documental', // 👈 tu base de datos
    password: '1234',              // 👈 tu contraseña
    port: 5432,
});

// 🔹 Nodemailer Transporter
const transporter = nodemailer.createTransport({
    // ⚠️ CONFIGURA ESTO CON TUS CREDENCIALES REALES
    // Usamos Ethereal como placeholder. Debes reemplazarlo para un entorno real.
    host: 'smtp.gmail.com', // Ejemplo: 'smtp.gmail.com' para Gmail
    port: 587,
    secure: false, // true para 465, false para otros puertos como 587
    auth: {
        user: 'documentacion.applus@gmail.com', // ⬅️ REEMPLAZAR
        pass: 'mmiu fjuv dygf yvyq'           // ⬅️ REEMPLAZAR (o Contraseña de Aplicación)
    },
    tls: {
        rejectUnauthorized: false
    }
});
// --------------------------------------------------------------------------


// 🔹 Obtener todos los documentos
app.get('/api/documentos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
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
                archivo_url AS "archivo" -- El valor guardado es la URL pública
            FROM documentos_entrada 
            ORDER BY id ASC;
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error en GET /api/documentos:', error);
        res.status(500).json({ error: 'Error al obtener documentos' });
    }
});

// 🔹 Crear un nuevo documento (CON SUBIDA DE ARCHIVOS)
app.post('/api/documentos', upload.single('file'), async (req, res) => {
    const d = req.body;
    const file = req.file;

    let fileUrlToSave = null;

    if (file) {
        // Generar la URL pública completa
        const baseUrl = `http://localhost:${PORT}`;
        fileUrlToSave = `${baseUrl}/files/${file.filename}`;
        console.log(`Archivo guardado y URL pública: ${fileUrlToSave}`);
    } else if (d.archivo) {
        // Usar la URL pegada si no se subió un archivo físico
        fileUrlToSave = d.archivo;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Iniciar Transacción

        const query = `
            INSERT INTO documentos_entrada (
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

        // Conversión de datos: los valores de FormData llegan como strings
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
            d.instruyeRespuesta === 'true', // IMPORTANTE: Conversión a booleano
            d.registroSalida || null,
            d.tipoRespuesta || null,
            d.fechaRespuesta || null,
            d.remite || null,
            d.a || null,
            d.estado || 'Pendiente',
            fileUrlToSave, // ⬅️ URL del archivo o texto
            new Date(),
            new Date()
        ];

        const result = await client.query(query, values);

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en POST /api/documentos:', error);

        // Limpieza: Si falló la DB, eliminamos el archivo subido por Multer para evitar basura
        if (file) {
            fs.unlink(file.path, (e) => {
                if(e) console.error("Error al limpiar archivo tras rollback:", e);
            });
        }
        res.status(500).json({ error: 'Error al guardar documento y archivo' });
    } finally {
        client.release();
    }
});

// 🔹 Actualizar un documento (Aplicamos express.json() solo a esta ruta)
app.put('/api/documentos/:id', express.json(), async (req, res) => {
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

        const values = [
            d.tramo, d.tipoDocumento, d.nroDocumento,
            d.fechaDocumento, d.fechaIngreso, d.remitente, d.cargoRemitente, d.destinatario,
            d.cargoDestinatario, d.antecedentesDocumento, d.materiaDocumento, d.areaResponsable,
            d.instruyeRespuesta, d.registroSalida, d.tipoRespuesta, d.fechaRespuesta,
            d.remite, d.a, d.estado, d.archivo, // d.archivo es la URL/ruta que viene del frontend
            id
        ];

        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }
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
        await pool.query('DELETE FROM documentos_entrada WHERE id=$1', [id]);
        res.json({ message: 'Documento eliminado correctamente' });
    } catch (error) {
        console.error('❌ Error en DELETE /api/documentos/:id:', error);
        res.status(500).json({ error: 'Error al eliminar documento' });
    }
});

// --------------------------------------------------------------------------
// 7. RUTA PARA ENVÍO DE CORREO ELECTRÓNICO (NUEVA)
// --------------------------------------------------------------------------
app.post('/api/send-email', express.json(), async (req, res) => {
    const { documentId, recipient, subject, body } = req.body;

    if (!documentId || !recipient) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos: documentId y recipient.' });
    }

    try {
        // 1. Obtener los detalles del documento de la DB
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

        // 2. Construir el cuerpo del correo
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

        // 3. Enviar el correo
        const info = await transporter.sendMail({
            from: '"Gestor Documental" <tu_usuario@ejemplo.com>', // Dirección del remitente
            to: recipient,                                     // Lista de destinatarios
            subject: subject || `[ALTA] Documento ${doc.nroDocumento} registrado`, // Asunto
            text: emailBody,
            html: emailBody.replace(/\n/g, '<br>'), // Para HTML
        });

        console.log("Mensaje enviado: %s", info.messageId);
        // Si usas Ethereal, esto mostrará la URL de preview
        if (transporter.options.host === 'smtp.ethereal.email') {
            console.log("URL de Preview (Ethereal): %s", nodemailer.getTestMessageUrl(info));
        }

        res.status(200).json({ message: 'Correo enviado correctamente', info: info });

    } catch (error) {
        console.error('❌ Error en POST /api/send-email:', error);
        res.status(500).json({ error: 'Error al enviar el correo electrónico', details: error.message });
    }
});


// 🔹 Arranque del servidor
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));