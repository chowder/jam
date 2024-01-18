const PLAYER_NAME_HEIGHT_OFFSET = 24

const JUMP_FORCE = 300
const MOVE_SPEED = 100
const CAGE_HEIGHT = 100
const CUBES_START_HEIGHT = 320
const FLOOR_HEIGHT = 1000

const cube = (identifier) => {
    return {
        id: "cube",
        getIdentifier() {
            return identifier;
        }
    }
}

export const lobby = ({socket}) => scene("lobby", () => {
    let playersByName = new Map();

    setGravity(640)

    // Background
    add([
        sprite("background"),
        pos(0, -200),
    ])

    // Lobby text
    add([
        text("Lobby", {size: 32}),
        pos(width() / 2, 20),
        anchor("center"),
        "lobby",
    ])

    // Left wall
    add([
        rect(10, 1300),
        pos(0, 0),
        body({isStatic: true}),
        area(),
        anchor("topright"),
    ])

    // Right wall
    add([
        rect(10, 1300),
        pos(width(), 0),
        body({isStatic: true}),
        area(),
        anchor("topleft"),
    ])

    // Gate
    add([
        rect(width(), 50),
        pos(0, CAGE_HEIGHT),
        body({isStatic: true}),
        area(),
        "gate",
    ])

    // Floor
    add([
        rect(width(), 200),
        color(Color.fromHex("3E3232")),
        pos(0, FLOOR_HEIGHT),
        body({isStatic: true}),
        area(),
        "floor"
    ])

    // Cubes
    const ROWS = 5
    const COLUMNS = 10

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLUMNS; x++) {
            add([
                rect(32, 32),
                pos(x * 32, y * 32 + CUBES_START_HEIGHT),
                color(Color.fromHex("777777")),
                area(),
                body({isStatic: true}),
                anchor("topleft"),
                cube(`${x}:${y}`),
            ])
        }
    }

    //#region Me
    let playerAlive = true;

    let me = add([
        sprite("bread", {anim: "idle"}),
        anchor("center"),
        pos(
            rand(20, width() - 20),
            20,
        ),
        area({collisionIgnore: ["player"]}),
        body(),
        z(1),  // Draw us on top of other players
        "player",
    ])
    let myName = me.add([
        text("", {
            size: 14,
            font: "vom",
            align: "center",
        }),
        pos(0, -PLAYER_NAME_HEIGHT_OFFSET),
        anchor("center"),
        color(),
    ]);

    me.onGround((thing) => {
        if (thing.is("cube")) {
            me.jump(JUMP_FORCE);
            destroy(thing);

            // Tell other people to delete this
            const message = {
                type: "DESTROY",
                data: {
                    tag: thing.getIdentifier()
                },
            }
            socket.send(JSON.stringify(message));

        } else if (thing.is("floor")) {
            me.play("dead");
            addKaboom(me.pos);
            playerAlive = false;

            const message = {
                type: "DEATH",
                data: {
                    name: myName.text,
                }
            }
            socket.send(JSON.stringify(message));
        }
    });

    me.onUpdate(() => {
        camPos(camPos().x, me.pos.y);
    });
    //#endregion

    //#region Controls
    const buttonPressed = {
        left: false,
        right: false,
    };

    const moveLeft = () => {
        if (playerAlive) {
            me.move(-MOVE_SPEED, 0);
            me.flipX = false;
        }
    }

    const moveRight = () => {
        if (playerAlive) {
            me.move(MOVE_SPEED, 0);
            me.flipX = true;
        }
    }

    const moveLeftButton = add([
        sprite("left-icon"),
        pos(0, height() - 100),
        opacity(0.25),
        fixed(),
        area(),
    ]);

    const moveRightButton = add([
        sprite("right-icon"),
        pos(width() - 100, height() - 100),
        opacity(0.25),
        fixed(),
        area(),
    ]);

    onTouchStart((pos, _) => {
        if (moveLeftButton.hasPoint(pos)) {
            moveLeftButton.opacity = 1;
            buttonPressed.left = true;
        } else if (moveRightButton.hasPoint(pos)) {
            moveRightButton.opacity = 1;
            buttonPressed.right = true;
        }
    });

    onTouchEnd((pos, _) => {
        if (moveLeftButton.hasPoint(pos)) {
            moveLeftButton.opacity = 0.25;
            buttonPressed.left = false;
        }
        if (moveRightButton.hasPoint(pos)) {
            moveRightButton.opacity = 0.25;
            buttonPressed.right = false;
        }
    })

    onTouchMove((pos, _) => {
        const leftButtonPressed = moveLeftButton.hasPoint(pos);
        buttonPressed.left = leftButtonPressed;
        moveLeftButton.opacity = leftButtonPressed ? 1 : 0.25;

        const rightButtonPressed = moveRightButton.hasPoint(pos);
        buttonPressed.right = rightButtonPressed;
        moveRightButton.opacity = rightButtonPressed ? 1 : 0.25;
    });

    onKeyDown("left", () => {
        moveLeft();
    });

    onKeyDown("right", () => {
        moveRight();
    });

    if (window.location.hash) {
        onKeyPress("s", () => {
            const message = {
                type: "START",
                data: {},
            };
            socket.send(JSON.stringify(message));
        })
    }
    //#endregion

    onUpdate(() => {
        if (buttonPressed.left) {
            moveLeft();
        } else if (buttonPressed.right) {
            moveRight();
        }
    })

    //#region Websocket Listeners
    const handleSetPlayer = ({data}) => {
        myName.text = data.name;
        myName.color = Color.fromHex(data.color);
    }

    const handlePlayerJoin = ({data}) => {
        // Player
        let player = add([
            sprite("bread", {anim: "idle"}),
            anchor("center"),
            pos(
                // Create new players off-screen
                rand(-100, 0),
                rand(-100, 0),
            ),
            "player",
        ]);

        // Name
        player.add([
            text(data.name, {
                size: 14,
                font: "vom",
                align: "center",
            }),
            pos(0, -PLAYER_NAME_HEIGHT_OFFSET),
            anchor("center"),
            color(Color.fromHex(data.color))
        ]);

        playersByName.set(data.name, player);
    }

    const handlePlayerLeave = ({data}) => {
        let player = playersByName.get(data)
        if (player !== undefined) {
            player.destroy();
            playersByName.delete(data)
        }
    }

    const handlePlayerPosition = ({data}) => {
        let player = playersByName.get(data.name)
        if (player !== undefined) {
            player.pos.x = data.x;
            player.pos.y = data.y;
            player.flipX = data.flipX;
        }
    }

    const handleDestroy = ({data}) => {
        const identifier = data.tag;
        const cubes=  get("cube");
        for (let i = 0; i < cubes.length; i++) {
            const cube = cubes[i];
            if (cube.getIdentifier() === identifier) {
                destroy(cube);
            }
        }
    }

    const handleStart = ({data}) => {
        destroyAll("gate");
        const players = get("player");
        for (let i = 0; i < players.length; i++) {
            players[i].play("falling");
        }
        destroyAll("lobby");
    };

    const handleDeath = ({data}) => {
        let player = playersByName.get(data.name);
        if (player !== undefined) {
            player.destroy();
        }
    }

    const socketListener = (event) => {
        let packet = JSON.parse(event.data);
        let data = packet.data;
        switch (packet.type) {
            case "SET_PLAYER":
                handleSetPlayer({data});
                break;
            case "PLAYER_JOIN":
                handlePlayerJoin({data});
                break;
            case "PLAYER_LEAVE":
                handlePlayerLeave({data});
                break;
            case "PLAYER_POSITION":
                handlePlayerPosition({data});
                break;
            case "DESTROY":
                handleDestroy({data});
                break;
            case "START":
                handleStart({data});
                break;
            case "DEATH":
                handleDeath({data});
                break;
        }
    }

    socket.addEventListener("open", () => {
        const updatePosition = setInterval(() => {
            const message = {
                type: "PLAYER_POSITION",
                data: {
                    name: myName.text,
                    x: me.pos.x,
                    y: me.pos.y,
                    flipX: me.flipX,
                },
            };
            socket.send(JSON.stringify(message))
        }, 50)
        onSceneLeave(_ => clearInterval(updatePosition));
    })
    //#endregion

    socket.addEventListener("message", socketListener)
    onSceneLeave(_ => socket.removeEventListener("message", socketListener));
})