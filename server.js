const fs = require('fs');
const http = require('http');

fs.readFile('./data', 'UTF-8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    serve(data);
})

function serve(data) {
    const houseRawList = data.split('\n\n');
    const houseList = [];
    houseRawList.forEach(house => {
        const [title, link] = house.split('\n');
        if (!title.length) return;
        houseList.push({
            title: title,
            link: link
        })
    })
    http.createServer((req, res) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Request-Method', '*');
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
        res.setHeader('Access-Control-Allow-Headers', '*');
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(houseList));
    }).listen(8080);
    console.log('serving on localhost:8080');
}