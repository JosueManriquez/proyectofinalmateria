import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarProducto } from './agregar-producto';

describe('AgregarProducto', () => {
  let component: AgregarProducto;
  let fixture: ComponentFixture<AgregarProducto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgregarProducto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarProducto);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
