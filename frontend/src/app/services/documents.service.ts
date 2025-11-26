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
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  // URLs para los diferentes endpoints
  private apiUrlEntrada = 'http://localhost:3000/api/documentos'; // Endpoint original (asumimos Entrada)
  private apiUrlSalida = 'http://localhost:3000/api/documentos-salida'; // NUEVO: Endpoint para Salida
  private mailUrl = 'http://localhost:3000/api/send-email';

  constructor(private http: HttpClient) {}

  // 1. OBTENER DOCUMENTOS DE ENTRADA
  // Renombramos el antiguo getDocumentos() a getDocumentosEntrada() para mayor claridad.
  getDocumentosEntrada(): Observable<Documento[]> {
    return this.http.get<Documento[]>(this.apiUrlEntrada);
  }

  // 2. OBTENER DOCUMENTOS DE SALIDA (Método requerido por el componente)
  getDocumentosSalida(): Observable<Documento[]> {
    return this.http.get<Documento[]>(this.apiUrlSalida);
  }

  // 🔹 Obtener un documento por ID (utiliza la URL de entrada por defecto)
  getDocumentoById(id: number): Observable<Documento> {
    return this.http.get<Documento>(`${this.apiUrlEntrada}/${id}`);
  }

  // 🔹 Crear nuevo documento
  addDocumento(data: Documento): Observable<Documento> {
    return this.http.post<Documento>(this.apiUrlEntrada, data);
  }

  // 🔹 Actualizar documento existente
  updateDocumento(id: number, data: Documento): Observable<Documento> {
    return this.http.put<Documento>(`${this.apiUrlEntrada}/${id}`, data);
  }

  // 🔹 Eliminar documento
  deleteDocumento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrlEntrada}/${id}`);
  }

  // 🔹 Enviar email
  sendDocumentEmail(documentId: number, recipient: string, subject: string, body: string): Observable<any> {
    const payload = {
      documentId: documentId,
      recipient: recipient,
      subject: subject,
      body: body
    };
    return this.http.post(this.mailUrl, payload);
  }
}
