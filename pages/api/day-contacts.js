import { MongoClient } from "mongodb";


const uri = process.env.MONGODB_URI;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default async function handler(req, res) {
    const client = await clientPromise;
    const db = client.db("contacts");
    const collection = db.collection("contactsCollection");
  
    if (req.method === "GET") {
      const { date } = req.query;
  
      try {
        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0); // Set time to 00:00:00
  
        const existingContacts = await collection.find({ date: queryDate }).toArray();
        
        return res.status(200).json(existingContacts);
      } catch (error) {
        return res.status(500).json({ message: "Error retrieving contacts from date." });
      }
    }
  }
  