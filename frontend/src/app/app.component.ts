import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DocumentosEntradaListComponent } from './documentos-entrada-list/documentos-entrada-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatToolbarModule, DocumentosEntradaListComponent],
  template: `
    <mat-toolbar color="primary">Gestor Documental</mat-toolbar>
    <div style="padding:16px;">
      <app-documents-list></app-documents-list>
    </div>
  `,
  styles: []
})
export class AppComponent {}
