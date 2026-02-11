import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentosSalidaForm } from './documentos-salida-form';

describe('DocumentosSalidaForm', () => {
  let component: DocumentosSalidaForm;
  let fixture: ComponentFixture<DocumentosSalidaForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentosSalidaForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentosSalidaForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
