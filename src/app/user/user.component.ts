import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService } from '../service/notification.service';
import { Router } from '@angular/router';
import { AuthenticationService } from '../service/authentication.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { User } from '../model/user';
import { UserService } from '../service/user.service';
import { NotificationType } from '../enum/notification-type.enum';
import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { CustomHttpResponse } from '../model/custom-http-response';
import { FileUploadStatus } from '../model/file-upload.status';
import {Role} from "../enum/role.enum";
import {SubSink} from 'subsink';
@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit,OnDestroy {
  private subs = new SubSink();
  private titleSubject = new BehaviorSubject<string>('users');
  public titleAction = this.titleSubject.asObservable();
  public tabValue='Users';
  public refreshing:boolean;
  public users:User[];
  private subscription:Subscription[]=[];
  public selectedUser:User;
  public loggedUser:User;
  public fileName : string;
  public profileImage:File;
  public editUser= new User();
  private currentUsername: string;
  public idUser: number;
  public username:string;
  public fileStatus = new FileUploadStatus();
  constructor(private router: Router, private userService: UserService,
              private notificationService: NotificationService,private authenticationService:AuthenticationService) { }
  ngOnInit(): void {
    this.getUsers(true);
    this.loggedUser =this.authenticationService.getUserFromLocalCache();
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
  public changeTitle(title:string):void{
    this.titleSubject.next(title);
  }
  public getUsers(showNotification:boolean):void{
    this.refreshing=true;
    this.subs.add(
      this.userService.getAllUsers().subscribe(
        (response:User[])=>{
          this.userService.addUsersToLocalCache(response);
          this.users=response;
          this.refreshing=false;
          if(showNotification){
            this.sendNotification(NotificationType.SUCCCESS,`${response.length} user(s) loaded successfully`);
          }
        },
        (errorResponse:HttpErrorResponse)=>{
          this.sendNotification(NotificationType.ERROR,errorResponse.error.message);
          this.refreshing=false;
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
  public onSelectUser(selectedUser:User):void{
    this.selectedUser=selectedUser;
    document.getElementById('openUserInfo').click();
    console.log(selectedUser.firstName);
  }
  public onOpenModal(selectedUser: User, mode: string): void {
    const container = document.getElementById('container');
    const button = document.createElement('button');
    button.type = 'button';
    button.style.display = 'none';
    button.setAttribute('data-toggle', 'modal');
    if (mode === 'view') {
      button.setAttribute('data-target', '#viewUserModal');
      console.log(selectedUser);
      this.selectedUser=selectedUser;
    }
    if (mode === 'add') {
      button.setAttribute('data-target', '#addUserModal');
      console.log(selectedUser);
      this.selectedUser=selectedUser;
    }
    if (mode === 'edit') {
      button.setAttribute('data-target', '#editUserModal');
      console.log(selectedUser);
      this.editUser = selectedUser;
      this.currentUsername = selectedUser.username;
      this.selectedUser=selectedUser;
    }
    if (mode === 'delete') {
      button.setAttribute('data-target', '#deleteUserModal');
      this.idUser = selectedUser.id;
      this.username = selectedUser.username;
      console.log(selectedUser);

    }
    container.appendChild(button);
    button.click();
  }
  public onDeleteUser(username:string):void{
    this.subs.add(
      this.userService.deleteUser(username).subscribe(
        (response:CustomHttpResponse)=>{
          this.sendNotification(NotificationType.SUCCCESS,response.message);
          this.getUsers(true);
          document.getElementById("close-confirmation-modal").click();
        },
        (errorResponse:HttpErrorResponse)=>{
          this.sendNotification(NotificationType.ERROR,errorResponse.error.message);
        }

      )
    );
  }
  public onProfileImageChange(fileName:string, profileImage:File):void
  {
    this.fileName=fileName;
    this.profileImage=profileImage;
  }
  public saveNewUser():void{
    document.getElementById("new-user-save").click();
  }
  public onAddNewUser(userForm:NgForm):void{
    const formData= this.userService.createUserFormData(null,userForm.value,this.profileImage);
    this.subs.add(
      this.userService.addUser(formData).subscribe(
        (response:User)=>{
          document.getElementById("new-user-close").click();
          this.getUsers(false);
          this.fileName=null;
          this.profileImage=null;
          userForm.reset();
          this.sendNotification(NotificationType.SUCCCESS,`${response.firstName} ${response.lastName} created successfully`);
        },
        (errorResponse:HttpErrorResponse)=>{
          this.sendNotification(NotificationType.ERROR,errorResponse.error.message);
          this.profileImage=null;
        }
      )
    );

  }
  public onEditUser():void{
    const formData= this.userService.createUserFormData(this.currentUsername,this.editUser,this.profileImage);
    this.subs.add(
      this.userService.updateUser(formData).subscribe(
        (response:User)=>{
          document.getElementById("close-edit-button").click();
          this.getUsers(false);
          this.fileName=null;
          this.profileImage=null;
          this.sendNotification(NotificationType.SUCCCESS,`${response.firstName} ${response.lastName} updated successfully`);
        },
        (errorResponse:HttpErrorResponse)=>{
          this.sendNotification(NotificationType.ERROR,errorResponse.error.message);
          this.profileImage=null;
        }
      )
    );
  }
  public searchUsers(searchTerm:string):void{
    const result:User[]=[];
    for(const user of  this.userService.getUsersFromLocalCache()){
      if(user.firstName.toLowerCase().indexOf(searchTerm.toLowerCase())!==-1 ||
        user.lastName.toLowerCase().indexOf(searchTerm.toLowerCase())!==-1 ||
        user.userId.toLowerCase().indexOf(searchTerm.toLowerCase())!==-1 ||
        user.username.toLowerCase().indexOf(searchTerm.toLowerCase())!==-1 ||
        user.email.toLowerCase().indexOf(searchTerm.toLowerCase())!==-1){
        result.push(user);
      }
    }
    this.users = result;
    if (result.length===0 || searchTerm=== null){
      this.users = this.userService.getUsersFromLocalCache();
    }
  }
  public onResetPassword(emailForm:NgForm):void{
    this.refreshing=true;
    const email = emailForm.value['reset-password-email'];
    this.subs.add(
      this.userService.resetPassword(email).subscribe(
        (response:CustomHttpResponse)=>{
          this.sendNotification(NotificationType.SUCCCESS,response.message);
          this.refreshing=false;
        },
        (errorResponse:HttpErrorResponse)=>{
          this.sendNotification(NotificationType.WARNING,errorResponse.error.message);
          this.refreshing=false;
        },
        ()=> emailForm.reset()

      )
    );
  }

  public onUpdateCurrentUser(user : User):void{
    this.refreshing= true;
    this.currentUsername = this.authenticationService.getUserFromLocalCache().username;
    const formData= this.userService.createUserFormData(this.currentUsername,user,this.profileImage);
    this.subs.add(
      this.userService.updateUser(formData).subscribe(
        (response:User)=>{
          this.authenticationService.addUserToLocalCache(response);
          this.getUsers(false);
          this.fileName=null;
          this.profileImage=null;
          this.refreshing=false;
          this.sendNotification(NotificationType.SUCCCESS,`${response.firstName} ${response.lastName} updated successfully`);
        },
        (errorResponse:HttpErrorResponse)=>{
          this.sendNotification(NotificationType.ERROR,errorResponse.error.message);
          this.profileImage=null;
          this.refreshing=false;
        }
      )
    );


  }
  public onLogOut():void{
    this.authenticationService.logOut();
    this.router.navigate(['/login']);
    this.sendNotification(NotificationType.SUCCCESS,`You've been successfully logout`);
  }
  public updateProfileImage():void{
    document.getElementById('profile-image-input').click();
  }
  public onUpdateProfileImage():void{
    const formData = new FormData();
    formData.append('username',this.loggedUser.username);
    formData.append('profileImage',this.profileImage);
    this.subs.add(
      this.userService.updateProfileImage(formData).subscribe(
        (event:HttpEvent<any>)=>{
          this.reportUploadProgress(event);
        },
        (errorResponse:HttpErrorResponse)=>{
          this.sendNotification(NotificationType.ERROR,errorResponse.error.message);
          this.fileStatus.status='done';
        }
      )
    );
  }

  private reportUploadProgress(event: HttpEvent<any>):void {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        this.fileStatus.percentage= Math.round(100 * event.loaded/event.total);
        this.fileStatus.status='progress';
        console.log("progress");
        break;
      case HttpEventType.Response:
        if (event.status===200){
          this.loggedUser.profileImageUrl=`${event.body.profileImageUrl}?time=${new Date().getTime()}`;
          this.sendNotification(NotificationType.SUCCCESS,`${event.body.firstName}'s profile image updated successfully`);
          this.fileStatus.status='done';
          console.log("done");
          break;
        }
        else{
          this.sendNotification(NotificationType.ERROR,`Enable to upload image. Please try again.`);
          break;
        }
      default:
        'Finished all processes';

    }
  }
  private getUserRole():string{
    return this.authenticationService.getUserFromLocalCache().role;
  }
  // @ts-ignore
  public get isAdmin():boolean {
    return this.getUserRole() === Role.ADMIN || this.getUserRole() === Role.SUPER_USER;
  }
  // @ts-ignore
  public get isManager():boolean {
    return this.isAdmin || this.getUserRole() === Role.MANAGER;
  }
  // @ts-ignore
  public get isAdminOrManager():boolean {
    return this.isAdmin || this.isManager;
  }
}
