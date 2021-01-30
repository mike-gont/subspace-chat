import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubspaceComService {

  sessions: { [id: number]: SubspaceSession };

  constructor() {
    this.sessions = {};
  }

  // Observable incoming message
  private newIncomingMessageSubject = new Subject<{ sessionId: number, msgPacked: string }>();
  incomingMessageObservable = this.newIncomingMessageSubject.asObservable();
  notifyIncomingMessageToSubscribers(sessionId: number, msgPacked: string) {
    this.newIncomingMessageSubject.next({ sessionId: sessionId, msgPacked: msgPacked });
  }

  getPeerConnection(sessionId: number): RTCPeerConnection {
    if (this.sessionExists(sessionId) == false) {
      console.error("session with id: " + sessionId + " doesn't exist!");
      return;
    }
    return this.sessions[sessionId].peerConnection;
  }

  sendMessage(sessionId: number, msgPacked: string) {
    if (this.sessionExists(sessionId) == false) {
      console.error("session with id: " + sessionId + " doesn't exist!");
      return;
    }
    const channel = this.sessions[sessionId].messagingChannel;
    if (!channel) {
      console.error("can't send message, messaging channel is not defined!");
      return;
    }
    if (channel.readyState != "open") {
      console.error("can't send message, channel is not open");
      return;
    }
    console.log("sending packed msg: ", msgPacked)
    this.sessions[sessionId].messagingChannel.send(msgPacked);
    // TODO: make an event about the sent message, so that the chat manager could update the message status
  }

  sendData(targetId: number, data: any): void {
    console.warn("unimplemented");
  }

  // used by createOffer and acceptRemoteOfferAndCreateAnswer
  // can be awaited to get offer/answer with ice candidates included
  promiseLocalDescriptionWithIceCandidates = (connection: RTCPeerConnection) =>
    new Promise<string>(resolve =>
      connection.onicecandidate = event => {
        if (!event.candidate) {
          resolve(JSON.stringify(connection.localDescription));
        }
      }
    )

  async createOffer(sessionId: number): Promise<string> {
    if (this.sessionExists(sessionId) == false) {
      console.error("session with id: " + sessionId + " doesn't exist!");
      return undefined;
    }
    const connection = this.sessions[sessionId].peerConnection;
    const channel = connection.createDataChannel('messaging-channel');
    console.log("created messsaging channel for session #" + sessionId);
    this.setMessagingChannel(sessionId, channel);
    const localOffer = await connection.createOffer();
    await connection.setLocalDescription(localOffer); // TODO: handle errors

    const offerInJson: string = await this.promiseLocalDescriptionWithIceCandidates(connection);
    console.log("created local offer (with ice candidates) for session #" + sessionId);
    return offerInJson;
  }

  async acceptRemoteOfferAndCreateAnswer(remoteOfferStr: string, sessionId: number): Promise<string> {
    if (this.sessionExists(sessionId) == false) {
      console.error("session with id: " + sessionId + " doesn't exist!");
      return undefined;
    }
    const connection = this.sessions[sessionId].peerConnection;
    let remoteOffer: RTCSessionDescriptionInit;
    try {
      remoteOffer = JSON.parse(remoteOfferStr);
    } catch (e) {
      console.log("parsing offer json failed: ", e);
      return undefined;
    }
    // accept remote offer
    await connection.setRemoteDescription(remoteOffer);
    // create an answer
    const localAnswer = await connection.createAnswer();
    await connection.setLocalDescription(localAnswer); // TODO: handle errors

    const answerInJson: string = await this.promiseLocalDescriptionWithIceCandidates(connection);
    console.log("accepted remote offer and created local answer (with ice candidates) for session #" + sessionId);
    return answerInJson;
  }

  async acceptAnswer(remoteAnswerStr: string, sessionId: number) {
    if (this.sessionExists(sessionId) == false) {
      console.error("session with id: " + sessionId + " doesn't exist!");
      return;
    }
    const connection = this.sessions[sessionId].peerConnection;
    if (connection.signalingState == "stable") {
      console.log("no need to accept remote answer, state is already 'stable'");
      return;
    }
    const remoteAnswer = JSON.parse(remoteAnswerStr);
    await connection.setRemoteDescription(remoteAnswer);
    console.log("accepted remote answer for session #" + sessionId);
  }

  createNewSession(): number {
    let sessionId = this.genSessionId();
    const connection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    this.sessions[sessionId] = { peerConnection: undefined, messagingChannel: undefined };
    this.setPeerConnection(sessionId, connection);
    console.log("created session #" + sessionId);
    return sessionId;
  }

  private setPeerConnection(sessionId: number, connection: RTCPeerConnection): void {
    if (this.sessionExists(sessionId) == false) {
      console.error("session with id: " + sessionId + " doesn't exist!");
      return;
    }
    if (this.sessions[sessionId].peerConnection) {
      console.warn("peer connection already exists for session #" + sessionId + ", overriding...");
    }
    this.sessions[sessionId].peerConnection = connection;
    console.log("set a peer connection for session #" + sessionId);

    // peer connection event handlers
    connection.onconnectionstatechange = event => console.log("Session #" + sessionId + " State:", connection.connectionState);
    connection.oniceconnectionstatechange = event => console.log("Session #" + sessionId + " Ice Connection State: ", connection.iceConnectionState);
    connection.ondatachannel = event => {
      const channel = event.channel;
      console.log("received a messsaging channel for session #" + sessionId);
      this.setMessagingChannel(sessionId, channel);
    };
  }

  private setMessagingChannel(sessionId: number, channel: RTCDataChannel): void {
    if (this.sessionExists(sessionId) == false) {
      console.error("session with id: " + sessionId + " doesn't exist!");
      return;
    }
    if (this.sessions[sessionId].messagingChannel) {
      console.warn("messaging channel already exists for session #" + sessionId + ", overriding...");
    }
    this.sessions[sessionId].messagingChannel = channel;
    console.log("set a messsaging channel for session #" + sessionId);

    // channel event handlers
    channel.onopen = event => {
      console.log("Session #" + sessionId + " channel onpen event - ready state is now: " + channel.readyState);
    };
    channel.onclose = event => {
      console.log("Session #" + sessionId + " channel.onclose event:", event);
    };
    channel.onerror = event => {
      console.log("Session #" + sessionId + " channel.onerror event:", event);
    }
    channel.onmessage = event => {
      const msgPacked: string = event.data;
      console.log("Session #" + sessionId + " received new msg:", msgPacked + ". dispatching event...");
      this.notifyIncomingMessageToSubscribers(sessionId, msgPacked);
      // TODO: send receive confirmation to sender
    };
  }

  private genSessionId(): number {
    let id = this.genRandomId();
    while (this.sessionExists(id)) {
      id = this.genRandomId();
    }
    return id;
  }

  private genRandomId(): number {
    // TODO: improve
    return Math.floor(Math.random() * 1000000000);
  }

  private sessionExists(sessionId: number): boolean {
    return sessionId in this.sessions;
  }

}

interface SubspaceSession {
  peerConnection: RTCPeerConnection;
  messagingChannel: RTCDataChannel;
}
