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
  selector: 'app-documents-form',
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
    HttpClientModule
  ],
  templateUrl: './documents-form.component.html',
  styleUrls: ['./documents-form.component.css']
})
export class DocumentsFormComponent {
  form: FormGroup;
  isEditMode: boolean;

  selectedFile: File | null = null;
  selectedFileName: string = '';
  private apiUrl = 'http://localhost:3000/api/documentos';

  tramos = ['RBPM', 'PMPA', 'AIF'];
  tiposDocumento = ['Ordinario', 'Carta', 'Nota', 'Minuta', 'Folio', 'Resuel', 'Correo', 'Memo'];
  areas = ['Conservación', 'Seguridad Vial', 'Prevención', 'Hitos', 'Territorio', 'Ambiental', 'Proyectos', 'AIF'];
  estados = ['Pendiente', 'En Proceso', 'Terminado', 'Cerrado'];

  constructor(
    private fb: FormBuilder,
    private service: DocumentsService,
    public dialogRef: MatDialogRef<DocumentsFormComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: Documento | null
  ) {
    this.isEditMode = !!data?.id;

    this.form = this.fb.group({
      id: [data?.id || null],

      tramo: [data?.tramo || '', Validators.required],
      tipoDocumento: [data?.tipoDocumento || '', Validators.required],
      nroDocumento: [data?.nroDocumento || '', Validators.required],
      fechaDocumento: [this.convertDate(data?.fechaDocumento), Validators.required],
      fechaIngreso: [this.convertDate(data?.fechaIngreso), Validators.required],
      remitente: [data?.remitente || ''],
      cargoRemitente: [data?.cargoRemitente || ''],
      destinatario: [data?.destinatario || ''],
      cargoDestinatario: [data?.cargoDestinatario || ''],
      antecedentesDocumento: [data?.antecedentesDocumento || ''],
      materiaDocumento: [data?.materiaDocumento || ''],
      areaResponsable: [data?.areaResponsable || '', Validators.required],
      instruyeRespuesta: [data?.instruyeRespuesta || false],

      registroSalida: [data?.registroSalida || ''],
      tipoRespuesta: [data?.tipoRespuesta || ''],
      fechaRespuesta: [this.convertDate(data?.fechaRespuesta)],
      remite: [data?.remite || ''],
      a: [data?.a || ''],

      estado: [data?.estado || 'Pendiente'],
      archivo: [{value: data?.archivo || '', disabled: false}]
    });
  }

  private convertDate(dateValue: string | Date | undefined): Date | null {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    return new Date(dateValue);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.form.get('archivo')?.disable();
    } else {
      this.selectedFile = null;
      this.selectedFileName = '';
      this.form.get('archivo')?.enable();
    }
  }


  save() {
    if (this.form.invalid) {
      console.error('Formulario inválido. Revise los campos requeridos.');
      return;
    }

    const doc: Documento = this.form.getRawValue() as Documento;

    if (this.isEditMode && doc.id && !this.selectedFile) {
      this.service.updateDocumento(doc.id, doc).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err: any) => console.error('Error actualizando documento', err)
      });
    } else if (this.isEditMode && doc.id && this.selectedFile) {
      // En modo edición, el servidor no acepta nuevos archivos, solo la URL.
      console.warn('Advertencia: No se permite subir un nuevo archivo en modo edición. Actualice solo la URL pública o cree un nuevo registro.');
      this.service.updateDocumento(doc.id, doc).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err: any) => console.error('Error actualizando documento', err)
      });

    } else {
      // Modo creación (con o sin archivo)
      this.createDocumento(doc);
    }

    this.form.get('archivo')?.enable();
  }

  private createDocumento(doc: Documento) {
    const formData = new FormData();

    if (this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);
    }

    // Usamos Object.entries() para iterar de forma segura
    for (const [key, value] of Object.entries(doc)) {
      if (key !== 'id') {
        // 1. Manejar Date
        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        }
        // 2. Manejar Boolean (corregido typeof)
        else if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        }
        // 3. Manejar otros tipos (incluyendo la URL vacía si el archivo fue seleccionado)
        else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      }
    }

    // ----------------------------------------------------------------------
    // ✅ ACTUALIZACIÓN CLAVE: Llamada al servicio de correo
    // ----------------------------------------------------------------------
    // Usamos <Documento> para tipar la respuesta (que incluye el nuevo ID)
    this.http.post<Documento>(this.apiUrl, formData).subscribe({
      next: (newDoc) => {
        // La respuesta newDoc contiene el ID y la URL del archivo
        const recipient = 'victor.rodriguez.f@applusglobal.com'; // Dirección de notificación fija (puedes hacerla dinámica después)
        const subject = `[ALTA] Nuevo Documento de Entrada N° ${newDoc.nroDocumento}`;
        const body = `Se ha registrado el documento y el archivo ya está disponible. Por favor, revise y asigne responsabilidades.`;

        // Llamar al servicio de correo. Usamos '!' en newDoc.id para forzar el tipo number.
        this.service.sendDocumentEmail(newDoc.id!, recipient, subject, body).subscribe({
          next: () => console.log('✅ Correo de notificación enviado con éxito.'),
          error: (mailErr) => console.error('❌ Advertencia: Documento guardado, pero error al enviar correo:', mailErr)
        });

        this.dialogRef.close(true); // Cerrar después de intentar el envío del correo
      },
      error: (err) => console.error('❌ Error guardando documento y archivo:', err)
    });
    // ----------------------------------------------------------------------

    this.form.get('archivo')?.enable();
  }
}
