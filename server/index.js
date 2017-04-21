var http = require('http');
let server = http.createServer(() => {});

var io = require('socket.io')(server);

let users = {};

let roles = {};

io.on('connection', (socket) => {
    socket.emit('init', {
        rolesTaken: Object.keys(roles)
    });
    users[socket.id] = socket;
    socket.on('game-event', (data) => {
        console.log(data);
        Object.keys(users).forEach(userId => {
            if (userId !== socket.id) {
                users[userId].emit('game-event', data);
            }
        });
    });
    socket.on('choose-role', (role) => {
        if (!roles[role]) {
            roles[role] = socket.id;
            socket.role = role;
            Object.keys(users).forEach(userId => {
                if (userId !== socket.id) {
                    users[userId].emit('role-choosen', role);
                } else {
                    users[userId].emit('role-confirmed');
                }
            });
            if (roles.driver && roles.assist) {
                io.emit('all-ready');
            }
        } else {
            socket.emit('role-unavailable');
        }
    });
    socket.on('ready', () => {
        users[socket.id].ready = true;
        if (Object.keys(roles).every(key => users[roles[key]].ready)) {
            io.emit('start');
        }
    });
    socket.on('disconnect', () => {
        delete users[socket.id];
        if (socket.role) {
            delete roles[socket.role];
        }
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});