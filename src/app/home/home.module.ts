import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { HomeComponent } from './home.component';
import { SharedModule } from '../shared/shared.module';
import { ChatComponent } from './chat/chat.component';
import { ChatsListComponent } from './chats-list/chats-list.component';

@NgModule({
  declarations: [HomeComponent, ChatComponent, ChatsListComponent],
  imports: [CommonModule, SharedModule, HomeRoutingModule],
  exports: [HomeComponent]
})
export class HomeModule {}
