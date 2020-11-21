import { Injectable } from '@angular/core';

const Store = require('electron-store');

@Injectable({
  providedIn: 'root'
})
export class UserManagerService {

  usersContainer: UsersContainer;
  currentUserId: number;


  constructor() {
    this.usersContainer = new UsersContainer;
    // TODO: temp!
    this.currentUserId = 478948757;
    this.usersContainer.setUser(this.currentUserId, { name: "mike", id: this.currentUserId })
  }

  getUserName() {
    return this.usersContainer.getUser(this.currentUserId).name;
  }

  getUserId() {
    return this.currentUserId;
  }

  getUserDir() {
    return "user-data/" + this.getUserName();
  }

  loadUsers() {
    // TODO: load users from json file
    console.error("not implemented");
  }

  saveUser() {
    // TODO: implement
    console.error("not implemented");
  }

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
    return this.users[id];
  }

  setUser(id: number, user: UserData) {
    this.users[id] = user;
  }

  userExists(id: number): boolean {
    return id in this.users;
  }
}
