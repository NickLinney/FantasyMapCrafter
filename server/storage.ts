import { 
  type User, type InsertUser,
  type Tileset, type InsertTileset,
  type Map, type InsertMap
} from "@shared/schema";
import { getUsersCollection, getTilesetsCollection, getMapsCollection } from './db';
import { ObjectId } from 'mongodb';
import session from 'express-session';
import connectMongo from 'connect-mongo';

// Create MongoDB session store
const MongoStore = connectMongo;

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
  
  // Session store
  sessionStore: session.Store;
}

export class MongoDBStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Setup MongoDB session store
    const mongoUrl = process.env.MONGODB_URI || "mongodb+srv://FantasyMapApp:xtBuJkRDn1UAsbkM@cluster0.lzyuyuq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    this.sessionStore = MongoStore.create({
      mongoUrl,
      collectionName: 'sessions',
      ttl: 14 * 24 * 60 * 60, // 14 days
    });
    
    // Initialize default tilesets if they don't exist
    this.initializeTilesets();
  }
  
  private async initializeTilesets() {
    try {
      const tilesetsCollection = await getTilesetsCollection();
      const count = await tilesetsCollection.countDocuments();
      
      if (count === 0) {
        // Add default tilesets
        await tilesetsCollection.insertMany([
          {
            name: "Overland Tiles 1",
            userId: null,
            imageUrl: "/api/tilesets/overland1.png",
            tileWidth: 16,
            tileHeight: 16,
            gridWidth: 16,
            gridHeight: 16,
            id: 1
          },
          {
            name: "Overland Tiles 2",
            userId: null,
            imageUrl: "/api/tilesets/overland2.png",
            tileWidth: 16,
            tileHeight: 16,
            gridWidth: 16,
            gridHeight: 16,
            id: 2
          }
        ]);
        console.log("Default tilesets initialized");
      }
    } catch (error) {
      console.error("Failed to initialize tilesets:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ id });
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({ username });
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const usersCollection = await getUsersCollection();
    
    // Find the highest id to generate the next id
    const highestUser = await usersCollection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = highestUser.length > 0 ? highestUser[0].id + 1 : 1;
    
    const user: User = { ...insertUser, id: nextId };
    await usersCollection.insertOne(user);
    return user;
  }
  
  // Tileset methods
  async getTilesets(): Promise<Tileset[]> {
    const tilesetsCollection = await getTilesetsCollection();
    return tilesetsCollection.find().toArray();
  }
  
  async getTilesetsByUserId(userId: number): Promise<Tileset[]> {
    const tilesetsCollection = await getTilesetsCollection();
    return tilesetsCollection
      .find({ $or: [{ userId }, { userId: null }] })
      .toArray();
  }
  
  async getTileset(id: number): Promise<Tileset | undefined> {
    const tilesetsCollection = await getTilesetsCollection();
    const tileset = await tilesetsCollection.findOne({ id });
    return tileset || undefined;
  }
  
  async createTileset(insertTileset: InsertTileset): Promise<Tileset> {
    const tilesetsCollection = await getTilesetsCollection();
    
    // Find the highest id to generate the next id
    const highestTileset = await tilesetsCollection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = highestTileset.length > 0 ? highestTileset[0].id + 1 : 1;
    
    // Ensure userId is either a number or null (not undefined)
    const tilesetWithId: Tileset = {
      ...insertTileset,
      userId: insertTileset.userId ?? null,
      id: nextId
    };
    await tilesetsCollection.insertOne(tilesetWithId);
    return tilesetWithId;
  }
  
  async deleteTileset(id: number): Promise<boolean> {
    const tilesetsCollection = await getTilesetsCollection();
    const result = await tilesetsCollection.deleteOne({ id });
    return result.deletedCount === 1;
  }
  
  // Map methods
  async getMaps(): Promise<Map[]> {
    const mapsCollection = await getMapsCollection();
    return mapsCollection.find().toArray();
  }
  
  async getMapsByUserId(userId: number): Promise<Map[]> {
    const mapsCollection = await getMapsCollection();
    return mapsCollection.find({ userId }).toArray();
  }
  
  async getMap(id: number): Promise<Map | undefined> {
    const mapsCollection = await getMapsCollection();
    const map = await mapsCollection.findOne({ id });
    return map || undefined;
  }
  
  async createMap(insertMap: InsertMap): Promise<Map> {
    const mapsCollection = await getMapsCollection();
    
    // Find the highest id to generate the next id
    const highestMap = await mapsCollection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = highestMap.length > 0 ? highestMap[0].id + 1 : 1;
    
    // Ensure userId and description are not undefined
    const mapWithId: Map = {
      ...insertMap,
      userId: insertMap.userId ?? null,
      description: insertMap.description ?? null,
      id: nextId
    };
    await mapsCollection.insertOne(mapWithId);
    return mapWithId;
  }
  
  async updateMap(id: number, mapUpdate: Partial<InsertMap>): Promise<Map | undefined> {
    const mapsCollection = await getMapsCollection();
    
    const existingMap = await mapsCollection.findOne({ id });
    if (!existingMap) return undefined;
    
    await mapsCollection.updateOne({ id }, { $set: mapUpdate });
    const updatedMap = await mapsCollection.findOne({ id });
    
    return updatedMap || undefined;
  }
  
  async deleteMap(id: number): Promise<boolean> {
    const mapsCollection = await getMapsCollection();
    const result = await mapsCollection.deleteOne({ id });
    return result.deletedCount === 1;
  }
}

export const storage = new MongoDBStorage();
