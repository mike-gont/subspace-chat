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

  myUserId: number;
  inputBoxMessage: string;

  constructor(private homeComponent: HomeComponent) {
    // loadChat when the homeComponent.currentChatId changes
    homeComponent.currentChatId$.subscribe(
      chatId => {
        this.loadChat(chatId);
      });
    // TODO: get from data service when ready
    this.myUserId = 478948757;
  }

  ngOnInit(): void {
  }

  loadChat(chatId: number) {
    // TODO: use ChatManager
    const store = new Store({name: "user-data/chats/chat-" + chatId, schema: ChatComponent.chatSchema});

    if (chatId != store.get('id')) {
      console.error("chat file: chat-" + chatId + " contains a contradicting id: " + store.get('id'));
    }

    this.chatName = store.get('name');
    this.chatType = store.get('type');
    this.chatId = chatId;
    this.chatMessages = store.get('messages');

    if (this.chatMessages == undefined) {
      console.error("failed loading chat with id: " + chatId);
    }
    console.log("loaded chat with id: " + chatId);
  }

  // TODO: use ChatManager
  // TODO: get only last x messages and don't load the whole chat file
  updateChat() {
    const store = new Store({name: "chat-" + this.chatId, schema: ChatComponent.chatSchema});
    this.chatMessages = store.get('messages');
  }

  updateInputBoxMessage(event: any) {
    this.inputBoxMessage = event.target.value;
    console.log("input msg: " + this.inputBoxMessage);
  }

  sendMessage() {
    console.log("sendMessage: " + this.inputBoxMessage);
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
