// 役割: アプリの全部の部品（コントローラーなど）をまとめる設計図。
// Laravelなら: config/app.php や Provider に近い役割

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}
