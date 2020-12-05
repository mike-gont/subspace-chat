import { Component, OnInit } from '@angular/core';
import { UserManagerService } from 'app/user-manager.service';
import { HomeComponent } from 'app/home/home.component';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {

  constructor(public homeComponent: HomeComponent, public userManager: UserManagerService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
  }

  switchUser(id: string): void {
    if (id == "") {
      return;
    }
    this.userManager.switchUser(id);
  }
    
}
