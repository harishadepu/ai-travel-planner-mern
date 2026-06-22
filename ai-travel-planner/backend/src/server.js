const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;
const isVercel = Boolean(process.env.VERCEL);

const startServer = async () => {
  await connectDB();

  if (!isVercel) {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  }
};

startServer().catch((err) => {
  console.error('Failed to connect to MongoDB:', err.message);
  process.exit(1);
});

module.exports = app