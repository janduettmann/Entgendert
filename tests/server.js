import http from "node:http";
import { readFile } from "node:fs/promises";
const fixture = await readFile(new URL("fixtures/page.html", import.meta.url));
http.createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(fixture);
}).listen(4173, "127.0.0.1");
