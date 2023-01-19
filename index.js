const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000

const app = express();

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nyrqcjg.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const appointmentOptionCollection = client.db('dentalPortal').collection('appointmentOptions');
        const bookingsCollection = client.db('dentalPortal').collection('bookings');
        app.get('/appointmentOptions', async(req, res) =>{
            const date = req.query.date;
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();
            const bookingQuery = {appointmentdate: date}
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
            options.forEach(option =>{
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookedSlots = optionBooked.map(book => book.slot);
                console.log(date, option.name,bookedSlots)
            })
            res.send(options);
        })

        app.post ('/bookings', async(req, res) =>{
            const booking =  req.body
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })
    }
    finally{

    }
}
run().catch(console.log)


app.get('/', async(req,res) =>{
    res.send('dental portal server is running.')
})

app.listen(port, ()=> console.log(`Dental portal running on ${port}`))