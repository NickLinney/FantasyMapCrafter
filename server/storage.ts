import { 
  users, type User, type InsertUser,
  tilesets, type Tileset, type InsertTileset,
  maps, type Map, type InsertMap
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tileset methods
  getTilesets(): Promise<Tileset[]>;
  getTilesetsByUserId(userId: number): Promise<Tileset[]>;
  getTileset(id: number): Promise<Tileset | undefined>;
  createTileset(tileset: InsertTileset): Promise<Tileset>;
  deleteTileset(id: number): Promise<boolean>;
  
  // Map methods
  getMaps(): Promise<Map[]>;
  getMapsByUserId(userId: number): Promise<Map[]>;
  getMap(id: number): Promise<Map | undefined>;
  createMap(map: InsertMap): Promise<Map>;
  updateMap(id: number, map: Partial<InsertMap>): Promise<Map | undefined>;
  deleteMap(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tilesets: Map<number, Tileset>;
  private maps: Map<number, Map>;
  private userCurrentId: number;
  private tilesetCurrentId: number;
  private mapCurrentId: number;

  constructor() {
    this.users = new Map();
    this.tilesets = new Map();
    this.maps = new Map();
    this.userCurrentId = 1;
    this.tilesetCurrentId = 1;
    this.mapCurrentId = 1;
    
    // Initialize with default tilesets
    this.createTileset({
      name: "Overland Tiles 1",
      userId: null,
      imageUrl: "/api/tilesets/overland1.png",
      tileWidth: 16,
      tileHeight: 16,
      gridWidth: 16,
      gridHeight: 16
    });
    
    this.createTileset({
      name: "Overland Tiles 2",
      userId: null,
      imageUrl: "/api/tilesets/overland2.png",
      tileWidth: 16,
      tileHeight: 16,
      gridWidth: 16,
      gridHeight: 16
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Tileset methods
  async getTilesets(): Promise<Tileset[]> {
    return Array.from(this.tilesets.values());
  }
  
  async getTilesetsByUserId(userId: number): Promise<Tileset[]> {
    return Array.from(this.tilesets.values())
      .filter(tileset => tileset.userId === userId || tileset.userId === null);
  }
  
  async getTileset(id: number): Promise<Tileset | undefined> {
    return this.tilesets.get(id);
  }
  
  async createTileset(insertTileset: InsertTileset): Promise<Tileset> {
    const id = this.tilesetCurrentId++;
    const tileset: Tileset = { ...insertTileset, id };
    this.tilesets.set(id, tileset);
    return tileset;
  }
  
  async deleteTileset(id: number): Promise<boolean> {
    return this.tilesets.delete(id);
  }
  
  // Map methods
  async getMaps(): Promise<Map[]> {
    return Array.from(this.maps.values());
  }
  
  async getMapsByUserId(userId: number): Promise<Map[]> {
    return Array.from(this.maps.values())
      .filter(map => map.userId === userId);
  }
  
  async getMap(id: number): Promise<Map | undefined> {
    return this.maps.get(id);
  }
  
  async createMap(insertMap: InsertMap): Promise<Map> {
    const id = this.mapCurrentId++;
    const map: Map = { ...insertMap, id };
    this.maps.set(id, map);
    return map;
  }
  
  async updateMap(id: number, mapUpdate: Partial<InsertMap>): Promise<Map | undefined> {
    const map = this.maps.get(id);
    if (!map) {
      return undefined;
    }
    
    const updatedMap = { ...map, ...mapUpdate };
    this.maps.set(id, updatedMap);
    return updatedMap;
  }
  
  async deleteMap(id: number): Promise<boolean> {
    return this.maps.delete(id);
  }
}

export const storage = new MemStorage();
