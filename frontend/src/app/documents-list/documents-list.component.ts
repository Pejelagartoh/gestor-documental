import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
  displayedColumns: string[] = [
    'id', 'tramo', 'tipo', 'numero_documento', 'fecha_documento', 'fecha_ingreso',
    'remitente', 'cargo_remitente', 'destinatario', 'cargo_destinatario',
    'antecedentes', 'materia', 'area_responsable', 'instruye_respuesta',
    'registro_salida', 'tipo_respuesta', 'fecha_respuesta', 'remitente', 'a', 'estado'
  ];

  documents: Documento[] = [];

  constructor(private documentsService: DocumentsService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments() {
    this.documentsService.getDocumentos().subscribe({
      next: (data: any) => this.documents = data,
      error: (err: any) => console.error('Error cargando documentos', err)
    });

  }

  openAddDialog() {
    const ref = this.dialog.open(DocumentsFormComponent, { width: '900px' });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadDocuments();
    });
  }

editDocument(documento: any): void {
  this.dialog.open(DocumentsFormComponent, {
    width: '800px',
    data: documento
  }).afterClosed().subscribe(result => {
    if (result) this.loadDocuments(); // recarga lista
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

}
