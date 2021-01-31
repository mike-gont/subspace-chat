import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { UserManagerService } from 'app/user-manager.service';
import { SubspaceComService } from 'app/subspace-com.service';

const Store = require('electron-store');

@Injectable({
  providedIn: 'root'
})
export class ChatManagerService {

  userId: string;
  chatsList: ChatsListItem[];
  chatsContainer: ChatsContainer;
  activeChatId: number;
  numMessagesToLoad: number = 100;

  constructor(
    private userManager: UserManagerService,
    private subspaceCom: SubspaceComService
    ) {
    this.chatsContainer = new ChatsContainer;

    this.observeActiveUserId();
    this.observeIncomingMessages();

    if (userManager.isConfigured) {
      this.userId = this.userManager.getActiveUserId();
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

  // Observable new message flag
  private newMessageFlagSource = new Subject<number>();
  newMessageFlag$ = this.newMessageFlagSource.asObservable();
  raiseNewMessageFlag(chatId: number) {
    this.newMessageFlagSource.next(chatId);
  }

  private observeActiveUserId(): void {
    // subscribe to the active user id and do stuff when it changes
    this.userManager.activeUserId$.subscribe(
      activeUserId => {
        this.onUserSwitch(); 
      }
    );
  }

  private observeIncomingMessages(): void {
    this.subspaceCom.incomingMessageObservable.subscribe(data =>
        this.handleIncomingMessage(data.sessionId, data.msgPacked)
    )
  }

  // TODO: add a listener to get an updates about message statuses from SubspaceCom


  createChat(chatId: number, name: string): void {
    console.log("createChat: chatId: " + chatId + ", name: " + name);
    let type = "private-chat"; // TODO: FUTURE: add group chat option
    let newChat: ChatData = {
      id: chatId,
      name: name,
      type: type,
      messages: [],
      full: true,
      numOfUnstoredMessages: 0,
      draft: ""
    };
    this.chatsContainer.setChat(newChat);

    let newListItem: ChatsListItem = {
      id: chatId,
      name: name,
      last_msg_from: "",
      last_msg_date: "",
      last_msg_text: ""
    };
    this.chatsList.push(newListItem);

    this.createChatFile(chatId);
    this.updateChatsListFile();
  }

  sendMessage(chatId: number, msg: ChatMsg): void {
    this.addMessageToChat(chatId, msg);
    const msgPacked = JSON.stringify(msg);
    this.subspaceCom.sendMessage(chatId, msgPacked);
  }

  private handleIncomingMessage(sessionId: number, msgPacked: string): void {
    const chatId = sessionId;
    const msg: ChatMsg = JSON.parse(msgPacked);
    this.addMessageToChat(chatId, msg);
  }

  private loadChatsListFromFile(): void {
    const fileName = this.chatsListFilePath();
    const store = new Store({ name: fileName, schema: ChatManagerService.chatsListSchema });
    if (!store.has('chats')) {
      console.warn("chats list file is not availble / invalid: " + fileName + ". creating a new one...");
      this.createChatsListFile();
      this.chatsList = [];
      return;
    }
    this.chatsList = store.get('chats');
  }

  getChatsList(): ChatsListItem[] {
    return this.chatsList;
  }

  getLastMessage(id: number = this.activeChatId): ChatMsg {
    if (this.chatsContainer.getMessages(id).length == 0) {
      console.warn("no messages in chat #" + id);
      return {} as ChatMsg;
    }
    return this.chatsContainer.getMessages(id).slice(-1)[0];
  }

  private loadChatFromFile(id: number, loadFullChat: boolean): boolean {
    const fileName = this.chatFilePath(id);
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
      draft: "",
      numOfUnstoredMessages: 0
    };

    // TODO: I assume store.get('messages') loads all messages to memory. check how this can be avoided
    if (loadFullChat || store.get('messages').length <= this.numMessagesToLoad) {
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

  private addMessageToChat(id: number, msg: ChatMsg): void {
    if (!this.chatsContainer.chatExists(id)) {
      console.error("chat #" + id + " doesn't exist!");
      return;
    }
    console.log("chat mgr: new msg for chat " + id + ": " + msg.text);
    this.chatsContainer.getMessages(id).push(msg);
    this.chatsContainer.getChat(id).numOfUnstoredMessages++;
    this.raiseNewMessageFlag(id);
  }

  private createChatFile(id: number): void {
    const fileName = this.chatFilePath(id);
    console.log("createChatFile: " + fileName);
    const store = new Store({name: fileName, schema: ChatManagerService.chatSchema});
    store.set('name', this.chatsContainer.getChat(id).name);
    store.set('type', this.chatsContainer.getChat(id).type);
    store.set('id', id);
    store.set('messages', this.chatsContainer.getMessages(id));
  }

  private createChatsListFile(): void {
    const fileName = this.chatsListFilePath();
    console.log("createChatsListFile: " + fileName);
    const store = new Store({name: fileName, schema: ChatManagerService.chatsListSchema});
    store.set('chats', []);
  }

  // TODO: we want to append messages from the state to the chat file
  // and not write the file from scratch, as the chat from the state can be partial.
  private updateChatFile(id: number): void {
    const n: number = this.chatsContainer.getChat(id).numOfUnstoredMessages;
    if (n == 0) {
      return;
    }
    const fileName = this.chatFilePath(id);
    console.log("updateChatFile: " + fileName);
    const store = new Store({name: fileName, schema: ChatManagerService.chatSchema});
    const storedMessages: ChatMsg[] = store.get('messages');
    const updatedMessages: ChatMsg[] =
      storedMessages.concat(this.chatsContainer.getMessages(id).slice(-n));

    store.set('messages', updatedMessages);
    console.log("saved chat " + id + " with " + n + " new messages to file: " + fileName);
    this.chatsContainer.getChat(id).numOfUnstoredMessages = 0;
  }

  private updateAllChatFiles(): void {
    for (const id of this.chatsContainer.getIds()) {
      this.updateChatFile(id);
    }
  }

  private updateChatsListFile(): void {
    console.log("updating chats list file");
    const fileName = this.chatsListFilePath();
    const store = new Store({ name: fileName, schema: ChatManagerService.chatsListSchema });
    store.set('chats', this.chatsList);
  }

  private onUserSwitch(): void {
    console.log("chat mgr: onUserSwitch");
    this.updateAllChatFiles();
    this.updateChatsListFile();
    this.chatsList = [];
    this.chatsContainer.clear();
    this.activeChatId = undefined;
    this.userId = this.userManager.getActiveUserId();
    this.loadChatsListFromFile();
    console.log("set chat manager user id: " + this.userId);
  }

  beforeAppClose(): void {
    console.log('chat mgr: close routine')
    this.updateAllChatFiles();
    this.updateChatsListFile();
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

  genCurrentDateStr(): string {
    var currentdate = new Date();
    return currentdate.getFullYear() + "-"
    + (currentdate.getMonth()+1)  + "-"
    + currentdate.getDate() + "T"
    + currentdate.getHours() + ":"
    + currentdate.getMinutes() + ":"
    + currentdate.getSeconds();
  }

  getTimeFromDateStr(date: string) {
    const min_sec = date.split('T')[1].split(':');
    return min_sec[0] + ":" + min_sec[1];
  }

  getDateFromDateStr(date:string) {
    return date.split('T')[0];
  }

  private chatFilePath(id: number): string {
    return this.userManager.getUserDir(this.userId) + "/chats/chat-" + id;
  }

  private chatsListFilePath(): string {
    return this.userManager.getUserDir(this.userId) + "/chats-list";
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

interface StoredChatData {
  name: string;
  type: string;
  id: number;
  messages: ChatMsg[];
}

export interface ChatData extends StoredChatData {
  full: boolean;
  draft: string;
  numOfUnstoredMessages: number;
}

export interface ChatMsg {
  id: number;
  type: string;
  date: string;
  from: string;
  from_id: string;
  status: MsgStatus;
  text: string;
}

export enum MsgStatus {
  None = 0,
  Pending = 1,
  Sent = 2,
  Received = 3
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

  getMessages(id: number): ChatMsg[] {
    return this.chats[id].messages;
  }

  chatExists(id: number): boolean {
    return this.chats.hasOwnProperty(id);
  }

  fullChatExists(id: number): boolean {
    return this.chats.hasOwnProperty(id) && this.chats[id].full;
  }

  getIds(): number[] {
    return Object.keys(this.chats).map(Number);
  }

  getChatsArray(): ChatData[] {
    return Object.values(this.chats);
  }

  clear() {
    this.chats = {}; // TODO: should delete instead of leaving for GC?
  }
}

export interface ChatsListItem {
  id: number,
  name: string,
  last_msg_from: string,
  last_msg_date: string,
  last_msg_text: string
}
