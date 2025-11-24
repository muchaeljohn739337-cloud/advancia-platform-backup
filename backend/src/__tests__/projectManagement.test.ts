import cors from "cors";
import express from "express";
import request from "supertest";
import { config } from "../config";
import milestonesRouter from "../routes/milestones";
import projectsRouter from "../routes/projects";
import tasksRouter from "../routes/tasks";
import teamsRouter from "../routes/teams";

// Create a test app
const app = express();

app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());

// Register routes
app.use("/api/teams", teamsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/milestones", milestonesRouter);

describe("Project Management Routes", () => {
  describe("Teams API", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await request(app).get("/api/teams");
      expect(response.status).toBe(401);
    });
  });

  describe("Projects API", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await request(app).get("/api/projects");
      expect(response.status).toBe(401);
    });
  });

  describe("Tasks API", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await request(app).get("/api/tasks");
      expect(response.status).toBe(401);
    });
  });

  describe("Milestones API", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await request(app).get("/api/milestones");
      expect(response.status).toBe(401);
    });
  });
});
