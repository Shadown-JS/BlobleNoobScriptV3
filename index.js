var app = require('http').createServer()
var io = require('socket.io')(app);

var http = require("http"),
    https = require("https"),
    querystring = require("querystring");
var request = function(f, b, c, d) {
    var e = !1,
        h = !1;
    if (c) {
        e = querystring.stringify(b);
        var g = c;
        h = d
    } else g = b, h = c;
    d = !1;
    b = "/";
    var m = "";
    c = "";
    var a = f.split("://");
    d = "https" == a[0] ? !0 : !1;
    a = a[1] ? a.slice(1).join("://") : a[0];
    a = a.split("/");
    var k = a[0].split(":");
    f = k[0];
    k[1] && (c = parseInt(k[1]));
    a[1] && (b += a.slice(1).join("/"));
    d = d ? https : http;
    h && (b += "?" + Date.now());
    try {
        var n = e ? {
                host: f,
                path: b,
                port: c,
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": Buffer.byteLength(e)
                }
            } : {
                host: f,
                path: b,
                port: c
            },
            l = d.request(n, function(a) {
                a.setEncoding("utf8");
                a.on("data", function(a) {
                    m += a
                });
                a.on("end", function() {
                    g(!1, a, m)
                })
            });
        l.on("error", function(a) {
            g(a, null, null)
        });
        e && l.write(e);
        l.end()
    } catch (p) {
        g(p, null, null)
    }
};


var port = process.env.PORT || 8080;
app.listen(port)
console.log("Listening on port " + port);
var sockets = [];
io.on('connection', function(socket) {

    socket.admin = false;
    socket.bases = [];
    socket.userID = socket.handshake.query.userID
    socket.server = socket.handshake.query.server;
    sockets.push(socket);
    console.log("User connected! " + socket.handshake.query.userID + " from " + socket.handshake.query.server + " " + sockets.length);
    socket.on("ap", (id) => {
        if (socket.bases.indexOf(id) == -1) {
            socket.bases.push(id);
        }
    })
    socket.on("rp", (id) => {
        var ind = socket.bases.indexOf(id);
        if (ind != -1) {
            socket.bases.splice(ind, 1);
        }
    });
    socket.on("toadmin", (msg) => {
        sockets.forEach((sock)=>{
            if (sock.admin) {
                sock.emit("toadmin",msg);
            }
        });
    });
    socket.on("elevate", (id, security) => {
        console.log(id + " requests elevation");
        request("https://bloble.000webhostapp.com/verify.php", {
            id: id,
            security: security
        }, (e, r, b) => {
            if (b && b == "true") {
                console.log(id + " elevated");
                socket.emit("elevate", true);
                socket.admin = true;
                socket.on("msg", (msg, target, sender) => {

                    sockets.every((s) => {
                        if (target == -1 || s.bases.indexOf(target) != -1) {
                            s.emit("msg", msg, target, sender);
                            return target == -1;
                        }
                        return true;
                    });
                })
                socket.on("reset", () => {
                    sockets.slice(0).forEach((s) => {
                        s.disconnect();
                    })
                    sockets.length = 0;
                });
                socket.on("id", (sid) => {
                    sockets.every((s)=>{
                        if (sid == -1 || s.bases.indexOf(sid) !== -1) {
                            socket.emit("id", s.userID);
                            return sid == -1;
                        }
                        return true;
                    });
                });
            } else {
                console.log("elevation failed")
                socket.emit("elevate", false);
            }
        });
    })


    socket.on("disconnect", () => {
        var ind = sockets.indexOf(socket)
        if (ind !== -1) sockets.splice(ind, 1);
        console.log("User disconnected! " + sockets.length);
        if (socket.admin) {
            sockets.slice(0).forEach((s) => {
                s.disconnect();
            })
            sockets.length = 0;
        }
    })
});
