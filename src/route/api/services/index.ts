import { Router } from "express";
import API_CiderServiceRoute from "./cider";
import API_LastFMServiceRoute from "./lastfm";
import API_IcecastServiceRoute from "./icecast";

const API_ServicesRoute = Router();

API_ServicesRoute.use("/cider", API_CiderServiceRoute);
API_ServicesRoute.use("/lastfm", API_LastFMServiceRoute);
API_ServicesRoute.use("/icecast", API_IcecastServiceRoute);

export default API_ServicesRoute;