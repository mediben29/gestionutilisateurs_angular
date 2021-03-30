export class User{
  public  id :number;
  public  userId :string;
  public  firstName:string;
  public  lastName:string;
  public  username:string;
  public  email:string;
  public  profileImageUrl:string;
  public  logInDateDisplay:Date;
  public  joinDate:Date;
  public  role:string; //ROLE_USER{ read, edit }, ROLE_ADMIN {delete}
  public  authorities : [];
  public  active:boolean;
  public  notLocked:boolean;

  constructor() {
    this.firstName='';
    this.lastName='';
    this.email='';
    this.username='';
    this.active=true;
    this.notLocked=true;
    this.role='';
    this.authorities=[];
  }
}
