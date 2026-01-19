import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BienvenidaUsuario } from './bienvenida-usuario';

describe('BienvenidaUsuario', () => {
  let component: BienvenidaUsuario;
  let fixture: ComponentFixture<BienvenidaUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BienvenidaUsuario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BienvenidaUsuario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
