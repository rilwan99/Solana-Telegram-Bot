const express = require('express')
const app = express()
const { PublicKey, Connection, clusterApiUrl } = require('@solana/web3.js')
const bodyParser = require('body-parser');

// Parse the request body as JSON
app.use(bodyParser.json());

app.get('/', (req,res) => {
    // Create a connection to a Solana node
    const connection = new Connection(clusterApiUrl('devnet'))
    const publicKey = new PublicKey('7C4jsPZpht42Tw6MjXWF56Q5RQUocjBBmciEjDa8HRtp')

    // Get Balances
    connection.getBalance(publicKey)
      .then(balance => {
        res.send(`Balance: ${balance}`)
      })
      .catch(err => {
        res.status(500).send(`Error getting balance: ${err.message}`)
      })
})

app.listen(3000, () => {
    console.log('Server listening on port 3000')
})
  