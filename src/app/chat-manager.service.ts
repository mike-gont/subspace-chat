import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { UserManagerService } from './user-manager.service';

const Store = require('electron-store');

@Injectable({
  providedIn: 'root'
})
export class ChatManagerService {

  chatsList: ChatsList;
  chatsContainer: ChatsContainer;

  constructor(private userManager: UserManagerService) {
    this.loadChatsList();
    this.chatsContainer = new ChatsContainer;
  }

  // Observable chatId source and stream
  private currentChatIdSource = new Subject<number>();
  currentChatId$ = this.currentChatIdSource.asObservable();
  setCurrentChatId(chatId: number) {
    this.currentChatIdSource.next(chatId);
  }

  loadChatsList() {
    const fileName = this.userManager.getUserDir() + "/chats-list";
    const store = new Store({name: fileName, schema: ChatManagerService.chatsListSchema});
    this.chatsList =  store.get('chats');
  }

  getChatsList() {
    return this.chatsList;
  }

  loadChat(id: number): boolean {
    const fileName = this.userManager.getUserDir() + "/chats/chat-" + id;
    const store = new Store({name: fileName, schema: ChatManagerService.chatSchema});

    if (store.get('id') == undefined) {
      console.error("couldn't load chat with id " + id + ", file: " + fileName);
      return false;
    }
    if (id != store.get('id')) {
      console.warn("chat file: " + fileName + " contains a contradicting id: " + store.get('id'));
    }

    let chat: ChatData = {
      name: store.get('name'),
      type: store.get('type'),
      id: id,
      messages: store.get('messages')
    };

    if (chat.messages == undefined) {
      console.error("failed loading messages for chat with id: " + id);
    }
    this.chatsContainer.setChat(id, chat);
    console.log("loaded chat with id: " + id);
    return true;
  }

  getChat(id: number): ChatData {
    if (!this.chatsContainer.chatExists(id)) {
      let res = this.loadChat(id);
      if (!res) {
        return undefined;
      }
    }
    return this.chatsContainer.getChat(id);
  }

  getChatPartial(id: number, numMessages: number): ChatData {
    if (!this.chatsContainer.chatExists(id)) {
      let res = this.loadChat(id);
      if (!res) {
        return undefined;
      }
    }
    return {
      name: this.chatsContainer.getChat(id).name,
      type: this.chatsContainer.getChat(id).type,
      id: this.chatsContainer.getChat(id).id,
      messages: this.chatsContainer.getChat(id).messages.slice(1).slice(-numMessages)
    }
  }

  updateChat(id: number, messages: MessageData[]) {
    // TODO: implement
    console.error("not implemented");
  }

  saveChat(id: number) {
    // TODO: implement
    console.error("not implemented");
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

export interface ChatData {
  name: string;
  type: string;
  id: number;
  messages: MessageData[];
}

export interface MessageData {
  id: number;
  type: string;
  date: string;
  from: string;
  from_id: number;
  text: string;
}

class ChatsContainer {
  chats: { [id: number] : ChatData };

  constructor() {
    this.chats = {};
  }

  getChat(id: number): ChatData {
    return this.chats[id];
  }

  setChat(id: number, chat: ChatData) {
    this.chats[id] = chat;
  }

  chatExists(id: number): boolean {
    return id in this.chats;
  }
}

export interface ChatsList {
  chats: {
    id: number,
    name: string,
    last_msg_from: string,
    last_msg_date: string,
    last_msg_text: string
  };
}
