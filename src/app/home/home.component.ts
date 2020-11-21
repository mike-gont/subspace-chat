import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserManagerService, UserData } from 'app/user-manager.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  activePopUp: string;

  constructor(private router: Router, private userManager: UserManagerService) { }

  ngOnInit(): void {
    if (!this.userManager.isConfigured) {
      this.showNewUserPage();
    }
   }

  showNewUserPage(): void {
    this.activePopUp = 'new-user-page';
  }

  closePopUp(): void {
    this.activePopUp = undefined;
  }

  switchUser(id: string): void {
    this.userManager.switchUser(id);
  }

  getUsers(): UserData[] {
    return Object.values(this.userManager.usersContainer.users);
  }

}
