import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { query } from '../lib/db';

const ensureTableSchema = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS "Table" (
        "id" TEXT PRIMARY KEY,
        "tableNumber" TEXT NOT NULL,
        "qrCodeUrl" TEXT,
        "isOccupied" BOOLEAN NOT NULL DEFAULT false,
        "status" TEXT NOT NULL DEFAULT 'FREE',
        "capacity" INT NOT NULL DEFAULT 4,
        "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await query(`ALTER TABLE "Table" ADD COLUMN IF NOT EXISTS "capacity" INT DEFAULT 4;`).catch(() => {});
    await query(`ALTER TABLE "Table" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'FREE';`).catch(() => {});
    await query(`ALTER TABLE "Table" ADD COLUMN IF NOT EXISTS "isOccupied" BOOLEAN DEFAULT false;`).catch(() => {});
  } catch (err) {
    // schema already valid
  }
};

export const getTables = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    await ensureTableSchema();

    const result = await query(
      `SELECT * FROM "Table" WHERE "restaurantId" = $1 ORDER BY "tableNumber" ASC;`,
      [restaurantId]
    );

    const tables = result.rows.map(row => ({
      id: row.id,
      number: row.tableNumber,
      capacity: row.capacity || 4,
      status: row.status || (row.isOccupied ? 'OCCUPIED' : 'FREE'),
      restaurantId: row.restaurantId,
      createdAt: row.createdAt
    }));

    res.json({ tables });
  } catch (error) {
    console.error('getTables error:', error);
    res.status(500).json({ message: 'Failed to fetch tables' });
  }
};

export const createTable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { tableNumber, number, capacity } = req.body;
    const cleanNumber = String(tableNumber || number || '').trim();

    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    if (!cleanNumber) {
      res.status(400).json({ message: 'Table number is required' });
      return;
    }

    await ensureTableSchema();

    const tableId = 'tbl-' + Math.random().toString(36).substring(2, 9);
    const parsedCapacity = Number(capacity) || 4;

    const result = await query(
      `INSERT INTO "Table" ("id", "tableNumber", "capacity", "status", "isOccupied", "restaurantId")
       VALUES ($1, $2, $3, 'FREE', false, $4)
       RETURNING *;`,
      [tableId, cleanNumber, parsedCapacity, restaurantId]
    );

    const row = result.rows[0];
    res.status(201).json({
      table: {
        id: row.id,
        number: row.tableNumber,
        capacity: row.capacity || 4,
        status: row.status || 'FREE',
        restaurantId: row.restaurantId,
      },
      message: `Table ${cleanNumber} created successfully`
    });
  } catch (error) {
    console.error('createTable error:', error);
    res.status(500).json({ message: 'Failed to create table' });
  }
};

export const batchCreateTables = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { count = 5, prefix = '' } = req.body;
    const total = Math.min(Math.max(1, Number(count) || 5), 50);

    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    await ensureTableSchema();

    const existing = await query(
      `SELECT "tableNumber" FROM "Table" WHERE "restaurantId" = $1;`,
      [restaurantId]
    );
    const existingSet = new Set(existing.rows.map(r => r.tableNumber));

    const created = [];
    for (let i = 1; i <= total; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      const fullNum = prefix ? `${prefix}${numStr}` : numStr;
      if (!existingSet.has(fullNum)) {
        const tableId = 'tbl-' + Math.random().toString(36).substring(2, 9);
        await query(
          `INSERT INTO "Table" ("id", "tableNumber", "capacity", "status", "isOccupied", "restaurantId")
           VALUES ($1, $2, 4, 'FREE', false, $3);`,
          [tableId, fullNum, restaurantId]
        );
        created.push({ id: tableId, number: fullNum, capacity: 4, status: 'FREE' });
      }
    }

    res.status(201).json({
      message: `Created ${created.length} table(s)`,
      tables: created
    });
  } catch (error) {
    console.error('batchCreateTables error:', error);
    res.status(500).json({ message: 'Failed to batch create tables' });
  }
};

export const updateTableStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params;
    const { status, capacity } = req.body;

    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    await ensureTableSchema();

    const isOccupied = status === 'OCCUPIED';

    const result = await query(
      `UPDATE "Table"
       SET "status" = COALESCE($1, "status"),
           "isOccupied" = COALESCE($2, "isOccupied"),
           "capacity" = COALESCE($3, "capacity"),
           "updatedAt" = NOW()
       WHERE "id" = $4 AND "restaurantId" = $5
       RETURNING *;`,
      [status || null, status ? isOccupied : null, capacity ? Number(capacity) : null, id, restaurantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Table not found for this restaurant' });
      return;
    }

    const row = result.rows[0];
    res.json({
      table: {
        id: row.id,
        number: row.tableNumber,
        capacity: row.capacity || 4,
        status: row.status || (row.isOccupied ? 'OCCUPIED' : 'FREE'),
        restaurantId: row.restaurantId,
      }
    });
  } catch (error) {
    console.error('updateTableStatus error:', error);
    res.status(500).json({ message: 'Failed to update table' });
  }
};

export const deleteTable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params;

    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    const result = await query(
      `DELETE FROM "Table" WHERE "id" = $1 AND "restaurantId" = $2 RETURNING id;`,
      [id, restaurantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Table not found for this restaurant' });
      return;
    }

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('deleteTable error:', error);
    res.status(500).json({ message: 'Failed to delete table' });
  }
};
