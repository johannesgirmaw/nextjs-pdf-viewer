import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(__filename);
const serve = (res, filePath, contentType = "text/plain") => {
  fs.createReadStream(filePath)
    .on("error", () => {
      res.statusCode = 404;
      res.end("Not found");
    })
    .pipe(res);
  res.setHeader("Content-Type", contentType);
};
const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];

  // Handle favicon requests (common browser request)
  if (url === "/favicon.ico") {
    res.statusCode = 204; // No Content
    res.end();
    return;
  }

  if (url === "/" || url === "/index.html")
    return serve(res, path.join(root, "index.html"), "text/html");
  if (url.startsWith("/src/"))
    return serve(res, path.join(root, url), "application/javascript");
  if (url.startsWith("/node_modules/"))
    return serve(res, path.join(root, url), "application/javascript");
  if (url.startsWith("/public/"))
    return serve(res, path.join(root, url), "application/pdf");

  res.statusCode = 404;
  res.end("Not found");
});
server.listen(5173, () => console.log("Demo running at http://localhost:5173"));
