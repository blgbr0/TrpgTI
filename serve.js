const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

function resolveFile(urlPath) {
  const safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^([.][.][/\\])+/, "");
  const targetPath = path.join(root, safePath === "/" ? "index.html" : safePath);
  return targetPath;
}

http
  .createServer((req, res) => {
    if (req.url === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }

    const filePath = resolveFile(req.url.split("?")[0]);

    fs.stat(filePath, (statError, stat) => {
      if (statError) {
        send(res, 404, "Not Found");
        return;
      }

      const finalPath = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;

      fs.readFile(finalPath, (readError, data) => {
        if (readError) {
          send(res, 500, "Server Error");
          return;
        }

        const type = contentTypes[path.extname(finalPath).toLowerCase()] || "application/octet-stream";
        send(res, 200, data, type);
      });
    });
  })
  .listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
