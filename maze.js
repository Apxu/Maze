var move;
function sendData() {
        var ws = new WebSocket("ws://hometask.eg1236.com/game-maze/")
        var name = document.getElementById("name").value;
        var contact = document.getElementById("contact").value;
        var pass = document.getElementById("pass").value;
        var state = {};

        let visited = {};
        let finish = null;
        let target = null;
        const wall = '█';
        const locked = '╬';
        let keyPos = null;
        let keyFound = false;

        function findFinish(maze, height, width) {
            for (var i = 0; i < height; i++) {
                for (var j = 0; j < width; j++) {
                    if (maze[i][j] === '֎') {
                        return [i,j];
                    }
                }
            }
            return null;
        }

        function findKey(maze, height, width) {
            for (var i = 0; i < height; i++) {
                for (var j = 0; j < width; j++) {
                    if (maze[i][j] === 'ȶ') {
                        return [i,j];
                    }
                }
            }
            return null;
        }

        function findNextTarget(maze, pos) {
            let q = [pos];
            let v = {};
            v[pos] = true;

//            console.log("findNextTarget start");

            while (q.length > 0) {
                const p = q.shift();
                const y = p[0];
                const x = p[1];
                if (maze[y-1][x] !== wall && v[[y-1,x]] !== true) {
                    if (maze[y-1][x] === locked && !keyFound) {
                    } else {
                        if (visited[[y-1,x]] !== true) {
                            return [y-1,x];
                        } else {
                            v[[y-1,x]] = true;
                            q.push([y-1,x]);
                        }
                    }
                }
                if (maze[y+1][x] !== wall && v[[y+1,x]] !== true) {
                    if (maze[y+1][x] === locked && !keyFound) {
                    } else {
                        if (visited[[y+1,x]] !== true) {
                            return [y+1,x];
                        } else {
                            v[[y+1,x]] = true;
                            q.push([y+1,x]);
                        }
                    }
                }
                if (maze[y][x-1] !== wall && v[[y,x-1]] !== true) {
                    if (maze[y][x-1] === locked && !keyFound) {
                    } else {
                        if (visited[[y,x-1]] !== true) {
                            return [y,x-1];
                        } else {
                            v[[y,x-1]] = true;
                            q.push([y,x-1]);
                        }
                    }
                }
                if (maze[y][x+1] !== wall && v[[y,x+1]] !== true) {
                    if (maze[y][x+1] === locked && !keyFound) {
                    } else {
                        if (visited[[y,x+1]] !== true) {
                            return [y,x+1];
                        } else {
                            v[[y,x+1]] = true;
                            q.push([y,x+1]);
                        }
                    }
                }
            }

//            console.log("findNextTarget end");

            return [-1,-1];
        }

        function moveToTarget(maze, pos) {
            q = [[pos, []]];
            v = {};
            v[pos] = true;

            while (q.length > 0) {
                let elem = q.shift();
                let p = elem[0];
                let y = p[0];
                let x = p[1];
                if (y == target[0] && x == target[1]) {
                    return elem[1][0];
                }

                if (maze[y-1][x] !== wall && !v[[y-1,x]]) {
                    if (maze[y-1][x] === locked && !keyFound) {
                    } else {
                        v[[y-1,x]] = true;
                        q.push([[y-1,x], [...elem[1],"up"]]);
                    }
                }
                if (maze[y+1][x] !== wall && !v[[y+1,x]]) {
                    if (maze[y+1][x] === locked && !keyFound) {
                    } else {
                        v[[y+1,x]] = true;
                        q.push([[y+1, x], [...elem[1], "down"]]);
                    }
                }
                if (maze[y][x-1] !== wall && !v[[y,x-1]]) {
                    if (maze[y][x-1] === locked && !keyFound) {
                    } else {
                        v[[y,x-1]] = true;
                        q.push([[y,x-1], [...elem[1], "left"]]);
                    }
                }
                if (maze[y][x+1] !== wall && !v[[y,x+1]]) {
                    if (maze[y][x+1] === locked && !keyFound) {
                    } else {
                        v[[y,x+1]] = true;
                        q.push([[y,x+1], [...elem[1], "right"]]);
                    }
                }
            }

            return "";
        }

        function findNextMove(maze, pos) {
            if (target != null && target[0] == pos[0] && target[1] == pos[1]) {
                target = null;
            }

            if (target == null) {
                target = findNextTarget(maze, pos);
                if (target[0] === -1 || target[1] === -1) {
//                    console.log("couldn't find any target, exiting");
                    return;
                }
            }

            const nextMove = moveToTarget(maze, pos);

            if (nextMove === "up") {
                visited[[pos[0]-1, pos[1]]] = true;
            } else if (nextMove === "down") {
                visited[[pos[0]+1, pos[1]]] = true;
            } else if (nextMove === "left") {
                visited[[pos[0], pos[1]-1]] = true;
            } else if (nextMove === "right") {
                visited[[pos[0], pos[1]+1]] = true;
            } else {
//                console.log("failed to find next move");
                return;
            }

            return nextMove;
        }

        function autoMove(maze, height, width, pos) {
            if (finish == null) {
                finish = findFinish(maze, height, width);
            }
            if (keyPos == null) {
                keyPos = findKey(maze, height, width);
            }

            visited[pos] = true;

            if (finish !== null && pos[0] === finish[0] && pos[1] === finish[1]) {
                console.log("EXIT FOUND");
                state.auto = false;
            } else if (keyPos !== null && pos[0] === keyPos[0] && pos[1] === keyPos[1]) {
                keyFound = true;
                keyPos = null;
                ws.send("take");
            } else {
                const nextMove = findNextMove(maze, pos);
                ws.send(nextMove);
            }
        }

        ws.onopen = function(event) {
            ws.send("name=" + name);
//            console.log("name=" + name);
            ws.send("contact=" + contact);
//            console.log("contact=" + contact);
            ws.send("password=" + pass);
//            console.log("password=" + pass);
        }
        ws.onmessage = function(event) {
            if (event.data.includes("Hello") || event.data.includes("contact")) {
                console.log(event.data);
            }
            else {
                const data = event.data.split("\n");
                const sizes = data[0].split("x");
                const width = parseInt(sizes[0]);
                const height = parseInt(sizes[1]);
//                console.log("width = " + width);
//                console.log("height = " + height);
//                console.log("Size: " + width + "x" + height);
                message = data.slice(height+2, height+3);
//                console.log(message);
                const maze = data.slice(1, height+1);
                const pos = findInitialPosition(maze, height, width);
//                console.log("pos = " + pos);
                state.message = message;
                state.width = width;
                state.height = height;
                state.pos = pos;
                state.maze = maze;

                if (state.collectMap) {
                    for (var i = 0; i < 5; i++) {
                        for (var j = 0; j < 5; j++) {
                            state.field[state.mapRow + i - 2][state.mapCol + j - 2] = state.maze[i][j];
                        }
                    }

                    state.width = 100;
                    state.height = 100;

                    gameArea.start();
                    fillMaze(state.field, 100, 100);
                    typeMessage(state.message);
                    currentPosition = new component("red", state.mapCol, state.mapRow);
                } else {
                    startGame();
                }

                if (state.auto) {
                    autoMove(maze, height, width, pos);
                }
            }
        }

        var gameArea = {
            canvas : document.createElement("canvas"),
            start : function() {
                this.canvas.width = state.width * 8;
                this.canvas.height = state.height * 8;
                this.context = this.canvas.getContext("2d");
                document.body.insertBefore(this.canvas, document.body.childNodes[0]);
            },
            clear : function() {
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }

        function typeMessage(message) {
          var x = message;
          document.getElementById("message").innerHTML = x;
        }

        function startGame() {
            gameArea.start();
            fillMaze(state.maze, state.height, state.width);
            typeMessage(state.message);
            currentPosition = new component("red", state.pos[1], state.pos[0]);
        }

        function component(color, x, y) {
            this.width = 8;
            this.height = 8;
            this.x = x * 8;
            this.y = y * 8;
            ctx = gameArea.context;
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        function findInitialPosition(maze, height, width) {
            for (var i = 0; i < height; i++) {
                for (var j = 0; j < width; j++) {
                    if (maze[i][j] === '☺') {
                        return [i,j];
                    }
                }
            }
            return [-1,-1];
        }

        function fillMaze(maze, height, width, ) {
            for (i = 0; i < height; i++) {
                for (j = 0; j < width; j++) {

                    if (maze[i][j] === '?') {
                        fog = new component("grey", j, i);
                    }
                    else if (maze[i][j] === ' ') {
                        empty = new component("black", j, i);
                    }
                    else if (maze[i][j] === '█') {
                        wally = new component("white", j, i);
                    }
                    else if (maze[i][j] === '֎') {
                        exit = new component("green", j, i);
                    }
                    else if (maze[i][j] === '╬') {
                        door = new component("brown", j, i);
                    }
                    else if (maze[i][j] === 'ȶ') {
                        key = new component("gold", j, i);
                    }
                    else if (maze[i][j] === '▀') {
                        secretDoor = new component("#42f4eb", j, i);
                    }
                    else if (maze[i][j] === '○') {
                        a = new component("#b4edd9", j, i);
                    }
                    else if (maze[i][j] === '●') {
                        b = new component("gold", j, i);
                    }
                    else if (maze[i][j] === '□') {
                        c = new component("#c6600b", j, i);
                    }
                    else if (maze[i][j] === '₪') {
                        acid = new component("#0bc684", j, i);
                    }
                    else {
                        unknown = new component("blue", j, i);
                    }
                }
            }
        }

        function send(message) {
            ws.send(message);
        }

        function move(direction) {
            return () => {
                if (direction === "up") {
                    state.mapRow -= 1;
                } else if (direction === "down") {
                    state.mapRow += 1;
                } else if (direction === "left") {
                    state.mapCol -= 1;
                } else if (direction === "right") {
                    state.mapCol += 1;
                }
                send(direction);
            };
        }

        return {
            up: move("up"),
            right: move("right"),
            left: move("left"),
            down: move("down"),
            action: send,
            switchAuto: () => {
                if (state.auto) {
                    state.auto = false;
                } else {
                const { maze, height, width, pos } = state;
                state.auto = true;
                autoMove(maze, height, width, pos);
                }
            },
            darkestNight: () => {
                state.collectMap = true;
                state.mapRow = 50;
                state.mapCol = 50;
                state.field = new Array(100);
                for (var i = 0; i < 100; i++) {
                    state.field[i] = new Array(100);
                    for (var j = 0; j < 100; j++) {
                        state.field[i][j] = '?';
                    }
                }
            }
        }
     }

document.onkeydown = function(e) {
    e = e || window.event;
    switch(e.which || e.keyCode) {
        case 37: move.left()
        break;

        case 38: move.up()
        break;

        case 39: move.right()
        break;

        case 40: move.down()
        break;

        default: return;
    }
    e.preventDefault();
};

/*
d();d();d();l();l();l();l();u();l();u();l();l();l();d();d();r();r();d();d();l();l();d();d();r();r();r();r();r();u();u();r();r();d();d();d();d();l();l();l();d();d();r();r();r();r();r();u();r();u();u();u();r();r();d();d();d();r();r();r();u();u();u();u();u();r();r();u();u();u();r();r();d();d();d();d();l();d();l();d();d();r();d();d();r();r();u();r();u();u();u();u();u();r();r();r();r();d();d();l();l();d();d();r();r();r();u();r();r();u();u();u();l();u();l();u();l();l();l();u();u();r();r();r();r();d();r();d();r();u();u();r();r();d();d();d();l();d();d();d();d();d();d();d();r();r();u();u();u();u();
*/