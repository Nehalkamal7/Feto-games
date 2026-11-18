import { Router, Request, Response } from 'express';
import { RoomManager } from '../services/roomManager.js';

export const roomRouter = Router();

/**
 * GET /api/rooms/public
 * Returns active public rooms for matchmaking lobby
 */
roomRouter.get('/public', async (_req: Request, res: Response) => {
  try {
    const rooms = await RoomManager.listPublicRooms();
    res.json({
      success: true,
      data: rooms
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { message: err.message || 'Failed to fetch public rooms.' }
    });
  }
});

/**
 * GET /api/rooms/:code
 * Inspects a room by its 6-character code (for invite link preview / validation)
 */
roomRouter.get('/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawCode = req.params.code;
    const code = (typeof rawCode === 'string' ? rawCode : '')?.toUpperCase().trim();
    if (!code) {
      res.status(400).json({
        success: false,
        error: { message: 'Missing room code parameter.' }
      });
      return;
    }

    const room = await RoomManager.getRoom(code);
    if (!room) {
      res.status(404).json({
        success: false,
        error: { code: 'ROOM_NOT_FOUND', message: 'Room not found or expired.' }
      });
      return;
    }

    const publicState = RoomManager.toPublicState(room);

    res.json({
      success: true,
      data: {
        code: publicState.code,
        status: publicState.status,
        playerCount: publicState.playerCount,
        maxPlayers: publicState.config.maxPlayers,
        hasPin: publicState.config.hasPin,
        gameMode: publicState.config.gameMode,
        allowSpectators: publicState.config.allowSpectators
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { message: err.message || 'Failed to inspect room.' }
    });
  }
});
