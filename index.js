const express=require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors=require("cors");
const app=express();
require('dotenv').config()
const port=process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//Database

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.npygsvo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("CarService").collection("Services");

    app.get("/data",async(req,res)=>{
        const cursor = database.find();
        const result=await cursor.toArray();
        res.send(result);
    })

    app.get("/data/:id",async(req,res)=>{
        const id=req.params.id;
        const query={_id: new ObjectId(id)};
        const result=await database.findOne(query);
        res.send(result);
    });


    app.post("/booking",async(req,res)=>{
      const booked=req.body;
      // console.log(booked);
      const result= await database.insertOne(booked);
      res.send(result);
    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/",(req,res)=>{
    res.send("Server is Running");
})

app.listen(port,(req,res)=>{
    console.log(`the server is running on port ${port}`);
})