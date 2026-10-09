// HTTP request handler: serves the two static files the chat UI needs.

// TODO: user signup/login and authentication (add POST /signup, POST /login
//       routes here that create users/sessions in Redis and set an auth
//       cookie; also protect / and /style.css behind a valid session)

import { readFile } from "fs/promises";

const requestListener = async (req, res) => {
  const myUrl = new URL(req.url, "http://localhost:8000");

  // Serve the chat page
  if (myUrl.pathname === "/") {
    try {
      const html = await readFile("./index.html", { encoding: "utf8" });

      res.writeHead(200, { "content-type": "text/html" }).end(html);
    } catch (error) {
      res.writeHead(500, "There was a server side error!");
    }

    // Serve the external stylesheet
  } else if (myUrl.pathname === "/style.css") {
    try {
      const css = await readFile("./style.css", { encoding: "utf8" });
      res.writeHead(200, { "content-type": "text/css" }).end(css);
    } catch (error) {
      res.writeHead(500, "There was a server side error!");
    }
  } else {
    res.writeHead(404).end("Requested path was not found!");
  }
};

export default requestListener;
