// 1. OnGatewayConnection を追加で読み込む
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  OnGatewayConnection, // 🌟 これを追加！
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

// 2. 「implements OnGatewayConnection」を書き足す
@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection {
  private prisma = new PrismaClient();

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: any) {
    console.log('誰かが接続しました！過去のデータを送ります。');

    const messages = await this.prisma.chat.findMany({
      orderBy: { createdAt: 'asc' },
    });

    client.emit('init_messages', messages);
  }

  @SubscribeMessage('send_message')
  async handleMessage(@MessageBody() data: { name: string; text: string }) {
    console.log('届いたデータ:', data);

    await this.prisma.chat.create({
      data: {
        name: data.name,
        text: data.text,
      },
    });

    this.server.emit('new_message', data);
  }
}
