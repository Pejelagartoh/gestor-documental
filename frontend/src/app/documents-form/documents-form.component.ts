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
import { MatIconModule } from '@angular/material/icon'; // Importamos MatIconModule
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
    MatIconModule // Añadido
  ],
  templateUrl: './documents-form.component.html',
  styleUrls: ['./documents-form.component.css']
})
export class DocumentsFormComponent {
  form: FormGroup;
  isEditMode: boolean;

  // ✅ NUEVAS PROPIEDADES PARA GESTIONAR EL ARCHIVO EN EL FRONTEND
  selectedFile: File | null = null;
  selectedFileName: string = '';
  // ------------------------------------------------------------------

  tramos = ['RBPM', 'PMPA', 'AIF'];
  tiposDocumento = ['Ordinario', 'Carta', 'Nota', 'Minuta', 'Folio', 'Resuel', 'Correo', 'Memo'];
  areas = ['Conservación', 'Seguridad Vial', 'Prevención', 'Hitos', 'Territorio', 'Ambiental', 'Proyectos', 'AIF'];
  estados = ['Pendiente', 'En Proceso', 'Terminado', 'Cerrado'];

  constructor(
    private fb: FormBuilder,
    private service: DocumentsService,
    public dialogRef: MatDialogRef<DocumentsFormComponent>,
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
      // ✅ Aquí se guarda la URL permanente del archivo
      archivo: [data?.archivo || '']
    });
  }

  private convertDate(dateValue: string | Date | undefined): Date | null {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    return new Date(dateValue);
  }

  // ✅ NUEVO: Manejador para el input de tipo file
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;

      // NOTA: Para este ejercicio, el campo 'archivo' solo contendrá la URL.
      // Si el usuario selecciona un archivo, mostramos su nombre, pero debe subirlo
      // a un servicio cloud y pegar la URL permanente en el campo de texto.

      // Podríamos poner un placeholder de URL temporal aquí, pero es mejor que el
      // usuario pegue la URL permanente, o suba el archivo y el backend genere la URL.

      // Por ahora, solo ponemos el nombre del archivo en el control para que se sepa qué archivo se seleccionó.
      // this.form.get('archivo')?.setValue(`[Pendiente de subir] ${file.name}`);

    } else {
      this.selectedFile = null;
      this.selectedFileName = '';
      // Si el archivo ya existía (en modo edición), no borramos la URL existente.
      if (!this.isEditMode) {
        this.form.get('archivo')?.setValue('');
      }
    }
  }


  save() {
    if (this.form.invalid) {
      console.error('Formulario inválido. Revise los campos requeridos.');
      return;
    }

    const doc: Documento = this.form.value;

    // 🛑 IMPORTANTE: Si selectedFile no es null, aquí debería iniciar el proceso de subida
    // a Firebase Storage o similar, y esperar la URL de retorno antes de llamar al service.

    if (this.isEditMode && doc.id) {
      this.service.updateDocumento(doc.id, doc).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (err: any) => console.error('Error actualizando documento', err)
      });
    } else {
      delete doc.id;
      this.service.addDocumento(doc).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (err: any) => console.error('Error guardando documento', err)
      });
    }
  }
}
