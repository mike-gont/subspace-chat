import { Component, OnInit } from '@angular/core';
import { UserManagerService } from 'app/user-manager.service';
import { HomeComponent } from 'app/home/home.component';

@Component({
  selector: 'app-new-user-page',
  templateUrl: './new-user-page.component.html',
  styleUrls: ['./new-user-page.component.scss']
})
export class NewUserPageComponent implements OnInit {

  constructor(private homeComponent: HomeComponent, private userManager: UserManagerService) { }

  ngOnInit(): void {
  }

  closePage(): void {
    this.homeComponent.closePopUp();
  }

  submitNewUser(name: string) {
    this.userManager.addUser(name);
    this.closePage();
  }

    
}
