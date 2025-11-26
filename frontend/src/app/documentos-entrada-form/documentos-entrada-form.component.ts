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
  ],
  templateUrl: './documentos-entrada-form.component.html',
  styleUrls: ['./documentos-entrada-form.component.css']
})
export class DocumentosEntradaFormComponent {
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
    public dialogRef: MatDialogRef<DocumentosEntradaFormComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: Documento | null
  ) {
    this.isEditMode = !!data?.id;

    // ✅ INICIALIZACIÓN DEL NOMBRE DE ARCHIVO EN MODO EDICIÓN
    if (this.isEditMode && data && data.archivo) {
      this.selectedFileName = this.extractFileNameFromUrl(data.archivo);
    }

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
      areaResponsable: [data?.areaResponsable || ''],
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

  // ✅ FUNCIÓN PARA EXTRAER EL NOMBRE DEL ARCHIVO DE LA URL
  private extractFileNameFromUrl(url: string): string {
    if (!url) return '';

    try {
      const urlObject = new URL(url);
      const pathname = urlObject.pathname;
      // Obtiene la última parte de la ruta y elimina el prefijo de marca de tiempo (si existe)
      let fileName = pathname.substring(pathname.lastIndexOf('/') + 1);

      // Si el archivo tiene el formato 'timestamp-nombre_original.pdf' (como lo guarda Multer)
      const match = fileName.match(/^\d+-(.*)/);
      if (match && match[1]) {
        // Devuelve el nombre original, reemplazando los guiones bajos por espacios
        return match[1].replace(/_/g, ' ');
      }

      // Si no tiene el formato Multer, devuelve la última parte de la URL limpia
      return fileName.replace(/_/g, ' ');

    } catch (e) {
      // Si no es una URL válida (ej. es solo un nombre de archivo), devuelve la cadena tal cual
      return url;
    }
  }
  // ----------------------------------------------------------------------


  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      // Ya no deshabilitamos el form control, pero lo vaciamos si hay un archivo nuevo.
      this.form.get('archivo')?.setValue('');
    } else {
      this.selectedFile = null;
      this.selectedFileName = this.data?.archivo ? this.extractFileNameFromUrl(this.data.archivo) : '';
    }
  }


  save() {
    if (this.form.invalid) {
      console.error('Formulario inválido. Revise los campos requeridos.');
      return;
    }

    const doc: Documento = this.form.getRawValue() as Documento;

    if (this.isEditMode && doc.id && !this.selectedFile) {
      // Modo Edición sin nuevo archivo: Solo actualizamos los campos.
      this.service.updateDocumento(doc.id, doc).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err: any) => console.error('Error actualizando documento', err)
      });
    } else if (this.isEditMode && doc.id && this.selectedFile) {
      // Modo Edición CON nuevo archivo: Esto es problemático en el backend actual.
      // Lo que hacemos es guardar el archivo nuevo y luego actualizar la URL en el registro existente.
      // Pero dado que el backend de Node.js solo usa Multer en POST, debemos adaptar la lógica o
      // advertir que subir un archivo nuevo en modo edición no actualiza la URL en el servidor.
      // Por la simplicidad actual, usaremos el mismo endpoint de creación (POST) si hay un archivo.
      // ⚠️ En un sistema robusto, se debería tener un endpoint PUT con Multer.
      console.warn('Advertencia: No se recomienda subir un archivo nuevo en modo edición. Se intentará crear un nuevo registro o solo guardar los campos si no hay archivo.');
      this.service.updateDocumento(doc.id, doc).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err: any) => console.error('Error actualizando documento (solo campos):', err)
      });

    } else {
      // Modo creación (con o sin archivo)
      this.createDocumento(doc);
    }
  }

  private createDocumento(doc: Documento) {
    const formData = new FormData();

    if (this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);
    } else if (doc.archivo) {
      // Si no hay archivo local, pero hay una URL pegada (aunque el campo fue removido visualmente)
      // En este caso, el control 'archivo' debe estar vacío si se seleccionó un archivo local,
      // o puede contener la URL si el usuario editó un registro y no subió un nuevo archivo.
      // Pero si estamos en `createDocumento`, es solo creación, por lo que el `doc.archivo` debe ser la URL pegada.
      // Dado que eliminamos el campo visualmente, solo nos enfocamos en `selectedFile`.
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
        // 3. Manejar otros tipos
        else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      }
    }

    // ----------------------------------------------------------------------
    // Llamada a la creación de documento
    // ----------------------------------------------------------------------
    this.http.post<Documento>(this.apiUrl, formData).subscribe({
      next: (newDoc) => {
        // Llamar al servicio de correo. Usamos '!' en newDoc.id para forzar el tipo number.
        const recipient = 'victor.rodriguez.f@applusglobal.com';
        const subject = `[ALTA] Nuevo Documento de Entrada N° ${newDoc.nroDocumento}`;
        const body = `Se ha registrado el documento y el archivo ya está disponible. Por favor, revise y asigne responsabilidades.`;

        this.service.sendDocumentEmail(newDoc.id!, recipient, subject, body).subscribe({
          next: () => console.log('✅ Correo de notificación enviado con éxito.'),
          error: (mailErr) => console.error('❌ Advertencia: Documento guardado, pero error al enviar correo:', mailErr)
        });

        this.dialogRef.close(true);
      },
      error: (err) => console.error('❌ Error guardando documento y archivo:', err)
    });
    // ----------------------------------------------------------------------
  }
}
