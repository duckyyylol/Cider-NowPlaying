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

export default OverlayRoute;