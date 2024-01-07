package main

import "github.com/brianvoe/gofakeit/v6"

type Player struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

func makePlayer() *Player {
	return &Player{
		Name:  gofakeit.Gamertag(),
		Color: gofakeit.HexColor(),
	}
}
