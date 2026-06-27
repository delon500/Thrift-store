import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import authRouter from "./routes/authRoute.js";
import pool from "./config/db.js";
import institutionRouter from "./routes/institutionRoute.js";
import productRouter from "./routes/productRoutes.js";
import connectCloudinary from "./config/cloudinary.js";
import parentRouter from "./routes/parentRoute.js";
import studentRouter from "./routes/studentRoute.js";
import userRouter from "./routes/userRoute.js";
import orderRouter from "./routes/orderRoute.js";
import notificationRouter from "./routes/notificationRoute.js";
import cartRouter from "./routes/cartRoute.js";
import checkoutRouter from "./routes/checkoutRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import adminOrderRouter from "./routes/adminOrderRoute.js";
import registrationRouter from "./routes/registrationRoute.js";
import schoolRouter from "./routes/schoolRoute.js";
import adminRouter from "./routes/adminRoute.js";
import adminInstitutionRouter from "./routes/adminInstitutionRoute.js";
import adminPaymentRouter from "./routes/adminPaymentRoute.js";
import adminSettingsRouter from "./routes/adminSettingsRoute.js";
import tagRouter from "./routes/tagRoute.js";
import adminGuardianshipRouter from "./routes/adminGuardianshipRoute.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

connectCloudinary();

// App config
const app = express();
const port = process.env.PORT || 5000;

// Browser origins allowed to call the API. Non-browser clients (no Origin
// header) — curl, server-to-server, and the PayFast ITN — are always allowed.
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://localhost:5174,http://localhost:5175"
)
  .split(",")
  .map((origin) => origin.trim());

//middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(express.json());

// api endpoint
app.use("/api/auth", authRouter);
app.use("/api/institutions", institutionRouter);
app.use("/api/parents", parentRouter);
app.use("/api/products", productRouter);
app.use("/api/students", studentRouter);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/cart", cartRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin/registrations", registrationRouter);
app.use("/api/school", schoolRouter);
app.use("/api/admin/institutions", adminInstitutionRouter);
app.use("/api/admin/payments", adminPaymentRouter);
app.use("/api/admin/settings", adminSettingsRouter);
app.use("/api/admin/tags", tagRouter);
app.use("/api/admin/parents", adminGuardianshipRouter);
app.use("/api/admin", adminRouter);

// Unmatched routes + centralised error handling (must come after the routes).
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server started on port: http://localhost:${port}`);
});
