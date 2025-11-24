import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// Importa la interfaz Documento desde el servicio
import { DocumentsService, Documento } from '../services/documents.service';
import { DocumentsFormComponent } from '../documents-form/documents-form.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.css']
})
export class DocumentsListComponent implements OnInit {

  // ✅ CORREGIDO: Lista simplificada con nombres en camelCase y 'acciones'
  displayedColumns: string[] = [
    'id', 'tramo', 'tipoDocumento', 'nroDocumento', 'fechaDocumento',
    'fechaIngreso', 'remitente', 'cargoRemitente', 'destinatario',
    'cargoDestinatario', 'antecedentesDocumento', 'materiaDocumento',
    'areaResponsable', 'instruyeRespuesta', 'registroSalida',
    'tipoRespuesta', 'fechaRespuesta', 'remite', 'a', 'estado', 'archivo', 'acciones'
  ];

  documents: Documento[] = [];

  constructor(private documentsService: DocumentsService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments() {
    this.documentsService.getDocumentos().subscribe({
      next: (data: Documento[]) => this.documents = data, // Usar Documento[] para tipado
      error: (err: any) => console.error('Error cargando documentos', err)
    });
  }

  openAddDialog() {
    const ref = this.dialog.open(DocumentsFormComponent, { width: '900px' });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadDocuments();
    });
  }

  editDocument(documento: Documento): void { // Usamos Documento para tipar
    this.dialog.open(DocumentsFormComponent, {
      width: '900px',
      data: documento
    }).afterClosed().subscribe(result => {
      if (result) this.loadDocuments();
    });
  }

  deleteDocument(id: number): void {
    if (confirm('¿Seguro que deseas eliminar este documento?')) {
      this.documentsService.deleteDocumento(id).subscribe({
        next: () => this.loadDocuments(),
        error: (err: any) => console.error('Error eliminando documento', err)
      });
    }
  }

  // ✅ Función de ayuda para formatear booleanos (del backend)
  formatBoolean(value: boolean | string | undefined): string {
    if (value === true || value === 't') return 'Sí';
    if (value === false || value === 'f') return 'No';
    return '';
  }
}
