import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenovarSuscripcion } from './renovar-suscripcion';

describe('RenovarSuscripcion', () => {
  let component: RenovarSuscripcion;
  let fixture: ComponentFixture<RenovarSuscripcion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RenovarSuscripcion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RenovarSuscripcion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
