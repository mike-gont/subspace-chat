import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SubspaceComService {

  connections: { [id: number]: RTCPeerConnection };

  constructor() {
    this.connections = {};
  }

  sendData(targetId: number, data: any): void {
    console.warn("unimplemented");
  }
}
