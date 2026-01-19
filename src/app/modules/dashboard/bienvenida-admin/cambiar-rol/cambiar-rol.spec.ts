import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CambiarRol } from './cambiar-rol';

describe('CambiarRol', () => {
  let component: CambiarRol;
  let fixture: ComponentFixture<CambiarRol>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CambiarRol]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CambiarRol);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
