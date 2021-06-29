import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthenticationService } from '../service/authentication.service';
import { Router } from '@angular/router';
import { NotificationService } from '../service/notification.service';
import { User } from '../model/user';
import { Subscription } from 'rxjs';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { NotificationType } from '../enum/notification-type.enum';
import { HeaderType } from '../enum/header-type.enum';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit,OnDestroy {
  showLoading: boolean;
  private subscriptions: Subscription[]=[];
  constructor(private router: Router, private authenticationsService: AuthenticationService,
              private notificationService: NotificationService) { }

  ngOnInit(): void {
    if(this.authenticationsService.isLoggedIn()){
      this.router.navigateByUrl('/user/management');
    }
    else{
      this.router.navigateByUrl('/login');
    }
  }

  onLogin(user:User):void{
    this.showLoading=true;
    console.log(user);
    this.subscriptions.push(
      this.authenticationsService.login(user).subscribe(
        (response:HttpResponse<User>)=>{
            const token = response.headers.get(HeaderType.JWT_TOKEN);
            this.authenticationsService.saveToken(token);
            this.authenticationsService.addUserToLocalCache(response.body);
            this.router.navigateByUrl('/user/management');
            this.showLoading=false;
            
        },
        (errorResponse:HttpErrorResponse)=>{
          console.log(errorResponse);
          this.sendErrorNotification(NotificationType.ERROR,errorResponse.error.message);
          this.showLoading=false;
        }
      )
    );
  }

  private sendErrorNotification(notificationType: NotificationType, message: string) {
        if (message){
          this.notificationService.showNotification(notificationType,message);
        }
        else{
          this.notificationService.showNotification(notificationType,'AN ERROR OCCURED, PLEASE TRY AGAIN');
        }

    }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub=>sub.unsubscribe());
  }

}
