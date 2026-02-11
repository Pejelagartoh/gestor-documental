import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Usamos la interfaz Documento que definiste, es lo suficientemente amplia para ambos tipos.
export interface Documento {
  id?: number;
  tramo?: string;
  tipoDocumento?: string;
  nroDocumento?: string;
  fechaDocumento?: string;
  fechaIngreso?: string;
  remitente?: string;
  cargoRemitente?: string;
  destinatario?: string;
  cargoDestinatario?: string;
  antecedentesDocumento?: string;
  materiaDocumento?: string;
  areaResponsable?: string;
  instruyeRespuesta?: boolean;
  registroSalida?: string;
  tipoRespuesta?: string;
  fechaRespuesta?: string;
  remite?: string;
  a?: string;
  estado?: string;
  archivo?: string;
  created_at?: string;
  updated_at?: string;

  // Campos específicos de documentos_salida
  materia?: string;
  nroLoe?: string;
  incluye?: boolean;
  registroEntrada?: string;
  fechaDeRecepcion?: string;
  plazo?: string;
  fechaDeVencimiento?: string;
  fechaDeRespuesta?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  // URLs para los diferentes endpoints
  private apiUrlEntrada = 'http://localhost:3000/api/documentos';
  private apiUrlSalida = 'http://localhost:3000/api/documentos-salida'; // Endpoint para Salida
  private mailUrl = 'http://localhost:3000/api/send-email';

  constructor(private http: HttpClient) {}

  // =========================================================================
  // 1. MÉTODOS PARA DOCUMENTOS DE ENTRADA (/api/documentos)
  // =========================================================================

  getDocumentosEntrada(): Observable<Documento[]> {
    return this.http.get<Documento[]>(this.apiUrlEntrada);
  }

  getDocumentoEntradaById(id: number): Observable<Documento> {
    return this.http.get<Documento>(`${this.apiUrlEntrada}/${id}`);
  }

  addDocumentoEntrada(data: Documento): Observable<Documento> {
    return this.http.post<Documento>(this.apiUrlEntrada, data);
  }

  updateDocumentoEntrada(id: number, data: Documento): Observable<Documento> {
    return this.http.put<Documento>(`${this.apiUrlEntrada}/${id}`, data);
  }

  deleteDocumentoEntrada(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrlEntrada}/${id}`);
  }

  // =========================================================================
  // 2. MÉTODOS PARA DOCUMENTOS DE SALIDA (/api/documentos-salida)
  // =========================================================================

  /**
   * Obtiene todos los documentos de salida.
   */
  getDocumentosSalida(): Observable<Documento[]> {
    return this.http.get<Documento[]>(this.apiUrlSalida);
  }

  /**
   * Guarda un nuevo documento de salida (o actualiza si tiene ID).
   * Este método es el que usará el formulario de creación.
   */
  saveDocumentoSalida(data: Documento): Observable<Documento> {
    // Si tiene ID, actualiza; si no, crea.
    if (data.id) {
      return this.updateDocumentoSalida(data.id, data);
    }
    // Asumimos que la lógica de subida de archivo se maneja por separado,
    // o el formulario lo envía como un objeto JSON simple sin 'file'.
    return this.http.post<Documento>(this.apiUrlSalida, data);
  }

  /**
   * Actualiza un documento de salida existente.
   */
  updateDocumentoSalida(id: number, data: Documento): Observable<Documento> {
    return this.http.put<Documento>(`${this.apiUrlSalida}/${id}`, data);
  }

  /**
   * Elimina un documento de salida.
   */
  deleteDocumentoSalida(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrlSalida}/${id}`);
  }


  // =========================================================================
  // 3. MÉTODOS GENERALES
  // =========================================================================

  /**
   * Envía email (asume que el ID es de un Documento de Entrada).
   */
  sendDocumentEmail(documentId: number, recipient: string, subject: string, body: string): Observable<any> {
    const payload = {
      documentId: documentId,
      recipient: recipient,
      subject: subject,
      body: body
    };
    return this.http.post(this.mailUrl, payload);
  }

  // Los siguientes métodos genéricos han sido eliminados/renombrados
  // para usar los métodos específicos (Entrada/Salida) para mayor claridad.
  // Por ejemplo, el antiguo addDocumento() ha sido reemplazado por addDocumentoEntrada().
}
