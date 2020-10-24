import { Component, OnInit } from '@angular/core';
import { HomeComponent } from '../home.component';

const Store = require('electron-store');

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

  chatName: string;
  chatType: string;
  chatId: number;
  chatMessages = [];

  constructor(private homeComponent: HomeComponent) {
    homeComponent.currentChatId$.subscribe(
      chatId => {
        this.loadChat(chatId);
      });
  }

  ngOnInit(): void {
  }

  loadChat(chatId: number) {
    const store = new Store({name: "chat-" + chatId, schema: ChatComponent.chatSchema});
    this.chatName = store.get('name');
    this.chatType = store.get('type');
    this.chatId = chatId;
    this.chatMessages = store.get('messages');

    if (this.chatMessages == undefined) {
      console.error("failed loading chat with id: " + chatId);
    }
    console.log("loaded chat with id: " + chatId);
  }

  // TODO: update only last messages and don't load the whole chat file
  updateChat() {
    const store = new Store({name: "chat-" + this.chatId, schema: ChatComponent.chatSchema});
    this.chatMessages = store.get('messages');
  }

  // TODO: fix this schema
  static chatSchema = {
    name: { type: 'string' },
    type: { type: 'string' },
    id: { type: 'number' },
    messages: {
      type: 'array',
      // items: {
      //   id: { type: 'number' },
      //   type: { type: 'string' },
      //   date: { type: 'string' },
      //   from: { type: 'string' },
      //   from_id: { type: 'number' },
      //   text: { type: 'string' }
      // }
    }
  };

}
