const PLAYER_NAME_HEIGHT_OFFSET = 24

const JUMP_FORCE = 300
const MOVE_SPEED = 100

export const lobby = ({socket}) => scene("lobby", () => {
    let playersByName = new Map();

    setGravity(640)

    // Title
    add([
        text("Lobby", {size: 32}),
        pos(width() / 2, 20),
        anchor("center"),
    ])

    // Floor
    add([
        rect(width(), 20),
        pos(0, 240),
        area(),
        body({isStatic: true}),
        anchor("botleft"),
    ])

    //#region Me
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
    //#endregion

    //#region Controls
    const buttonPressed = {
        left: false,
        right: false,
    };

    const moveLeft = () => {
        me.move(-MOVE_SPEED, 0);
        me.flipX = false;
    }

    const moveRight = () => {
        me.move(MOVE_SPEED, 0);
        me.flipX = true;
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
    })

    onKeyDown("right", () => {
        moveRight();
    })
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
        }
    }

    const socketListener = (event) => {
        let packet = JSON.parse(event.data);
        let data = packet.data;
        switch (packet.type) {
            case "SET_PLAYER":
                handleSetPlayer({data})
                break;
            case "PLAYER_JOIN":
                handlePlayerJoin({data})
                break;
            case "PLAYER_LEAVE":
                handlePlayerLeave({data})
                break;
            case "PLAYER_POSITION":
                handlePlayerPosition({data})
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
                },
            };
            socket.send(JSON.stringify(message))
        }, 50)
        onSceneLeave(_ => clearInterval(updatePosition));
    })
    //#endregion

    onKeyPress('space', () => jump(me))

    socket.addEventListener("message", socketListener)
    onSceneLeave(_ => socket.removeEventListener("message", socketListener));
})