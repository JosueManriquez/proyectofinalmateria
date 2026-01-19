import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarCategoria } from './gestionar-categoria';

describe('GestionarCategoria', () => {
  let component: GestionarCategoria;
  let fixture: ComponentFixture<GestionarCategoria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionarCategoria]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarCategoria);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
