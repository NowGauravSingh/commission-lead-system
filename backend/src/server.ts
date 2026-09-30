import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import usersRouter from "./routes/users.js";
import leadsRouter from "./routes/leads.js";
const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/api/users", usersRouter);
app.use("/api/leads", leadsRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Commission Lead Backend is running",
  });
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      server: "OK",
      database: "OK",
    });
  } catch (error) {
    console.error("DATABASE ERROR:", error);

    res.status(500).json({
      server: "OK",
      database: "ERROR",
      error: String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});