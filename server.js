var http = require('http');
var static = require('node-static');
var file = new static.Server('./', { indexFile: 'index.html' });
let server = http.createServer((request, response) => {
    request.addListener('end', () => {
        file.serve(request, response);
    }).resume();
});

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

let port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(`listening on *:${ port }`);
});