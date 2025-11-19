import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { DocumentsService } from '../services/documents.service';

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
    MatSelectModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions
  ],
  templateUrl: './documents-form.component.html',
  styleUrls: ['./documents-form.component.css']
})
export class DocumentsFormComponent {
  form: FormGroup;

  tramos = ['RBPM', 'PMPA', 'AIF'];
  tiposDocumento = ['Ordinario', 'Carta', 'Nota', 'Minuta', 'Folio', 'Resuel', 'Correo', 'Memo'];
  areas = ['Conservación', 'Seguridad Vial', 'Prevención', 'Hitos', 'Territorio', 'Ambiental', 'Proyectos', 'AIF'];
  instruyeOpciones = ['Sí', 'No'];

  constructor(
    private fb: FormBuilder,
    private service: DocumentsService,
    public dialogRef: MatDialogRef<DocumentsFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      tramo: [data?.tramo || '', Validators.required],
      tipo: [data?.tipo_registro || '', Validators.required],
      registro_sgd: [data?.registro_sgd || ''],
      numero_documento: [data?.numero_documento || '', Validators.required],
      fecha_documento: [data?.fecha_documento || null],
      fecha_ingreso: [data?.fecha_ingreso || null],
      remitente: [data?.remitente || ''],
      cargo_remitente: [data?.cargo_remitente || ''],
      destinatario: [data?.destinatario || ''],
      cargo_destinatario: [data?.cargo_destinatario || ''],
      antecedentes: [data?.antecedentes || ''],
      materia: [data?.materia || ''],
      area_responsable: [data?.area_responsable || '', Validators.required],
      instruye_respuesta: [data?.instruye_respuesta || 'No']
    });
  }

  save() {
    if (this.form.invalid) return;
    this.service.addDocumento(this.form.value).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err: any) => console.error('Error guardando documento', err)
    });

  }
}
