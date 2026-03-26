import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 JobAI backend running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}\n`);
});

export default app;
