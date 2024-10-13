import { MongoClient } from "mongodb";
import { startOfDay, addDays, endOfMonth, format } from "date-fns";

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
    const { name } = req.query;
    const { overwrite } = req.query;
    
    // Check for the count of contacts per day
    if (req.query.range) {
      try {
        const startDate = startOfDay(new Date());
        const endDate = addDays(startDate, 30); // Up to 30 days from today

        const counts = await collection.aggregate([
          {
            $match: {
              nextCallDate: {
                $gte: startDate,
                $lte: endDate,
              },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$nextCallDate" } },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              date: "$_id",
              count: 1,
              _id: 0,
            },
          },
          {
            $sort: { date: 1 },
          },
        ]).toArray();

        // Generate an array of all days in the range to fill in missing dates with count 0
        const daysWithCounts = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateString = format(currentDate, "yyyy-MM-dd");
          const existingCount = counts.find(c => c.date === dateString);
          daysWithCounts.push({
            date: dateString,
            count: existingCount ? existingCount.count : 0,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return res.status(200).json(daysWithCounts);
      } catch (error) {
        return res.status(500).json({ message: "Error retrieving contacts count." });
      }
    }

    try {
      // Verifica se esiste già un contatto con questo nome
      const existingContact = await collection.findOne({ name });
      if (existingContact && !overwrite) {
        return res.status(409).json({ message: "Contact with this name already exists.", contact: existingContact });
      } else {
        return res.status(200).json({ message: "Contatto aggiunto con successo!" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Error checking contact." });
    }
  } else if (req.method === "POST") {
    const { name, phone, email, nextCallDate, timesCalled, overwrite } = req.body;

    if (!name || !phone || !email || !nextCallDate || !timesCalled) {
      return res.status(400).json({ message: "All fields are required." });
    }

    try {
      const existingContact = await collection.findOne({ name });

      if (existingContact && !overwrite) {
        return res.status(409).json({ message: "Contact with this name already exists." });
      }

      if (existingContact && overwrite) {
        await collection.deleteOne({ _id: existingContact._id });
      }

      const contact = {
        name,
        phone,
        email,
        nextCallDate: new Date(nextCallDate), // Ensure this is a Date object
        timesCalled: parseInt(timesCalled, 10),
      };

      const result = await collection.insertOne(contact);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to save contact" });
    }
  }
}
