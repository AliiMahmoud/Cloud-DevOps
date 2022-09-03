// Require Express to run server and Routes
const express = require('express')

// Dependencies
const bodyParser = require('body-parser')

// Start up an instance of the app
const app = express()

// Setting the view engine 
app.set('view engine', 'ejs')

// Middle-wares 
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())

app.get('/', (_, res) => {
    res.send("Hello, Friend")
})

// Setup Server 
const port = process.env.PORT || 8080;

app.listen(port, () => console.log(`server is running on port ${port}`));
