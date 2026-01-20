import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearSuscripcion } from './crear-suscripcion';

describe('CrearSuscripcion', () => {
  let component: CrearSuscripcion;
  let fixture: ComponentFixture<CrearSuscripcion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CrearSuscripcion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearSuscripcion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
