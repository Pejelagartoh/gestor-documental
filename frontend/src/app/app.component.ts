import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

// ✅ FIX NG8001: Asegurando que los componentes de lista estén importados
import { DocumentosEntradaListComponent } from './documentos-entrada-list/documentos-entrada-list.component';
import { DocumentosSalidaListComponent } from './documentos-salida-list/documentos-salida-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatTabsModule,
    MatIconModule,
    // ✅ FIX NG8001: Incluyendo los componentes en los imports
    DocumentosEntradaListComponent,
    DocumentosSalidaListComponent
  ],
  templateUrl: './app.component.html',
  // ✅ FIX NG2008: Cambiando la extensión del archivo de estilos a .css
  //styleUrls: ['./app.component.css']
})
export class AppComponent {
  // La lógica permanece vacía.
}
