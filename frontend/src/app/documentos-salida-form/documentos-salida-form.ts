import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { DocumentsService, Documento } from '../services/documents.service';

@Component({
  selector: 'app-documentos-salida-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatIconModule,
    HttpClientModule,
  ],
  templateUrl: './documentos-salida-form.html',
  styleUrls: ['./documentos-salida-form.scss']
})
export class DocumentosSalidaFormComponent {
  form: FormGroup;
  isEditMode: boolean;
  selectedFile: File | null = null;
  selectedFileName: string = '';

  // Endpoint de Salida
  private apiUrl = 'http://localhost:3000/api/documentos-salida';

  tramos = ['RBPM', 'PMPA', 'AIF'];
  tiposDocumento = ['Oficio', 'Carta', 'Resolución', 'Memorándum', 'Circular', 'Informe', 'Correo', 'Memo'];
  areas = ['Conservación', 'Seguridad Vial', 'Prevención', 'Hitos', 'Territorio', 'Ambiental', 'Proyectos', 'AIF'];
  estados = ['En Borrador', 'Pendiente de Firma', 'Enviado', 'Archivado'];

  constructor(
    private fb: FormBuilder,
    private service: DocumentsService,
    public dialogRef: MatDialogRef<DocumentosSalidaFormComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: Documento | null
  ) {
    this.isEditMode = !!data?.id;

    if (this.isEditMode && data && data.archivo) {
      this.selectedFileName = this.extractFileNameFromUrl(data.archivo);
    }

    // MANTENEMOS TODOS LOS CAMPOS DEL MODELO DOCUMENTO
    this.form = this.fb.group({
      id: [data?.id || null],
      tramo: [data?.tramo || '', Validators.required],
      tipoDocumento: [data?.tipoDocumento || '', Validators.required],
      nroDocumento: [data?.nroDocumento || '', Validators.required],
      fechaDocumento: [this.convertDate(data?.fechaDocumento), Validators.required],

      // Campos de Entrada (se mantienen en el modelo)
      fechaIngreso: [this.convertDate(data?.fechaIngreso)],

      // Actores
      remitente: [data?.remitente || '', Validators.required],
      cargoRemitente: [data?.cargoRemitente || ''],
      destinatario: [data?.destinatario || '', Validators.required],
      cargoDestinatario: [data?.cargoDestinatario || ''],

      // Contenido
      antecedentesDocumento: [data?.antecedentesDocumento || ''],
      materiaDocumento: [data?.materiaDocumento || '', Validators.required],
      areaResponsable: [data?.areaResponsable || '', Validators.required],

      // Campos de Respuesta
      instruyeRespuesta: [data?.instruyeRespuesta || false],
      registroSalida: [data?.registroSalida || ''],
      tipoRespuesta: [data?.tipoRespuesta || ''],
      fechaRespuesta: [this.convertDate(data?.fechaRespuesta)],
      remite: [data?.remite || ''],
      a: [data?.a || ''],

      estado: [data?.estado || 'En Borrador'],
      archivo: [{value: data?.archivo || '', disabled: false}]
    });
  }

  private convertDate(dateValue: string | Date | undefined): Date | null {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    return new Date(dateValue);
  }

  private extractFileNameFromUrl(url: string): string {
    if (!url) return '';
    try {
      const urlObject = new URL(url);
      const pathname = urlObject.pathname;
      let fileName = pathname.substring(pathname.lastIndexOf('/') + 1);
      const match = fileName.match(/^\d+-(.*)/);
      return (match && match[1]) ? match[1].replace(/_/g, ' ') : fileName.replace(/_/g, ' ');
    } catch (e) {
      return url;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.form.get('archivo')?.setValue('');
    } else {
      this.selectedFile = null;
      this.selectedFileName = this.data?.archivo ? this.extractFileNameFromUrl(this.data.archivo) : '';
    }
  }

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const doc: Documento = this.form.getRawValue() as Documento;

    if (this.isEditMode && doc.id && !this.selectedFile) {
      this.service.updateDocumentoSalida(doc.id, doc).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err: any) => console.error('Error actualizando salida', err)
      });
    } else {
      this.createDocumento(doc);
    }
  }

  private createDocumento(doc: Documento) {
    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);
    }

    // Iteración idéntica a la que funciona en Entrada
    for (const [key, value] of Object.entries(doc)) {
      if (key !== 'id') {
        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      }
    }

    // Petición POST y envío de correo (mismo flujo que entrada)
    this.http.post<Documento>(this.apiUrl, formData).subscribe({
      next: (newDoc) => {
        const recipient = 'victor.rodriguez.f@applusglobal.com';
        const subject = `[ALTA SALIDA] Nuevo Documento de Salida N° ${newDoc.nroDocumento}`;
        const body = `Se ha registrado el documento de salida y el archivo ya está disponible.`;

        this.service.sendDocumentEmail(newDoc.id!, recipient, subject, body).subscribe({
          next: () => console.log('✅ Correo de salida enviado.'),
          error: (mailErr) => console.error('❌ Error correo salida:', mailErr)
        });

        this.dialogRef.close(true);
      },
      error: (err) => console.error('❌ Error guardando salida:', err)
    });
  }
}
