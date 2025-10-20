const http = require('http');
const path = require('path');
const fs = require('fs');
const root = __dirname;
const serve = (res, filePath, contentType='text/plain') => {
  fs.createReadStream(filePath).on('error', () => { res.statusCode=404; res.end('Not found'); }).pipe(res);
  res.setHeader('Content-Type', contentType);
};
const server = http.createServer((req,res)=>{
  const url = req.url.split('?')[0];
  if (url === '/' || url === '/index.html') return serve(res, path.join(root, 'index.html'), 'text/html');
  if (url.startsWith('/src/')) return serve(res, path.join(root, url), 'application/javascript');
  if (url.startsWith('/node_modules/')) return serve(res, path.join(root, url), 'application/javascript');
  res.statusCode = 404; res.end('Not found');
});
server.listen(5173, ()=>console.log('Demo running at http://localhost:5173'));
