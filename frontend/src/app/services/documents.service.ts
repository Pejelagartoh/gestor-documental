import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// 💡 INTERFAZ CORREGIDA Y SIMPLIFICADA (22 campos esenciales en camelCase)
export interface Documento {
  id?: number;
  tramo?: string;
  tipoDocumento?: string; // Corregido a camelCase
  nroDocumento?: string;  // Corregido a camelCase
  fechaDocumento?: string; // Corregido a camelCase
  fechaIngreso?: string;  // Corregido a camelCase
  remitente?: string;
  cargoRemitente?: string; // Corregido a camelCase
  destinatario?: string;
  cargoDestinatario?: string; // Corregido a camelCase
  antecedentesDocumento?: string; // Corregido a camelCase
  materiaDocumento?: string; // Corregido a camelCase
  areaResponsable?: string; // Corregido a camelCase
  instruyeRespuesta?: boolean; // Corregido a camelCase y tipo a boolean
  registroSalida?: string; // Corregido a camelCase
  tipoRespuesta?: string; // Corregido a camelCase
  fechaRespuesta?: string; // Corregido a camelCase (Asumimos que es 'Fecha')
  remite?: string;
  a?: string;
  estado?: string;
  archivo?: string; // Corregido a 'archivo' (URL)
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  // La URL es correcta ya que tu backend está en el puerto 3000
  private apiUrl = 'http://localhost:3000/api/documentos';

  constructor(private http: HttpClient) {}

  // La lógica de las funciones HTTP es correcta y no necesita cambios:

  // 🔹 Obtener todos los documentos
  getDocumentos(): Observable<Documento[]> {
    return this.http.get<Documento[]>(this.apiUrl);
  }

  // 🔹 Obtener un documento por ID
  getDocumentoById(id: number): Observable<Documento> {
    return this.http.get<Documento>(`${this.apiUrl}/${id}`);
  }

  // 🔹 Crear nuevo documento
  addDocumento(data: Documento): Observable<Documento> {
    return this.http.post<Documento>(this.apiUrl, data);
  }

  // 🔹 Actualizar documento existente
  updateDocumento(id: number, data: Documento): Observable<Documento> {
    return this.http.put<Documento>(`${this.apiUrl}/${id}`, data);
  }

  // 🔹 Eliminar documento
  deleteDocumento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
