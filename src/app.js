import express from "express";
import cors from "cors";
import helmet from "helmet";
import {env} from "./config/env.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";




const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(cors({origin: env.FRONTEND_URL}));

app.use(express.json({limit: "1mb"}));
app.use(express.urlencoded({extended: true}));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);




app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "School Management API is running",
    data: {
      environment: env.NODE_ENV
    }
  });
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    data: null
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "An unexpected server error occurred"
        : err.message || "An unexpected server error occurred",
    data: null
  });
});

export default app;


