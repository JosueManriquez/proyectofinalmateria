import { TestBed } from '@angular/core/testing';

import { SuscripcionService } from './suscripcion';
import { SuscripcionModelo } from '../models/suscripcion';

describe('Suscripcion', () => {
  let service: SuscripcionModelo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuscripcionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
