const { Router } = require("express");
const { Server } = require("socket.io");
const Config = require("./config");
const MinecraftServer = require("./MinecraftServer");

module.exports = class PageRoute {
    /**
     * @param {null|Config} config
     * @param {null|MinecraftServer} minecraft
     * @param {null|Server} io
     */
    constructor(config = null, minecraft = null, io = null) {
        /** @type {Router} */
        this.app = Router();

        /** @type {Config} */
        this.config = config;

        /** @type {MinecraftServer} */
        this.minecraft = minecraft;

        /** @type {Server} */
        this.io = io;

        this.init();
    }

    init() {  }
}