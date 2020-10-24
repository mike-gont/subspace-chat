import { Component, OnInit } from '@angular/core';
import { HomeComponent } from '../home.component';

const Store = require('electron-store');

@Component({
  selector: 'app-chats-list',
  templateUrl: './chats-list.component.html',
  styleUrls: ['./chats-list.component.scss']
})
export class ChatsListComponent implements OnInit {

  chatsList = [];

  constructor(private homeComponent: HomeComponent) { }

  ngOnInit(): void {
    this.loadChatList();
  }

  loadChatList() {
    const store = new Store({name: "chats-list", schema: ChatsListComponent.chatsListSchema});
    this.chatsList = store.get('chats');
  }

  onSelect(chatId : number) {
    console.log("selected chat: " + chatId);
    this.homeComponent.setCurrentChatId(chatId);
  }

  static chatsListSchema = {
    chats: {
      type: 'array',
      items: {
        id: { type: 'number' },
        name: { type: 'string' },
        last_msg_from: { type: 'string' },
        last_msg_date: { type: 'string' },
        last_msg_text: { type: 'string' }
      }
    }
  };
    
}
