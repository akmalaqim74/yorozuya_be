import app from "./app";
import env from "./config/env";

const port = env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Yorozuya Backend API server running on port ${port} (env: ${env.NODE_ENV})`);
  console.log(`🔗 Health check available at http://localhost:${port}/health-check`);
  console.log(`📸 Streak Booth API available at http://localhost:${port}/api/v1`);
});
