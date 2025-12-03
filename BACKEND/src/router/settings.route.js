 import {Router} from "express"
 const router = Router();
 import { getSettings, postSettings } from "../controllers/settings.controller.js";
 
 router.route("/settings").get( getSettings);
 router.route("/save_settings").post( postSettings);

 export default router;