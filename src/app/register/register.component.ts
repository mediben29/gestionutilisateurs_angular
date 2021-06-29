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
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit,OnDestroy {
  showLoading: boolean;
  private subscriptions: Subscription[]=[];
  constructor(private router: Router, private authenticationsService: AuthenticationService,
              private notificationService: NotificationService) { }

  ngOnInit(): void {
    if(this.authenticationsService.isLoggedIn()){
      this.router.navigateByUrl('/user/management');
    }
 
  }

  onRegister(user:User):void{
    this.showLoading=true;
    console.log(user);
    this.subscriptions.push(
      this.authenticationsService.register(user).subscribe(
        (response:User)=>{
          this.showLoading=false;
          this.sendNotification(NotificationType.SUCCCESS,`A new account was created for ${response.firstName}.
           Please check your email for password to log in!`);
        },
        (errorResponse:HttpErrorResponse)=>{
          console.log(errorResponse);
          this.sendNotification(NotificationType.ERROR,errorResponse.error.message);
          this.showLoading=false;
        }
      )
    );
  }

  private sendNotification(notificationType: NotificationType, message: string) {
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
