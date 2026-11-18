import { Server, Socket } from 'socket.io';
import { RoomManager } from '../services/roomManager.js';
import { TimerService } from '../services/timerService.js';
import { env } from '../config/env.js';
import { GameRegistry } from '../games/index.js';
import { cleanupSocketRateLimit } from './middleware.js';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from '@feto-games/shared-types';

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export const registerConnectionHandlers = (io: TypedServer, socket: TypedSocket) => {
  socket.on('disconnecting', async (reason: string) => {
    const { playerId, roomCode, username } = socket.data;

    cleanupSocketRateLimit(socket.id);

    if (!playerId || !roomCode) {
      return;
    }

    console.log(
      `🔌 [Socket Disconnecting] Player ${username || playerId} (${socket.id}) disconnected from ${roomCode}. Reason: ${reason}`
    );

    try {
      // Initiate 45-second grace period in Redis
      const result = await RoomManager.handlePlayerDisconnect(playerId, roomCode);
      if (!result) return;

      const { room, graceExpiresAt } = result;

      // Notify active game engine of player disconnect
      const engine = GameRegistry.get(room.config.gameMode);
      if (engine && room.status === 'in_game') {
        await engine.handlePlayerDisconnect(room, playerId, io);
      }

      // Broadcast disconnection status to remaining players in the room
      io.to(roomCode).emit('room:player-disconnected', {
        playerId,
        username: username || 'Player',
        gracePeriodSeconds: env.GRACE_PERIOD_SECONDS,
        graceExpiresAt
      });

      io.to(roomCode).emit('room:state', RoomManager.toPublicState(room));

      // Start 45-second authoritative grace timer
      TimerService.startGracePeriod(
        roomCode,
        playerId,
        env.GRACE_PERIOD_SECONDS,
        async () => {
          // Grace period expired without reconnection - purge player
          console.log(`⏱️ [Grace Expired] Removing player ${playerId} from room ${roomCode}`);

          const { room: updatedRoom, removedPlayer, newHostId } = await RoomManager.removePlayer(
            playerId,
            roomCode
          );

          if (removedPlayer) {
            io.to(roomCode).emit('room:player-left', {
              playerId: removedPlayer.id,
              username: removedPlayer.username,
              newHostId: newHostId || undefined
            });
          }

          if (updatedRoom) {
            if (newHostId) {
              const newHost = updatedRoom.players[newHostId];
              if (newHost) {
                console.log(`👑 [Host Migration] Room ${roomCode} new host is ${newHost.username}`);
                io.to(roomCode).emit('room:host-migrated', {
                  newHostId: newHost.id,
                  previousHostId: playerId,
                  newHostUsername: newHost.username
                });
              }
            }
            io.to(roomCode).emit('room:state', RoomManager.toPublicState(updatedRoom));
          } else {
            console.log(`🧹 [Room Cleaned] Room ${roomCode} is now empty and was destroyed.`);
            engine?.destroyGame(roomCode);
            TimerService.clearAllForRoom(roomCode);
          }
        }
      );
    } catch (err) {
      console.error(`❌ Error handling player disconnect for ${playerId}:`, err);
    }
  });

  socket.on('disconnect', () => {
    // Final cleanup
  });
};
