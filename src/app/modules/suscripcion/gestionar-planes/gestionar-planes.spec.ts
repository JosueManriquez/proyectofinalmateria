import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarPlanes } from './gestionar-planes';

describe('GestionarPlanes', () => {
  let component: GestionarPlanes;
  let fixture: ComponentFixture<GestionarPlanes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionarPlanes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarPlanes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
