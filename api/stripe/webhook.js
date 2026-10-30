import "dotenv/config";
import express from "express";
import { registerStripeWebhook } from "../../server/webhook";

const app = express();
app.set("trust proxy", 1);
registerStripeWebhook(app);

export default app;
