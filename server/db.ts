import { MongoClient, Collection, Db } from 'mongodb';
import { User, Tileset, Map } from '@shared/schema';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://FantasyMapApp:xtBuJkRDn1UAsbkM@cluster0.lzyuyuq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = 'FantasyMapApp';

// MongoDB connection
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient, db: Db }> {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  
  const db = client.db(DB_NAME);
  
  // Cache the connection
  cachedClient = client;
  cachedDb = db;
  
  console.log("Connected to MongoDB");
  
  return { client, db };
}

// Collections
export async function getUsersCollection(): Promise<Collection<User>> {
  const { db } = await connectToDatabase();
  return db.collection<User>('users');
}

export async function getTilesetsCollection(): Promise<Collection<Tileset>> {
  const { db } = await connectToDatabase();
  return db.collection<Tileset>('tilesets');
}

export async function getMapsCollection(): Promise<Collection<Map>> {
  const { db } = await connectToDatabase();
  return db.collection<Map>('maps');
}