import { Component } from '@angular/core';
import { ApiService } from './services/api.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'directus-frontend';

  constructor(private apiService: ApiService){
    
  }

  ngOninit(){
   this.refresh_token(); 
  }

  refresh_token(){

    setTimeout(()=>{                           // <<<---using ()=> syntax
    this.apiService.auth('refresh').subscribe((response)=>{
      console.log(response);
    });
  },1000);
  }

  
}
