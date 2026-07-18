import express from "express";
import cors from "cors";
import { env } from "./lib/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { booksRouter } from "./routes/books.js";
import { chaptersRouter } from "./routes/chapters.js";
import { craftRouter } from "./routes/craft.js";
import { socialRouter } from "./routes/social.js";
import { libraryRouter } from "./routes/library.js";
import { notificationsRouter } from "./routes/notifications.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { searchRouter } from "./routes/search.js";
import { messagesRouter } from "./routes/messages.js";
import { goalsRouter } from "./routes/goals.js";
import { readingGoalsRouter } from "./routes/readingGoals.js";
import { eventsRouter } from "./routes/events.js";

const app = express();

app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "wordvrs-api" }));

// Shared identity + social graph, used by both apps.
app.use("/auth", authRouter);
app.use("/users", usersRouter);

// Writer-facing creation surface; also serves published-book reads for the Reader app.
app.use("/books", booksRouter);
app.use("/books/:bookId/chapters", chaptersRouter);
app.use("/books/:bookId", craftRouter);

// Cross-app engagement: reviews, comments, follows-to-purchase funnel.
app.use("/", socialRouter);

// Reader-facing surfaces.
app.use("/library", libraryRouter);
app.use("/notifications", notificationsRouter);
app.use("/search", searchRouter);
app.use("/reading-goals", readingGoalsRouter);

// Writer-facing surfaces.
app.use("/dashboard", dashboardRouter);
app.use("/goals", goalsRouter);

// Shared: author-hosted events (Q&As, live readings, virtual book tours).
app.use("/events", eventsRouter);

// Shared messaging.
app.use("/messages", messagesRouter);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`WordVrs API listening on http://localhost:${env.port}`);
});
