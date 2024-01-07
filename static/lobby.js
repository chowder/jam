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
        pos(0, height()),
        area(),
        body({isStatic: true}),
        anchor("botleft"),
    ])

    let me = add([
        rect(10, 10),
        anchor("center"),
        pos(
            rand(20, width() - 20),
            rand(20, height() - 20),
        ),
        color(),
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
        pos(0, -16),
        anchor("center"),
        color(),
    ]);

    const handleSetPlayer = ({data}) => {
        myName.text = data.name;
        me.color = myName.color = Color.fromHex(data.color);
    }

    const handlePlayerJoin = ({data}) => {
        // Player
        let player = add([
            rect(10, 10),
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
            pos(0, -16),
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

    socket.addEventListener("message", socketListener)
    onSceneLeave(_ => socket.removeEventListener("message", socketListener));
})