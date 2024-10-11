import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the MongoClient is not constantly recreated
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { name, phone, email, nextCallDate, timesCalled } = req.body;

    if (!name || !phone || !email || !nextCallDate || !timesCalled) {
      return res.status(400).json({ message: "All fields are required." });
    }

    try {
      const client = await clientPromise;
      const db = client.db("contacts"); // nome del database
      const collection = db.collection("contactsCollection"); // nome della collezione

      const contact = {
        name,
        phone,
        email,
        nextCallDate: new Date(nextCallDate),
        timesCalled: parseInt(timesCalled, 10),
      };

      const result = await collection.insertOne(contact);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to save contact" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
