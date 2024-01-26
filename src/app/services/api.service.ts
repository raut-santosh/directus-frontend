import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  is_autologout=true;
  public current_year:number=new Date().getFullYear();
  public portal_url =  environment.portal_url;
  private currentUserSubject!: BehaviorSubject<any>;
  public currentUser!: Observable<any>;

  public globalEventEmitter$: any = new EventEmitter<{}>();

  constructor(private http: HttpClient,public router: Router,public location:Location) { 
    this.currentUserSubject = new BehaviorSubject<any>(
      {}
    );
    this.currentUser = this.currentUserSubject.asObservable();
   }

  initializeCurrentUserSubject() {
    this.currentUserSubject = new BehaviorSubject<any>(
      JSON.parse(localStorage.getItem('currentUser')!)
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }
  
  ngOnInit(){
    this.initializeCurrentUserSubject();
  }


  public get(collectionORendpoint: string, params: any={}){
    let urlendpoint = collectionORendpoint;

    if (collectionORendpoint.startsWith('/')) {
      urlendpoint = this.portal_url + '/' + collectionORendpoint;
    } else {
      urlendpoint = this.portal_url + '/items/' + collectionORendpoint;
    }
    const get$ = this.http.get<any>(urlendpoint, {
      params: this.removeUndefinedParams(params),
    });

    return this.http
    .get<any>(urlendpoint, { params:this.removeUndefinedParams(params) })
    .pipe(
      map((data) => { 
        return data;
      })
    );
  }

  public save<T>(collection: string, payload: any): Observable<T> {
    const isEdit = payload && payload['id']; // Check if it's an edit (has an 'id')
   
    const url = isEdit
    ? `${this.portal_url}/${collection}/${payload['id']}`
    : `${this.portal_url}/items/${collection}`;

    //compare payload and item and remove the same properties which are not changed
    //if item is undefined then it is a new item so no need to remove properties
     
    //add tenant
    //payload.tenant=this.currentUserValue?.tenant?.id ?? idata.tenant.id;

    const save$ = isEdit
        ? this.http.patch<T>(url, payload)
        : this.http.post<T>(url, payload);
    return save$;
  }

  

  private removeUndefinedParams(params: any): HttpParams {
    let cleanedParams = new HttpParams();
    for (const key in params) {
      if (params.hasOwnProperty(key) && params[key] !== undefined) {
        cleanedParams = cleanedParams.append(key, params[key]);
      }
    }
    return cleanedParams;
  }

  auth(action:any='login',payload:any={},provider:any=''){
    let url=this.portal_url+'/auth';
        switch(action){
          case 'login':
            url+='/login';
            
          break;

          case 'refresh':
            url+='/refresh';
            console.log(this.currentUserValue);
            payload={refresh_token:this.currentUserValue?.session?.refresh_token};
            if(!payload.refresh_token){
              //return observable error
              return new Observable((observer) => {
                observer.error('refresh_token not found');
                observer.complete();
              });
            }
          break;

          case 'logout':
            payload={refresh_token:this.currentUserValue.refresh_token};
          break;

        }

        //send POST request
        return this.http.post<any>(url, payload).pipe(
          tap((res) => {
            if (res.data?.access_token) {
              // Update the currentUserSubject after the HTTP POST request completes
              this.currentUserSubject.next({ session: res.data });
              this.getSetCurrentUser(res.data);
            }
          }),
          map((res) => {
            if (res.data?.access_token) {
              return res;
            } else {
              throw new Error('Authentication failed'); // Adjust error handling as needed
            }
          })
        );
  }

  getSetCurrentUser(session:any={}){
    // console.log('getSetCurrentUser',this.currentUser,session);
    console.log('getSetCurrentUser',this.currentUserValue);
    //console.log(this.currentUserValue?.id);
    if(this.currentUserValue?.id || session?.access_token){
      this.get('/users/me',{fields:'*,tenant.*,role.id,role.name,role.slug'}, ).subscribe((res:any)=>{ 
        console.log('setuserInfo');
        this.setUser({...res.data,session:session});
      });
    }
  }

  setUser(user: any) {
    let uid = user.name ?? user.first_name + ' - ' + user.mobile;
    console.log('assign id ' + uid.toString());
    //this.analytics.setUserId(uid.toString());
    //_paq.push(['setUserId', uid]);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    // _paq.push(['trackPageView']);
    this.globalEventEmitter$.emit({refreshuser:true,user:user}); 
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  logout(goto='') {
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    localStorage.clear();
    this.currentUserSubject.next(null!);
    this.router.navigate(['/'+goto, { replaceUrl: true }]);
  }

  uploadFile(fileo:any, blob:any, reportProgress = false) {
    //console.log(fileo,blob);
    let formData: FormData = new FormData();
    formData.append('file', blob, fileo.name);

    return this.http
      .post<any>(environment.portal_url + '/files', formData)
      .pipe(map((res) => res));
  }
  
}
