// Centralised 404 + error handling so unmatched routes and uncaught errors
// always return JSON (never Express's default HTML) and internals aren't leaked.

export const notFound = (req, res) => {
  res
    .status(404)
    .json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// 4-arg signature is required for Express to treat this as error middleware.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // CORS rejection (thrown by the cors origin callback).
  if (err?.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Origin not allowed" });
  }

  // Malformed JSON body (thrown by express.json()).
  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  const status = err.status || err.statusCode || 500;

  // Always log server-side for diagnosis.
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);

  return res.status(status).json({
    message: status === 500 ? "Internal server error" : err.message,
    // Surface the detail only outside production.
    ...(process.env.NODE_ENV !== "production" ? { error: err.message } : {}),
  });
};
