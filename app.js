import express from "express";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import cors from 'cors';

import user from "./routes/user.js";
import post from "./routes/post.js";

const app = express();
dotenv.config({ path: "./config/config.env" });

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
//   next();
// });

app.use("/api/v1", user);
app.use("/api/v1", post);

export default app;
