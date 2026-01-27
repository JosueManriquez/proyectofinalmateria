import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SuscripcionService } from '../../../services/suscripcion';
import { SuscripcionModelo } from '../../../models/suscripcion';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-renovar-suscripcion',
  templateUrl: './renovar-suscripcion.html',
  styleUrls: ['./renovar-suscripcion.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class RenovarSuscripcion {

}
