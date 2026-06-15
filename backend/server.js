import express from "express";
import cors from "cors";
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
import cartRouter from "./routes/cartRoute.js";
import checkoutRouter from "./routes/checkoutRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import adminOrderRouter from "./routes/adminOrderRoute.js";
import registrationRouter from "./routes/registrationRoute.js";
import schoolRouter from "./routes/schoolRoute.js";

connectCloudinary();

// App config
const app = express();
const port = process.env.PORT || 5000;

//middlewares
app.use(express.json());
app.use(cors());

// api endpoint
app.use("/api/auth", authRouter);
app.use("/api/institutions", institutionRouter);
app.use("/api/parents", parentRouter);
app.use("/api/products", productRouter);
app.use("/api/students", studentRouter);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/cart", cartRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin/registrations", registrationRouter);
app.use("/api/school", schoolRouter);

app.listen(port, () => {
  console.log(`Server started on port: http://localhost:${port}`);
});
