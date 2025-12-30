import { Router } from "express";
import API_CiderServiceRoute from "./cider";
import API_LastFMServiceRoute from "./lastfm";

const API_ServicesRoute = Router();

API_ServicesRoute.use("/cider", API_CiderServiceRoute);
API_ServicesRoute.use("/lastfm", API_LastFMServiceRoute);

export default API_ServicesRoute;