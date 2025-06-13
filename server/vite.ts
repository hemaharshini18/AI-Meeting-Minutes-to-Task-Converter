import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  try {
    log("Setting up Vite middleware...");
    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as true,
    };

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          log(`Vite error: ${msg}`, "vite-error");
          // Don't exit process on error, just log it
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    app.use(vite.middlewares);
    
    // Simple test endpoint
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", time: new Date().toISOString() });
    });
    
    // Serve test.html directly for debugging
    app.get("/test", (req, res) => {
      res.sendFile(path.resolve(import.meta.dirname, "..", "client", "test.html"));
    });
    
    // Serve debug.html directly for debugging
    app.get("/debug", (req, res) => {
      res.sendFile(path.resolve(import.meta.dirname, "..", "client", "debug.html"));
    });

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      log(`Processing request for: ${url}`);

      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html",
        );

        // Check if the file exists
        if (!fs.existsSync(clientTemplate)) {
          log(`Template file not found: ${clientTemplate}`, "error");
          return res.status(500).send("Template file not found");
        }

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        
        try {
          const page = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(page);
        } catch (transformError) {
          log(`Error transforming HTML: ${transformError}`, "error");
          // Send the template directly as fallback
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        }
      } catch (e) {
        log(`Error processing request: ${e}`, "error");
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
    
    log("Vite middleware setup complete");
  } catch (error) {
    log(`Failed to setup Vite: ${error}`, "error");
    throw error;
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
