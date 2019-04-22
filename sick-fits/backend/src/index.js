require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db') 

const server = createServer();

// TODO: User express middleware to handle cookies (JWT)
// TODO: user express middleware to populate current USer

server.start(
{
    cors: {
    credentials: true,
    origin: process.env.FRONTEND_URL,
    },
}, 
deets => {
    console.log(`Server is now running on port http://localhost:${deets.port}`)
});