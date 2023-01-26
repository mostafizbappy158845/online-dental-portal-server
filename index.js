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

        //use Aggregate to query multiple collection and then merge data
        app.get('/appointmentOptions', async(req, res) =>{
            const date = req.query.date;
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();
            
            //get the booking of the provided data
            const bookingQuery = {appointmentDate: date}
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
            
            //carefully
            options.forEach(option =>{
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookedSlots = optionBooked.map(book => book.slot);
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = remainingSlots;
            })
            res.send(options);
        })

        app.get('/bookings', async(req, res) =>{
            const email =  req.query.email;
            const query = {email: email};
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.post ('/bookings', async(req, res) =>{
            const booking =  req.body;
            console.log(booking);
            const query = {
                appointmentDate: booking.appointmentDate, //capital D-date;
                email: booking.email,
                treatment: booking.treatment
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if(alreadyBooked.length){
                const message = `You already booking on ${booking.appointmentDate}`//capital D-date;
                return res.send({acknowledged: false, message});
            }
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