import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const Store = require('electron-store');

@Injectable({
  providedIn: 'root'
})
export class UserManagerService {

  usersContainer: UsersContainer;
  activeUserId: string;

  static usersDataDir = "user-data/";
  static usersJsonFileName = UserManagerService.usersDataDir + "users";

  constructor() {
    this.usersContainer = new UsersContainer;
    this.loadDataFromFile();
  }

  // Observable activeUserId source and stream
  private activeUserIdSource = new Subject<string>();
  activeUserId$ = this.activeUserIdSource.asObservable();
  setActiveUser(id: string): void {
    this.activeUserId = id;
    this.activeUserIdSource.next(id);
  }

  activeUserConfigured(): boolean {
    return this.activeUserId != undefined;
  }

  getUserName(id: string = this.activeUserId): string {
    if (!this.activeUserConfigured()) {
      console.error("active user is not defined!");
      return undefined;
    }
    return this.usersContainer.getUser(id).name;
  }

  getActiveUserId(): string {
    if (!this.activeUserConfigured()) {
      console.error("active user is not defined!");
      return undefined;
    }
    return this.activeUserId;
  }

  getUserDir(id: string = this.activeUserId): string {
    // console.log("getUserDir(id = " + id + ")");
    return UserManagerService.usersDataDir + this.getUserName(id);
  }

  addUser(name: string): void {
    const id: string = this.generateId();
    this.usersContainer.setUser({ name: name, id:id });
    this.saveUsersToFile();
    this.switchUser(id);
  }

  switchUser(id: string): void {
    if (id == "") {
      console.error("no id");
      return;
    }
    this.setActiveUserInUsersFile(id);
    this.setActiveUser(id); // this will notify to subscribers
  }

  private saveUsersToFile(): void {
    const store = new Store({name: UserManagerService.usersJsonFileName, schema: UserManagerService.usersListSchema});
    store.set('users', this.usersContainer.getUsersArray());
    console.log("saved users to file");
  }

  private setActiveUserInUsersFile(id: string): void {
    const store = new Store({name: UserManagerService.usersJsonFileName, schema: UserManagerService.usersListSchema});
    store.set('active_user_id', id);
    console.log("set new active user id in users file: " + id);
  }

  private loadDataFromFile(): void {
    const store = new Store({name: UserManagerService.usersJsonFileName, schema: UserManagerService.usersListSchema});
    if (!store.has('active_user_id') || !store.has('users')) {
      console.warn("user data file is not available / invalid: " + UserManagerService.usersJsonFileName);
      return;
    }

    for (const item of store.get('users')) {
      this.usersContainer.setUser({ name: item.name, id: item.id });
    }

    let active_user_id = store.get('active_user_id');
    // make sure the active user id is valid. if not, set the the first user
    if (!this.usersContainer.userExists(active_user_id) && this.usersContainer.getUsersArray) {
      active_user_id = this.usersContainer.getUsersArray()[0].id;
    }

    this.setActiveUser(active_user_id);
    console.log("loaded users from file. active user id: " + this.activeUserId);
  }

  getUsers(): UserData[] {
    return this.usersContainer.getUsersArray();
  }

  private generateId (): string {
    return Math.random().toString(36).substr(2, 20);
  }

  static usersListSchema = {
    active_user_id: { type: 'string' },
    users: {
      type: 'array',
      items: {
        id: { type: 'string' },
        name: { type: 'string' }
      }
    }
  };

}

export interface UserData {
  name: string;
  id: string;
}

class UsersContainer {
  users: { [id: string] : UserData };

  constructor() {
    this.users = {};
  }

  getUser(id: string): UserData {
    if (!this.userExists(id)) {
      console.error("UsersContainer::getUser - the container doesn't contain user with id: " + id);
      return undefined;
    }
    return this.users[id];
  }

  setUser(user: UserData) {
    this.users[user.id] = user;
  }

  userExists(id: string): boolean {
    return this.users.hasOwnProperty(id);
  }

  getUsersArray(): UserData[] {
    return Object.values(this.users);
  }
}
