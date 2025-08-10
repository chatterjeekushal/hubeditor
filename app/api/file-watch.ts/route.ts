
import { NextApiRequest, NextApiResponse } from "next";
import chokidar from "chokidar";

let clients: any[] = [];
let watcher: any = null;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    clients.push(res);

    if (!watcher) {
        watcher = chokidar.watch("user", { // watch your `user` folder
            persistent: true,
            ignoreInitial: false
        });

        watcher.on("add", () => sendUpdate());
        watcher.on("unlink", () => sendUpdate());
        watcher.on("addDir", () => sendUpdate());
        watcher.on("unlinkDir", () => sendUpdate());
    }

    req.on("close", () => {
        clients = clients.filter(client => client !== res);
    });
}

function sendUpdate() {
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify({ update: true })}\n\n`);
    });
}
