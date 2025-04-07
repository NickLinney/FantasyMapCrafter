import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMapSchema, insertTilesetSchema } from "@shared/schema";
import fs from "fs";
import path from "path";
import multer from "multer";
import { setupAuth } from "./auth";

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized: You must be logged in" });
}

// Configure storage for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(import.meta.dirname, "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  })
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  // Serve the default tilesets
  app.get("/api/tilesets/overland1.png", (req: Request, res: Response) => {
    const imagePath = path.join(import.meta.dirname, "..", "attached_assets", "image_1743982934053.png");
    res.sendFile(imagePath);
  });

  app.get("/api/tilesets/overland2.png", (req: Request, res: Response) => {
    const imagePath = path.join(import.meta.dirname, "..", "attached_assets", "image_1743983374287.png");
    res.sendFile(imagePath);
  });

  // Get all tilesets
  app.get("/api/tilesets", async (req: Request, res: Response) => {
    try {
      // If user is authenticated, return tilesets owned by the user
      // plus public tilesets not owned by the user
      if (req.isAuthenticated()) {
        const userId = req.user!.id;
        const tilesets = await storage.getTilesetsByUserId(userId);
        res.json(tilesets);
      } else {
        // If not authenticated, return only public tilesets
        const tilesets = await storage.getPublicTilesets();
        res.json(tilesets);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tilesets" });
    }
  });
  
  // Get public tilesets
  app.get("/api/tilesets/public", async (req: Request, res: Response) => {
    try {
      const tilesets = await storage.getPublicTilesets();
      res.json(tilesets);
    } catch (error) {
      console.error("Error fetching public tilesets:", error);
      res.status(500).json({ message: "Failed to fetch public tilesets" });
    }
  });
  
  // Get user's tileset collection
  app.get("/api/tilesets/collection", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const tilesets = await storage.getUserTilesetCollection(userId);
      res.json(tilesets);
    } catch (error) {
      console.error("Error fetching user's tileset collection:", error);
      res.status(500).json({ message: "Failed to fetch tileset collection" });
    }
  });

  // Get tileset by ID
  app.get("/api/tilesets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const tileset = await storage.getTileset(id);
      
      if (!tileset) {
        return res.status(404).json({ message: "Tileset not found" });
      }
      
      res.json(tileset);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tileset" });
    }
  });

  // Upload a new tileset - protected route
  app.post("/api/tilesets", isAuthenticated, upload.single("image"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const tilesetData = {
        ...req.body,
        imageUrl: `/api/uploads/${req.file.filename}`,
        tileWidth: parseInt(req.body.tileWidth),
        tileHeight: parseInt(req.body.tileHeight),
        gridWidth: parseInt(req.body.gridWidth),
        gridHeight: parseInt(req.body.gridHeight),
        userId: req.user?.id, // Set userId from authenticated user
        isPublic: req.body.isPublic === "true"
      };
      
      const parsedData = insertTilesetSchema.safeParse(tilesetData);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid tileset data", errors: parsedData.error });
      }
      
      const tileset = await storage.createTileset(parsedData.data);
      res.status(201).json(tileset);
    } catch (error) {
      console.error("Error uploading tileset:", error);
      res.status(500).json({ message: "Failed to upload tileset" });
    }
  });
  
  // Update a tileset
  app.put("/api/tilesets/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if tileset belongs to the current user
      const existingTileset = await storage.getTileset(id);
      if (!existingTileset) {
        return res.status(404).json({ message: "Tileset not found" });
      }
      
      // Only allow users to update their own tilesets
      if (existingTileset.userId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: You can only update your own tilesets" });
      }
      
      const updateData = {
        ...req.body,
        isPublic: req.body.isPublic === "true" ? true : (req.body.isPublic === "false" ? false : undefined)
      };
      
      const updatedTileset = await storage.updateTileset(id, updateData);
      res.json(updatedTileset);
    } catch (error) {
      console.error("Error updating tileset:", error);
      res.status(500).json({ message: "Failed to update tileset" });
    }
  });
  
  // Add a tileset to user's collection
  app.post("/api/tilesets/collection/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const tilesetId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if tileset exists
      const tileset = await storage.getTileset(tilesetId);
      if (!tileset) {
        return res.status(404).json({ message: "Tileset not found" });
      }
      
      // Check if it's already in the user's collection
      const isInCollection = await storage.isInCollection(userId, tilesetId);
      if (isInCollection) {
        return res.status(200).json({ message: "Tileset already in collection" });
      }
      
      await storage.addTilesetToCollection(userId, tilesetId);
      res.status(201).json({ message: "Tileset added to collection" });
    } catch (error) {
      console.error("Error adding tileset to collection:", error);
      res.status(500).json({ message: "Failed to add tileset to collection" });
    }
  });
  
  // Remove a tileset from user's collection
  app.delete("/api/tilesets/collection/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const tilesetId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      await storage.removeTilesetFromCollection(userId, tilesetId);
      res.status(200).json({ message: "Tileset removed from collection" });
    } catch (error) {
      console.error("Error removing tileset from collection:", error);
      res.status(500).json({ message: "Failed to remove tileset from collection" });
    }
  });

  // Serve uploaded files
  app.get("/api/uploads/:filename", (req: Request, res: Response) => {
    const filePath = path.join(import.meta.dirname, "uploads", req.params.filename);
    res.sendFile(filePath);
  });

  // Get all maps
  app.get("/api/maps", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      let maps;
      if (userId) {
        maps = await storage.getMapsByUserId(userId);
      } else {
        maps = await storage.getMaps();
      }
      
      res.json(maps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch maps" });
    }
  });

  // Get map by ID
  app.get("/api/maps/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const map = await storage.getMap(id);
      
      if (!map) {
        return res.status(404).json({ message: "Map not found" });
      }
      
      res.json(map);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch map" });
    }
  });

  // Create a new map - protected route
  app.post("/api/maps", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const mapData = {
        ...req.body,
        userId: req.user?.id, // Set userId from authenticated user
        width: parseInt(req.body.width),
        height: parseInt(req.body.height),
        tileSize: parseInt(req.body.tileSize),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const parsedData = insertMapSchema.safeParse(mapData);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid map data", errors: parsedData.error });
      }
      
      const map = await storage.createMap(parsedData.data);
      res.status(201).json(map);
    } catch (error) {
      console.error("Error creating map:", error);
      res.status(500).json({ message: "Failed to create map" });
    }
  });

  // Update an existing map - protected route
  app.put("/api/maps/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if map belongs to the current user
      const existingMap = await storage.getMap(id);
      if (!existingMap) {
        return res.status(404).json({ message: "Map not found" });
      }
      
      // Only allow users to update their own maps
      if (existingMap.userId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: You can only update your own maps" });
      }
      
      const mapData = {
        ...req.body,
        // Don't allow changing the userId
        width: req.body.width ? parseInt(req.body.width) : undefined,
        height: req.body.height ? parseInt(req.body.height) : undefined,
        tileSize: req.body.tileSize ? parseInt(req.body.tileSize) : undefined,
        updatedAt: new Date().toISOString()
      };
      
      const updatedMap = await storage.updateMap(id, mapData);
      res.json(updatedMap);
    } catch (error) {
      console.error("Error updating map:", error);
      res.status(500).json({ message: "Failed to update map" });
    }
  });

  // Delete a map - protected route
  app.delete("/api/maps/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if map belongs to the current user
      const existingMap = await storage.getMap(id);
      if (!existingMap) {
        return res.status(404).json({ message: "Map not found" });
      }
      
      // Only allow users to delete their own maps
      if (existingMap.userId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: You can only delete your own maps" });
      }
      
      const success = await storage.deleteMap(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting map:", error);
      res.status(500).json({ message: "Failed to delete map" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
