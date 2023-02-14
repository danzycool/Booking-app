import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthResponseData, AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading = false;
  isLogin = true;

  constructor(
      private authService: AuthService, 
      private router: Router,
      private loadingCtrl: LoadingController,
      private alertCtrl: AlertController
    ){}

  ngOnInit() {
  }

  authenticate(email, password){
    this.isLoading=true;   
    this.loadingCtrl.create({keyboardClose: true, message: 'Logging in... Please Wait'})
    .then(loadingEl=>{
        loadingEl.present();
        let authObs: Observable<AuthResponseData>;
        if(this.isLogin){
          authObs = this.authService.login(email, password);
        }else{
          authObs = this.authService.signUp(email, password); 
        }   
        authObs.subscribe(
          resData=>{
            console.log(resData);
            this.isLoading = false;
            loadingEl.dismiss();                        
            this.router.navigateByUrl('places/tabs/discover');
          },
          errorRes=>{
            loadingEl.dismiss();
            const code = errorRes.error.error.message;
            let message = 'Could not sign you up, please try again.';
            if(code==='ADMIN_ONLY_OPERATION'){
              message = 'ADMIN_ONLY_OPERATION'
            }
            if(code==='MISSING_EMAIL'){
              message = 'MISSING_EMAIL'
            }
            if(code==='EMAIL_EXISTS'){
              message = 'The Email exists already!!!'
            }
            if(code==='EMAIL_NOT_FOUND' || code==='INVALID_PASSWORD'){
              message ='Email Address or Password is invalid'
            }
            this.showAlert(message);
          }
        ); 
    });    
    
  }

  onSwitchAuthMode(){
    this.isLogin = !this.isLogin;
  }

  onSubmit(form: NgForm){
    if(!form.valid){
      return
    }     
    else{
      const email = form.value.email;
      const password = form.value.password;
      this.authenticate(email, password);
      form.reset();
    }
  }

  showAlert(message: string){
    if(message==='ADMIN_ONLY_OPERATION' || message==='MISSING_EMAIL'){
      return
    }
    this.alertCtrl.create({
        header: 'Authentication Failed',
        message: message,
        buttons: ['Okay']
    }).then(alertEl=>{
        alertEl.present()
    })
  }



  

}