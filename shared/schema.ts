import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const tilesets = pgTable("tilesets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id),
  imageUrl: text("image_url").notNull(),
  tileWidth: integer("tile_width").notNull(),
  tileHeight: integer("tile_height").notNull(),
  gridWidth: integer("grid_width").notNull(),
  gridHeight: integer("grid_height").notNull(),
});

export const insertTilesetSchema = createInsertSchema(tilesets).pick({
  name: true,
  userId: true,
  imageUrl: true,
  tileWidth: true,
  tileHeight: true,
  gridWidth: true,
  gridHeight: true,
});

export type InsertTileset = z.infer<typeof insertTilesetSchema>;
export type Tileset = typeof tilesets.$inferSelect;

export const maps = pgTable("maps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  tileSize: integer("tile_size").notNull(),
  mapType: text("map_type").notNull(), // "grid" or "hex"
  layers: jsonb("layers").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertMapSchema = createInsertSchema(maps).pick({
  name: true,
  description: true,
  userId: true,
  width: true,
  height: true,
  tileSize: true,
  mapType: true,
  layers: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMap = z.infer<typeof insertMapSchema>;
export type Map = typeof maps.$inferSelect;

// Types for in-memory use that don't need to be in DB schema
export type Layer = {
  id: string;
  name: string;
  visible: boolean;
  tiles: (string | null)[][];  // 2D array of tile IDs or null for empty
};

export type TilePosition = {
  tilesetId: number;
  x: number; 
  y: number;
};

export type DrawingTool = 'smallBrush' | 'largeBrush' | 'fill' | 'eraser';

export type MapSize = {
  width: number;
  height: number;
};
