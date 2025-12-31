import { Router } from "express";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function returnHTMLContent(page: string): string {
    return readFileSync(join(process.cwd(), "src", "web", "pages", `${page}.html`), {encoding: "utf8"})
}

const OverlayRoute = Router();

OverlayRoute.get("/nowplaying", async (req, res) => {
    res.send(returnHTMLContent("nowplaying"))
})

OverlayRoute.get("/history", async (req, res) => {
    res.send(returnHTMLContent("history"))
})

OverlayRoute.get("/art/cover", async (req, res) => {
    res.send(returnHTMLContent("cover"))
})

OverlayRoute.get("/art/cover/grid", async (req, res) => {
    res.send(returnHTMLContent("coverGrid"))
})

OverlayRoute.get("/art/cover/vinyl", async (req, res) => {
    res.send(returnHTMLContent("vinyl"))
})

export default OverlayRoute;