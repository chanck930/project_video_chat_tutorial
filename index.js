const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
});

app.use(cors());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
	res.send('Running');
});

const users = {};

let serverUser = null;

const socketToRoom = {};

io.on('connection', socket => {
    console.log('connection ' + socket.id);

    socket.on("server join room", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            users[roomID].push(socket.id);
            console.log('server join room ' + socket.id);
        } else {
            users[roomID] = [socket.id];
            console.log('server create room ' + socket.id);
        }
        serverUser = socket.id;
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

        socket.emit("all client users", usersInThisRoom);
    });
    
    socket.on("client join room", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            users[roomID].push(socket.id);
            console.log('client join room ' + socket.id);
        } else {
            users[roomID] = [socket.id];
            console.log('client create room ' + socket.id);
        }
        socketToRoom[socket.id] = roomID;
        // const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

        socket.emit("server users", serverUser);
    });

    socket.on("sending signal", payload => {
        console.log('sending signal ' + socket.id);
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        console.log('returning signal ' + socket.id);
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        console.log('disconnect ' + socket.id);
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
        if (serverUser == socket.id) {
            console.log('server disconnect ' + socket.id);
            socket.emit("server disconnect", serverUser);
            serverUser = null;
        }
    });

});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
