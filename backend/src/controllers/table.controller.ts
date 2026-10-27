/*import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { query } from '../lib/db';

let tableSchemaEnsured = false;
let tableSchemaEnsuringPromise: Promise<void> | null = null;

const ensureTableSchema = async () => {
  if (tableSchemaEnsured) return;
  if (tableSchemaEnsuringPromise) return tableSchemaEnsuringPromise;

  tableSchemaEnsuringPromise = (async () => {
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
      await query(`CREATE INDEX IF NOT EXISTS "idx_table_restaurant" ON "Table"("restaurantId", "tableNumber" ASC);`).catch(() => {});
      tableSchemaEnsured = true;
    } catch (err) {
      // schema already valid
    } finally {
      tableSchemaEnsuringPromise = null;
    }
  })();

  return tableSchemaEnsuringPromise;
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
};*/




import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { query } from '../lib/db';

let tableSchemaEnsured = false;
let tableSchemaEnsuringPromise: Promise<void> | null = null;

const ensureTableSchema = async () => {
  if (tableSchemaEnsured) return;
  if (tableSchemaEnsuringPromise) return tableSchemaEnsuringPromise;

  tableSchemaEnsuringPromise = (async () => {
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
      await query(`CREATE INDEX IF NOT EXISTS "idx_table_restaurant" ON "Table"("restaurantId", "tableNumber" ASC);`).catch(() => {});
      tableSchemaEnsured = true;
    } catch (err) {
      // schema already valid
    } finally {
      tableSchemaEnsuringPromise = null;
    }
  })();

  return tableSchemaEnsuringPromise;
};

// ───────────────────────── Automatic table status ─────────────────────────
// A table is OCCUPIED while at least one guest at that table has an open bill
// (an order that is not rejected and whose final bill has not been closed yet).
// It becomes FREE again when the last open bill at that table is closed or rejected.

// An open bill older than this is ignored (same window that is used to merge orders into one bill)
const OPEN_BILL_WINDOW = `INTERVAL '6 hours'`;
const UTC_NOW = `(NOW() AT TIME ZONE 'UTC')`;

// "1", "01" and "001" are the same table; names like "A1" and "a1" are the same too
export const normalizeTable = (value: unknown): string => {
  const t = String(value ?? '').trim().replace(/^Table\s*#?/i, '');
  return (/^\d{1,9}$/.test(t) ? String(parseInt(t, 10)) : t).toLowerCase();
};

// Same normalization, done inside SQL
const normSql = (col: string) =>
  `LOWER(CASE WHEN TRIM(${col}) ~ '^[0-9]{1,9}$' THEN (TRIM(${col})::bigint)::text ELSE TRIM(${col}) END)`;

// Recalculates one table from its orders. Safe to call at any time and never throws,
// so it can never break placing an order or closing a bill.
export const syncTableOccupancy = async (restaurantId: string, tableNumber: string): Promise<void> => {
  try {
    const norm = normalizeTable(tableNumber);
    if (!restaurantId || !norm) return;

    const open = await query(
      `SELECT 1 FROM "Order" o
        WHERE o."restaurantId" = $1
          AND o."billedAt" IS NULL
          AND o.status <> 'REJECTED'
          AND ${normSql('o."tableNumber"')} = $2
          AND o."updatedAt" > ${UTC_NOW} - ${OPEN_BILL_WINDOW}
        LIMIT 1;`,
      [restaurantId, norm]
    );

    const occupied = open.rows.length > 0;
    const status = occupied ? 'OCCUPIED' : 'FREE';

    await query(
      `UPDATE "Table"
          SET "status" = $3, "isOccupied" = $4, "updatedAt" = NOW()
        WHERE "restaurantId" = $1
          AND ${normSql('"tableNumber"')} = $2
          AND "status" IS DISTINCT FROM $3;`,
      [restaurantId, norm, status, occupied]
    );
  } catch (error) {
    console.error('syncTableOccupancy error:', error);
  }
};

const toTable = (row: any) => ({
  id: row.id,
  number: row.tableNumber,
  capacity: row.capacity || 4,
  status: row.status || (row.isOccupied ? 'OCCUPIED' : 'FREE'),
  restaurantId: row.restaurantId,
  createdAt: row.createdAt,
});

export const getTables = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    await ensureTableSchema();

    // Self-heal: any table that has an open bill is shown as occupied
    // (covers orders placed before this feature existed)
    await query(
      `UPDATE "Table" t
          SET "status" = 'OCCUPIED', "isOccupied" = true, "updatedAt" = NOW()
        WHERE t."restaurantId" = $1
          AND t."status" IS DISTINCT FROM 'OCCUPIED'
          AND EXISTS (
            SELECT 1 FROM "Order" o
             WHERE o."restaurantId" = t."restaurantId"
               AND o."billedAt" IS NULL
               AND o.status <> 'REJECTED'
               AND ${normSql('o."tableNumber"')} = ${normSql('t."tableNumber"')}
               AND o."updatedAt" > ${UTC_NOW} - ${OPEN_BILL_WINDOW}
          );`,
      [restaurantId]
    ).catch(err => console.error('getTables self-heal error:', err));

    const result = await query(
      `SELECT t.*,
              (SELECT COUNT(*)::int FROM "Order" o
                WHERE o."restaurantId" = t."restaurantId"
                  AND o."billedAt" IS NULL
                  AND o.status <> 'REJECTED'
                  AND ${normSql('o."tableNumber"')} = ${normSql('t."tableNumber"')}
                  AND o."updatedAt" > ${UTC_NOW} - ${OPEN_BILL_WINDOW}) AS "openBills"
         FROM "Table" t
        WHERE t."restaurantId" = $1
        ORDER BY t."tableNumber" ASC;`,
      [restaurantId]
    );

    const tables = result.rows.map(row => ({
      ...toTable(row),
      openBills: Number(row.openBills) || 0, // guests at this table who have not paid yet
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

    // If guests are already ordering at this table number, mark it occupied right away
    await syncTableOccupancy(restaurantId, cleanNumber);

    const fresh = await query(`SELECT * FROM "Table" WHERE "id" = $1;`, [tableId]);
    const row = fresh.rows[0] || result.rows[0];

    res.status(201).json({
      table: toTable(row),
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

// Manual override from the Tables page. The status is recalculated automatically
// the next time an order is placed or a bill is closed at that table.
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

    res.json({ table: toTable(result.rows[0]) });
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