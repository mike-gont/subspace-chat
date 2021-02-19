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
    if (!this.userManager.activeUserConfigured()) {
      this.showNewUserPage();
    }
   }

  showNewUserPage(): void {
    this.activePopUp = 'new-user-page';
  }

  showNewChatPage(): void {
    this.activePopUp = 'new-chat-page';
  }

  closePopUp(): void {
    this.activePopUp = undefined;
  }

}
