import dotenv from "dotenv";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config({ path: ".env.test" });

let mongoServer;

beforeAll(async () => {
	process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

	// Prefer configured test DB URI when available, then fallback to in-memory Mongo.
	const configuredUri = process.env.MONGO_URI;
	if (configuredUri) {
		try {
			await mongoose.connect(configuredUri, { serverSelectionTimeoutMS: 5000 });
			return;
		} catch {
			// Fall through to MongoMemoryServer for environments without local Mongo.
		}
	}

	mongoServer = await MongoMemoryServer.create();
	const memoryUri = mongoServer.getUri();
	await mongoose.connect(memoryUri);
});

afterEach(async () => {
	if (mongoose.connection.readyState !== 1) {
		return;
	}

	const { collections } = mongoose.connection;
	for (const key of Object.keys(collections)) {
		await collections[key].deleteMany({});
	}
});

afterAll(async () => {
	if (mongoose.connection.readyState !== 0) {
		await mongoose.connection.close();
	}

	if (mongoServer) {
		await mongoServer.stop();
	}
});