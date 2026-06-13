import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async getMessageThreads(userId: number) {
    // Get all messages involving this user, sorted by most recent
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { recipientId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by thread (unique conversation partners)
    const threadMap = new Map();
    messages.forEach(msg => {
      const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      const key = `thread-${partnerId}`;
      if (!threadMap.has(key)) {
        threadMap.set(key, {
          partnerId,
          partnerName: msg.senderId === userId ? msg.recipient.name : msg.sender.name,
          partnerEmail: msg.senderId === userId ? msg.recipient.email : msg.sender.email,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
        });
      }
    });

    return Array.from(threadMap.values());
  }

  async getThreadWithUser(userId: number, otherUserId: number) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  }

  async sendMessage(senderId: number, recipientId: number, content: string) {
    const message = await this.prisma.message.create({
      data: {
        senderId,
        recipientId,
        content,
        room: `${Math.min(senderId, recipientId)}-${Math.max(senderId, recipientId)}`,
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
    });

    return message;
  }

  async markAsRead(messageId: number) {
    const message = await this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
      include: {
        sender: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } },
      },
    });

    return message;
  }

  async getUnreadCount(userId: number) {
    const unreadCount = await this.prisma.message.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    return unreadCount;
  }
}
