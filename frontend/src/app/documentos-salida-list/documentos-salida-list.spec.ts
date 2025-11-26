import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentosSalidaList } from './documentos-salida-list';

describe('DocumentosSalidaList', () => {
  let component: DocumentosSalidaList;
  let fixture: ComponentFixture<DocumentosSalidaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentosSalidaList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentosSalidaList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
