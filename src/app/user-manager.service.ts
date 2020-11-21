import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

const Store = require('electron-store');

@Injectable({
  providedIn: 'root'
})
export class UserManagerService {

  usersContainer: UsersContainer;
  activeUserId: number;
  activeUserDefined: boolean;

  constructor() {
    this.activeUserDefined = false;
    this.usersContainer = new UsersContainer;
    let load_res: boolean = this.loadUsersFromFile();
    if (!load_res) {
      // TODO: implement
    }
  }

  // Observable activeUserId source and stream
  private activeUserIdSource = new Subject<number>();
  activeUserId$ = this.activeUserIdSource.asObservable();
  setActiveUser(id: number) {
    this.activeUserDefined = true;
    this.activeUserId = id;
    this.activeUserIdSource.next(id);
  }

  getUserName(): string {
    if (!this.activeUserDefined) {
      console.error("active user is not defined!");
      return undefined;
    }
    return this.usersContainer.getUser(this.activeUserId).name;
  }

  getUserId(): number {
    if (!this.activeUserDefined) {
      console.error("active user is not defined!");
      return undefined;
    }
    return this.activeUserId;
  }

  getUserDir(): string {
    return "user-data/" + this.getUserName();
  }

  setUser(user: UserData) {
    this.usersContainer.setUser(user);
  }

  saveUsersToFile() {
    const fileName = "user-data/users";
    const store = new Store({name: fileName, schema: UserManagerService.usersListSchema});
    store.set('active_user_id', this.activeUserId);
    store.set('users', this.usersContainer.users);
    console.log("saved users to file");
  }

  loadUsersFromFile(): boolean {
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

  static usersListSchema = {
    active_user_id: { type: 'number' },
    users: {
      type: 'array',
      items: {
        id: { type: 'number' },
        name: { type: 'string' }
      }
    }
  };

}

interface UserData {
  name: string;
  id: number;
}

class UsersContainer {
  users: { [id: number] : UserData };

  constructor() {
    this.users = {};
  }

  getUser(id: number): UserData {
    if (!this.userExists(id)) {
      console.error("UsersContainer::getUser - the container doesn't contain user with id: " + id);
      return undefined;
    }
    return this.users[id];
  }

  setUser(user: UserData) {
    this.users[user.id] = user;
  }

  userExists(id: number): boolean {
    return this.users.hasOwnProperty(id);
  }
}
