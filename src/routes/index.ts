import { Router } from "express";
import authRoutes from "./auth.route";
import pairRoutes from "./pair.route";
import boothRoutes from "./booth.route";
import archiveRoutes from "./archive.route";
import statsRoutes from "./stats.route";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/pair", pairRoutes);
routes.use("/booth", boothRoutes);
routes.use("/archive", archiveRoutes);
routes.use("/stats", statsRoutes);

export default routes;
