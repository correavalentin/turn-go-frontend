import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HorariosService {
  private baseUrl = 'http://localhost:8080/api/v1/horarios';
  
  constructor(private http: HttpClient) {}
  
  getHorarios() : Observable<any> {
    return this.http.get(this.baseUrl);
  }
}
