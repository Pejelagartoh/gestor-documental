import express from 'express';
import { listDocuments, createDocument } from '../controllers/documentsController.js';
const router = express.Router();
router.get('/', listDocuments);
router.post('/', createDocument);
export default router;
