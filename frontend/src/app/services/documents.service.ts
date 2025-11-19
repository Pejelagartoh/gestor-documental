import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Documento {
  id?: number;
  tipo_registro?: string;
  tramo?: string;
  tipo?: string;
  numero_documento?: string;
  registro_sgd?: string;
  fecha_documento?: string;
  fecha_ingreso?: string;
  remitente?: string;
  cargo_remitente?: string;
  destinatario?: string;
  cargo_destinatario?: string;
  antecedentes?: string;
  materia?: string;
  area_responsable?: string;
  instruye_respuesta?: string;
  registro_entrada?: string;
  registro_salida?: string;
  fecha_recepcion?: string;
  nro_loe?: string;
  incluye?: string;
  cuenta?: string;
  plazo?: number;
  fecha_vencimiento?: string;
  alerta_dias?: number;
  fecha_respuesta?: string;
  archivo_url?: string;
  estado?: string;
  cons?: boolean;
  seg?: boolean;
  prev?: boolean;
  hitos?: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private apiUrl = 'http://localhost:3000/api/documentos'; // 👈 Backend URL

  constructor(private http: HttpClient) {}

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
