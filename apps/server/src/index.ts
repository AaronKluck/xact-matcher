import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as OpenApiValidator from 'express-openapi-validator';
import matchRoutes from './routes/matchRoute';

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Transaction Matcher',
      version: '1.0.0',
      description: 'Match orders to their transactions',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(express.json({limit: '10mb'})); // Increased limit for larger payloads
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(
  OpenApiValidator.middleware({
    apiSpec: specs as any,
    validateRequests: true,
    validateResponses: true, // disable in prod
  })
);

// Routes
app.use('/api/match', matchRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Swagger UI: http://localhost:${PORT}/docs`);
});