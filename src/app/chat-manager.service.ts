import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { UserManagerService } from './user-manager.service';

const Store = require('electron-store');

@Injectable({
  providedIn: 'root'
})
export class ChatManagerService {

  chatsList: ChatsListItem[];
  chatsContainer: ChatsContainer;
  activeChatId: number;
  numMessagesToLoad: number = 100;

  constructor(private userManager: UserManagerService) {
    this.chatsContainer = new ChatsContainer;

    this.observeActiveUserId();

    if (userManager.isConfigured) {
      this.loadChatsListFromFile();
    }
  }

  // Observable active chat id source and stream
  private activeChatIdSource = new Subject<number>();
  activeChatId$ = this.activeChatIdSource.asObservable();
  setActiveChatId(id: number) {
    this.activeChatId = id;
    this.activeChatIdSource.next(id);
  }

  observeActiveUserId(): void {
    // subscribe to the active user id and do stuff when it changes
    this.userManager.activeUserId$.subscribe(
      activeUserId => {
        this.onUserSwitch(); 
      }
    );
  }

  loadChatsListFromFile(): boolean {
    const fileName = this.userManager.getUserDir() + "/chats-list";
    const store = new Store({ name: fileName, schema: ChatManagerService.chatsListSchema });
    if (!store.has('chats')) {
      console.warn("chats list file is not availble / invalid: " + fileName);
      return false;
    }
    this.chatsList = store.get('chats');
    return true;
  }

  getChatsList(): ChatsListItem[] {
    return this.chatsList;
  }

  loadChatFromFile(id: number, loadFully: boolean): boolean {
    const fileName = this.userManager.getUserDir() + "/chats/chat-" + id;
    const store = new Store({ name: fileName, schema: ChatManagerService.chatSchema });

    if (!store.has('id') || !store.has('name') || !store.has('type') || !store.has('messages')) {
      console.error("couldn't load chat with id " + id + ", file: " + fileName);
      return false;
    }

    let chat: ChatData = {
      name: store.get('name'),
      type: store.get('type'),
      id: id,
      messages: [],
      full: false,
      draft: ""
    };

    // TODO: I assume store.get('messages') loads all messages to memory. check how this can be avoided
    if (loadFully || store.get('messages').length <= this.numMessagesToLoad) {
      chat.messages = store.get('messages');
      chat.full = true;
    }
    else {
      chat.messages = store.get('messages').slice(-this.numMessagesToLoad);
      chat.full = false;
    }

    this.chatsContainer.setChat(chat);
    console.log("loaded chat with id: " + id);
    return true;
  }

  getFullChat(id: number): ChatData {
    if (!this.chatsContainer.fullChatExists(id)) {
      let res = this.loadChatFromFile(id, true);
      if (!res) {
        return undefined;
      }
    }
    return this.chatsContainer.getChat(id);
  }

  getChat(id: number): ChatData {
    if (!this.chatsContainer.chatExists(id)) {
      let res = this.loadChatFromFile(id, false);
      if (!res) {
        return undefined;
      }
    }
    return this.chatsContainer.getChat(id);
  }

  updateChat(id: number, messages: MessageData[]) {
    // TODO: implement
    console.error("not implemented");
  }

  saveChatToFile(id: number) {
    // TODO: implement
    console.error("saveChatToFile not implemented");
    // TODO: we want to append messages from the state to the chat file
    // and not write the file from scratch, as the chat from the state can be partial.

    // const fileName = this.userManager.getUserDir() + "/chats/chat-" + id;
    // const store = new Store({name: fileName, schema: ChatManagerService.chatSchema});
    // ...
    // console.log("saved chat " + id + " to file: " + fileName);
  }

  onUserSwitch() {
    // TODO: save unsaved chats state before switching everything
    // this.saveChatsToFiles();
    this.chatsList = [];
    this.chatsContainer.clear();
    this.loadChatsListFromFile();
  }

  setDraft(id: number, str: string): void {
    this.chatsContainer.chats[id].draft = str;
    console.log("saving draft for chat " + id + ": " + str);
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
  full: boolean;
  draft: string;
}

export interface MessageData {
  id: number;
  type: string;
  date: string;
  from: string;
  from_id: string;
  text: string;
}

class ChatsContainer {
  chats: { [id: number]: ChatData };

  constructor() {
    this.chats = {};
  }

  getChat(id: number): ChatData {
    if (!this.chatExists(id)) {
      console.error("ChatsContainer::getChat - the container doesn't contain chat with id: " + id);
      return undefined;
    }
    return this.chats[id];
  }

  setChat(chat: ChatData) {
    this.chats[chat.id] = chat;
  }

  chatExists(id: number): boolean {
    return this.chats.hasOwnProperty(id);
  }

  fullChatExists(id: number): boolean {
    return this.chats.hasOwnProperty(id) && this.chats[id].full;
  }

  clear() {
    this.chats = {}; // TODO: should delete instead of leaving for GC?
  }
}

// export interface ChatsList {
//   chats: ChatsListItem[];
// }

export interface ChatsListItem {
  id: number,
  name: string,
  last_msg_from: string,
  last_msg_date: string,
  last_msg_text: string
}
