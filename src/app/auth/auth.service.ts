import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Storage } from '@capacitor/storage';
import { BehaviorSubject, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from './user.model';


export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  localId: string;
  expiresIn: string;
  registered?: string;
}

@Injectable({
  providedIn: 'root'
})

export class AuthService implements OnDestroy{ 
  private _user = new BehaviorSubject<User>(null);
  private activeLogoutTimer: any;

  constructor(
    private http: HttpClient,
  ) { }

  get userIsAuthenticated(){
    return this._user.asObservable().pipe(
      map(
        user=>{
          if(user){
            return !!user.token;
          }else{
            return false;
          }
        }
      )
    )
  }

  get userId(){
    return this._user.asObservable().pipe(map(user=>{
      if(user){
        return user.id;
      }else{
        return null;
      }
    }))
  }

  get token(){
    return this._user.asObservable().pipe(
      map(
        user=>{
          if(user){
            return user.token;
          }else{
            return null;            
          }
        }
      )
    )
  }

  login(email: string, password: string){
    return this.http.post<AuthResponseData>(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseAPIKey}`,
      {email: email, password: password, returnSecureToken: true}
    )
    .pipe(tap(this.setUserData.bind(this)));    
  }

  logout(){
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer)
    }
    this._user.next(null);
    Storage.remove({ key: 'authData' });
  }

  autoLogin(){
    return from(Storage.get({key: 'authData'})).pipe(
      map(
        storedData=>{
          if(!storedData || !storedData.value){
            return null;
          }else{
            const parsedData = JSON.parse(storedData.value) as {
              userId: string; 
              token: string; 
              tokenExpirationDate: string;
              email: string
            }
            const expirationTime = new Date(parsedData.tokenExpirationDate);
            if(expirationTime <= new Date()){
              return null;
            }else{
              const user = new User(
                parsedData.userId,
                parsedData.email,
                parsedData.token,
                expirationTime
              );
              return user;
            }
          }
        }
      ),
      tap(
        user=>{
          if(user){
            this._user.next(user);
            this.autoLogout(user.tokenDuration());
          }
        }
      ),
      map(
        user=>{
          return !!user;
        }
      )
    )
  }

  autoLogout(duration: number){
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer)
    }
    this.activeLogoutTimer = setTimeout(()=>{
      this.logout()
    }, duration)
  }

  signUp(email: string, password: string){
    return this.http.post<AuthResponseData>(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseAPIKey}`,
      {email: email, password: password, returnSecureToken: true}
    )
    .pipe(tap(this.setUserData.bind(this)));
  }

  setUserData(userData: AuthResponseData){
    const tokenExpirationDate = new Date(new Date().getTime() + (+userData.expiresIn * 1000));
    const user = new User(
      userData.localId, 
      userData.email, 
      userData.idToken, 
      tokenExpirationDate
    );
    this._user.next(user);
    this.autoLogout(user.tokenDuration());
    this.storeAuthData(
      userData.localId, 
      userData.idToken, 
      tokenExpirationDate.toISOString(),
      userData.email
    );
  }

  private storeAuthData(
    userId: string, 
    token: string,
    tokenExpirationDate: string,
    email: string
  ){
    const data = JSON.stringify({userId: userId, 
                                token:  token, 
                                tokenExpirationDate: tokenExpirationDate,
                                email: email});

    Storage.set({key: 'authData', value: data});
  }

  ngOnDestroy(){
    if(this.activeLogoutTimer){
      clearTimeout(this.activeLogoutTimer)
    }
  }



}