const http = require("http");
const path = require("path");
const fs = require("fs");
const root = __dirname;

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".js")) return "application/javascript";
  if (filePath.endsWith(".mjs")) return "application/javascript";
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".pdf")) return "application/pdf";
  return "text/plain";
}

function sendFile(res, filePath) {
  res.setHeader("Content-Type", contentType(filePath));
  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    res.statusCode = 404;
    res.end("Not found");
  });
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];
  if (url === "/favicon.ico") {
    res.statusCode = 204;
    return res.end();
  }
  if (url === "/" || url === "/index.html") {
    return sendFile(res, path.join(root, "index.html"));
  }
  if (url.startsWith("/src/")) {
    return sendFile(res, path.join(root, url));
  }
  if (url.startsWith("/node_modules/")) {
    return sendFile(res, path.join(root, url));
  }
  if (url.startsWith("/public/")) {
    return sendFile(res, path.join(root, url));
  }
  res.statusCode = 404;
  res.end("Not found");
});

server.listen(5173, () => console.log("Demo running at http://localhost:5173"));
