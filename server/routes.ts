import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMapSchema, insertTilesetSchema } from "@shared/schema";
import fs from "fs";
import path from "path";
import multer from "multer";

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
      const tilesets = await storage.getTilesets();
      res.json(tilesets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tilesets" });
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

  // Upload a new tileset
  app.post("/api/tilesets", upload.single("image"), async (req: Request, res: Response) => {
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
        userId: req.body.userId ? parseInt(req.body.userId) : null
      };
      
      const parsedData = insertTilesetSchema.safeParse(tilesetData);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid tileset data", errors: parsedData.error });
      }
      
      const tileset = await storage.createTileset(parsedData.data);
      res.status(201).json(tileset);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload tileset" });
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

  // Create a new map
  app.post("/api/maps", async (req: Request, res: Response) => {
    try {
      const mapData = {
        ...req.body,
        userId: req.body.userId ? parseInt(req.body.userId) : null,
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
      res.status(500).json({ message: "Failed to create map" });
    }
  });

  // Update an existing map
  app.put("/api/maps/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const mapData = {
        ...req.body,
        userId: req.body.userId ? parseInt(req.body.userId) : undefined,
        width: req.body.width ? parseInt(req.body.width) : undefined,
        height: req.body.height ? parseInt(req.body.height) : undefined,
        tileSize: req.body.tileSize ? parseInt(req.body.tileSize) : undefined,
        updatedAt: new Date().toISOString()
      };
      
      const updatedMap = await storage.updateMap(id, mapData);
      
      if (!updatedMap) {
        return res.status(404).json({ message: "Map not found" });
      }
      
      res.json(updatedMap);
    } catch (error) {
      res.status(500).json({ message: "Failed to update map" });
    }
  });

  // Delete a map
  app.delete("/api/maps/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMap(id);
      
      if (!success) {
        return res.status(404).json({ message: "Map not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete map" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
