import { Router } from "express";
import API_TracksRoute from "./tracks";
import API_ServicesRoute from "./services";

const APIRoute = Router();

APIRoute.use("/tracks", API_TracksRoute);
APIRoute.use("/services", API_ServicesRoute);

export default APIRoute;