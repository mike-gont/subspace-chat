import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

const Store = require('electron-store');

@Injectable({
  providedIn: 'root'
})
export class UserManagerService {

  usersContainer: UsersContainer;
  activeUserId: string;
  isConfigured: boolean;

  constructor() {
    this.isConfigured = false;
    this.usersContainer = new UsersContainer;
    let load_res: boolean = this.loadDataFromFile();
    this.isConfigured = load_res;
  }

  // Observable activeUserId source and stream
  private activeUserIdSource = new Subject<string>();
  activeUserId$ = this.activeUserIdSource.asObservable();
  setActiveUser(id: string): void {
    this.activeUserId = id;
    this.activeUserIdSource.next(id);
  }

  getUserName(id: string = this.activeUserId): string {
    if (!this.isConfigured) {
      console.error("active user is not defined!");
      return undefined;
    }
    return this.usersContainer.getUser(id).name;
  }

  getActiveUserId(): string {
    if (!this.isConfigured) {
      console.error("active user is not defined!");
      return undefined;
    }
    return this.activeUserId;
  }

  getUserDir(id: string = this.activeUserId): string {
    // console.log("getUserDir(id = " + id + ")");
    return "user-data/" + this.getUserName(id);
  }

  addUser(name: string): void {
    const id: string = UserManagerService.generateId();
    this.usersContainer.setUser({ name: name, id:id });
    this.switchUser(id);
    this.saveUsersToFile();
  }

  switchUser(id: string): void {
    this.setActiveUser(id);
    this.saveActiveUserToFile();
  }

  saveUsersToFile(): void {
    const fileName = "user-data/users";
    const store = new Store({name: fileName, schema: UserManagerService.usersListSchema});
    store.set('users', this.usersContainer.getUsersArray());
    console.log("saved users to file");
  }

  saveActiveUserToFile(): void {
    const fileName = "user-data/users";
    const store = new Store({name: fileName, schema: UserManagerService.usersListSchema});
    store.set('active_user_id', this.activeUserId);
    console.log("saved active user id to file");
  }

  loadDataFromFile(): boolean {
    const fileName = "user-data/users";
    const store = new Store({name: fileName, schema: UserManagerService.usersListSchema});
    if (!store.has('active_user_id') || !store.has('users')) {
      console.warn("user data file is not available / invalid: " + fileName);
      return false;
    }

    for (const item of store.get('users')) {
      this.usersContainer.setUser({ name: item.name, id: item.id });
    }

    this.setActiveUser(store.get('active_user_id'));
    console.log("loaded users from file. active user id: " + this.activeUserId);
    return true;
  }

  getUsers(): UserData[] {
    return this.usersContainer.getUsersArray();
  }

  static generateId (): string {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 10 characters
    // after the decimal.
    return Math.random().toString(36).substr(2, 10);
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
