const express=require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors=require("cors");
const app=express();
require('dotenv').config();
const cookieParser=require("cookie-parser")
var jwt = require('jsonwebtoken');
const port=process.env.PORT || 5000;

//middleware
app.use(cors({
  origin:["http://localhost:5173"],
  credentials:true,
}));
app.use(express.json());
app.use(cookieParser());

//Middleware Created by us
const logger=async(req,res,next)=>{

  console.log("called:",req.host,req.originalUrl);
  next();

}
const verifyToken=async(req,res,next)=>{
    const token = req?.cookies?.token;
     console.log('token in the middleware', token);
    // no token available 
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access no token' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access ivalid' })
        }
        req.user = decoded;
        next();
    })
}

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
    
    const database = client.db("CarService").collection("Services");
    const bookingDB=client.db("CarService").collection("bookingCollect");

    //user data
    app.post("/jwt",async(req,res)=>{
      const user=req.body;
      // console.log(user);
      const token=jwt.sign(user,process.env.ACCESS_TOKEN,{expiresIn:'1hr'});
      //console.log(token);
      res.cookie("token",token,{
        httpOnly:true,
        secure:true,
        sameSite:"none"
      })
      .send({success:true});
    })

    //product data
    app.get("/data",logger,async(req,res)=>{
        const cursor = database.find();
        const result=await cursor.toArray();
        res.send(result);
    })

    app.get("/data/:id",logger,async(req,res)=>{
        const id=req.params.id;
        const query={_id: new ObjectId(id)};
        const result=await database.findOne(query);
        res.send(result);
    });


    app.post("/booking",async(req,res)=>{
      const booked=req.body;
      const cookie=req.cookies;
       //console.log(booked,cookie);
      const result= await bookingDB.insertOne(booked);
      res.send(result);
    });

    app.get("/booking",verifyToken,async(req,res)=>{
      let query={};
      if(req.query?.email){
          query={email: req.query.email}
      }
      const result=await bookingDB.find(query).toArray();
      res.send(result);
    });

    app.delete("/booking/:id",async(req,res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)};
      const result=await bookingDB.deleteOne(query);
      res.send(result);
    });


    app.patch("/booking/:id",async(req,res)=>{
      const id=req.params.id;
      const updateBooking=req.body;
      const query={_id: new ObjectId(id)};
      const updateDoc = {
      $set: {
        status: updateBooking.status,
      },
      };

      const result=await bookingDB.updateOne(query,updateDoc);
      res.send(result);
    });




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