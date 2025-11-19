import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DocumentsListComponent } from './documents-list/documents-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatToolbarModule, DocumentsListComponent],
  template: `
    <mat-toolbar color="primary">Gestor Documental</mat-toolbar>
    <div style="padding:16px;">
      <app-documents-list></app-documents-list>
    </div>
  `,
  styles: []
})
export class AppComponent {}
