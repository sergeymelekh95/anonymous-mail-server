const http = require('http');
// const ws = require('ws');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io'); // Add this

const User = require('./models/User');
const Msg = require('./models/Msg');

const app = express();

app.use(cors());
// app.use(express.json());

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

const start = async () => {
    try {
        await mongoose.connect(
            `mongodb+srv://sergeymelekh95:8000160q@cluster0.knua9qg.mongodb.net/anonymousChat?retryWrites=true&w=majority`
        );
        console.log('DB connected!');
    } catch (err) {
        console.log(err);
    }
};

start();

const onlinePersons = [];

io.on('connection', (socket) => {
    console.log(`User connected ${socket.id}`);

    socket.on('login', async (username, callback) => {
        let user = await User.findOne({ username });
        const users = await User.find();

        if (!user) {
            user = new User({ username });
            await user.save();
        }

        const msgs = await Msg.find({
            receiverName: username,
        });

        socket.username = username;

        const newOnlinePerson = {
            username,
            userId: socket.id,
        };

        onlinePersons.push(newOnlinePerson);

        callback({ username, users, msgs: msgs.reverse() });
    });

    socket.on('history-messages', async ({senderName, receiverName}, callback) => {
        const msgs = await Msg.find({
            senderName,
            receiverName
        });
        
        onlinePersons.forEach((onlinePerson) => {
            if (onlinePerson.username === senderName) {
                socket.emit('history', msgs);
            }
        })

    });

    socket.on('message', async (message, callback) => {
        const { theme, text, receiverName, senderName } = message;

        const msg = new Msg({
            receiverName,
            senderName,
            theme,
            text,
            sentAt: Date.now(),
        });

        await msg.save();

        onlinePersons.forEach((onlinePerson) => {
            if (onlinePerson.username === receiverName) {
                socket.to(onlinePerson.userId).emit('newMessage', msg);
            }

            if (receiverName === senderName) {
            socket.emit('newMessage', msg);
        }
        });
    });

    socket.on('disconnect', async (message, callback) => {
        const indexOfDisconnected = onlinePersons.findIndex((onlinePerson) => onlinePerson.userId === socket.id );

        onlinePersons.splice(indexOfDisconnected, 1);

        console.log(onlinePersons);
        console.log(socket.id, 'disconnected');
    })
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
