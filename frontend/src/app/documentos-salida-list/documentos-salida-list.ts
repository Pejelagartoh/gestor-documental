import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importa Angular Material (usa los mismos módulos que tu componente de entrada)
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs'; // Necesario para simplificar el manejo del Observable

// Importa la interfaz Documento desde el servicio (ajusta la ruta si es necesario)
import { DocumentsService, Documento } from '../services/documents.service';
// Asumimos que el formulario de salida usará el de entrada o un similar
import { DocumentosEntradaFormComponent } from '../documentos-entrada-form/documentos-entrada-form.component';

@Component({
  selector: 'app-documentos-salida-list',
  standalone: true, // Debe ser standalone si tus otros componentes lo son
  // Importamos todos los módulos necesarios
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ],
  templateUrl: './documentos-salida-list.html', // Asumiendo convención .component.html
  styleUrls: ['./documentos-salida-list.scss'] // Asumiendo convención .component.css
})
export class DocumentosSalidaListComponent implements OnInit { // Cambio de nombre de la clase a convención

  // DEFINICIÓN DE COLUMNAS PARA DOCUMENTOS DE SALIDA
  displayedColumns: string[] = [
    'id', 'tramo', 'tipoDocumento', 'nroDocumento', 'fechaDocumento',
    'remitente', 'destinatario', 'materiaDocumento',
    'registroSalida', // Mapeado a Nro. LOE
    'areaResponsable',
    'instruyeRespuesta', // Mapeado a 'Incluye'
    'fechaIngreso', // Mapeado a 'Fecha de Recepción'
    'tipoRespuesta', // Mapeado a 'Plazo'
    'fechaRespuesta', // Mapeado a 'Fecha de Vencimiento' y 'Fecha de Respuesta'
    'archivo',
    'estado',
    'acciones'
  ];

  documents: Documento[] = [];

  // Inyección de dependencias
  constructor(private documentsService: DocumentsService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  /**
   * Carga los documentos de salida utilizando el método específico del servicio.
   */
  loadDocuments() {
    this.documentsService.getDocumentosSalida().subscribe({
      next: (data: Documento[]) => this.documents = data,
      error: (err: any) => console.error('Error cargando documentos de salida', err)
    });
  }

  // Las funciones de edición, eliminación y diálogo se mantienen consistentes
  openAddDialog() {
    const ref = this.dialog.open(DocumentosEntradaFormComponent, { width: '900px' });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadDocuments();
    });
  }

  editDocument(documento: Documento): void {
    this.dialog.open(DocumentosEntradaFormComponent, {
      width: '900px',
      data: documento
    }).afterClosed().subscribe(result => {
      if (result) this.loadDocuments();
    });
  }

  deleteDocument(id: number): void {
    if (confirm('¿Seguro que deseas eliminar este documento de salida?')) {
      this.documentsService.deleteDocumento(id).subscribe({
        next: () => this.loadDocuments(),
        error: (err: any) => console.error('Error eliminando documento', err)
      });
    }
  }

  // Función de ayuda para formatear booleanos (del backend)
  formatBoolean(value: boolean | string | undefined): string {
    if (value === true || value === 't') return 'Sí';
    if (value === false || value === 'f') return 'No';
    return '';
  }
}
